import { useState, useEffect } from 'react';

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
 className="relative min-h-screen flex items-center justify-center overflow-hidden"
 >

 {/* Content */}
 <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
 {/* Greeting */}
 <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-warm-100/80 border border-black/10 rounded-full text-sm text-zinc-700 animate-fade-in shadow-sm">
 <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
 Available for opportunities
 </div>

 {/* Name */}
 <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tight mb-6 animate-slide-up leading-[1.02]">
 <span className="text-black">Saud </span>
 <span className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 bg-clip-text text-transparent">
 Ahmad
 </span>
 </h1>

 {/* Animated Role */}
 <div className="h-10 mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
 <p className="text-xl md:text-2xl text-zinc-700 font-light">
 <span className="text-zinc-500 mr-2">I'm a</span>
 <span className="text-black font-medium">{displayText}</span>
 <span className="inline-block w-0.5 h-6 bg-primary-500 ml-1 animate-pulse" />
 </p>
 </div>

 {/* Subtitle */}
 <p
 className="text-base md:text-lg text-zinc-600 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in"
 style={{ animationDelay: '400ms' }}
 >
 Building intelligent, production-ready AI systems that solve real-world
 problems. Specializing in LLMs, RAG architectures, and agentic AI.
 </p>

 {/* CTAs */}
 <div
 className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
 style={{ animationDelay: '600ms' }}
 >
 {/* Primary — Explore (mustard) */}
 <button
 onClick={scrollToProjects}
 className="group relative px-8 py-4 bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-bold rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/30 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
 >
 <span className="relative z-10 flex items-center gap-2">
 Explore My Work
 <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
 </svg>
 </span>
 </button>

 {/* Secondary — Ask AI (ghost) */}
 <button
 onClick={() => window.dispatchEvent(new Event('openChat'))}
 className="group px-8 py-4 bg-warm-100/80 hover:bg-warm-200 text-black font-bold rounded-2xl border border-black/15 hover:border-black/40 transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
 >
 <svg className="w-5 h-5 text-primary-700 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
 </svg>
 Ask AI About Me
 </button>
 </div>

 {/* Scroll cue */}
 <div
 className="mt-16 flex flex-col items-center gap-2 text-zinc-500 animate-fade-in"
 style={{ animationDelay: '900ms' }}
 >
 <span className="text-[11px] uppercase tracking-[0.25em]">Scroll</span>
 <div className="w-px h-8 bg-gradient-to-b from-primary-500/60 to-transparent animate-pulse" />
 </div>
 </div>

 {/* Mobile floating AI icon — stuck to right side */}
 <button
 onClick={() => window.dispatchEvent(new Event('openChat'))}
 className="fixed right-4 bottom-20 z-50 sm:hidden w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center border border-black/20 shadow-lg shadow-primary-500/40 active:scale-90 transition-transform"
 aria-label="Ask AI"
 >
 <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
 </svg>
 </button>

 </section>
 );
}
