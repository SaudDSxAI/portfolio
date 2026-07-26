import BackButton from './ui/BackButton';
import SectionHeading from './SectionHeading';
import CategoryBrowserCard, { CategoryIcon } from './CategoryBrowserCard';
import ScrollReveal from './ui/ScrollReveal';
import { useTransitionNavigate } from '../lib/useTransitionNavigate';
import { useIsMobile } from '../lib/useIsMobile';
import { useScrubActivate, computeGridDims } from '../lib/useScrubActivate';
import { categories, caseStudies } from '../data/caseStudies';

// Projects are organized into classes (ML, DL, and more as they're added —
// just add a new key to `categories` + `caseStudies` in
// src/data/caseStudies.js and it shows up here automatically). Each class
// has its own page with real project cards, which each open a full
// case-study page with real charts and numbers.
export default function Projects() {
  const categoryKeys = Object.keys(categories);
  const navigate = useTransitionNavigate();
  const isMobile = useIsMobile();
  const { activeIndex, handlers } = useScrubActivate((idx) => navigate(`/${categoryKeys[idx]}`));
  const { cols, rows } = computeGridDims(categoryKeys.length);

  return (
    <section
      id="projects"
      className="relative px-6 py-20 sm:min-h-screen sm:py-20 max-sm:h-[100svh] max-sm:overflow-hidden max-sm:flex max-sm:flex-col max-sm:py-0"
    >
      <BackButton to="/" label="Back home" />
      <div className="cv-auto relative max-w-6xl mx-auto w-full max-sm:flex max-sm:flex-col max-sm:flex-1 max-sm:min-h-0">
        {isMobile ? (
          // Compact heading — SectionHeading's full eyebrow/title/subtitle/
          // underline stack is too tall for a zero-scroll phone layout that
          // also has to fit every category card; pt-14 clears the fixed
          // BackButton pinned at top-5.
          <div className="pt-14 pb-3 text-center flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-700 mb-1">
              Selected Work
            </p>
            <h2 className="text-xl font-heading font-bold text-black">Projects</h2>
          </div>
        ) : (
          <SectionHeading
            eyebrow="Selected Work"
            title="Projects"
            subtitle="Organized by discipline — pick a class to see the real benchmarks and case studies behind it."
          />
        )}

        {isMobile ? (
          // Compact, zero-scroll mobile grid: every category fits on one
          // screen no matter how many there are (rows/cols computed from
          // the count, so this scales automatically as classes are added).
          // Since touch has no hover, dragging a finger across the grid
          // hit-tests which tile is underneath it (useScrubActivate) and
          // pops that one tile up into an enlarged overlay revealing its
          // description — release on a tile to open it.
          <div
            {...handlers}
            className="touch-none grid gap-2 flex-1 min-h-0"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {categoryKeys.map((key, i) => {
              const meta = categories[key];
              const count = (caseStudies[key] || []).length;
              const isActive = activeIndex === i;
              return (
                <button
                  key={key}
                  type="button"
                  data-scrub-index={i}
                  onClick={() => navigate(`/${key}`)}
                  className="relative rounded-xl"
                >
                  {/* Base tile — icon + short label only */}
                  <div className="h-full w-full rounded-xl border border-black/10 bg-warm-100/80 flex flex-col items-center justify-center gap-1 p-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                      <CategoryIcon categoryKey={key} />
                    </span>
                    <span className="text-[10px] font-semibold text-black leading-tight text-center line-clamp-2">
                      {meta.label}
                    </span>
                  </div>

                  {/* Enlarged preview — revealed while the finger rests on
                      this tile (or on hover, for mouse/trackpad users) */}
                  <div
                    className={`absolute inset-[-15%] z-30 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-2xl shadow-primary-900/40 flex flex-col items-center justify-center gap-1.5 p-3 text-center transition-all duration-200 ease-out ${
                      isActive
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-90 pointer-events-none'
                    }`}
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15">
                      <CategoryIcon categoryKey={key} />
                    </span>
                    <span className="text-xs font-bold leading-tight">{meta.label}</span>
                    <span className="text-[10px] text-white/80 leading-snug line-clamp-2">
                      {meta.subtitle}
                    </span>
                    <span className="text-[10px] font-semibold text-white/70">
                      {count === 0 ? 'Coming soon' : `${count} case ${count === 1 ? 'study' : 'studies'}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryKeys.map((key, i) => (
              <ScrollReveal key={key} delay={i * 80}>
                <CategoryBrowserCard
                  categoryKey={key}
                  meta={categories[key]}
                  studies={caseStudies[key] || []}
                />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
