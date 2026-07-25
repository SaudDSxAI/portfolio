import BackButton from './ui/BackButton';
import SectionHeading from './SectionHeading';
import ScrollReveal from './ui/ScrollReveal';
import TShapeBackground from './ui/TShapeBackground';
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

export default function Skills() {
 // Broad, complementary knowledge (the bar) vs. deep primary specialization
 // (the stem) — see the `tier` field in data/projects.js. Laying the bar
 // out wide and the stem out narrow, directly below it, makes the page's
 // own structure read as a T; the soft glow in TShapeBackground just
 // reinforces what the layout is already doing.
 const barSkills = skills.filter((s) => s.tier === 'bar');
 const stemSkills = skills.filter((s) => s.tier === 'stem');

 return (
 <section id="skills" className="relative min-h-screen py-20 px-6 overflow-hidden">
 {/* Background accent */}
 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-warm-100/70 to-transparent pointer-events-none" />
 <TShapeBackground />

 <BackButton to="/" label="Back home" />
 <div className="relative max-w-6xl mx-auto">
 <SectionHeading
 title="Skills & Expertise"
 subtitle="Broad, working knowledge across the stack — and deep specialization in AI, ML, and LLM systems"
 />

 {/* The actual T: one continuous bordered frame, not two independently
 boxed groups. A 3-column grid — shoulder / stem-width / shoulder — lets
 the bar frame span all three columns while the stem frame occupies only
 the center column beneath it, so the outline is unbroken: wide box on
 top, narrow box below, joined by two short closing lines ("shoulders")
 exactly where the bar's bottom edge steps in to meet the stem's width.
 Both the middle column and the stem frame use the same
 `min(42rem,100%)` track, so their widths always match exactly at any
 screen size — on narrow phones the shoulders collapse to 0 and it
 simply reads as two stacked boxes, which is the right fallback there. */}
 <div className="grid grid-cols-[1fr_min(42rem,100%)_1fr]">
 {/* Bar frame — top of the T, full width */}
 <div className="col-span-3 rounded-t-3xl border-2 border-b-0 border-black/15 bg-white/40 backdrop-blur-[2px] p-6 md:p-8">
 <div className="mb-6 md:mb-8 text-center">
 <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
 Breadth — Supporting Skills
 </span>
 </div>
 <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
 {barSkills.map((group, i) => (
 <SkillCard key={group.category} group={group} delay={i * 100} />
 ))}
 </div>
 </div>

 {/* Shoulders — close the notch where the bar steps in to the stem's
 width. Empty middle cell leaves that span open, connecting straight
 down into the stem frame below. */}
 <div className="border-b-2 border-black/15" aria-hidden="true" />
 <div aria-hidden="true" />
 <div className="border-b-2 border-black/15" aria-hidden="true" />

 {/* Stem frame — the vertical stroke of the T, centered beneath the bar
 and narrower than it, so the silhouette is unmistakable. */}
 <div className="col-start-2 rounded-b-3xl border-2 border-t-0 border-black/15 bg-white/40 backdrop-blur-[2px] p-6 md:p-8">
 <div className="mb-8 md:mb-10 flex justify-center">
 <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-800 text-xs font-bold uppercase tracking-[0.2em] shadow-sm shadow-primary-500/10">
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-2.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
 </svg>
 Depth — AI Engineering Specialization
 </span>
 </div>
 <div className="grid gap-6">
 {stemSkills.map((group, i) => (
 <SkillCard key={group.category} group={group} delay={(barSkills.length + i) * 100} emphasized />
 ))}
 </div>
 </div>
 </div>
 </div>
 </section>
 );
}
