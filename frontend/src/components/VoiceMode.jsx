import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hands-free voice conversation, in the shape people already expect from
 * OpenAI's voice mode: you open it, start talking, and it just runs.
 *
 * The loop is: listen → detect that you've stopped talking → send the clip →
 * think → speak the reply → listen again. No push-to-talk, no send button.
 *
 * Two things drive the whole design:
 *
 * 1. The analyser runs continuously, in every state — including while the
 *    assistant is talking. That's what makes barge-in possible: if you start
 *    speaking over the reply, we hear it, cut the audio dead, and hand the
 *    turn back to you. The mic is only *recorded* while listening, so the
 *    assistant's own voice can never end up inside a clip we send.
 *
 * 2. The avatar is driven by two different analysers — the mic while you're
 *    talking, the reply audio while it's talking — so the photo visibly reacts
 *    to whoever currently has the floor.
 *
 * Both the avatar animation and the VAD read levels from the rAF loop and
 * mutate the DOM directly rather than going through React state. At 60fps,
 * setState would re-render this component ~60 times a second for what is
 * purely a visual effect.
 */

// Speech is "present" above this RMS. Low enough for a quiet voice on a
// laptop mic, high enough that room tone and fan noise sit below it.
const SPEECH_THRESHOLD = 0.015;
// Barge-in needs a higher bar than normal speech detection: while the reply
// is playing, some of it leaks back into the mic even with echo cancellation
// on, and we must not let the assistant interrupt itself.
const BARGE_THRESHOLD = 0.045;
// ...and it must be sustained, so a cough or a door closing can't cut off a
// reply mid-sentence.
const BARGE_SUSTAIN_MS = 220;
// How long the level must stay below the threshold before we call the turn
// finished. This is pure dead air added to every single turn — the server
// hasn't even been contacted yet — so it's the cheapest latency to buy back.
// 700ms still comfortably survives a mid-sentence thinking pause; drop it
// further and it starts cutting people off.
const SILENCE_HANGOVER_MS = 700;
// Ignore turns shorter than this — almost always a click or a stray noise.
const MIN_SPEECH_MS = 350;
// Hard cap on a single turn so a stuck VAD can't record forever.
const MAX_TURN_MS = 20000;

const STATUS_LABEL = {
  connecting: 'Getting your mic ready…',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  error: 'Something went wrong',
};

const HINT = {
  connecting: 'Allow microphone access to start.',
  listening: 'Just talk. It sends when you stop.',
  thinking: 'One moment.',
  speaking: 'Start talking any time to cut in.',
};

export default function VoiceMode({ open, onClose, apiUrl, sessionId, onSessionId, onTurn }) {
  const [status, setStatus] = useState('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [userText, setUserText] = useState('');
  const [replyText, setReplyText] = useState('');

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micDataRef = useRef(null);
  const playAnalyserRef = useRef(null);
  const playDataRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  // Pipelined playback: audio arrives in sentence-sized pieces while the rest
  // of the reply is still being generated, so we hold them in a queue and play
  // them back to back rather than waiting for the whole thing.
  const queueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const streamDoneRef = useRef(false);
  const abortRef = useRef(null);
  const rafRef = useRef(null);
  const audioElRef = useRef(null);
  const avatarRef = useRef(null);
  const haloRef = useRef(null);

  const speechSeenRef = useRef(false);
  const silenceStartRef = useRef(null);
  const bargeStartRef = useRef(null);
  const turnStartRef = useRef(0);
  const closingRef = useRef(false);
  // What the recorder's onstop handler should do. Set immediately before every
  // .stop() call so the handler never has to guess why it was stopped.
  const nextActionRef = useRef('none'); // 'send' | 'restart' | 'none'
  // The rAF loop reads status every frame; React state would be a render
  // behind, so the loop reads this instead.
  const statusRef = useRef('connecting');

  // sessionId lives in a ref too: the loop and recorder callbacks are created
  // once per turn and would otherwise close over a stale value.
  const sessionRef = useRef(sessionId);
  // The parent passes onTurn/onSessionId as inline arrows, so they get a new
  // identity every render. Reading them through refs keeps startListening
  // stable, which is what stops the mount effect below from tearing down and
  // re-acquiring the microphone on every single parent re-render.
  const onTurnRef = useRef(onTurn);
  const onSessionIdRef = useRef(onSessionId);
  const startListeningRef = useRef(null);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
  useEffect(() => { onTurnRef.current = onTurn; }, [onTurn]);
  useEffect(() => { onSessionIdRef.current = onSessionId; }, [onSessionId]);

  const applyStatus = useCallback((next) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  // ---- avatar animation ---------------------------------------------------

  const paintAvatar = useCallback((level, state) => {
    const el = avatarRef.current;
    const halo = haloRef.current;
    if (!el) return;

    if (state === 'thinking') {
      el.style.transform = 'scale(1)';
      if (halo) halo.style.opacity = '0.25';
      return;
    }

    // Speaking gets a bigger response than listening so the photo reads as
    // the one doing the talking, rather than just a level meter.
    const gain = state === 'speaking' ? 1.1 : 0.55;
    const scale = 1 + Math.min(level * 7 * gain, 0.14);
    el.style.transform = `scale(${scale})`;

    if (halo) {
      const spread = Math.min(level * 260 * gain, 46);
      halo.style.opacity = String(0.3 + Math.min(level * 5, 0.55));
      halo.style.transform = `scale(${1 + spread / 150})`;
    }
  }, []);

  // ---- the always-on analyser loop ---------------------------------------

  const readLevel = (analyser, buf) => {
    if (!analyser || !buf) return 0;
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  };

  const stopMonitor = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const endTurnAndSend = useCallback(() => {
    nextActionRef.current = 'send';
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  // Cuts the reply off mid-sentence and gives the floor back.
  //
  // With pipelined audio there are three things to kill, not one: the clip
  // currently playing, every clip already queued behind it, and the server
  // stream still producing more. Miss any of them and the assistant carries
  // on talking after being interrupted.
  const interrupt = useCallback(() => {
    abortRef.current?.abort();
    queueRef.current = [];
    isPlayingRef.current = false;
    streamDoneRef.current = true;
    const el = audioElRef.current;
    if (el) {
      el.onended = null;
      el.pause();
      el.currentTime = 0;
    }
    bargeStartRef.current = null;
    startListeningRef.current?.();
  }, []);

  const monitor = useCallback(() => {
    const state = statusRef.current;
    const micLevel = readLevel(micAnalyserRef.current, micDataRef.current);
    const playLevel = readLevel(playAnalyserRef.current, playDataRef.current);
    const now = Date.now();

    paintAvatar(state === 'speaking' ? playLevel : micLevel, state);

    if (state === 'speaking') {
      // Barge-in watch. Requires a sustained burst well above normal speech
      // level, since the reply itself bleeds into the mic a little.
      if (micLevel > BARGE_THRESHOLD) {
        if (bargeStartRef.current == null) bargeStartRef.current = now;
        if (now - bargeStartRef.current > BARGE_SUSTAIN_MS) {
          interrupt();
          return;
        }
      } else {
        bargeStartRef.current = null;
      }
    } else if (state === 'listening') {
      const elapsed = now - turnStartRef.current;
      if (micLevel > SPEECH_THRESHOLD) {
        speechSeenRef.current = true;
        silenceStartRef.current = null;
      } else if (speechSeenRef.current) {
        if (silenceStartRef.current == null) silenceStartRef.current = now;
        if (now - silenceStartRef.current > SILENCE_HANGOVER_MS && elapsed > MIN_SPEECH_MS) {
          endTurnAndSend();
          return;
        }
      }
      if (elapsed > MAX_TURN_MS) {
        endTurnAndSend();
        return;
      }
    }

    rafRef.current = requestAnimationFrame(monitor);
  }, [endTurnAndSend, interrupt, paintAvatar]);

  const runLoop = useCallback(() => {
    stopMonitor();
    rafRef.current = requestAnimationFrame(monitor);
  }, [monitor, stopMonitor]);

  // ---- turn handling ------------------------------------------------------

  // Plays the next queued clip. When the queue runs dry we only hand the turn
  // back if the server has actually finished — otherwise we're just waiting on
  // the next sentence, and grabbing the mic here would cut the reply in half.
  const playNext = useCallback(() => {
    if (closingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) {
      isPlayingRef.current = false;
      if (streamDoneRef.current) startListeningRef.current?.();
      return;
    }
    isPlayingRef.current = true;
    const el = audioElRef.current;
    if (!el) return;
    el.src = next;
    el.onended = playNext;
    bargeStartRef.current = null;
    applyStatus('speaking');
    el.play().catch((e) => {
      console.warn('[voice] playback blocked:', e);
      isPlayingRef.current = false;
      if (streamDoneRef.current) startListeningRef.current?.();
    });
  }, [applyStatus]);

  const enqueueAudio = useCallback((src) => {
    queueRef.current.push(src);
    if (!isPlayingRef.current) playNext();
  }, [playNext]);

  const sendTurn = useCallback(async (blob) => {
    applyStatus('thinking');
    runLoop();

    queueRef.current = [];
    isPlayingRef.current = false;
    streamDoneRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;

    const sentAt = performance.now();
    let firstAudioAt = null;
    let fullText = '';
    let turnTranscript = '';

    try {
      const form = new FormData();
      form.append('audio', blob, 'clip.webm');
      const url = sessionRef.current
        ? `${apiUrl}/api/voice/chat/stream?session_id=${encodeURIComponent(sessionRef.current)}`
        : `${apiUrl}/api/voice/chat/stream`;

      const res = await fetch(url, { method: 'POST', body: form, signal: controller.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          let data;
          try {
            data = JSON.parse(trimmed.slice(6));
          } catch {
            continue; // partial frame, will arrive complete next read
          }
          if (closingRef.current) return;

          if (data.type === 'session') {
            sessionRef.current = data.session_id;
            onSessionIdRef.current?.(data.session_id);
          } else if (data.type === 'transcript') {
            turnTranscript = data.text || '';
            setUserText(turnTranscript);
          } else if (data.type === 'text') {
            fullText = fullText ? `${fullText} ${data.content}` : data.content;
            setReplyText(fullText);
          } else if (data.type === 'audio') {
            if (firstAudioAt === null) {
              firstAudioAt = Math.round(performance.now() - sentAt);
              console.log(`[voice] first audio in ${firstAudioAt}ms (server ${data.first_audio_ms}ms)`);
            }
            enqueueAudio(`data:${data.mime || 'audio/mpeg'};base64,${data.audio_base64}`);
          } else if (data.type === 'done') {
            fullText = data.response || fullText;
            setReplyText(fullText);
            onTurnRef.current?.({ transcript: turnTranscript, response: fullText });
            console.log(
              `[voice] complete in ${Math.round(performance.now() - sentAt)}ms`,
              `| server stt=${data.stt_ms}ms first_audio=${data.first_audio_ms}ms total=${data.total_ms}ms`
            );
            streamDoneRef.current = true;
            if (!isPlayingRef.current) startListeningRef.current?.();
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        }
      }

      // Stream closed without a 'done' frame (dropped connection, proxy
      // timeout). Don't strand the conversation in 'thinking' forever.
      if (!streamDoneRef.current) {
        streamDoneRef.current = true;
        if (!isPlayingRef.current) startListeningRef.current?.();
      }
    } catch (err) {
      // An abort is us interrupting on purpose, not a failure.
      if (err?.name === 'AbortError' || closingRef.current) return;
      console.error('[voice] turn failed:', err);
      const msg = err?.message || String(err);
      // "no speech in that clip" is a normal thing to happen, not a failure
      // worth dropping out of the conversation for — just listen again.
      if (/speech/i.test(msg)) {
        startListeningRef.current?.();
        return;
      }
      setErrorMsg(msg);
      applyStatus('error');
    }
  }, [apiUrl, applyStatus, enqueueAudio, runLoop]);

  const startListening = useCallback(() => {
    if (closingRef.current) return;
    const stream = streamRef.current;
    if (!stream) return;

    // Any recorder still running (e.g. we're barging in) is abandoned, not
    // sent — its audio is the assistant's own voice, not the user's.
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      nextActionRef.current = 'none';
      try { recorderRef.current.stop(); } catch {}
    }

    let recorder;
    try {
      recorder = MediaRecorder.isTypeSupported('audio/webm')
        ? new MediaRecorder(stream, { mimeType: 'audio/webm' })
        : new MediaRecorder(stream);
    } catch (e) {
      console.error('[voice] recorder init failed:', e);
      setErrorMsg('This browser cannot record audio.');
      applyStatus('error');
      return;
    }

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const action = nextActionRef.current;
      nextActionRef.current = 'none';
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      chunksRef.current = [];
      if (closingRef.current || action === 'none') return;
      // Nothing but silence, or too small to contain a word — listen again
      // rather than burning an API call on it.
      if (action === 'send' && speechSeenRef.current && blob.size >= 2000) {
        sendTurn(blob);
      } else {
        startListeningRef.current?.();
      }
    };

    recorderRef.current = recorder;
    speechSeenRef.current = false;
    silenceStartRef.current = null;
    bargeStartRef.current = null;
    turnStartRef.current = Date.now();
    nextActionRef.current = 'none';
    recorder.start();
    applyStatus('listening');
    runLoop();
  }, [applyStatus, runLoop, sendTurn]);

  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ---- open / close lifecycle --------------------------------------------
  // Deliberately keyed on `open` alone. Everything it calls goes through refs,
  // so a parent re-render can never restart the microphone mid-conversation.
  useEffect(() => {
    if (!open) return;
    closingRef.current = false;
    statusRef.current = 'connecting';
    setStatus('connecting');
    setErrorMsg('');
    setUserText('');
    setReplyText('');

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') await ctx.resume();

        const micAnalyser = ctx.createAnalyser();
        micAnalyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(micAnalyser);
        micAnalyserRef.current = micAnalyser;
        micDataRef.current = new Uint8Array(micAnalyser.fftSize);

        // Route the reply audio through an analyser so the avatar can react to
        // it. Note this node MUST also reach ctx.destination or the reply
        // becomes silent — routing an element into the graph takes it out of
        // the browser's default output path.
        if (audioElRef.current) {
          const playAnalyser = ctx.createAnalyser();
          playAnalyser.fftSize = 1024;
          const src = ctx.createMediaElementSource(audioElRef.current);
          src.connect(playAnalyser);
          playAnalyser.connect(ctx.destination);
          playAnalyserRef.current = playAnalyser;
          playDataRef.current = new Uint8Array(playAnalyser.fftSize);
        }

        startListeningRef.current?.();
      } catch (err) {
        console.error('[voice] mic access failed:', err);
        if (cancelled) return;
        setErrorMsg(
          err?.name === 'NotAllowedError'
            ? 'Microphone access was blocked. Allow it in your browser settings, then try again.'
            : 'Could not reach your microphone.'
        );
        statusRef.current = 'error';
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      closingRef.current = true;
      nextActionRef.current = 'none';
      abortRef.current?.abort();
      queueRef.current = [];
      isPlayingRef.current = false;
      stopMonitor();
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch {}
      }
      recorderRef.current = null;
      if (audioElRef.current) {
        audioElRef.current.onended = null;
        audioElRef.current.pause();
        audioElRef.current.src = '';
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      micAnalyserRef.current = null;
      micDataRef.current = null;
      playAnalyserRef.current = null;
      playDataRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const ringColor =
    status === 'error' ? 'ring-red-500/60'
    : status === 'speaking' ? 'ring-primary-400/70'
    : status === 'listening' ? 'ring-white/60'
    : 'ring-white/25';

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-dark-900/95 backdrop-blur-xl animate-fade-in px-6">
      <audio ref={audioElRef} className="hidden" />

      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all active:scale-90 max-sm:top-[calc(env(safe-area-inset-top)+1rem)]"
        aria-label="Close voice mode"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Avatar. The photo itself is what pulses — with the mic level while
          you're talking, and with the reply's own waveform while it's
          talking, so it reads as the picture doing the speaking. */}
      <button
        onClick={() => { if (statusRef.current === 'speaking') interrupt(); }}
        className="relative flex items-center justify-center mb-10 focus:outline-none group"
        aria-label={status === 'speaking' ? 'Interrupt and speak' : 'Voice indicator'}
      >
        {/* Soft glow behind the photo, sized by the same level signal */}
        <span
          ref={haloRef}
          className={`absolute w-40 h-40 sm:w-52 sm:h-52 rounded-full blur-2xl ${
            status === 'speaking' ? 'bg-primary-400' : 'bg-white'
          }`}
          style={{ opacity: 0.25, transition: 'opacity 100ms linear, transform 100ms linear, background 400ms' }}
        />

        {status === 'listening' && (
          <span className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-white/25 animate-ping" />
        )}

        <img
          ref={avatarRef}
          src="/saud.jpeg"
          alt="Saud"
          width="176"
          height="176"
          className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover object-top ring-4 ${ringColor} shadow-2xl shadow-black/50 ${
            status === 'thinking' ? 'animate-pulse' : ''
          }`}
          style={{ transition: 'transform 90ms linear, box-shadow 120ms linear' }}
        />
      </button>

      <p className="text-sm font-semibold text-white tracking-wide mb-2">
        {STATUS_LABEL[status] || ''}
      </p>
      <p className="text-xs text-zinc-500 mb-8 text-center max-w-xs">
        {status === 'error' ? errorMsg : HINT[status]}
      </p>

      {/* Live captions — the last thing you said and the last thing it said,
          so the conversation is followable with the sound off. */}
      <div className="w-full max-w-md space-y-3 max-h-[26vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {userText && (
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-zinc-600 mb-1">You</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{userText}</p>
          </div>
        )}
        {replyText && (
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-wider text-zinc-600 mb-1">Saud's AI</p>
            <p className="text-sm text-white leading-relaxed whitespace-pre-line">{replyText}</p>
          </div>
        )}
      </div>

      {status === 'error' && (
        <button
          onClick={onClose}
          className="mt-8 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/10 transition-all"
        >
          Back to chat
        </button>
      )}
    </div>
  );
}
