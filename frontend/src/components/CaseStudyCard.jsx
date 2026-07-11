import { Link } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import TechBadge from './ui/TechBadge';

// Small deterministic sparkline-style preview built from the project's own
// model comparison data — a real chart, not decoration.
function MiniComparisonChart({ data }) {
  return (
    <div className="h-20 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Bar dataKey="rocAuc" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.chosen ? '#73774e' : '#dfe2bb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CaseStudyCard({ study, categoryKey, index = 0 }) {
  return (
    <Link
      to={`/${categoryKey}/${study.slug}`}
      className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 h-full block"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary-400/0 via-primary-500/0 to-primary-700/0 group-hover:from-primary-400/40 group-hover:via-primary-500/30 group-hover:to-primary-700/40 transition-all duration-500 blur-md opacity-60" />

      <div className="relative bg-warm-100/90 border border-black/10 rounded-2xl overflow-hidden h-full flex flex-col hover:border-primary-600/40 hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-500">
        {/* Preview: mini chart + headline metric */}
        <div className="relative p-5 pb-0 border-b border-black/10">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <div className="text-[11px] font-semibold text-primary-700 uppercase tracking-[0.2em] mb-1">
                {study.categoryKey.toUpperCase()} Case Study
              </div>
              <div className="text-3xl font-heading font-bold text-black leading-none">
                {study.heroMetrics[0].value}
              </div>
              <div className="text-xs text-zinc-600 mt-1">{study.heroMetrics[0].label}</div>
            </div>
          </div>
          {study.modelComparison && <MiniComparisonChart data={study.modelComparison} />}
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-heading font-bold text-black text-lg mb-2 group-hover:text-primary-800 transition-colors duration-300">
            {study.title}
          </h3>
          <p className="text-sm text-zinc-700 leading-relaxed mb-4 flex-1">{study.tagline}</p>

          {study.tech?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {study.tech.slice(0, 4).map((t) => (
                <TechBadge key={t} name={t} />
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 group-hover:text-primary-900 pt-3 border-t border-black/10">
            View full case study
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
