import SectionHeading from './SectionHeading';
import ScrollReveal from './ui/ScrollReveal';

export default function About() {
 return (
 <section id="about" className="relative py-24 px-6 overflow-hidden">
 {/* Subtle background gradient */}
 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-warm-100/70 to-transparent pointer-events-none" />

 <div className="relative max-w-6xl mx-auto">
 <SectionHeading
 title="About Me"
 subtitle="AI Engineer & Co-Founder at Oval Labs building production-grade LLM applications and agentic systems."
 />

 <div className="grid md:grid-cols-5 gap-12 items-center">
 {/* Photo */}
 <ScrollReveal className="md:col-span-2 flex justify-center">
 <div className="relative group">
 {/* Glow effect removed */}
 <div className="relative">
 <img
 src="/saud.jpeg"
 alt="Saud Ahmad"
 width="288"
 height="320"
 loading="lazy"
 decoding="async"
 className="w-64 h-72 md:w-72 md:h-80 object-cover object-top rounded-2xl ring-2 ring-black shadow-2xl"
 />
 {/* Overlay gradient */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent rounded-2xl" />
 </div>
 </div>
 </ScrollReveal>

 {/* Bio */}
 <ScrollReveal delay={200} className="md:col-span-3 space-y-5">
 <p className="text-lg text-zinc-800 leading-relaxed">
 I'm <span className="text-black font-semibold">Saud Ahmad</span> — AI Engineer and Co-Founder at Oval Labs.
 Most of my work is around <span className="text-primary-400 font-medium">Large Language Models</span>,{' '}
 <span className="text-primary-400 font-medium">Retrieval-Augmented Generation</span> and{' '}
 <span className="text-primary-400 font-medium">agentic AI systems</span>.
 </p>
 <p className="text-zinc-700 leading-relaxed">
 I've actually shipped production AI, not just prototypes. Built Nebula from scratch — a live
 multi-tenant SaaS recruitment platform with a 3-LLM CV evaluation pipeline and RAG assistants,
 running for real clients in the UAE.
 </p>
 <p className="text-zinc-700 leading-relaxed">
 I've worked across the full AI stack — Python, TypeScript, FastAPI — and I'm looking to bring
 that same build-and-ship attitude to client-facing AI work.
 </p>

 {/* Quick Info */}
 <div className="flex flex-wrap gap-4 pt-2">
 <div className="flex items-center gap-2 text-sm text-zinc-600">
 <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
 </svg>
 Swat, Pakistan
 </div>
 <div className="flex items-center gap-2 text-sm text-zinc-600">
 <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
 </svg>
 BSc Data Science — GIK Institute
 </div>
 <div className="flex items-center gap-2 text-sm text-primary-400 font-medium">
 <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
 Open to opportunities
 </div>
 </div>
 </ScrollReveal>
 </div>
 </div>
 </section>
 );
}
