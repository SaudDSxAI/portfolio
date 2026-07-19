import { useEffect, useRef, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/rag';

const SUGGESTIONS = [
  "What did the GAN's loss numbers get wrong about output quality?",
  'How did the LoRA checkpoint size compare to the full fine-tune?',
  "What's Saud's educational background?",
];

const VARIANTS = [
  { key: 'naive', label: 'Naive', note: 'Embed the question, cosine top-3.' },
  { key: 'hybrid', label: 'Hybrid', note: 'BM25 + embeddings, merged with RRF.' },
  { key: 'hyde', label: 'HyDE', note: 'Embeds a hypothetical answer, not the question.' },
  { key: 'agentic', label: 'Agentic', note: 'LLM decides whether to search again.' },
];

// One column = one independent live SSE stream. Each column owns its own
// fetch + ReadableStream reader, so all four genuinely run concurrently —
// this isn't four requests dressed up to look parallel, each one really is
// its own in-flight connection updating its own state as bytes arrive.
function StreamColumn({ variant, label, note, query }) {
  const [status, setStatus] = useState('Connecting…');
  const [hypothetical, setHypothetical] = useState(null);
  const [hits, setHits] = useState(null);
  const [answer, setAnswer] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch(`${API_BASE}/stream/${variant}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const detail = (await res.json().catch(() => ({}))).detail || `Request failed (${res.status})`;
          throw new Error(detail);
        }

        setStatus('Retrieving…');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!cancelled) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop(); // last part may be incomplete, keep for next chunk

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data:')) continue;
            const evt = JSON.parse(line.slice(5).trim());

            if (evt.type === 'status') setStatus(evt.text);
            else if (evt.type === 'hypothetical') { setHypothetical(evt.text); setStatus('Retrieving…'); }
            else if (evt.type === 'retrieved') { setHits(evt.hits); setStatus('Generating…'); }
            else if (evt.type === 'token') setAnswer((prev) => prev + evt.text);
            else if (evt.type === 'done') setDone(true);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message || 'Stream failed');
      }
    }

    run();
    return () => { cancelled = true; controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white/70 border border-black/10 rounded-2xl p-4 flex flex-col gap-2.5 min-h-[280px]">
      <div>
        <h3 className="text-sm font-heading font-bold text-black">{label}</h3>
        <p className="text-[11px] text-zinc-500">{note}</p>
      </div>

      {!done && !error && (
        <div className="flex items-center gap-1.5 text-xs text-blue-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          {status}
        </div>
      )}

      {hypothetical && (
        <details className="text-[11px] bg-warm-100/70 border border-black/10 rounded-lg p-2">
          <summary className="cursor-pointer font-semibold text-zinc-600">Hypothetical answer (retrieval only)</summary>
          <p className="mt-1.5 text-zinc-600 leading-relaxed">{hypothetical}</p>
        </details>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap flex-1">
        {answer}
        {!done && !error && <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse align-middle" />}
      </p>

      {hits?.length > 0 && (
        <details className="text-[11px]">
          <summary className="cursor-pointer font-semibold text-zinc-500">Retrieved chunks ({hits.length})</summary>
          <div className="mt-1.5 space-y-1.5">
            {hits.map((h, i) => (
              <div key={i} className="bg-warm-100/60 border border-black/10 rounded-lg p-2">
                <div className="flex justify-between text-zinc-500 mb-0.5">
                  <span className="font-semibold">{h.title}</span>
                  <span>score={h.score}</span>
                </div>
                <p className="text-zinc-600 leading-relaxed">{h.text}…</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default function RAGComparisonDemo() {
  const [input, setInput] = useState('');
  const [activeQuery, setActiveQuery] = useState(null);
  const [runId, setRunId] = useState(0);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [checkAttempt, setCheckAttempt] = useState(0);

  useEffect(() => {
    setApiUnreachable(false);
    fetch(`${API_BASE}/status`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        if (!d.ready) {
          setUnreachableDetail('RAG corpus/model not loaded on the server yet.');
          setApiUnreachable(true);
        }
      })
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [checkAttempt]);

  const submit = (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput(q);
    setActiveQuery(q);
    setRunId((n) => n + 1); // forces columns to remount fresh for this run
  };

  if (apiUnreachable) {
    return (
      <div className="bg-blue-50 border border-blue-300/60 rounded-2xl p-6 text-sm text-blue-900">
        <p className="font-semibold mb-1">Live demo isn't available right now.</p>
        <p className="mb-3">
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/rag/status</code> on this site's own
          backend — the corpus or embedding model may not be loaded on the server.
        </p>
        <p className="text-xs opacity-75 mb-3">Detail: {unreachableDetail}</p>
        <button
          onClick={() => setCheckAttempt((n) => n + 1)}
          className="px-3 py-1.5 rounded-lg bg-blue-200/70 hover:bg-blue-300/70 text-xs font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4">
        Ask one question — all four techniques search and answer live, in parallel, in their own column below.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white/60 hover:bg-white text-zinc-600 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Ask a question…"
          maxLength={300}
          className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button
          onClick={() => submit()}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
        >
          Compare
        </button>
      </div>

      {activeQuery && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3" key={runId}>
          {VARIANTS.map((v) => (
            <StreamColumn key={v.key} variant={v.key} label={v.label} note={v.note} query={activeQuery} />
          ))}
        </div>
      )}
    </div>
  );
}
