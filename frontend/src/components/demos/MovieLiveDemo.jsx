import { useEffect, useRef, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/movies';

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

// Deterministic pastel color per movie, derived from its id — gives every
// "poster" a distinct identity without needing actual poster images
// (this dataset only has titles/genres, no artwork).
const PALETTE = ['#8f9466', '#b45309', '#585b3c', '#73774e', '#41432d', '#c9cba4', '#afb284'];
function posterColor(id) {
  return PALETTE[id % PALETTE.length];
}

function MoviePoster({ movie, small = false }) {
  const initials = movie.title.replace(/\s*\(\d{4}\)$/, '').split(' ').slice(0, 2).map((w) => w[0]).join('');
  return (
    <div
      className={`flex items-center justify-center rounded-xl text-white font-heading font-bold ${small ? 'w-12 h-12 text-sm' : 'w-full aspect-[2/3] text-2xl'}`}
      style={{ background: `linear-gradient(135deg, ${posterColor(movie.movieId)}, ${posterColor(movie.movieId + 3)})` }}
    >
      {initials}
    </div>
  );
}

export default function MovieLiveDemo({ theme }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);
  const debounceRef = useRef(null);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/search`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setResults)
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      fetchWithTimeout(`${API_BASE}/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then(setResults)
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const togglePick = (movie) => {
    setPicked((prev) =>
      prev.some((m) => m.movieId === movie.movieId)
        ? prev.filter((m) => m.movieId !== movie.movieId)
        : prev.length < 5 ? [...prev, movie] : prev
    );
    setRecommendations(null);
  };

  const getRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_ids: picked.map((m) => m.movieId) }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (apiUnreachable) {
    return (
      <div className="bg-amber-50 border border-amber-300/60 rounded-2xl p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Live demo API isn't reachable right now.</p>
        <p className="mb-3">
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/movies/search</code> on this
          site's own backend. Run it locally with{' '}
          <code className="bg-black/10 px-1.5 py-0.5 rounded">python main.py</code>, or make sure the
          movie_model.py changes are deployed if you're viewing the live site.
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
        Search and pick up to 5 movies you like, then get real recommendations, computed from item
        similarity in the trained model's learned "taste space," not a lookup table.
      </p>

      {/* Picked movies as chips */}
      {picked.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {picked.map((m) => (
            <button
              key={m.movieId}
              onClick={() => togglePick(m)}
              className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-primary-700 text-white text-xs font-medium hover:bg-primary-800 transition-colors"
            >
              <MoviePoster movie={m} small />
              {m.title}
              <span className="opacity-60">×</span>
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies (e.g. Toy Story, Matrix, Titanic)…"
        className="w-full mb-4 px-4 py-3 rounded-xl border border-black/15 bg-white text-black text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-300/40"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-5 max-h-[340px] overflow-y-auto pr-1">
        {results.map((m) => {
          const isPicked = picked.some((p) => p.movieId === m.movieId);
          return (
            <button
              key={m.movieId}
              onClick={() => togglePick(m)}
              className={`text-left rounded-xl overflow-hidden border-2 transition-all ${isPicked ? 'border-primary-600 ring-2 ring-primary-300/50' : 'border-transparent hover:border-black/15'}`}
            >
              <MoviePoster movie={m} />
              <div className="p-2 bg-white/70">
                <div className="text-[11px] font-semibold text-black leading-tight line-clamp-2">{m.title}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">★ {m.avgRating}</div>
              </div>
            </button>
          );
        })}
        {results.length === 0 && !searching && (
          <p className="col-span-full text-sm text-zinc-500 py-6 text-center">No movies found.</p>
        )}
      </div>

      <button
        onClick={getRecommendations}
        disabled={loading || picked.length === 0}
        className="w-full py-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Finding similar movies…' : `Get recommendations${picked.length ? ` from ${picked.length} pick${picked.length > 1 ? 's' : ''}` : ''}`}
      </button>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {recommendations && (
        <div className="mt-6 bg-gradient-to-b from-white/80 to-warm-100/60 border border-black/10 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-heading font-bold text-black mb-3">Recommended for you</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {recommendations.map((m) => (
              <div key={m.movieId} className="rounded-xl overflow-hidden border border-black/10 bg-white/70 shadow-sm hover:shadow-md transition-shadow">
                <MoviePoster movie={m} />
                <div className="p-2">
                  <div className="text-[11px] font-semibold text-black leading-tight line-clamp-2">{m.title}</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${theme?.text || 'text-primary-700'}`}>{Math.round(m.matchScore * 100)}% match</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
