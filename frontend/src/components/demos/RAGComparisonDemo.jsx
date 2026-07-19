import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/rag';

async function fetchWithTimeout(url, opts = {}, timeoutMs = 60000) {
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

const SUGGESTIONS = [
  "What did the GAN's loss numbers get wrong about output quality?",
  'How did the LoRA checkpoint size compare to the full fine-tune?',
  "What's Saud's educational background?",
];

const VARIANT_LABELS = {
  naive: 'Naive RAG',
  hybrid: 'Hybrid RAG',
  hyde: 'HyDE',
  agentic: 'Agentic RAG',
};

const VARIANT_NOTES = {
  naive: 'Embed the question, cosine similarity top-3.',
  hybrid: 'BM25 keyword search + embeddings, merged with Reciprocal Rank Fusion.',
  hyde: 'LLM writes a hypothetical answer first, embeds that instead of the question.',
  agentic: 'LLM decides whether to search, can reformulate and search again.',
};

function ResultPanel({ result }) {
  const { variant, answer, retrieved, hypothetical_answer } = result;
  return (
    <div className="bg-white/70 border border-black/10 rounded-2xl p-5 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-heading font-bold text-black">{VARIANT_LABELS[variant] || variant}</h3>
        <p className="text-xs text-zinc-500">{VARIANT_NOTES[variant]}</p>
      </div>

      {hypothetical_answer && (
        <details className="text-xs bg-warm-100/70 border border-black/10 rounded-lg p-2.5">
          <summary className="cursor-pointer font-semibold text-zinc-700">Hypothetical answer (used for retrieval only)</summary>
          <p className="mt-2 text-zinc-600 leading-relaxed">{hypothetical_answer}</p>
        </details>
      )}

      <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">{answer}</p>

      {retrieved?.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-zinc-500">
            Retrieved chunks ({retrieved.length})
          </summary>
          <div className="mt-2 space-y-2">
            {retrieved.map((r, i) => (
              <div key={i} className="bg-warm-100/60 border border-black/10 rounded-lg p-2.5">
                <div className="flex justify-between text-zinc-500 mb-1">
                  <span className="font-semibold">{r.title}</span>
                  <span>score={r.score}</span>
                </div>
                <p className="text-zinc-600 leading-relaxed">{r.text}…</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default function RAGComparisonDemo() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/status`, {}, 10000)
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
  }, [attempt]);

  const runCompare = async (text) => {
    const useQuery = (text ?? query).trim();
    if (!useQuery) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: useQuery }),
      }, 60000);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Request failed (${res.status})`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          onClick={() => setAttempt((n) => n + 1)}
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
        Type a question about my projects or background — it runs live through all four techniques at once (each
        makes its own OpenAI API calls, so this can take 10-20 seconds).
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setQuery(s); runCompare(s); }}
            className="text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white/60 hover:bg-white text-zinc-600 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runCompare()}
          placeholder="Ask a question…"
          maxLength={300}
          className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button
          onClick={() => runCompare()}
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
        >
          {loading ? 'Comparing…' : 'Compare'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      {loading && <p className="text-sm text-zinc-500 mb-3">Running all four techniques…</p>}

      {data && (
        <div className="grid md:grid-cols-2 gap-4">
          {data.results.map((r) => (
            <ResultPanel key={r.variant} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}
