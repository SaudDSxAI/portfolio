import { useState } from 'react';
import BackButton from './ui/BackButton';
import SectionHeading from './SectionHeading';
import ScrollReveal from './ui/ScrollReveal';
import TShapeBackground from './ui/TShapeBackground';
import { useIsMobile } from '../lib/useIsMobile';
import { useScrubActivate } from '../lib/useScrubActivate';
import { getTileOriginClass } from '../lib/useSquareGridDims';
import { skills } from '../data/projects';

// A single skill-category card. `emphasized` is set for stem (AI
// engineering) cards — a warmer accent border, a gradient icon tile instead
// of plain black, and accent-tinted chips — so the deep-specialization half
// of the T reads as the visual focus, not just an equally-weighted section.
function SkillCard({ group, delay, emphasized = false }) {
 return (
 <ScrollReveal delay={delay}>
 <div
 className={`group relative rounded-2xl p-6 transition-all duration-500 h-full ${
 emphasized
 ? 'bg-warm-100/90 border-2 border-primary-400/40 hover:border-primary-500/60 shadow-md shadow-primary-500/10 hover:shadow-xl hover:shadow-primary-500/20'
 : 'bg-warm-100/70 border border-black/10 hover:border-black/20 hover:shadow-lg hover:shadow-black/10'
 }`}
 >
 <div className="relative">
 {/* Header */}
 <div className="flex items-center gap-3 mb-5">
 <div
 className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-all duration-300 ${
 emphasized
 ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-700/30'
 : 'bg-black border border-black text-black drop-shadow-md'
 }`}
 >
 {group.icon ? group.icon : (
 <svg className={`w-5 h-5 ${emphasized ? 'text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 )}
 </div>
 <h3 className="text-lg font-heading font-bold text-black">
 {group.category}
 </h3>
 </div>

 {/* Skills List */}
 <div className="flex flex-wrap gap-2">
 {group.items.map((skill) => (
 <span
 key={skill}
 className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-default ${
 emphasized
 ? 'bg-primary-200/40 text-primary-900 border border-primary-400/30 hover:bg-primary-300/50 hover:border-primary-500/40'
 : 'bg-warm-50 text-zinc-700 border border-black/10 hover:bg-black/10 hover:text-black hover:border-black/30'
 }`}
 >
 {skill}
 </span>
 ))}
 </div>
 </div>
 </div>
 </ScrollReveal>
 );
}

// Compact icon used for the mobile T's heading cards and its preview panel
// — the same checkmark fallback SkillCard uses when a category has no
// custom icon set.
function CategoryGlyph({ group, className = '' }) {
 return group.icon ? (
 <span className={className}>{group.icon}</span>
 ) : (
 <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 );
}

// Short label for the small T tiles. The full category name ("Deep Learning
// & Generative Models") can't fit legibly in a tile that's a third of the
// screen wide without either shrinking to an unreadable size or wrapping to
// four cramped lines, so the tile shows an abbreviated form and the detail
// panel carries the full name plus every skill in it. Dropping everything
// after " & " and then capping at two words handles every current category
// ("Agentic AI", "RAG", "Machine Learning", "Full-Stack Production") without
// a hand-maintained lookup table that would silently go stale on a rename.
function shortLabel(category) {
 return category.split(' & ')[0].split(' ').slice(0, 2).join(' ');
}

// The contents of one category's detail card. Every skill is rendered as
// its own chip with no line-clamp and no fixed height, so nothing is ever
// truncated or hidden the way a single clamped joined-together string was.
function SkillDetailBody({ group }) {
 const emphasized = group.tier === 'stem';
 return (
 <div>
 <div className="flex items-center gap-2 mb-2">
 <span
 className={`flex items-center justify-center w-7 h-7 rounded-lg text-white flex-shrink-0 ${
 emphasized ? 'bg-gradient-to-br from-primary-500 to-primary-700' : 'bg-black'
 }`}
 >
 <CategoryGlyph group={group} className="w-4 h-4" />
 </span>
 <p className="text-[13px] font-bold text-black leading-tight">{group.category}</p>
 </div>
 <div className="flex flex-wrap gap-1">
 {group.items.map((skill) => (
 <span
 key={skill}
 className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${
 emphasized
 ? 'bg-primary-200/50 text-primary-900 border border-primary-400/30'
 : 'bg-warm-50 text-zinc-700 border border-black/10'
 }`}
 >
 {skill}
 </span>
 ))}
 </div>
 </div>
 );
}

/**
 * Detail panel for the mobile T. Deliberately NOT the shared
 * ScrubPreviewPanel used by Projects/CategoryPage: that one shows a
 * one-line tagline inside a fixed-height box with a line-clamp, which is
 * exactly what was cutting skills off here.
 *
 * Every category is rendered, all stacked into the *same* grid cell
 * (`gridArea: '1/1'`), with only the active one visible. That does two
 * things at once: the panel's height is always the height of the tallest
 * category, so it never resizes as you drag across cards and the T below
 * never jumps — and because each category is laid out at full size rather
 * than clamped into a fixed box, no skill is ever clipped regardless of how
 * many items a category has.
 */
function SkillDetailPanel({ groups, activeIndex }) {
 return (
 <div className="flex-shrink-0 mb-2 grid rounded-2xl border-2 border-primary-600/40 bg-warm-100/90 px-3 py-2.5">
 {groups.map((group, i) => (
 <div
 key={group.category}
 style={{ gridArea: '1 / 1' }}
 className={`transition-opacity duration-200 ${
 i === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
 }`}
 aria-hidden={i !== activeIndex}
 >
 <SkillDetailBody group={group} />
 </div>
 ))}
 </div>
 );
}

export default function Skills() {
 // Broad, complementary knowledge (the bar) vs. deep primary specialization
 // (the stem) — see the `tier` field in data/projects.js. Laying the bar
 // out wide and the stem out narrow, directly below it, makes the page's
 // own structure read as a T; the soft glow in TShapeBackground just
 // reinforces what the layout is already doing.
 const barSkills = skills.filter((s) => s.tier === 'bar');
 const stemSkills = skills.filter((s) => s.tier === 'stem');
 const allSkills = [...barSkills, ...stemSkills];

 const isMobile = useIsMobile();

 // On mobile there's nothing to navigate to — a category isn't a link, it's
 // just detail to reveal — so a real drag-release *or* a plain tap both
 // just pin that category's detail in the preview panel, where it stays
 // until another card is touched. Starting pinned to the first category
 // (instead of null) means the panel always has something real in it from
 // the first paint, rather than only an idle hint until you touch a card.
 const [pinnedIndex, setPinnedIndex] = useState(0);
 const { activeIndex, handlers } = useScrubActivate((idx) => setPinnedIndex(idx));
 const displayIndex = activeIndex ?? pinnedIndex;

 const barCols = barSkills.length;
 // The stem is ONE column wide on purpose. A 2-column stem under a
 // 3-column bar is 2/3 as wide as the bar, which reads as two stacked
 // blocks rather than a letter — the stroke has to be visibly thin next to
 // the bar for the silhouette to actually say "T". One column means the
 // stem is exactly 1/3 of the bar's width and several rows tall, which is
 // the proportion of a real T. (Only widens to 2 columns if the stem list
 // ever grows long enough that a single column would squash the rows flat.)
 const stemCols = stemSkills.length > 7 ? 2 : 1;
 const stemRows = Math.ceil(stemSkills.length / stemCols);
 // The stem block's width as a percentage of the whole T's width. Because
 // it's exactly stemCols/barCols, every card comes out the same width in
 // both the bar row and the stem column automatically, with no JS
 // measurement (an earlier version measured pixels via ResizeObserver and
 // left large unexplained gaps around a too-small shape — plain CSS grid
 // tracks stretching to fill the container can't drift out of sync with
 // what's actually rendered).
 const stemWidthPct = (stemCols / barCols) * 100;

 return (
 <section
 id="skills"
 className="relative overflow-hidden px-6 sm:min-h-screen sm:py-20 max-sm:h-[100svh] max-sm:flex max-sm:flex-col max-sm:py-0"
 >
 {/* Background accent */}
 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-warm-100/70 to-transparent pointer-events-none" />
 {!isMobile && <TShapeBackground />}

 <BackButton to="/" label="Back home" />
 <div className="cv-auto relative max-w-6xl mx-auto w-full max-sm:flex max-sm:flex-col max-sm:flex-1 max-sm:min-h-0">
 {isMobile ? (
 <div className="pt-14 pb-2 text-center flex-shrink-0">
 <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-700 mb-1">
 T-Shaped Expertise
 </p>
 <h2 className="text-xl font-heading font-bold text-black">Skills & Expertise</h2>
 </div>
 ) : (
 <SectionHeading
 title="Skills & Expertise"
 subtitle="Broad, working knowledge across the stack — and deep specialization in AI, ML, and LLM systems"
 />
 )}

 {isMobile && <SkillDetailPanel groups={allSkills} activeIndex={displayIndex} />}

 {isMobile ? (
 // The T is built from small per-category heading cards — a wide row
 // of `bar` (breadth) categories on top, a narrower, centered block
 // of `stem` (AI-specialization) categories below — wrapped in a real
 // bordered frame (bar frame + two short "shoulder" lines + stem
 // frame, borders matching so the seam reads as one continuous
 // outline) so the T shape is unmistakable at a glance. Everything
 // here is plain CSS grid tracks (fr/%) stretching to fill the
 // measured flex-1 box exactly — no JS pixel measurement — which
 // guarantees it always fits with no scrolling and never leaves
 // unexplained empty space around a too-small shape. The stem
 // column's width is set to exactly stemCols/barCols percent of the
 // bar's width, which works out to make every card the same size in
 // both the row and the block, automatically.
 <div className="flex-1 min-h-0 p-3">
 <div
 {...handlers}
 className="touch-none grid h-full w-full"
 style={{
 gridTemplateColumns: `1fr ${stemWidthPct}% 1fr`,
 gridTemplateRows: `1fr auto ${stemRows}fr`,
 }}
 >
 <div
 className="col-span-3 rounded-t-2xl border-2 border-b-0 border-primary-600 bg-white/85 p-2 grid gap-2"
 style={{ gridTemplateColumns: `repeat(${barCols}, 1fr)` }}
 >
 {barSkills.map((group, i) => {
 const isActive = displayIndex === i;
 return (
 <button
 key={group.category}
 type="button"
 data-scrub-index={i}
 onClick={() => setPinnedIndex(i)}
 className={`rounded-lg border flex flex-col items-center justify-center gap-0.5 p-1 overflow-hidden transition-all duration-150 ${getTileOriginClass(
 i,
 barCols,
 1
 )} ${
 isActive
 ? 'scale-[1.04] z-10 border-black bg-warm-100 ring-2 ring-inset ring-black/40'
 : 'border-black/10 bg-warm-100/80'
 }`}
 >
 <CategoryGlyph group={group} className="w-3.5 h-3.5 shrink-0 text-black" />
 <span className="text-[9px] font-semibold text-black leading-[1.15] text-center break-words">
 {shortLabel(group.category)}
 </span>
 </button>
 );
 })}
 </div>

 {/* Shoulders — the step where the bar's full width narrows down
 to the stem's width, closed off with short border segments so
 the frame reads as one unbroken outline instead of two boxes. */}
 <div className="border-b-2 border-primary-600" aria-hidden="true" />
 <div aria-hidden="true" />
 <div className="border-b-2 border-primary-600" aria-hidden="true" />

 <div
 className="col-start-2 rounded-b-2xl border-2 border-t-0 border-primary-600 bg-white/85 p-2 grid gap-2"
 style={{
 gridTemplateColumns: `repeat(${stemCols}, 1fr)`,
 gridTemplateRows: `repeat(${stemRows}, 1fr)`,
 }}
 >
 {stemSkills.map((group, i) => {
 const globalIndex = barCols + i;
 const isActive = displayIndex === globalIndex;
 return (
 <button
 key={group.category}
 type="button"
 data-scrub-index={globalIndex}
 onClick={() => setPinnedIndex(globalIndex)}
 className={`rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 p-1 overflow-hidden transition-all duration-150 ${getTileOriginClass(
 i,
 stemCols,
 stemRows
 )} ${
 isActive
 ? 'scale-[1.04] z-10 border-primary-500 bg-warm-100 ring-2 ring-inset ring-primary-400/60'
 : 'border-primary-400/40 bg-warm-100/90'
 }`}
 >
 <CategoryGlyph group={group} className="w-3.5 h-3.5 shrink-0 text-primary-700" />
 <span className="text-[9px] font-semibold text-primary-800 leading-[1.15] text-center break-words">
 {shortLabel(group.category)}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-[1fr_min(30rem,90%)_1fr]">
 {/* Bar frame — top of the T, full width. Tighter padding/gap than
 before so the horizontal stroke reads as lean rather than a thick
 slab. */}
 <div className="col-span-3 rounded-t-2xl border-2 border-b-0 border-primary-600/60 bg-white/70 backdrop-blur-[2px] shadow-lg shadow-primary-900/5 p-5 md:p-6">
 <div className="mb-5 md:mb-6 text-center">
 <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
 Breadth — Supporting Skills
 </span>
 </div>
 <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
 {barSkills.map((group, i) => (
 <SkillCard key={group.category} group={group} delay={i * 100} />
 ))}
 </div>
 </div>

 {/* Shoulders — close the notch where the bar steps in to the stem's
 width. Empty middle cell leaves that span open, connecting straight
 down into the stem frame below. */}
 <div className="border-b-2 border-primary-600/60" aria-hidden="true" />
 <div aria-hidden="true" />
 <div className="border-b-2 border-primary-600/60" aria-hidden="true" />

 {/* Stem frame — the vertical stroke of the T, narrowed (30rem instead
 of 42rem) so it reads as a slim column beneath the bar rather than
 an equally-wide block. */}
 <div className="col-start-2 rounded-b-2xl border-2 border-t-0 border-primary-600/60 bg-white/70 backdrop-blur-[2px] shadow-lg shadow-primary-900/5 p-5 md:p-6">
 <div className="mb-6 md:mb-8 flex justify-center">
 <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-800 text-xs font-bold uppercase tracking-[0.2em] shadow-sm shadow-primary-500/10">
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-2.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
 </svg>
 Depth — AI Engineering Specialization
 </span>
 </div>
 <div className="grid gap-5">
 {stemSkills.map((group, i) => (
 <SkillCard key={group.category} group={group} delay={(barSkills.length + i) * 100} emphasized />
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 </section>
 );
}
