import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/house';

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

const DEFAULTS = {
  gr_liv_area: 1500, overall_qual: 6, overall_cond: 5, year_built: 2000,
  total_bsmt_sf: 1000, garage_cars: 2, full_bath: 2, bedroom_abvgr: 3,
  lot_area: 9500, neighborhood: 'NAmes', kitchen_qual: 'TA', exter_qual: 'TA',
};

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-zinc-600">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

const selectClass =
  'bg-white text-black border border-black/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-300/40';

const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function HouseLiveDemo({ theme }) {
  const [form, setForm] = useState(DEFAULTS);
  const [neighborhoods, setNeighborhoods] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/neighborhoods`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setNeighborhoods)
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/house/neighborhoods</code> on
          this site's own backend. Run it locally with{' '}
          <code className="bg-black/10 px-1.5 py-0.5 rounded">python main.py</code>, or make sure the
          house_model.py changes are deployed if you're viewing the live site.
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
        This model uses 216 features after encoding, far too many for a usable form. These dozen fields are
        the ones that actually drive the prediction (per the model's own coefficients); everything else is
        filled from a "typical house" profile (the median/mode across the training data).
      </p>

      <div className="grid md:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <form onSubmit={submit} className="bg-white/70 border border-black/10 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Living area: ${form.gr_liv_area.toLocaleString()} sq ft`}>
              <input type="range" min="300" max="6000" step="50" value={form.gr_liv_area} onChange={(e) => update('gr_liv_area', Number(e.target.value))} className="accent-primary-600" />
            </Field>
            <Field label={`Lot area: ${form.lot_area.toLocaleString()} sq ft`}>
              <input type="range" min="1000" max="50000" step="500" value={form.lot_area} onChange={(e) => update('lot_area', Number(e.target.value))} className="accent-primary-600" />
            </Field>
            <Field label={`Overall quality: ${form.overall_qual}/10`}>
              <input type="range" min="1" max="10" value={form.overall_qual} onChange={(e) => update('overall_qual', Number(e.target.value))} className="accent-primary-600" />
            </Field>
            <Field label={`Overall condition: ${form.overall_cond}/10`}>
              <input type="range" min="1" max="10" value={form.overall_cond} onChange={(e) => update('overall_cond', Number(e.target.value))} className="accent-primary-600" />
            </Field>
            <Field label={`Year built: ${form.year_built}`}>
              <input type="range" min="1870" max="2026" value={form.year_built} onChange={(e) => update('year_built', Number(e.target.value))} className="accent-primary-600" />
            </Field>
            <Field label={`Basement: ${form.total_bsmt_sf.toLocaleString()} sq ft`}>
              <input type="range" min="0" max="6000" step="50" value={form.total_bsmt_sf} onChange={(e) => update('total_bsmt_sf', Number(e.target.value))} className="accent-primary-600" />
            </Field>

            <Field label="Garage (cars)">
              <select className={selectClass} value={form.garage_cars} onChange={(e) => update('garage_cars', Number(e.target.value))}>
                {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Full bathrooms">
              <select className={selectClass} value={form.full_bath} onChange={(e) => update('full_bath', Number(e.target.value))}>
                {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Bedrooms">
              <select className={selectClass} value={form.bedroom_abvgr} onChange={(e) => update('bedroom_abvgr', Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Neighborhood">
              <select className={selectClass} value={form.neighborhood} onChange={(e) => update('neighborhood', e.target.value)}>
                {(neighborhoods || ['NAmes']).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Kitchen quality">
              <select className={selectClass} value={form.kitchen_qual} onChange={(e) => update('kitchen_qual', e.target.value)}>
                <option value="Po">Poor</option><option value="Fa">Fair</option><option value="TA">Typical</option>
                <option value="Gd">Good</option><option value="Ex">Excellent</option>
              </select>
            </Field>
            <Field label="Exterior quality">
              <select className={selectClass} value={form.exter_qual} onChange={(e) => update('exter_qual', e.target.value)}>
                <option value="Po">Poor</option><option value="Fa">Fair</option><option value="TA">Typical</option>
                <option value="Gd">Good</option><option value="Ex">Excellent</option>
              </select>
            </Field>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? 'Estimating…' : 'Estimate sale price'}
          </button>
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </form>

        <div className="relative bg-gradient-to-b from-white/80 to-warm-100/60 border border-black/10 rounded-2xl p-6 min-h-[220px] flex items-center justify-center shadow-sm">
          {!result && <p className="text-sm text-zinc-500 text-center">Set a profile and estimate the price.</p>}
          {result && (
            <div className="w-full text-center">
              <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">Lasso Regression</div>
              <div className="text-3xl sm:text-5xl font-heading font-bold text-black leading-none break-words">{fmt(result.predicted_price)}</div>
              <div className="text-xs text-zinc-500 mt-1.5 mb-6">estimated sale price</div>

              <div className="relative h-2.5 rounded-full bg-black/10 mb-2">
                <div className="absolute inset-y-0 left-[15%] right-[15%] rounded-full" style={{ background: theme?.chartChosen || '#585b3c' }} />
                <div className="absolute -top-1 w-1 h-[18px] rounded-full bg-black/80" style={{ left: '50%' }} title="Point estimate" />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 mb-4">
                <span>{fmt(result.price_range_low)}</span>
                <span>{fmt(result.price_range_high)}</span>
              </div>

              <p className="text-[11px] text-zinc-500">
                Likely range shown above (± {fmt(result.mae_dollars)}, the model's typical error on unseen houses)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
