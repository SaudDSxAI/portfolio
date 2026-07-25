import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatStrip } from './shared';

export default function CitationRoutingResults({ study, theme }) {
  const data = (study.routingByCategory || []).map((c) => ({
    category: c.category,
    Before: Math.round((c.before / c.total) * 100),
    After: Math.round((c.after / c.total) * 100),
    beforeCount: c.before,
    afterCount: c.after,
    total: c.total,
  }));

  return (
    <div className="space-y-8">
      <StatStrip metrics={study.heroMetrics} />

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Routing accuracy, by question type</h2>
        <p className="text-sm text-zinc-600 mb-4">Before vs. after grounding the router in Saud's real project list.</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" vertical={false} />
            <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#585b3c' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#585b3c' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v, name, props) => [
                `${v}% (${name === 'Before' ? props.payload.beforeCount : props.payload.afterCount}/${props.payload.total})`,
                name,
              ]}
              contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }}
            />
            <Bar dataKey="Before" fill={theme.chartOther} radius={[4, 4, 0, 0]} />
            <Bar dataKey="After" fill={theme.chartChosen} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[11px] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: theme.chartOther }} />
            Before fix
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: theme.chartChosen }} />
            After fix
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-3">
          Out of scope dips from 5/5 to 4/5 after the fix — the one honest tradeoff. A low-stakes question ("tell me a joke") started
          triggering retrieval it didn't need, as a side effect of biasing the router toward retrieval when unsure.
        </p>
      </div>
    </div>
  );
}
