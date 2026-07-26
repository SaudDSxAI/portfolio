import { useParams } from 'react-router-dom';
import BackButton from '../components/ui/BackButton';
import SectionHeading from '../components/SectionHeading';
import CaseStudyCard from '../components/CaseStudyCard';
import RAGProjectCard from '../components/RAGProjectCard';
import ScrollReveal from '../components/ui/ScrollReveal';
import ScrubPreviewPanel from '../components/ui/ScrubPreviewPanel';
import { getTheme, getIcon } from '../lib/projectTheme';
import { useTransitionNavigate } from '../lib/useTransitionNavigate';
import { useIsMobile } from '../lib/useIsMobile';
import { useScrubActivate } from '../lib/useScrubActivate';
import { useSquareGridDims, getTileOriginClass } from '../lib/useSquareGridDims';
import { caseStudies, categories } from '../data/caseStudies';

// A few projects don't fit the generic "icon + headline metric + mini
// chart" card — set study.customCard to one of these keys to opt in to a
// bespoke card layout instead. (Desktop only — the mobile compact grid
// below renders every study identically for a consistent, predictable
// scrub-preview interaction.)
const CUSTOM_CARD_COMPONENTS = {
  ragComparison: RAGProjectCard,
};

export default function CategoryPage() {
  const { category } = useParams();
  const meta = categories[category];
  const studies = caseStudies[category] || [];
  const navigate = useTransitionNavigate();
  const isMobile = useIsMobile();
  const { activeIndex, handlers } = useScrubActivate((idx) => {
    const study = studies[idx];
    if (study) navigate(`/${category}/${study.slug}`);
  });
  // minCells=4 keeps a category with only 1-2 projects from stretching a
  // card across the whole grid — it stays sized like a normal grid cell,
  // just with the rest of the grid empty until more projects are added.
  const { ref: gridRef, cols, rows } = useSquareGridDims(studies.length, 4);

  const activeStudy = activeIndex != null ? studies[activeIndex] : null;
  const activePreview = activeStudy
    ? {
        icon: (() => {
          const Icon = getIcon(activeStudy.icon);
          return <Icon className="w-5 h-5" strokeWidth={1.75} />;
        })(),
        iconBg: getTheme(activeStudy.accentColor).iconBg,
        title: activeStudy.title,
        description: activeStudy.tagline,
      }
    : null;

  if (!meta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-zinc-600 mb-4">Category not found.</p>
        <BackButton to="/projects" label="Back to Projects" />
      </div>
    );
  }

  return (
    <section
      className={`relative px-4 sm:px-6 ${
        studies.length > 0
          ? 'max-sm:h-[100svh] max-sm:overflow-hidden max-sm:flex max-sm:flex-col max-sm:py-0 sm:py-24 sm:min-h-screen'
          : 'py-24 sm:py-32 min-h-screen'
      }`}
    >
      <BackButton to="/projects" label="Back to Projects" />
      <div className="max-w-6xl mx-auto w-full max-sm:flex max-sm:flex-col max-sm:flex-1 max-sm:min-h-0">
        {isMobile && studies.length > 0 ? (
          // Compact heading — mirrors the Projects page: full SectionHeading
          // is too tall to still leave room for every project card on a
          // zero-scroll phone screen.
          <div className="pt-14 pb-2 text-left flex-shrink-0">
            {meta.eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-700 mb-1">
                {meta.eyebrow}
              </p>
            )}
            <h2 className="text-xl font-heading font-bold text-black">{meta.label}</h2>
          </div>
        ) : (
          <SectionHeading eyebrow={meta.eyebrow} title={meta.label} subtitle={meta.subtitle} align="left" />
        )}

        {isMobile && studies.length > 0 && <ScrubPreviewPanel active={activePreview} />}

        {studies.length > 0 ? (
          isMobile ? (
            // Compact, zero-scroll mobile grid — every project card in this
            // category fits on one screen no matter how many there are,
            // with cells kept close to square (see useSquareGridDims) and
            // detail shown in the ScrubPreviewPanel above rather than an
            // overlay glued to the tile, so edge tiles never clip and the
            // preview is never hidden under the finger.
            // Padding lives on this outer flex-1 box so the measured grid
            // sizes its cells for the space left over after it — the last
            // row and edge cards end up inset from the screen edges instead
            // of touching them.
            <div className="flex-1 min-h-0 p-2">
              <div
                ref={gridRef}
                {...handlers}
                className="touch-none grid gap-2 h-full w-full"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
              >
                {studies.map((study, i) => {
                  const theme = getTheme(study.accentColor);
                  const Icon = getIcon(study.icon);
                  const isActive = activeIndex === i;
                  return (
                    <button
                      key={study.slug}
                      type="button"
                      data-scrub-index={i}
                      onClick={() => navigate(`/${category}/${study.slug}`)}
                      // Inward-biased origin + inset ring, same reasoning as
                      // the Projects grid: keeps the active tile fully inside
                      // the section's overflow-hidden boundary even at the
                      // grid's edges.
                      className={`rounded-xl border flex flex-col items-center justify-center gap-1 p-2 transition-all duration-150 ${getTileOriginClass(
                        i,
                        cols,
                        rows
                      )} ${
                        isActive
                          ? 'scale-[1.06] z-10 border-primary-500 bg-warm-100 ring-2 ring-inset ring-primary-400/60'
                          : 'border-black/10 bg-warm-100/80'
                      }`}
                    >
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${theme.iconBg} text-white`}>
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                      </span>
                      <span className="text-[10px] font-semibold text-black leading-tight text-center line-clamp-2">
                        {study.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studies.map((study, i) => {
                const Card = CUSTOM_CARD_COMPONENTS[study.customCard] || CaseStudyCard;
                return (
                  <ScrollReveal key={study.slug} delay={i * 80}>
                    <Card study={study} categoryKey={category} index={i} />
                  </ScrollReveal>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center py-24 text-center">
            <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            <p className="text-zinc-600 mb-1">Case studies for {meta.label} are in progress.</p>
            <p className="text-sm text-zinc-500">Check back soon, or ask the AI assistant what's coming next.</p>
          </div>
        )}
      </div>
    </section>
  );
}
