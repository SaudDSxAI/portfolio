import { useState } from 'react';
import { CheckCircle2, TriangleAlert, Shuffle } from 'lucide-react';
import BackButton from '../components/ui/BackButton';
import TechBadge from '../components/ui/TechBadge';
import ScrollReveal from '../components/ui/ScrollReveal';
import RAGComparisonDemo from '../components/demos/RAGComparisonDemo';
import { getTheme, getIcon } from '../lib/projectTheme';

const STATUS_STYLES = {
  reliable: { icon: CheckCircle2, text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', pill: 'bg-emerald-100/80' },
  fragile: { icon: TriangleAlert, text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', pill: 'bg-amber-100/80' },
  inconsistent: { icon: Shuffle, text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', pill: 'bg-rose-100/80' },
};

function VerdictCard({ v }) {
  const s = STATUS_STYLES[v.status] || STATUS_STYLES.reliable;
  const StatusIcon = s.icon;
  return (
    <div
      className={`group rounded-2xl border ${s.border} ${s.bg} p-4 flex flex-col gap-2 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="font-heading font-bold text-black text-sm leading-tight">{v.label}</h3>
        <span className={`inline-flex items-center gap-1 w-fit text-[10px] font-bold uppercase tracking-wide ${s.text} ${s.pill} px-2 py-0.5 rounded-full`}>
          <StatusIcon className="w-3 h-3" strokeWidth={2.5} />
          {v.statusLabel}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 leading-snug">{v.approach}</p>
      <p className="text-xs text-zinc-700 leading-relaxed flex-1">{v.finding}</p>
    </div>
  );
}

function DeepDiveRow({ item, isOpen, onToggle, theme }) {
  return (
    <div className="border-b border-black/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <div>
          <div className={`text-[11px] font-semibold ${theme.text} uppercase tracking-[0.15em] mb-0.5`}>{item.label}</div>
          <div className="font-heading font-bold text-black text-base">{item.summary}</div>
        </div>
        <svg
          className={`w-5 h-5 flex-shrink-0 text-zinc-400 group-hover:text-black transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-5' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="text-sm text-zinc-700 leading-relaxed max-w-3xl">{item.body}</p>
        </div>
      </div>
    </div>
  );
}

export default function RAGCaseStudyPage({ study, categoryMeta }) {
  const theme = getTheme(study.accentColor);
  const Icon = getIcon(study.icon);
  const [openKey, setOpenKey] = useState(study.techniqueDeepDives?.[0]?.key || null);

  return (
    <article className="relative py-24 sm:py-28 px-4 sm:px-6">
      <BackButton to="/rag" label={`Back to ${categoryMeta?.label || 'projects'}`} />
      <div className="max-w-4xl mx-auto">

        {/* Compact hero — no giant metric grid, the demo below is the point */}
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-4">
            <span className={`flex items-center justify-center w-11 h-11 rounded-xl ${theme.iconBg} text-white shadow-md ${theme.iconShadow} flex-shrink-0`}>
              <Icon className="w-5 h-5" strokeWidth={2} />
            </span>
            <div className={`text-[11px] font-semibold ${theme.text} uppercase tracking-[0.25em]`}>
              {categoryMeta?.label}
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-black mb-3 tracking-tight leading-[1.1] max-w-2xl">
            {study.title}
          </h1>
          <p className="text-base text-zinc-700 leading-relaxed mb-5 max-w-2xl">{study.tagline}</p>

          <div className="flex items-center gap-3 mb-8 flex-wrap">
            {study.notebookUrl && (
              <a
                href={study.notebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black/15 text-black text-sm font-semibold hover:border-black/30 transition-colors"
              >
                View full notebook
              </a>
            )}
            {study.corpusStats.map((s) => (
              <span key={s.label} className="text-xs text-zinc-500 flex items-center gap-1.5">
                <span className="font-semibold text-black">{s.value}</span> {s.label}
              </span>
            ))}
          </div>
        </ScrollReveal>

        {/* The demo IS the case study — leads immediately, not buried after
            hero metrics and architecture diagrams like every other project. */}
        <ScrollReveal delay={80}>
          <div className={`rounded-3xl border-2 ${theme.hoverBorder} bg-gradient-to-br from-blue-50/50 to-transparent p-3 sm:p-5 md:p-7 mb-10`}>
            <h2 className="text-lg font-heading font-bold text-black mb-1">{study.liveDemoHeading}</h2>
            <p className="text-sm text-zinc-600 mb-5">{study.liveDemoBlurb}</p>
            <RAGComparisonDemo />
          </div>
        </ScrollReveal>

        {/* Verdict scorecard — the "real result" at a glance, before any prose */}
        <ScrollReveal delay={120}>
          <div className="mb-10">
            <h2 className="text-lg font-heading font-bold text-black mb-1">The verdict, per technique</h2>
            <p className="text-sm text-zinc-600 mb-4">From a 5-question test set run against all five, honestly.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {study.verdicts.map((v) => <VerdictCard key={v.key} v={v} />)}
            </div>
          </div>
        </ScrollReveal>

        {/* Deep dives — accordion, not a linear scroll of identical heading
            blocks. Click into whichever technique's story you want. */}
        <ScrollReveal delay={160}>
          <div className="mb-12">
            <h2 className="text-lg font-heading font-bold text-black mb-1">The full story</h2>
            <p className="text-sm text-zinc-600 mb-2">Click a section to expand it.</p>
            <div className="bg-white/50 border border-black/10 rounded-2xl px-4 sm:px-5">
              {study.techniqueDeepDives.map((item) => (
                <DeepDiveRow
                  key={item.key}
                  item={item}
                  theme={theme}
                  isOpen={openKey === item.key}
                  onToggle={() => setOpenKey(openKey === item.key ? null : item.key)}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Tech stack */}
        {study.tech?.length > 0 && (
          <ScrollReveal>
            <div className="mb-10">
              <h2 className="text-lg font-heading font-bold text-black mb-3">Tech stack</h2>
              <div className="flex flex-wrap gap-2">
                {study.tech.map((t) => <TechBadge key={t} name={t} />)}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Skills demonstrated */}
        {study.skillsDemonstrated?.length > 0 && (
          <ScrollReveal>
            <div className="bg-black text-white rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-5 h-5 ${theme.onDark}`} strokeWidth={2} />
                <h2 className="text-lg font-heading font-bold">Skills demonstrated</h2>
              </div>
              <ul className="space-y-3">
                {study.skillsDemonstrated.map((skill, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-200 leading-relaxed">
                    <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${theme.onDark}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        )}
      </div>
    </article>
  );
}
