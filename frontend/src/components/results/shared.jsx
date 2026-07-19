// Shared visual primitives for the per-project "results" sections. Each ML
// case study composes a different subset of these into its own layout, so
// two projects never end up with the literal same chart shape even though
// they share underlying building blocks.
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';

// Ranked leaderboard — #1/#2/#3 badges with a proportional bar underneath
// each name, instead of a plain bar chart. Good for "which model won" when
// the framing is competitive.
export function RankLeaderboard({ data, metricKey, metricLabel, theme, suffix = '%' }) {
  const sorted = [...data].sort((a, b) => b[metricKey] - a[metricKey]);
  const max = Math.max(...sorted.map((d) => d[metricKey]));
  const min = Math.min(...sorted.map((d) => d[metricKey]));
  const range = Math.max(max - min, 0.001);
  const medals = ['#1', '#2', '#3', '#4', '#5'];

  return (
    <div className="space-y-3">
      {sorted.map((d, i) => {
        const fillPct = 15 + ((d[metricKey] - min) / range) * 85;
        return (
          <div key={d.name} className={`rounded-xl border p-4 ${d.chosen ? 'border-black/20 bg-white/70' : 'border-black/10 bg-white/30'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-heading font-bold ${
                  i === 0 ? `${theme.iconBg} text-white shadow-sm ${theme.iconShadow}` : 'bg-black/5 text-zinc-500'
                }`}>
                  {medals[i] || `#${i + 1}`}
                </span>
                <span className="text-sm font-semibold text-black">{d.name}</span>
                {d.chosen && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme.badge}`}>chosen</span>
                )}
              </div>
              <span className="text-sm font-heading font-bold text-black">{d[metricKey]}{suffix}</span>
            </div>
            <div className="h-2 rounded-full bg-black/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${fillPct}%`, background: d.chosen ? theme.chartChosen : theme.chartOther }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-zinc-500">{metricLabel}, higher is better.</p>
    </div>
  );
}

// Tornado / butterfly chart — bars grow left or right from a centered zero
// axis depending on sign, so the direction of each feature's pull is visible
// at a glance instead of just its rank.
export function TornadoChart({ data, theme }) {
  const max = Math.max(...data.map((d) => Math.abs(d.coefficient)));
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = (Math.abs(d.coefficient) / max) * 50;
        const positive = d.coefficient >= 0;
        return (
          <div key={d.feature} className="flex items-center gap-3 text-xs">
            <div className="w-[42%] text-right text-zinc-600 truncate" title={d.feature}>
              {!positive ? d.feature : ''}
            </div>
            <div className="relative flex-1 h-5 flex items-center">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/15" />
              {!positive && (
                <div
                  className="absolute right-1/2 h-3 rounded-l bg-zinc-400"
                  style={{ width: `${pct}%` }}
                />
              )}
              {positive && (
                <div
                  className="absolute left-1/2 h-3 rounded-r"
                  style={{ width: `${pct}%`, background: theme.chartChosen }}
                />
              )}
            </div>
            <div className="w-[42%] text-left text-zinc-600 truncate" title={d.feature}>
              {positive ? d.feature : ''}
            </div>
          </div>
        );
      })}
      <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
        <span>pulls toward "no"</span>
        <span>pulls toward "yes"</span>
      </div>
    </div>
  );
}

// Confusion matrix rendered as a heat strip — one row of four proportionally
// sized blocks (mosaic plot) instead of four equal-sized cards, so the actual
// scale of false alarms vs. correct calls is visible in the shape itself.
export function MosaicConfusion({ cm, labels, theme }) {
  const total = cm.tn + cm.fp + cm.fn + cm.tp;
  const defaultLabels = { tn: 'Correct negative', fp: 'False alarm', fn: 'Missed', tp: 'Correct positive' };
  const l = { ...defaultLabels, ...labels };
  const cells = [
    { key: 'tn', value: cm.tn, label: l.tn, tone: 'good' },
    { key: 'fp', value: cm.fp, label: l.fp, tone: 'bad' },
    { key: 'fn', value: cm.fn, label: l.fn, tone: 'bad' },
    { key: 'tp', value: cm.tp, label: l.tp, tone: 'good' },
  ];
  return (
    <div>
      <p className="text-sm text-zinc-600 mb-3">Out of {total.toLocaleString()} held-out test cases, block width shows actual share.</p>
      <div className="flex w-full h-16 rounded-xl overflow-hidden border border-black/10">
        {cells.map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-center text-center px-1"
            style={{
              width: `${(c.value / total) * 100}%`,
              background: c.tone === 'good' ? theme.chartChosen : '#dc9a3f',
              minWidth: c.value > 0 ? '2%' : 0,
            }}
            title={`${c.label}: ${c.value}`}
          >
            {(c.value / total) * 100 > 6 && (
              <span className="text-[10px] font-bold text-white leading-tight">{c.value.toLocaleString()}</span>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        {cells.map((c) => (
          <div key={c.key} className="flex items-center gap-2 text-[11px] text-zinc-600">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.tone === 'good' ? theme.chartChosen : '#dc9a3f' }} />
            {c.label} ({c.value.toLocaleString()})
          </div>
        ))}
      </div>
    </div>
  );
}

// A number-line dot plot — for "these models basically tied" stories, where
// a bar chart exaggerates a gap that's actually within noise. Dots on a
// shared axis make a near-tie visually obvious instead of hidden by bar
// chart auto-zoom.
export function DotPlot({ data, metricKey, metricLabel, theme, suffix = '%' }) {
  const values = data.map((d) => d[metricKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.6, 1);
  const lo = min - pad;
  const hi = max + pad;
  const pos = (v) => ((v - lo) / (hi - lo)) * 100;

  return (
    <div className="pt-6 pb-2">
      <div className="relative h-px bg-black/15 mb-8">
        {data.map((d) => (
          <div key={d.name} className="absolute -top-2" style={{ left: `${pos(d[metricKey])}%`, transform: 'translateX(-50%)' }}>
            <div
              className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${d.chosen ? '' : 'opacity-70'}`}
              style={{ background: d.chosen ? theme.chartChosen : theme.chartOther }}
              title={`${d.name}: ${d[metricKey]}${suffix}`}
            />
            <div className="mt-2 text-[11px] text-center whitespace-nowrap -translate-x-1/2 relative left-1/2">
              <div className="font-semibold text-black">{d[metricKey]}{suffix}</div>
              <div className="text-zinc-500">{d.name}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-zinc-500 mt-10">{metricLabel}: dots close together means the models are effectively tied.</p>
    </div>
  );
}

// Radial progress rings — one ring per model, used for regression R² where a
// "percent of variance explained" framing reads naturally as a fill amount
// rather than a bar height.
export function RadialCompare({ data, metricKey, metricLabel, theme }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {data.map((d) => (
        <div key={d.name} className={`flex flex-col items-center rounded-xl p-3 ${d.chosen ? 'bg-white/70 border border-black/15' : ''}`}>
          <div className="w-full h-24">
            <ResponsiveContainer>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={[{ value: d[metricKey] }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background={{ fill: '#eee5d6' }}
                  dataKey="value"
                  cornerRadius={8}
                  fill={d.chosen ? theme.chartChosen : theme.chartOther}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm font-heading font-bold text-black -mt-3">{d[metricKey]}%</div>
          <div className="text-[11px] text-zinc-600 text-center mt-1 leading-tight">{d.name}</div>
        </div>
      ))}
      <p className="col-span-full text-[11px] text-zinc-500 mt-1">{metricLabel}: how much of the fill each model reaches.</p>
    </div>
  );
}

// Funnel — decreasing-width horizontal bars, for "N things narrowed down to
// M things" stories (dataset -> test set -> flagged -> caught).
export function FunnelBars({ steps, theme }) {
  const max = Math.max(...steps.map((s) => s.value));
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const pct = 25 + (s.value / max) * 75;
        return (
          <div key={i} className="flex flex-col items-center">
            <div
              className="rounded-lg py-3 px-4 text-center text-white shadow-sm"
              style={{
                width: `${pct}%`,
                background: i === steps.length - 1 ? theme.chartChosen : '#a89f8c',
                opacity: i === steps.length - 1 ? 1 : 0.55 + (i / Math.max(steps.length - 1, 1)) * 0.3,
              }}
            >
              <div className="text-lg font-heading font-bold leading-none">{s.value.toLocaleString()}</div>
              <div className="text-[11px] opacity-90 mt-1">{s.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// A grid of small squares standing in for a sparse ratings matrix — most
// cells empty, a few filled, so "98% sparse" is something you see instead
// of just read as a percentage.
export function SparsityGrid({ filledPct, theme, cols = 20, rows = 5 }) {
  const total = cols * rows;
  const filledCount = Math.round((filledPct / 100) * total);
  // Deterministic pseudo-random-looking scatter, not actually random, so the
  // grid doesn't reshuffle on every re-render.
  const filledSet = new Set();
  let seed = 7;
  while (filledSet.size < filledCount) {
    seed = (seed * 48271) % 2147483647;
    filledSet.add(seed % total);
  }
  return (
    <div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm"
            style={{ background: filledSet.has(i) ? theme.chartChosen : '#eee5d6' }}
          />
        ))}
      </div>
      <p className="text-[11px] text-zinc-500 mt-3">
        Each square is a slice of the user-movie ratings grid. Filled squares are the {filledPct}% that are actually rated.
      </p>
    </div>
  );
}

// Diverging seasonal bars — a plain BarChart with a zero reference line so
// months that pull sales up vs. down read as up/down bars instead of a
// generic "feature importance" ranking.
export function SeasonalBars({ data, theme }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" vertical={false} />
        <XAxis dataKey="feature" tick={{ fontSize: 11, fill: '#585b3c' }} angle={-30} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11, fill: '#585b3c' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <ReferenceLine y={0} stroke="#585b3c" />
        <Tooltip formatter={(v) => `$${v.toLocaleString()}`} contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }} />
        <Bar dataKey="coefficient" radius={[4, 4, 4, 4]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.coefficient >= 0 ? theme.chartChosen : '#c9a876'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// A left-anchored signed bar list — bars start at the same left edge and
// grow right, colored by sign, ranked by magnitude. Reads as a plain "top
// drivers" list rather than the centered tornado shape, so a project that
// also uses TornadoChart elsewhere doesn't repeat the same visual.
export function SignedBarList({ data, theme }) {
  const max = Math.max(...data.map((d) => Math.abs(d.coefficient)));
  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const positive = d.coefficient >= 0;
        const pct = Math.max((Math.abs(d.coefficient) / max) * 100, 4);
        return (
          <div key={d.feature} className="flex items-center gap-3">
            <div className="w-[38%] text-xs text-zinc-600 text-right truncate" title={d.feature}>{d.feature}</div>
            <div className="flex-1 h-4 rounded bg-black/5 overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${pct}%`, background: positive ? theme.chartChosen : '#c9a876' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Inline stat strip — the info that used to live in a grid of metric cards,
// now presented as a single editorial byline instead of a boxed dashboard.
export function StatStrip({ metrics }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 mb-6">
      {metrics.map((m) => (
        <div key={m.label}>
          <div className="text-xl font-heading font-bold text-black leading-none">{m.value}</div>
          <div className="text-[11px] text-zinc-500 mt-1">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

// Two-column head-to-head — for a genuine "model A vs model B" tie, with a
// ribbon banner carrying the statistical verdict front and center instead of
// buried in prose.
export function HeadToHead({ left, right, ribbon, theme }) {
  return (
    <div>
      {ribbon && (
        <div className={`text-center text-xs font-semibold px-4 py-2 rounded-full mb-6 inline-flex items-center gap-2 ${theme.badge}`}>
          {ribbon}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {[left, right].map((side, i) => (
          <div key={i} className={`rounded-2xl p-5 border ${side.chosen ? 'border-black/20 bg-white/70' : 'border-black/10 bg-white/30'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-black text-sm">{side.name}</h3>
              {side.chosen && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme.badge}`}>chosen</span>}
            </div>
            <div className="space-y-2.5">
              {side.stats.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">{s.label}</span>
                  <span className="font-heading font-bold text-black">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden" />
    </div>
  );
}
