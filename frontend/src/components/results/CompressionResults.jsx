import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { StatStrip } from './shared';

function parseTokens(v) {
  return parseInt(String(v).replace(/,/g, ''), 10);
}

export default function CompressionResults({ study, theme }) {
  const reductionData = (study.rules || [])
    .map((r) => ({
      question: r.question.replace(/\?$/, ''),
      before: parseTokens(r.before),
      after: parseTokens(r.after),
      reductionPct: parseFloat(r.reduction),
    }))
    .sort((a, b) => b.reductionPct - a.reductionPct);

  return (
    <div className="space-y-8">
      <StatStrip metrics={study.heroMetrics} />

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Token reduction, by question</h2>
        <p className="text-sm text-zinc-600 mb-4">All 24 real test questions, sorted by how much compression cut the prompt.</p>
        <ResponsiveContainer width="100%" height={540}>
          <BarChart data={reductionData} layout="vertical" margin={{ top: 5, right: 44, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#585b3c' }} tickFormatter={(v) => `${v}%`} domain={[0, 'dataMax + 6']} />
            <YAxis type="category" dataKey="question" tick={{ fontSize: 10, fill: '#585b3c' }} width={230} />
            <Tooltip
              formatter={(v) => [`${v}%`, 'Reduction']}
              labelFormatter={(label, payload) => (payload && payload[0] ? `${payload[0].payload.before} → ${payload[0].payload.after} tokens` : label)}
              contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }}
            />
            <Bar dataKey="reductionPct" radius={[0, 4, 4, 0]}>
              {reductionData.map((d, i) => (
                <Cell key={i} fill={theme.chartChosen} />
              ))}
              <LabelList dataKey="reductionPct" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 10, fill: '#3f3f2f' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Faithfulness & relevance, before vs. after</h2>
        <p className="text-sm text-zinc-600 mb-4">Scored by an LLM judge against the original, uncompressed source passages.</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={study.faithfulnessChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" vertical={false} />
            <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#585b3c' }} />
            <YAxis domain={[90, 100]} tick={{ fontSize: 11, fill: '#585b3c' }} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }} />
            <Bar dataKey="before" name="Before" fill={theme.chartOther} radius={[4, 4, 0, 0]} />
            <Bar dataKey="after" name="After" fill={theme.chartChosen} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[11px] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: theme.chartOther }} />
            Before compression
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: theme.chartChosen }} />
            After compression
          </span>
        </div>
      </div>
    </div>
  );
}
