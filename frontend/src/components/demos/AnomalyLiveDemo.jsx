import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/anomaly';

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
  normal: 'bg-primary-100 text-primary-800 border-primary-300',
  anomaly: 'bg-red-100 text-red-800 border-red-300',
};

export default function AnomalyLiveDemo() {
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

  const runDetection = async () => {
    if (selectedIndex === null) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: selectedIndex }),
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

  if (apiUnreachable) {
    return (
      <div className="bg-amber-50 border border-amber-300/60 rounded-2xl p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Live demo API isn't reachable right now.</p>
        <p className="mb-3">
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/anomaly/examples</code> on
          this site's own backend. Run it locally with{' '}
          <code className="bg-black/10 px-1.5 py-0.5 rounded">python main.py</code>, or make sure the
          anomaly_model.py changes are deployed if you're viewing the live site.
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
        These are real network connection records from the held-out test set — the model was never
        trained on any of them. Pick one (including a couple the model actually got wrong, kept in
        deliberately) and run it through the autoencoder.
      </p>

      {!examples && <p className="text-sm text-zinc-500">Loading examples…</p>}

      {examples && (
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-6 items-start">
          <div className="bg-white/70 border border-black/10 rounded-2xl p-5">
            <div className="grid grid-cols-1 gap-2 mb-5 max-h-[360px] overflow-y-auto pr-1">
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
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-heading font-bold text-black">
                      {ex.protocol_type.toUpperCase()} · {ex.service}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      flag: {ex.flag}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    src {ex.src_bytes}B · dst {ex.dst_bytes}B · duration {ex.duration}s · count {ex.count}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={runDetection}
              disabled={loading || selectedIndex === null}
              className="w-full py-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              {loading ? 'Running autoencoder…' : 'Run anomaly detector on this connection'}
            </button>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          </div>

          <div className="bg-white/70 border border-black/10 rounded-2xl p-6 min-h-[220px] flex items-center justify-center">
            {!result && <p className="text-sm text-zinc-500 text-center">Select a connection and run the model.</p>}
            {result && (
              <div className="w-full text-center">
                <div className={`text-xs font-bold uppercase tracking-wide mb-2 px-3 py-1 rounded-full inline-block border ${
                  result.correct ? 'bg-primary-100 text-primary-800 border-primary-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {result.correct ? 'Model got this right' : 'Model got this wrong'}
                </div>
                <div className="text-4xl font-heading font-bold text-black mt-2">
                  {result.reconstruction_error.toFixed(3)}
                </div>
                <div className="text-xs text-zinc-500 mb-4">reconstruction error</div>
                <div className="relative h-2 rounded-full bg-black/10 mb-4">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 via-amber-500 to-red-500"
                    style={{ width: `${Math.min(100, (result.reconstruction_error / (result.threshold * 3)) * 100)}%` }}
                  />
                  <div
                    className="absolute -top-1 w-0.5 h-4 bg-black/60"
                    style={{ left: `${Math.min(100, (result.threshold / (result.threshold * 3)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-600">
                  Model says:{' '}
                  <strong className={`px-1.5 py-0.5 rounded border ${LABEL_STYLES[result.predicted_label]}`}>
                    {result.predicted_label}
                  </strong>{' '}
                  · Actually:{' '}
                  <strong className={`px-1.5 py-0.5 rounded border ${LABEL_STYLES[result.true_label]}`}>
                    {result.true_label}
                  </strong>
                </p>
                <p className="text-[11px] text-zinc-500 mt-2">Threshold: {result.threshold.toFixed(3)} (95th percentile of normal traffic's error)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
