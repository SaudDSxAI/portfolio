import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/clip-search';

async function fetchWithTimeout(url, opts = {}, timeoutMs = 20000) {
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

const SUGGESTIONS = ['a person smiling', 'outdoors', 'something blue', 'a close-up shot'];

export default function ClipSearchDemo({ theme }) {
  const [status, setStatus] = useState(null); // { ready, image_count }
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/status`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setStatus(data);
        if (!data.ready) {
          setUnreachableDetail('No images loaded on the server yet.');
          setApiUnreachable(true);
        }
      })
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  const runTextSearch = async (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/text-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, top_k: 6 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Search failed (${res.status})`);
      const data = await res.json();
      setResults({ mode: 'text', label: `"${data.query}"`, items: data.results });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runImageSearch = async (imageId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/image-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId, top_k: 6 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Search failed (${res.status})`);
      const data = await res.json();
      setResults({ mode: 'image', label: 'similar images', queryImageId: imageId, items: data.results });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (apiUnreachable) {
    return (
      <div className="bg-amber-50 border border-amber-300/60 rounded-2xl p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Live demo isn't available right now.</p>
        <p className="mb-3">
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/clip-search/status</code> on this
          site's own backend. The image collection may not be loaded on the server.
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
        Type a description and CLIP finds matching real photos. No labels, no keyword matching, just a shared
        image and text understanding. Click any result to find more images like it.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runTextSearch(query);
        }}
        className="flex gap-2 mb-3"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe what you're looking for…"
          disabled={loading || !status?.ready}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:border-stone-600 focus:ring-2 focus:ring-stone-300/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !query.trim() || !status?.ready}
          className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-br from-stone-500 to-stone-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setQuery(s); runTextSearch(s); }}
            disabled={loading || !status?.ready}
            className="px-3 py-1.5 rounded-full border border-black/10 bg-white/60 text-[11px] font-medium text-zinc-700 hover:border-stone-500/50 hover:text-stone-700 transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
      {loading && <p className="text-sm text-zinc-500">Searching…</p>}

      {results && !loading && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-700 mb-3">
            Results for {results.label}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {results.items.map((item) => (
              <button
                key={item.id}
                onClick={() => runImageSearch(item.id)}
                className="group relative rounded-xl overflow-hidden border border-black/10 hover:border-stone-500/50 transition-all aspect-square bg-zinc-100"
                title="Click to find similar images"
              >
                <img
                  src={`${API_BASE}/image/${item.id}`}
                  alt={item.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 font-medium">
                  score {item.score.toFixed(3)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {status && (
        <p className="text-[11px] text-zinc-400 mt-4">Searching across {status.image_count} real photos.</p>
      )}
    </div>
  );
}
