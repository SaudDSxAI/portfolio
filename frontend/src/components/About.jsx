import SectionHeading from './SectionHeading';
import ScrollReveal from './ui/ScrollReveal';
import { stats } from '../data/projects';

export default function About() {
  return (
    <section id="about" className="relative py-24 px-6 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/5 to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <SectionHeading
          title="About Me"
          subtitle="AI Engineer & Co-Founder at Oval Labs building production-grade LLM applications and agentic systems."
        />

        <div className="grid md:grid-cols-5 gap-12 items-center mb-16">
          {/* Photo */}
          <ScrollReveal className="md:col-span-2 flex justify-center">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-2xl opacity-50 group-hover:opacity-75 blur-lg transition-all duration-500" />
              <div className="relative">
                <img
                  src="/saud.jpeg"
                  alt="Saud Ahmad"
                  className="w-64 h-72 md:w-72 md:h-80 object-cover object-top rounded-2xl ring-2 ring-dark-900 shadow-2xl"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent rounded-2xl" />
              </div>
            </div>
          </ScrollReveal>

          {/* Bio */}
          <ScrollReveal delay={200} className="md:col-span-3 space-y-5">
            <p className="text-lg text-slate-300 leading-relaxed">
              I'm <span className="text-white font-semibold">Saud Ahmad</span>, an AI Engineer and Co-Founder of Oval Labs
              specializing in <span className="text-primary-400 font-medium">Large Language Models</span>,{' '}
              <span className="text-primary-400 font-medium">Retrieval-Augmented Generation</span>, and{' '}
              <span className="text-primary-400 font-medium">Agentic AI Systems</span>.
            </p>
            <p className="text-slate-400 leading-relaxed">
              I have commercial experience shipping production-grade AI systems. I built Nebula — a 
              live multi-tenant SaaS recruitment platform — from scratch, featuring a 3-LLM CV 
              evaluation pipeline and RAG-powered assistants deployed for real clients in the UAE.
            </p>
            <p className="text-slate-400 leading-relaxed">
              With a hands-on background across the full AI stack using Python, TypeScript, and FastAPI, 
              I am looking to bring this same build-and-ship mentality to client-facing AI engineering.
            </p>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Swat, Pakistan
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <ScrollReveal key={stat.label} delay={index * 100}>
              <div className="group relative bg-dark-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:border-white/20 hover:shadow-2xl hover:shadow-primary-900/20 hover:-translate-y-1 transition-all duration-300">
                <div className="text-3xl md:text-4xl font-heading font-bold text-white mb-2 bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-md">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
