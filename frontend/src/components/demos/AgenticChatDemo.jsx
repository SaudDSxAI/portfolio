import { useEffect, useRef, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/agentic-chat';

async function fetchWithTimeout(url, opts = {}, timeoutMs = 45000) {
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
  return crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const SUGGESTIONS = [
  "What's the latest news in AI this week?",
  'Who created you?',
  'Explain what LangGraph is in simple terms.',
];

const DEEP_RESEARCH_SUGGESTIONS = [
  'Benefits and risks of intermittent fasting',
  'Current state of solid-state EV batteries',
  'How is AI being used in drug discovery',
];

function ModeToggle({ mode, setMode }) {
  return (
    <div className="inline-flex rounded-xl border border-black/10 bg-white/60 p-1 mb-4">
      <button
        onClick={() => setMode('chat')}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          mode === 'chat' ? 'bg-gradient-to-br from-slate-600 to-slate-800 text-white' : 'text-zinc-600 hover:text-zinc-900'
        }`}
      >
        Chat (Tier 1 + 2)
      </button>
      <button
        onClick={() => setMode('research')}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          mode === 'research' ? 'bg-gradient-to-br from-slate-600 to-slate-800 text-white' : 'text-zinc-600 hover:text-zinc-900'
        }`}
      >
        Deep Research (Tier 3)
      </button>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const sessionIdRef = useRef(newSessionId());
  const scrollRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

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
      if (i < words.length) typingTimerRef.current = setTimeout(step, 28);
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

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4">
        Ask it anything, including current events. Tier 1 answers directly if it already knows.
        Tier 2 runs exactly one real web search if it doesn't — structurally capped, not just
        prompted, so it can't loop.
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
          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-300/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

const SOURCE_STATUS_LABEL = {
  reading: 'Reading…',
  summarized: 'Summarized',
  skipped: 'No usable content',
};

function ResearchPanel() {
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [sources, setSources] = useState([]); // { index, title, url, status }
  const [report, setReport] = useState('');
  const [finalSources, setFinalSources] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(null);

  const run = async (q) => {
    const trimmed = q.trim();
    if (!trimmed || running) return;

    setRunning(true);
    setStatusText('Starting…');
    setSources([]);
    setReport('');
    setFinalSources(null);
    setErrorMsg('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/deep-research/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, num_sources: 5 }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          let evt;
          try {
            evt = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (evt.type === 'status') {
            setStatusText(evt.message);
          } else if (evt.type === 'sources') {
            setSources(evt.sources.map((s, i) => ({ index: i + 1, title: s.title, url: s.url, status: 'pending' })));
            setStatusText('Reading sources…');
          } else if (evt.type === 'source_progress') {
            setSources((prev) =>
              prev.map((s) => (s.index === evt.index ? { ...s, status: evt.status } : s))
            );
          } else if (evt.type === 'report_token') {
            setReport((prev) => prev + evt.token);
          } else if (evt.type === 'error') {
            setErrorMsg(evt.message);
          } else if (evt.type === 'done') {
            if (evt.sources) setFinalSources(evt.sources);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setRunning(false);
      setStatusText('');
    }
  };

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4">
        Explicitly triggered, heavier pipeline: pulls 5 real sources (not 1), reads and summarizes
        each individually with its own citation — watch them get processed live below — then
        synthesizes a structured report. Every fact is grounded strictly in what the sources
        actually say.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className="flex gap-2 mb-4"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want researched?"
          disabled={running}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-300/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={running || !query.trim()}
          className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {running ? 'Researching…' : 'Deep Research'}
        </button>
      </form>

      {!running && sources.length === 0 && !report && (
        <div className="flex flex-wrap gap-2 mb-4">
          {DEEP_RESEARCH_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                run(s);
              }}
              className="px-3 py-1.5 rounded-full border border-black/10 bg-white/60 text-[11px] font-medium text-zinc-700 hover:border-slate-500/50 hover:text-slate-700 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {(running || sources.length > 0) && (
        <div className="mb-4">
          {statusText && <p className="text-xs font-medium text-slate-600 mb-2">{statusText}</p>}
          {sources.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {sources.map((s) => (
                <div
                  key={s.index}
                  className="flex items-center justify-between gap-3 bg-white/70 border border-black/10 rounded-lg px-3 py-2 text-xs"
                >
                  <span className="truncate text-zinc-700">
                    {s.index}. {s.title || s.url}
                  </span>
                  <span
                    className={`shrink-0 font-medium ${
                      s.status === 'summarized'
                        ? 'text-emerald-600'
                        : s.status === 'skipped'
                        ? 'text-zinc-400'
                        : 'text-slate-500 animate-pulse'
                    }`}
                  >
                    {SOURCE_STATUS_LABEL[s.status] || '…'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">
          {errorMsg}
        </div>
      )}

      {report && (
        <div className="bg-white/70 border border-black/10 rounded-2xl p-5 text-sm leading-relaxed whitespace-pre-wrap">
          {report}
          {running && <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 align-middle animate-pulse" />}
        </div>
      )}

      {finalSources && finalSources.length > 0 && (
        <div className="mt-3 text-xs text-zinc-500">
          <p className="font-semibold mb-1">Sources</p>
          <ul className="list-disc list-inside space-y-0.5">
            {finalSources.map((s) => (
              <li key={s.index}>
                <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-slate-700 underline decoration-dotted">
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AgenticChatDemo() {
  const [mode, setMode] = useState('chat');
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

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
      <ModeToggle mode={mode} setMode={setMode} />
      {mode === 'chat' ? <ChatPanel /> : <ResearchPanel />}
    </div>
  );
}
