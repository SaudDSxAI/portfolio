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

 {/* Breadth — the bar of the T. Deliberately understated: plain label,
 unaccented cards, so it reads as context rather than the headline. */}
 <div className="mb-6 md:mb-8 text-center">
 <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
 Breadth — Supporting Skills
 </span>
 </div>
 <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16 md:mb-20">
 {barSkills.map((group, i) => (
 <SkillCard key={group.category} group={group} delay={i * 100} />
 ))}
 </div>

 {/* Depth — the stem of the T: AI engineering, the actual specialization.
 Narrower and centered so it reads as a column descending from the
 bar above, with a bolder badge and accent-colored cards (emphasized)
 so it's unmistakably the focal point of the page, not a fourth
 category tacked onto the row above. */}
 <div className="mb-8 md:mb-10 flex justify-center">
 <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-800 text-xs font-bold uppercase tracking-[0.2em] shadow-sm shadow-primary-500/10">
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-2.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
 </svg>
 Depth — AI Engineering Specialization
 </span>
 </div>
 <div className="grid gap-6 md:max-w-2xl md:mx-auto">
 {stemSkills.map((group, i) => (
 <SkillCard key={group.category} group={group} delay={(barSkills.length + i) * 100} emphasized />
 ))}
 </div>
 </div>
 </section>
 );
}
