import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/sentiment';

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

export default function SentimentLiveDemo({ theme }) {
  const [examples, setExamples] = useState([]);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/examples`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setExamples)
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  const runPrediction = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Prediction failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const useExample = (ex) => {
    setText(ex.text);
    setResult(null);
    setError(null);
  };

  if (apiUnreachable) {
    return (
      <div className="bg-amber-50 border border-amber-300/60 rounded-2xl p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Live demo API isn't reachable right now.</p>
        <p className="mb-3">
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/sentiment/examples</code> on
          this site's own backend. Run it locally with{' '}
          <code className="bg-black/10 px-1.5 py-0.5 rounded">python main.py</code>, or make sure the
          sentiment_model.py changes are deployed if you're viewing the live site.
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
        Type a movie review (or pick an example) and the trained LSTM will score it. The raw number is a
        probability, not just positive/negative, so you can see how confident the model actually is.
      </p>

      {examples.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {examples.map((ex) => (
            <button
              key={ex.label}
              onClick={() => useExample(ex)}
              className="px-3 py-1.5 rounded-full border border-black/10 bg-white/60 text-[11px] font-medium text-zinc-700 hover:border-indigo-500/50 hover:text-indigo-700 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setResult(null); }}
        placeholder="Type or paste a movie review here…"
        rows={4}
        className="w-full mb-4 px-4 py-3 rounded-xl border border-black/15 bg-white text-black text-sm resize-none focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300/40"
      />

      <button
        onClick={runPrediction}
        disabled={loading || !text.trim()}
        className="w-full py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Running LSTM…' : 'Classify sentiment'}
      </button>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {result && (
        <div className="relative mt-6 bg-gradient-to-b from-white/80 to-warm-100/60 border border-black/10 rounded-2xl p-6 text-center shadow-sm">
          <span className={`text-xs font-bold uppercase tracking-wide mb-3 px-3 py-1 rounded-full inline-block ${
            result.sentiment === 'positive'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {result.sentiment}
          </span>
          <div className="text-5xl font-heading font-bold text-black leading-none mt-2">
            {(result.positive_probability * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-zinc-500 mt-1.5 mb-5">predicted probability of positive sentiment</div>
          <div className="relative h-3 rounded-full bg-black/10 mb-5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-zinc-400 to-emerald-500"
              style={{ width: '100%' }}
            />
            <div
              className="absolute -top-1.5 w-1 h-6 rounded-full bg-black/70"
              style={{ left: `${result.positive_probability * 100}%` }}
              title="Predicted probability"
            />
          </div>
          <p className="text-sm text-zinc-700">
            Confidence: <strong className="text-black">{(result.confidence * 100).toFixed(1)}%</strong> · Words read:{' '}
            <strong className="text-black">{result.word_count}</strong>
            {result.truncated && <span className="text-amber-700"> (truncated at 200 words)</span>}
          </p>
        </div>
      )}
    </div>
  );
}
