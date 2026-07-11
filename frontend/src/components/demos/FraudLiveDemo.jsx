import { useEffect, useState } from 'react';

// Fraud model is served by this portfolio's own backend, same pattern as
// the other two demos — same-origin, mounted at /api/fraud/*.
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/fraud';

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

const LABEL_STYLES = {
  'Caught fraud': 'bg-red-100 text-red-800 border-red-300',
  'Missed fraud': 'bg-amber-100 text-amber-800 border-amber-300',
  'Normal transaction': 'bg-primary-100 text-primary-800 border-primary-300',
  'False alarm': 'bg-amber-100 text-amber-800 border-amber-300',
};

export default function FraudLiveDemo() {
  const [examples, setExamples] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
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
      .then((data) => {
        setExamples(data);
        if (data.length > 0) setSelectedIndex(data[0].index);
      })
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  const runPrediction = async () => {
    if (selectedIndex === null) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ example_index: selectedIndex }),
      });
      if (!res.ok) throw new Error(`Prediction failed (${res.status})`);
      setResult(await res.json());
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
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/fraud/examples</code> on this
          site's own backend. Run it locally with{' '}
          <code className="bg-black/10 px-1.5 py-0.5 rounded">python main.py</code>, or make sure the
          fraud_model.py changes are deployed if you're viewing the live site.
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
        These 28 features are PCA components anonymized by the card issuer before public release — there's
        no honest way to let you type in "realistic" values for them. Instead, pick a real transaction from
        the held-out test set below (including a genuine model failure, not just cherry-picked wins) and see
        exactly what the model predicted.
      </p>

      {!examples && <p className="text-sm text-zinc-500">Loading examples…</p>}

      {examples && (
        <div className="grid md:grid-cols-[1fr_1fr] gap-6 items-start">
          <div className="bg-white/70 border border-black/10 rounded-2xl p-5">
            <div className="grid grid-cols-1 gap-2 mb-5">
              {examples.map((ex) => (
                <button
                  key={ex.index}
                  onClick={() => { setSelectedIndex(ex.index); setResult(null); }}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedIndex === ex.index
                      ? 'border-primary-600 bg-primary-100/60 ring-2 ring-primary-300/50'
                      : 'border-black/10 hover:border-black/20 bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${LABEL_STYLES[ex.label]}`}>
                      {ex.label}
                    </span>
                    <span className="text-sm font-heading font-bold text-black">${ex.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Actual: {ex.true_label === 1 ? 'Fraud' : 'Legitimate'}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={runPrediction}
              disabled={loading || selectedIndex === null}
              className="w-full py-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              {loading ? 'Scoring transaction…' : 'Run fraud model on this transaction'}
            </button>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          </div>

          <div className="bg-white/70 border border-black/10 rounded-2xl p-6 min-h-[220px] flex items-center justify-center">
            {!result && <p className="text-sm text-zinc-500 text-center">Select a transaction and run the model.</p>}
            {result && (
              <div className="w-full text-center">
                <div className={`text-xs font-bold uppercase tracking-wide mb-2 px-3 py-1 rounded-full inline-block border ${
                  result.correct ? 'bg-primary-100 text-primary-800 border-primary-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {result.correct ? 'Model got this right' : 'Model got this wrong'}
                </div>
                <div className="text-4xl font-heading font-bold text-black mt-2">
                  {(result.fraud_probability * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-zinc-500 mb-4">predicted fraud probability</div>
                <div className="relative h-2 rounded-full bg-black/10 mb-4">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 via-amber-500 to-red-500"
                    style={{ width: `${result.fraud_probability * 100}%` }}
                  />
                  <div className="absolute -top-1 w-0.5 h-4 bg-black/60" style={{ left: `${result.threshold_used * 100}%` }} />
                </div>
                <p className="text-xs text-zinc-600">
                  Model says: <strong>{result.prediction}</strong> · Actually: <strong>{result.true_label === 1 ? 'Fraud' : 'Legitimate'}</strong>
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">Decision threshold: {result.threshold_used.toFixed(3)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
