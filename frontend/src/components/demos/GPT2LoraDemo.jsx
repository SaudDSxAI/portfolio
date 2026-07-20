import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/gpt2-lora';

async function fetchWithTimeout(url, opts = {}, timeoutMs = 30000) {
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

const SUGGESTIONS = ['To be, or not to be,', 'My lord, what shall we do about the', 'Good morrow, friend,'];

export default function GPT2LoraDemo() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/status`, {}, 10000)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        if (!data.ready) {
          setUnreachableDetail('LoRA checkpoint not loaded on the server yet.');
          setApiUnreachable(true);
        }
      })
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  const runGenerate = async (text) => {
    const usePrompt = (text ?? prompt).trim();
    if (!usePrompt) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: usePrompt }),
      }, 30000);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Request failed (${res.status})`);
      const data = await res.json();
      setOutput(data.text);
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
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/gpt2-lora/status</code> on this
          site's own backend. The LoRA checkpoint may not be loaded on the server.
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
        This runs the actual LoRA adapter (442K trained parameters) live, on top of frozen GPT-2. Type any prompt
        and see how it continues in the Shakespeare style it learned. The full-fine-tune model isn't served live
        here since its checkpoint (475MB) is too large to deploy alongside this site. Its real outputs are shown
        as recorded examples further down this page instead.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setPrompt(s); runGenerate(s); }}
            className="text-xs px-3 py-1.5 rounded-full border border-black/10 bg-white/60 hover:bg-white text-zinc-600 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runGenerate()}
          placeholder="Type a prompt…"
          maxLength={200}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
        <button
          onClick={() => runGenerate()}
          disabled={loading || !prompt.trim()}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      <div className="bg-white/70 border border-black/10 rounded-2xl p-5 min-h-[100px]">
        {!output && !loading && <p className="text-sm text-zinc-500">Output will appear here.</p>}
        {loading && <p className="text-sm text-zinc-500">Working…</p>}
        {output && !loading && <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">{output}</p>}
      </div>
    </div>
  );
}
