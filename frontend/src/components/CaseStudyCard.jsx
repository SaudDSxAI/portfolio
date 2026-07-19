import TransitionLink from './ui/TransitionLink';
import TechBadge from './ui/TechBadge';
import { getTheme, getIcon } from '../lib/projectTheme';

export default function CaseStudyCard({ study, categoryKey, index = 0 }) {
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
        {/* Preview: a small icon badge on a muted background, identifying
            the project at a glance without a full-bleed saturated color
            block — the chart that lived here before read as decoration
            rather than a useful preview, and a full-color banner read as
            too intense across a grid of many different accent colors. */}
        <div className="relative flex items-center justify-center h-24 bg-black/[0.03] border-b border-black/5">
          <span className={`flex items-center justify-center w-12 h-12 rounded-xl ${theme.iconBg} text-white shadow-sm ${theme.iconShadow}`}>
            <Icon className="w-6 h-6" strokeWidth={1.75} />
          </span>
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
            View full case study
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
          </div>
        </div>
      </div>
    </TransitionLink>
  );
}
