import { useEffect, useRef, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/agentic-chat';

async function fetchWithTimeout(url, opts = {}, timeoutMs = 45000) {
  // Longer timeout than the other demos — a deep-scrape search (multi-page
  // fetch + multi-chunk summarization) genuinely takes longer than a single
  // model inference call.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function newSessionId() {
  return (crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

const SUGGESTIONS = [
  "What's the latest news in AI this week?",
  'Who created you?',
  'Explain what LangGraph is in simple terms.',
];

export default function AgenticChatDemo() {
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', content, typing? }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);
  const sessionIdRef = useRef(newSessionId());
  const scrollRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/status`, {}, 10000)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!data.ready) {
          setUnreachableDetail('Server reports the agent is not configured (missing OPENAI_API_KEY).');
          setApiUnreachable(true);
        }
      })
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

  // Reveals a finished response word-by-word, matching the original
  // Streamlit app's fake-typing effect — this is not token streaming, the
  // full response already arrived, it's just paced client-side for feel.
  const typeOutResponse = (fullText) => {
    const words = fullText.split(' ');
    let i = 0;
    setMessages((prev) => [...prev, { role: 'assistant', content: '', typing: true }]);

    const step = () => {
      i += 1;
      const partial = words.slice(0, i).join(' ');
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: partial, typing: i < words.length };
        return next;
      });
      if (i < words.length) {
        typingTimerRef.current = setTimeout(step, 28);
      }
    };
    step();
  };

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);
    setStatusText('Thinking…');

    try {
      const res = await fetchWithTimeout(`${API_BASE}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdRef.current, message: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (data.used_search) setStatusText('Searched the web…');
      typeOutResponse(data.response || '(empty response)');
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}`, error: true }]);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  if (apiUnreachable) {
    return (
      <div className="bg-amber-50 border border-amber-300/60 rounded-2xl p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Live demo API isn't reachable right now.</p>
        <p className="mb-3">
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/agentic-chat/status</code> on
          this site's own backend. Run it locally with{' '}
          <code className="bg-black/10 px-1.5 py-0.5 rounded">python main.py</code>, or make sure
          <code className="bg-black/10 px-1.5 py-0.5 rounded ml-1">OPENAI_API_KEY</code> is set if you're
          viewing the live site.
        </p>
        <p className="text-xs opacity-75 mb-3">Detail: {unreachableDetail}</p>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          className="px-3 py-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-300/70 text-xs font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4">
        Ask it anything, including current events — it decides on its own whether to run a real multi-page
        web search first, or just answer directly.
      </p>

      <div
        ref={scrollRef}
        className="bg-white/70 border border-black/10 rounded-2xl p-4 mb-4 h-[380px] overflow-y-auto flex flex-col gap-3"
      >
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
            <p className="text-sm text-zinc-500">Try asking something, or pick a suggestion:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-full border border-black/10 bg-white/60 text-[11px] font-medium text-zinc-700 hover:border-slate-500/50 hover:text-slate-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-slate-600 to-slate-800 text-white'
                  : m.error
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-zinc-100 text-black'
              }`}
            >
              {m.content}
              {m.typing && <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 align-middle animate-pulse" />}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl bg-zinc-100 text-zinc-500 text-xs italic">{statusText}</div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question here…"
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-300/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
