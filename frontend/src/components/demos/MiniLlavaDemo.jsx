import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/mini-llava';

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

export default function MiniLlavaDemo() {
  const [ready, setReady] = useState(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/status`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setReady(data.ready);
        if (!data.ready) {
          setUnreachableDetail('No trained projector loaded on the server yet.');
          setApiUnreachable(true);
        }
      })
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setCaption(null);
    setError(null);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const runCaption = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setCaption(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetchWithTimeout(`${API_BASE}/caption`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Request failed (${res.status})`);
      const data = await res.json();
      setCaption(data.caption);
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
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/mini-llava/status</code> on this
          site's own backend — the trained projector may not be loaded on the server.
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
        Upload any photo — this runs the real, full pipeline: CLIP sees it, the trained projector translates it,
        GPT-2 writes a genuinely new caption one word at a time. No candidate list, no hints, nothing pre-written.
      </p>

      <div className="grid md:grid-cols-[1fr_1.1fr] gap-6 items-start">
        <div className="bg-white/70 border border-black/10 rounded-2xl p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-black/15 hover:border-stone-500/50 bg-zinc-50 flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="upload preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Upload size={22} className="text-zinc-400" />
                <span className="text-xs text-zinc-500">Click to choose a photo</span>
              </>
            )}
          </button>

          <button
            onClick={runCaption}
            disabled={loading || !file || ready === false}
            className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-br from-stone-500 to-stone-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? 'Generating…' : 'Generate caption'}
          </button>
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </div>

        <div className="bg-white/70 border border-black/10 rounded-2xl p-6 min-h-[220px] flex items-center justify-center">
          {!caption && !loading && (
            <p className="text-sm text-zinc-500 text-center">Upload a photo and generate a caption to see it here.</p>
          )}
          {loading && <p className="text-sm text-zinc-500">Writing, one word at a time…</p>}
          {caption && !loading && (
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-600 mb-3">Generated caption</p>
              <p className="text-xl font-heading font-semibold text-black leading-snug">"{caption}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
