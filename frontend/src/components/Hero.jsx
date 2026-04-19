import { useState, useEffect } from 'react';
import ParticleField from './ui/ParticleField';

const roles = [
  'AI Engineer',
  'LLM Specialist',
  'RAG Architect',
  'Full-Stack Developer',
];

export default function Hero() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentRole = roles[roleIndex];
    let timeout;

    if (!isDeleting) {
      if (displayText.length < currentRole.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentRole.slice(0, displayText.length + 1));
        }, 80);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentRole.slice(0, displayText.length - 1));
        }, 40);
      } else {
        setIsDeleting(false);
        setRoleIndex((prev) => (prev + 1) % roles.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, roleIndex]);

  const scrollToProjects = () => {
    document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-900"
    >
      {/* Particle Background */}
      <ParticleField />

      {/* Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary-900/30 rounded-full blur-[80px] animate-blob will-change-transform" />
        <div className="absolute top-[30%] right-[-15%] w-[40%] h-[40%] bg-sky-900/20 rounded-full blur-[80px] animate-blob animation-delay-2000 will-change-transform" />
        <div className="absolute bottom-[-15%] left-[25%] w-[55%] h-[55%] bg-cyan-900/20 rounded-full blur-[80px] animate-blob animation-delay-4000 will-change-transform" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Greeting */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-sm text-slate-400 animate-fade-in">
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
          Available for opportunities
        </div>

        {/* Name */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight mb-6 animate-slide-up">
          <span className="text-white">Saud </span>
          <span className="bg-gradient-to-r from-primary-400 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
            Ahmad
          </span>
        </h1>

        {/* Animated Role */}
        <div className="h-10 mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <p className="text-xl md:text-2xl text-slate-300 font-light">
            <span>{displayText}</span>
            <span className="inline-block w-0.5 h-6 bg-primary-400 ml-1 animate-pulse" />
          </p>
        </div>

        {/* Subtitle */}
        <p
          className="text-base md:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in"
          style={{ animationDelay: '400ms' }}
        >
          Building intelligent, production-ready AI systems that solve real-world
          problems. Specializing in LLMs, RAG architectures, and agentic AI.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in"
          style={{ animationDelay: '600ms' }}
        >
          {/* Explore My Work — hidden on mobile */}
          <button
            onClick={scrollToProjects}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)] hover:shadow-[0_0_60px_-15px_rgba(6,182,212,0.7)] hover:-translate-y-1 active:scale-95 hidden sm:flex items-center justify-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center gap-2">
              Explore My Work
              <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </span>
          </button>
          
          {/* Ask AI — full button on desktop */}
          <button
            onClick={() => window.dispatchEvent(new Event('openChat'))}
            className="group px-8 py-4 bg-dark-900/60 hover:bg-dark-800/80 backdrop-blur-xl text-white font-bold rounded-2xl border-2 border-white/10 hover:border-cyan-500/50 transition-all duration-300 shadow-xl hover:shadow-cyan-900/30 hover:-translate-y-1 active:scale-95 hidden sm:flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-cyan-400 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            Ask AI About Me
          </button>
        </div>
      </div>

      {/* Mobile floating AI icon — stuck to right side */}
      <button
        onClick={() => window.dispatchEvent(new Event('openChat'))}
        className="fixed right-4 bottom-20 z-50 sm:hidden w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_-3px_rgba(6,182,212,0.6)] border border-white/20 active:scale-90 transition-transform"
        aria-label="Ask AI"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </button>

      {/* Fade out bottom overlay to blend canvas smoothly */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-dark-900 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
