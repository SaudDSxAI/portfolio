import TransitionLink from './ui/TransitionLink';
import { getTheme, getIcon } from '../lib/projectTheme';

// Kept visually consistent with the generic CaseStudyCard now: just an icon,
// title, and short description. The old verdict strip (5 technique status
// dots), category label, tech badges, and CTA row were all removed to keep
// the card minimal — that detail belongs on the case study page, not here.
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
        <div className="relative flex items-center justify-center h-24 bg-black/[0.03] border-b border-black/5">
          <span className={`flex items-center justify-center w-12 h-12 rounded-xl ${theme.iconBg} text-white shadow-sm ${theme.iconShadow}`}>
            <Icon className="w-6 h-6" strokeWidth={1.75} />
          </span>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-heading font-bold text-black text-lg mb-2 group-hover:text-black transition-colors duration-300">
            {study.title}
          </h3>
          <p className="text-sm text-zinc-700 leading-relaxed flex-1">{study.tagline}</p>
        </div>
      </div>
    </TransitionLink>
  );
}
