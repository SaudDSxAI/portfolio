import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/diffusion-gan';

async function fetchWithTimeout(url, opts = {}, timeoutMs = 60000) {
  // DDPM generation runs 300 sequential steps — genuinely slower than every
  // other live demo on this site, so this gets the longest timeout.
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

export default function DiffusionGanDemo() {
  const [ready, setReady] = useState(null);
  const [model, setModel] = useState('ddpm');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
        setReady(data.ready);
        if (!data.ready) {
          setUnreachableDetail('Trained checkpoints not loaded on the server yet.');
          setApiUnreachable(true);
        }
      })
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  const runGenerate = async () => {
    setLoading(true);
    setError(null);
    setImage(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, count: 6 }),
      }, model === 'ddpm' ? 60000 : 15000);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Request failed (${res.status})`);
      const data = await res.json();
      setImage(data.image_base64);
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
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/diffusion-gan/status</code> on this
          site's own backend — the trained checkpoints may not be loaded on the server.
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
        Pick a model and generate brand-new digits from pure random noise — nothing pre-made, no dataset lookup,
        genuinely fresh output every time. Notice the wait: the DDPM takes noticeably longer since it works
        through 300 denoising steps; the GAN produces its result in a single pass.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setModel('ddpm'); setImage(null); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
            model === 'ddpm' ? 'border-violet-600 bg-violet-100/60 text-violet-800' : 'border-black/10 text-zinc-600'
          }`}
        >
          Diffusion (DDPM) — ~300 steps
        </button>
        <button
          onClick={() => { setModel('gan'); setImage(null); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
            model === 'gan' ? 'border-violet-600 bg-violet-100/60 text-violet-800' : 'border-black/10 text-zinc-600'
          }`}
        >
          GAN — 1 step
        </button>
      </div>

      <button
        onClick={runGenerate}
        disabled={loading || ready === false}
        className="w-full py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 mb-4"
      >
        {loading ? (model === 'ddpm' ? 'Denoising, step by step…' : 'Generating…') : `Generate with ${model === 'ddpm' ? 'Diffusion' : 'GAN'}`}
      </button>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="bg-white/70 border border-black/10 rounded-2xl p-5 min-h-[140px] flex items-center justify-center">
        {!image && !loading && <p className="text-sm text-zinc-500">Generated digits will appear here.</p>}
        {loading && <p className="text-sm text-zinc-500">Working…</p>}
        {image && !loading && (
          <img src={`data:image/png;base64,${image}`} alt="generated digits" className="max-w-full rounded-lg" />
        )}
      </div>
    </div>
  );
}
