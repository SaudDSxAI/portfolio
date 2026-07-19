import TransitionLink from './ui/TransitionLink';
import TechBadge from './ui/TechBadge';
import { getTheme, getIcon } from '../lib/projectTheme';

const STATUS_DOT = {
  reliable: 'bg-emerald-500',
  fragile: 'bg-amber-500',
  inconsistent: 'bg-rose-500',
};

// Distinct from the generic CaseStudyCard's "icon + headline metric + mini
// bar chart" preview. This project doesn't have a single headline number,
// it has four techniques with four different real outcomes. The preview
// leads with that instead: a small verdict strip, not a fake single metric.
export default function RAGProjectCard({ study, categoryKey, index = 0 }) {
  const theme = getTheme(study.accentColor);
  const Icon = getIcon(study.icon);

  return (
    <TransitionLink
      to={`/${categoryKey}/${study.slug}`}
      className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 h-full block"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-transparent via-transparent to-transparent ${theme.glowFrom} ${theme.glowVia} ${theme.glowTo} transition-all duration-500 blur-md opacity-60`} />

      <div className={`relative bg-warm-100/90 border border-black/10 rounded-2xl overflow-hidden h-full flex flex-col ${theme.hoverBorder} hover:shadow-2xl ${theme.hoverShadow} transition-all duration-500`}>
        {/* Preview: icon + a 4-technique verdict strip instead of one metric */}
        <div className="relative p-5 pb-4 border-b border-black/10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className={`flex items-center justify-center w-10 h-10 rounded-xl ${theme.iconBg} text-white shadow-md ${theme.iconShadow}`}>
              <Icon className="w-5 h-5" strokeWidth={2} />
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">4 techniques, live</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {study.verdicts.map((v) => (
              <div key={v.key} className="flex flex-col items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[v.status]}`} />
                <span className="text-[10px] text-zinc-500 text-center leading-tight">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col">
          <div className={`text-[11px] font-semibold ${theme.text} uppercase tracking-[0.2em] mb-2`}>
            {study.categoryKey.toUpperCase()} Case Study
          </div>
          <h3 className="font-heading font-bold text-black text-lg mb-2 group-hover:text-black transition-colors duration-300">
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

          <div className={`flex items-center gap-1.5 text-sm font-semibold ${theme.text} pt-3 border-t border-black/10`}>
            Try the live comparison
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
          </div>
        </div>
      </div>
    </TransitionLink>
  );
}
