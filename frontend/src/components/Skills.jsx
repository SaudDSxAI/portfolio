import { useState } from 'react';
import BackButton from './ui/BackButton';
import SectionHeading from './SectionHeading';
import ScrollReveal from './ui/ScrollReveal';
import TShapeBackground from './ui/TShapeBackground';
import ScrubPreviewPanel from './ui/ScrubPreviewPanel';
import { useIsMobile } from '../lib/useIsMobile';
import { useScrubActivate } from '../lib/useScrubActivate';
import { useTShapeCellSize } from '../lib/useTShapeCellSize';
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
 // until another card is touched.
 const [pinnedIndex, setPinnedIndex] = useState(null);
 const { activeIndex, handlers } = useScrubActivate((idx) => setPinnedIndex(idx));
 const displayIndex = activeIndex ?? pinnedIndex;
 const activeCategory = displayIndex != null ? allSkills[displayIndex] : null;

 const stemCols = Math.max(1, Math.min(barSkills.length - 1 || 1, stemSkills.length));
 const stemRows = Math.ceil(stemSkills.length / stemCols);
 const { ref: tRef, cellSize } = useTShapeCellSize({
 barCols: barSkills.length,
 stemCols,
 stemRows,
 gap: 8,
 });

 const activePreview = activeCategory
 ? {
 icon: <CategoryGlyph group={activeCategory} className="w-5 h-5" />,
 iconBg: activeCategory.tier === 'stem'
 ? 'bg-gradient-to-br from-primary-500 to-primary-700'
 : 'bg-black',
 title: activeCategory.category,
 description: activeCategory.items.join(' • '),
 }
 : null;

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

 {isMobile && <ScrubPreviewPanel active={activePreview} />}

 {isMobile ? (
 // The T here isn't a bordered frame around full skill-list cards —
 // it's built directly from small per-category heading cards: a
 // wide row of `bar` (breadth) categories on top, a narrower,
 // centered block of `stem` (AI-specialization) categories below.
 // useTShapeCellSize measures the available box and picks one
 // square cell size that makes both the row and the block fit
 // together with no scrolling, so the T is always fully visible.
 <div
 ref={tRef}
 {...handlers}
 className="touch-none flex-1 min-h-0 flex flex-col items-center justify-center gap-2"
 >
 <div
 className="grid gap-2"
 style={{ gridTemplateColumns: `repeat(${barSkills.length}, ${cellSize}px)` }}
 >
 {barSkills.map((group, i) => {
 const isActive = displayIndex === i;
 return (
 <button
 key={group.category}
 type="button"
 data-scrub-index={i}
 onClick={() => setPinnedIndex(i)}
 style={{ width: cellSize, height: cellSize }}
 className={`rounded-xl border flex flex-col items-center justify-center gap-1 p-1.5 transition-all duration-150 ${getTileOriginClass(
 i,
 barSkills.length,
 1
 )} ${
 isActive
 ? 'scale-[1.08] z-10 border-black bg-warm-100 ring-2 ring-inset ring-black/40'
 : 'border-black/10 bg-warm-100/80'
 }`}
 >
 <CategoryGlyph group={group} className="w-4 h-4 text-black" />
 <span className="text-[8px] font-semibold text-black leading-[1.1] text-center line-clamp-2">
 {group.category}
 </span>
 </button>
 );
 })}
 </div>

 <div
 className="grid gap-2"
 style={{ gridTemplateColumns: `repeat(${stemCols}, ${cellSize}px)` }}
 >
 {stemSkills.map((group, i) => {
 const globalIndex = barSkills.length + i;
 const isActive = displayIndex === globalIndex;
 return (
 <button
 key={group.category}
 type="button"
 data-scrub-index={globalIndex}
 onClick={() => setPinnedIndex(globalIndex)}
 style={{ width: cellSize, height: cellSize }}
 className={`rounded-xl border-2 flex flex-col items-center justify-center gap-1 p-1.5 transition-all duration-150 ${getTileOriginClass(
 i,
 stemCols,
 stemRows
 )} ${
 isActive
 ? 'scale-[1.08] z-10 border-primary-500 bg-warm-100 ring-2 ring-inset ring-primary-400/60'
 : 'border-primary-400/40 bg-warm-100/90'
 }`}
 >
 <CategoryGlyph group={group} className="w-4 h-4 text-primary-700" />
 <span className="text-[8px] font-semibold text-primary-800 leading-[1.1] text-center line-clamp-2">
 {group.category}
 </span>
 </button>
 );
 })}
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
