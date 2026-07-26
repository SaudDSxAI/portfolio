import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StatStrip, RankLeaderboard } from './shared';

export default function MSMarcoRagResults({ study, theme }) {
  const mrrData = (study.techniqueResults || []).map((t) => ({
    name: t.name,
    mrrPct: t.mrr10,
    chosen: t.chosen,
  }));

  return (
    <div className="space-y-8">
      <StatStrip metrics={study.heroMetrics} />

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Recall@1 / @5 / @10, by technique</h2>
        <p className="text-sm text-zinc-600 mb-4">All five techniques, same 6,980 real MS MARCO dev questions, same 300,000-passage index.</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={study.techniqueResults} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#585b3c' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#585b3c' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="recall1" name="Recall@1" fill="#dfe2bb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recall5" name="Recall@5" fill={theme.chartOther} radius={[4, 4, 0, 0]} />
            <Bar dataKey="recall10" name="Recall@10" fill={theme.chartChosen} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">MRR@10, by technique</h2>
        <p className="text-sm text-zinc-600 mb-4">How high the first correct passage tends to rank, averaged across all 6,980 questions.</p>
        <RankLeaderboard data={mrrData} metricKey="mrrPct" metricLabel="MRR@10 x100" theme={theme} suffix="" />
      </div>

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Real wall-clock cost, by technique</h2>
        <p className="text-sm text-zinc-600 mb-4">Log scale — Re-ranking's accuracy win costs nearly 1,700x longer than plain Dense search.</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={study.runtimeData} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" horizontal={false} />
            <XAxis type="number" scale="log" domain={[0.03, 1500]} tick={{ fontSize: 11, fill: '#585b3c' }} tickFormatter={() => ''} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#585b3c' }} width={80} />
            <Tooltip
              formatter={(v, name, props) => [props.payload.display, 'Runtime']}
              contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }}
            />
            <Bar dataKey="minutes" radius={[0, 4, 4, 0]} fill={theme.chartOther}>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-2">
          {(study.runtimeData || []).map((d) => (
            <div key={d.name} className="flex items-center justify-between text-[11px] text-zinc-600">
              <span>{d.name}</span>
              <span className="font-semibold text-black">{d.display}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
