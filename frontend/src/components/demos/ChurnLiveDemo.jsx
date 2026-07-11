import { useEffect, useState } from 'react';

// Churn model is served by this portfolio's own backend (same origin,
// mounted at /api/churn/*) — no separate deployment or CORS config needed.
// In dev, Vite's proxy (vite.config.js) forwards /api/* to the local
// FastAPI backend on :8000, same as the rest of the site's API calls.
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/churn';

const DEFAULTS = {
  gender: 'Female', SeniorCitizen: 0, Partner: 'No', Dependents: 'No',
  tenure: 2, PhoneService: 'Yes', MultipleLines: 'No',
  InternetService: 'Fiber optic', OnlineSecurity: 'No', OnlineBackup: 'No',
  DeviceProtection: 'No', TechSupport: 'No', StreamingTV: 'No', StreamingMovies: 'No',
  Contract: 'Month-to-month', PaperlessBilling: 'Yes',
  PaymentMethod: 'Electronic check', MonthlyCharges: 85, TotalCharges: 170,
};

function riskLevel(prob, threshold) {
  if (prob < 0.3) return 'Low';
  if (prob < threshold) return 'Medium';
  return 'High';
}

// fetch with a hard timeout — without this, a hung request (cold start,
// dropped connection, misconfigured proxy) leaves the UI stuck on
// "Predicting…" forever with no feedback. 20s covers a slow Railway cold
// start; anything past that should surface as an error, not a silent hang.
async function fetchWithTimeout(url, opts = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

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

export default function ChurnLiveDemo() {
  const [form, setForm] = useState(DEFAULTS);
  const [models, setModels] = useState(null);
  const [selectedModel, setSelectedModel] = useState('logistic_regression');
  const [threshold, setThreshold] = useState(0.4);
  const [thresholdTouched, setThresholdTouched] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [modelsAttempt, setModelsAttempt] = useState(0);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/models`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((m) => {
        setModels(m);
        setThreshold(m[selectedModel].threshold);
      })
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [modelsAttempt]);

  useEffect(() => {
    if (models && !thresholdTouched) setThreshold(models[selectedModel].threshold);
  }, [selectedModel, models]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const hasInternet = form.InternetService !== 'No';
  const internetFields = ['OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies'];

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, model: selectedModel };
      if (!hasInternet) internetFields.forEach((f) => (payload[f] = 'No internet service'));
      if (form.PhoneService === 'No') payload.MultipleLines = 'No phone service';

      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Prediction failed (${res.status})`);
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const derivedPrediction = result ? (result.churn_probability >= threshold ? 'Yes' : 'No') : null;
  const derivedRisk = result ? riskLevel(result.churn_probability, threshold) : null;

  if (apiUnreachable) {
    return (
      <div className="bg-amber-50 border border-amber-300/60 rounded-2xl p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Live demo API isn't reachable right now.</p>
        <p>
          Run the churn API locally (<code className="bg-black/10 px-1.5 py-0.5 rounded">cd api && uvicorn main:app --reload --port 8000</code>)
          to try this live, or check back once it's deployed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[1.3fr_1fr] gap-6 items-start">
      <form onSubmit={submit} className="bg-white/70 border border-black/10 rounded-2xl p-5">
        {models && (
          <div className="mb-5 pb-4 border-b border-black/10">
            <Field label="Model">
              <select className={selectClass} value={selectedModel} onChange={(e) => { setSelectedModel(e.target.value); setThresholdTouched(false); }}>
                {Object.entries(models).map(([key, m]) => (
                  <option key={key} value={key}>{m.label} (ROC-AUC {m.roc_auc.toFixed(3)})</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          <Field label="Gender">
            <select className={selectClass} value={form.gender} onChange={(e) => update('gender', e.target.value)}>
              <option>Female</option><option>Male</option>
            </select>
          </Field>
          <Field label="Senior citizen">
            <select className={selectClass} value={form.SeniorCitizen} onChange={(e) => update('SeniorCitizen', Number(e.target.value))}>
              <option value={0}>No</option><option value={1}>Yes</option>
            </select>
          </Field>
          <Field label="Has partner">
            <select className={selectClass} value={form.Partner} onChange={(e) => update('Partner', e.target.value)}>
              <option>No</option><option>Yes</option>
            </select>
          </Field>
          <Field label="Has dependents">
            <select className={selectClass} value={form.Dependents} onChange={(e) => update('Dependents', e.target.value)}>
              <option>No</option><option>Yes</option>
            </select>
          </Field>

          <Field label={`Tenure: ${form.tenure} months`}>
            <input type="range" min="0" max="72" value={form.tenure} onChange={(e) => update('tenure', Number(e.target.value))} className="accent-primary-600" />
          </Field>
          <Field label={`Monthly charges: $${form.MonthlyCharges}`}>
            <input type="range" min="0" max="150" value={form.MonthlyCharges} onChange={(e) => update('MonthlyCharges', Number(e.target.value))} className="accent-primary-600" />
          </Field>
          <Field label={`Total charges: $${form.TotalCharges}`}>
            <input type="range" min="0" max="9000" step="10" value={form.TotalCharges} onChange={(e) => update('TotalCharges', Number(e.target.value))} className="accent-primary-600" />
          </Field>

          <Field label="Contract">
            <select className={selectClass} value={form.Contract} onChange={(e) => update('Contract', e.target.value)}>
              <option>Month-to-month</option><option>One year</option><option>Two year</option>
            </select>
          </Field>
          <Field label="Payment method">
            <select className={selectClass} value={form.PaymentMethod} onChange={(e) => update('PaymentMethod', e.target.value)}>
              <option>Electronic check</option><option>Mailed check</option>
              <option>Bank transfer (automatic)</option><option>Credit card (automatic)</option>
            </select>
          </Field>
          <Field label="Paperless billing">
            <select className={selectClass} value={form.PaperlessBilling} onChange={(e) => update('PaperlessBilling', e.target.value)}>
              <option>Yes</option><option>No</option>
            </select>
          </Field>

          <Field label="Phone service">
            <select className={selectClass} value={form.PhoneService} onChange={(e) => update('PhoneService', e.target.value)}>
              <option>Yes</option><option>No</option>
            </select>
          </Field>
          {form.PhoneService === 'Yes' && (
            <Field label="Multiple lines">
              <select className={selectClass} value={form.MultipleLines} onChange={(e) => update('MultipleLines', e.target.value)}>
                <option>No</option><option>Yes</option>
              </select>
            </Field>
          )}
          <Field label="Internet service">
            <select className={selectClass} value={form.InternetService} onChange={(e) => update('InternetService', e.target.value)}>
              <option>DSL</option><option>Fiber optic</option><option>No</option>
            </select>
          </Field>

          {hasInternet && internetFields.map((key) => (
            <Field key={key} label={key.replace(/([A-Z])/g, ' $1').trim()}>
              <select className={selectClass} value={form[key]} onChange={(e) => update(key, e.target.value)}>
                <option>No</option><option>Yes</option>
              </select>
            </Field>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
        >
          {loading ? 'Predicting…' : 'Predict churn risk'}
        </button>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </form>

      <div className="bg-white/70 border border-black/10 rounded-2xl p-6 min-h-[220px] flex items-center justify-center">
        {!result && <p className="text-sm text-zinc-500 text-center">Set a profile and click predict.</p>}
        {result && (
          <div className="w-full text-center">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">{result.model_used}</div>
            <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${
              derivedRisk === 'Low' ? 'text-primary-700' : derivedRisk === 'Medium' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {derivedRisk} risk
            </div>
            <div className="text-4xl font-heading font-bold text-black">{(result.churn_probability * 100).toFixed(1)}%</div>
            <div className="text-xs text-zinc-500 mb-4">predicted churn probability</div>

            <div className="relative h-2 rounded-full bg-black/10 mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 via-amber-500 to-red-500"
                style={{ width: `${result.churn_probability * 100}%` }}
              />
              <div className="absolute -top-1 w-0.5 h-4 bg-black/60" style={{ left: `${threshold * 100}%` }} />
            </div>

            <p className="text-xs text-zinc-600 mb-4">
              Verdict: <strong>{derivedPrediction === 'Yes' ? 'Likely to churn' : 'Likely to stay'}</strong>
            </p>

            <div className="text-left pt-4 border-t border-black/10">
              <p className="text-xs text-zinc-600 mb-2">
                Decision threshold: <strong>{threshold.toFixed(2)}</strong>
              </p>
              <input
                type="range" min="0.05" max="0.95" step="0.01" value={threshold}
                onChange={(e) => { setThreshold(Number(e.target.value)); setThresholdTouched(true); }}
                className="w-full accent-primary-600"
              />
              <p className="text-[11px] text-zinc-500 mt-2">
                Drag to see the precision/recall tradeoff — the probability doesn't change, only the classification.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
