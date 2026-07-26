import BackButton from './ui/BackButton';
import SectionHeading from './SectionHeading';
import CategoryBrowserCard, { CategoryIcon } from './CategoryBrowserCard';
import ScrollReveal from './ui/ScrollReveal';
import ScrubPreviewPanel from './ui/ScrubPreviewPanel';
import { useTransitionNavigate } from '../lib/useTransitionNavigate';
import { useIsMobile } from '../lib/useIsMobile';
import { useScrubActivate } from '../lib/useScrubActivate';
import { useSquareGridDims, getTileOriginClass } from '../lib/useSquareGridDims';
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
  // minCells=4 keeps a small category from stretching one tile across the
  // whole grid — see useSquareGridDims for why.
  const { ref: gridRef, cols, rows } = useSquareGridDims(categoryKeys.length, 4);

  const activePreview =
    activeIndex != null
      ? {
          icon: <CategoryIcon categoryKey={categoryKeys[activeIndex]} />,
          iconBg: 'bg-gradient-to-br from-primary-500 to-primary-700',
          title: categories[categoryKeys[activeIndex]].label,
          description: categories[categoryKeys[activeIndex]].subtitle,
        }
      : null;

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
          <div className="pt-14 pb-2 text-center flex-shrink-0">
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

        {isMobile && <ScrubPreviewPanel active={activePreview} />}

        {isMobile ? (
          // Compact, zero-scroll mobile grid: every category fits on one
          // screen no matter how many there are. useSquareGridDims measures
          // this container's real pixel box and picks whichever column
          // count makes the resulting cells closest to square, instead of a
          // fixed column count that would produce tall rectangles. Since
          // touch has no hover, dragging a finger across the grid
          // hit-tests which tile is underneath it (useScrubActivate) and
          // that tile just gets a modest highlight — the actual detail
          // shows in the ScrubPreviewPanel above, not an overlay glued to
          // the tile, so edge-column tiles never get clipped and the
          // preview is never hidden under the finger that triggered it.
          <div
            ref={gridRef}
            {...handlers}
            className="touch-none grid gap-2 flex-1 min-h-0"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {categoryKeys.map((key, i) => {
              const meta = categories[key];
              const isActive = activeIndex === i;
              return (
                <button
                  key={key}
                  type="button"
                  data-scrub-index={i}
                  onClick={() => navigate(`/${key}`)}
                  // Scaling from an edge/corner-biased origin (instead of
                  // the default center) makes the tile grow inward, so it
                  // never reaches past the grid's outer boundary and clip
                  // against the section's overflow-hidden — the ring is
                  // inset (not a box-shadow reaching outward) for the same
                  // reason.
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
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                    <CategoryIcon categoryKey={key} />
                  </span>
                  <span className="text-[10px] font-semibold text-black leading-tight text-center line-clamp-2">
                    {meta.label}
                  </span>
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
