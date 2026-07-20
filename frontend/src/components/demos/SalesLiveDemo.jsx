import { useEffect, useState } from 'react';
import {
  LineChart, Line, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/sales';

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

const fmt = (n) => `$${Math.round(n).toLocaleString()}`;
const fmtMonth = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

export default function SalesLiveDemo({ theme }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [unreachableDetail, setUnreachableDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setApiUnreachable(false);
    fetchWithTimeout(`${API_BASE}/forecast`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((err) => {
        setUnreachableDetail(err.message || 'Unknown error');
        setApiUnreachable(true);
      });
  }, [attempt]);

  if (apiUnreachable) {
    return (
      <div className="bg-amber-50 border border-amber-300/60 rounded-2xl p-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Live demo API isn't reachable right now.</p>
        <p className="mb-3">
          This calls <code className="bg-black/10 px-1.5 py-0.5 rounded">/api/sales/forecast</code> on this
          site's own backend. Run it locally with{' '}
          <code className="bg-black/10 px-1.5 py-0.5 rounded">python main.py</code>, or make sure the
          sales_model.py changes are deployed if you're viewing the live site.
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

  if (!data) return <p className="text-sm text-zinc-500">Loading forecast…</p>;

  // Merge history + forecast into one chart series, with a null gap so
  // recharts renders them as visually distinct lines (solid vs projected).
  const chartData = [
    ...data.history.map((h) => ({ date: h.date, actual: h.sales, forecast: null, lower: null, upper: null })),
    ...data.forecast.map((f) => ({ date: f.date, actual: null, forecast: f.predicted, lower: f.lower, upper: f.upper })),
  ];
  // Bridge the gap: let the forecast line start from the last actual point
  const lastActual = data.history[data.history.length - 1];
  const bridgeIndex = chartData.findIndex((d) => d.date === lastActual.date);
  if (bridgeIndex >= 0) chartData[bridgeIndex].forecast = lastActual.sales;

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4">
        This isn't a "fill in a form" demo. Forecasting predicts what happens next, not a category for a
        single input. The chart below shows 48 months of real sales (solid line) plus a genuine 6-month
        forecast beyond the data the model has ever seen (dashed line, with an uncertainty band).
      </p>

      <div className="bg-gradient-to-b from-white/80 to-warm-100/60 border border-black/10 rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-4 text-[11px] text-zinc-500 mb-2">
          <span className="flex items-center gap-1.5"><span className="w-3 h-[3px] rounded-full bg-[#41432d] inline-block" /> Actual</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-[3px] rounded-full bg-[#b45309] inline-block opacity-70" /> Forecast</span>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" />
            <XAxis dataKey="date" tickFormatter={fmtMonth} tick={{ fontSize: 10, fill: '#585b3c' }} interval={5} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#585b3c' }} />
            <Tooltip
              labelFormatter={fmtMonth}
              formatter={(v, name) => [v ? fmt(v) : 'N/A', name === 'actual' ? 'Actual' : name === 'forecast' ? 'Forecast' : name]}
              contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }}
            />
            <Area dataKey="upper" stroke="none" fill="#c9cba4" fillOpacity={0.3} />
            <Area dataKey="lower" stroke="none" fill="#fff" fillOpacity={1} />
            <Line dataKey="actual" stroke="#41432d" strokeWidth={2} dot={false} name="actual" />
            <Line dataKey="forecast" stroke="#b45309" strokeWidth={2} strokeDasharray="5 4" dot={false} name="forecast" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.forecast.slice(0, 3).map((f) => (
          <div key={f.date} className="bg-white/70 border border-black/10 rounded-xl p-3 text-center shadow-sm">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wide">{fmtMonth(f.date)}</div>
            <div className="text-lg font-heading font-bold text-black">{fmt(f.predicted)}</div>
            <div className="text-[10px] text-zinc-500">{fmt(f.lower)} – {fmt(f.upper)}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-zinc-500 mt-3">
        Trend: sales growing roughly {fmt(data.trend_dollars_per_month)}/month on average, with a repeating
        yearly pattern (busy Sep/Nov/Dec, quiet Jan/Feb) layered on top.
      </p>
    </div>
  );
}
