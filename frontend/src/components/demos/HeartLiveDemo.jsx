import { useEffect, useState } from 'react';

// Heart model is served by this portfolio's own backend, same pattern as
// the churn demo — same-origin, mounted at /api/heart/*.
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/heart';

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
  age: 54, sex: 1, chest_pain_type: 4, resting_bp_s: 130, cholesterol: 240,
  fasting_blood_sugar: 0, resting_ecg: 0, max_heart_rate: 140,
  exercise_angina: 0, oldpeak: 1.0, ST_slope: 2,
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

export default function HeartLiveDemo() {
  const [form, setForm] = useState(DEFAULTS);
  const [models, setModels] = useState(null);
  const [selectedModel, setSelectedModel] = useState('logistic_regression');
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
      .then((m) => setModels(m))
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [modelsAttempt]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, model: selectedModel }),
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
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/heart/models</code> on this
          site's own backend. Run it locally with{' '}
          <code className="bg-black/10 px-1.5 py-0.5 rounded">python main.py</code>, or make sure the
          heart_model.py changes are deployed if you're viewing the live site.
        </p>
        <p className="text-xs opacity-75 mb-3">Detail: {unreachableDetail}</p>
        <button
          onClick={() => setModelsAttempt((n) => n + 1)}
          className="px-3 py-1.5 rounded-lg bg-amber-200/70 hover:bg-amber-300/70 text-xs font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[1.3fr_1fr] gap-6 items-start">
      <form onSubmit={submit} className="bg-white/70 border border-black/10 rounded-2xl p-5">
        {models && (
          <div className="mb-5 pb-4 border-b border-black/10">
            <Field label="Model">
              <select className={selectClass} value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                {Object.entries(models).map(([key, m]) => (
                  <option key={key} value={key}>{m.label} (ROC-AUC {m.roc_auc.toFixed(3)})</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          <Field label={`Age: ${form.age}`}>
            <input type="range" min="20" max="90" value={form.age} onChange={(e) => update('age', Number(e.target.value))} className="accent-primary-600" />
          </Field>
          <Field label="Sex">
            <select className={selectClass} value={form.sex} onChange={(e) => update('sex', Number(e.target.value))}>
              <option value={0}>Female</option><option value={1}>Male</option>
            </select>
          </Field>
          <Field label="Chest pain type">
            <select className={selectClass} value={form.chest_pain_type} onChange={(e) => update('chest_pain_type', Number(e.target.value))}>
              <option value={1}>Typical angina</option>
              <option value={2}>Atypical angina</option>
              <option value={3}>Non-anginal pain</option>
              <option value={4}>Asymptomatic</option>
            </select>
          </Field>
          <Field label="Resting ECG">
            <select className={selectClass} value={form.resting_ecg} onChange={(e) => update('resting_ecg', Number(e.target.value))}>
              <option value={0}>Normal</option>
              <option value={1}>ST-T abnormality</option>
              <option value={2}>LV hypertrophy</option>
            </select>
          </Field>

          <Field label={`Resting BP: ${form.resting_bp_s} mmHg`}>
            <input type="range" min="80" max="220" value={form.resting_bp_s} onChange={(e) => update('resting_bp_s', Number(e.target.value))} className="accent-primary-600" />
          </Field>
          <Field label={`Cholesterol: ${form.cholesterol} mg/dl`}>
            <input type="range" min="0" max="600" value={form.cholesterol} onChange={(e) => update('cholesterol', Number(e.target.value))} className="accent-primary-600" />
          </Field>
          <Field label={`Max heart rate: ${form.max_heart_rate}`}>
            <input type="range" min="60" max="220" value={form.max_heart_rate} onChange={(e) => update('max_heart_rate', Number(e.target.value))} className="accent-primary-600" />
          </Field>
          <Field label={`ST depression (oldpeak): ${form.oldpeak}`}>
            <input type="range" min="-2" max="6" step="0.1" value={form.oldpeak} onChange={(e) => update('oldpeak', Number(e.target.value))} className="accent-primary-600" />
          </Field>

          <Field label="Fasting blood sugar > 120 mg/dl">
            <select className={selectClass} value={form.fasting_blood_sugar} onChange={(e) => update('fasting_blood_sugar', Number(e.target.value))}>
              <option value={0}>No</option><option value={1}>Yes</option>
            </select>
          </Field>
          <Field label="Exercise-induced angina">
            <select className={selectClass} value={form.exercise_angina} onChange={(e) => update('exercise_angina', Number(e.target.value))}>
              <option value={0}>No</option><option value={1}>Yes</option>
            </select>
          </Field>
          <Field label="ST slope">
            <select className={selectClass} value={form.ST_slope} onChange={(e) => update('ST_slope', Number(e.target.value))}>
              <option value={1}>Upsloping</option>
              <option value={2}>Flat</option>
              <option value={3}>Downsloping</option>
            </select>
          </Field>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
        >
          {loading ? 'Predicting…' : 'Predict disease risk'}
        </button>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </form>

      <div className="bg-white/70 border border-black/10 rounded-2xl p-6 min-h-[220px] flex items-center justify-center">
        {!result && <p className="text-sm text-zinc-500 text-center">Set a patient profile and click predict.</p>}
        {result && (
          <div className="w-full text-center">
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">{result.model_used}</div>
            <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${
              result.prediction_at_threshold === 'Yes' ? 'text-red-600' : 'text-primary-700'
            }`}>
              {result.prediction_at_threshold === 'Yes' ? 'Elevated risk' : 'Low risk'}
            </div>
            <div className="text-4xl font-heading font-bold text-black">{(result.disease_probability * 100).toFixed(1)}%</div>
            <div className="text-xs text-zinc-500 mb-4">predicted disease probability</div>
            <div className="relative h-2 rounded-full bg-black/10 mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 via-amber-500 to-red-500"
                style={{ width: `${result.disease_probability * 100}%` }}
              />
              <div className="absolute -top-1 w-0.5 h-4 bg-black/60" style={{ left: '50%' }} />
            </div>
            <p className="text-xs text-zinc-600">
              Verdict: <strong>{result.prediction_at_threshold === 'Yes' ? 'Likely disease present' : 'Likely no disease'}</strong> (threshold 0.50)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
