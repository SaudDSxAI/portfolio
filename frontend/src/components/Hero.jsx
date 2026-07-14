import { useState, useEffect } from 'react';
import { useTransitionNavigate } from '../lib/useTransitionNavigate';
import OvalLabsModal from './ui/OvalLabsModal';

const roles = [
 'AI/ML Engineer',
 'Co-Founder',
 'Agentic AI Builder',
 'Problem Solver',
];

const quickLinks = [
 { path: '/projects', label: 'Projects' },
 { path: '/skills', label: 'Skills' },
 { path: '/contact', label: 'Contact' },
];

export default function Hero() {
 const navigate = useTransitionNavigate();
 const [roleIndex, setRoleIndex] = useState(0);
 const [displayText, setDisplayText] = useState('');
 const [isDeleting, setIsDeleting] = useState(false);
 const [showOvalLabs, setShowOvalLabs] = useState(false);

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

 return (
 <section
 id="hero"
 className="relative h-dvh flex items-center justify-center overflow-hidden px-6"
 >

 <div className="relative z-10 max-w-5xl w-full mx-auto">
 <div className="grid md:grid-cols-5 gap-6 md:gap-10 items-start">

 {/* Photo */}
 <div className="md:col-span-2 flex justify-center md:justify-end animate-fade-in">
 <div className="relative mt-2 sm:mt-3 md:mt-4">
 <img
 src="/saud.jpeg"
 alt="Saud Ahmad"
 width="220"
 height="260"
 loading="eager"
 decoding="async"
 className="w-36 h-44 sm:w-44 sm:h-52 md:w-56 md:h-64 object-cover object-top rounded-2xl ring-2 ring-black shadow-2xl"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl" />
 </div>
 </div>

 {/* Text */}
 <div className="md:col-span-3 text-center md:text-left">
 {/* Name */}
 <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-2 animate-slide-up leading-[1.05]">
 <span className="text-black">Saud </span>
 <span className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 bg-clip-text text-transparent">
 Ahmad
 </span>
 </h1>

 {/* Animated Role */}
 <div className="h-7 mb-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
 <p className="text-base md:text-lg text-zinc-700 font-light">
 <span className="text-zinc-500 mr-1.5">I'm a</span>
 <span className="text-black font-medium">{displayText}</span>
 <span className="inline-block w-0.5 h-4 bg-primary-500 ml-1 animate-pulse" />
 </p>
 </div>

 {/* Bio — merged intro + about */}
 <p
 className="text-base md:text-lg text-zinc-800 leading-relaxed mb-4 max-w-xl mx-auto md:mx-0 animate-fade-in"
 style={{ animationDelay: '300ms' }}
 >
 I'm an <span className="text-primary-600 font-semibold">AI/ML Engineer</span> and
 Co-Founder at Oval Labs. I solve real problems: production systems deployed at
 real companies, plus hands-on projects across{' '}
 <span className="text-primary-600 font-semibold">ML</span>,{' '}
 <span className="text-primary-600 font-semibold">DL</span>,{' '}
 <span className="text-primary-600 font-semibold">NLP</span>,{' '}
 <span className="text-primary-600 font-semibold">generative AI</span>,{' '}
 <span className="text-primary-600 font-semibold">agentic AI</span>, robotics, and
 IoT. Every project gets the same treatment: real benchmarks, real numbers, and
 an honest account of what worked and what didn't. Check out my work below, or
 ask the AI assistant for specific details about me.
 </p>

 {/* Oval Labs link */}
 <button
 onClick={() => setShowOvalLabs(true)}
 className="inline-flex items-center gap-1.5 mb-5 px-3.5 py-1.5 text-sm font-semibold text-primary-800 bg-primary-200/50 hover:bg-primary-200/80 border border-primary-400/30 hover:border-primary-500/40 rounded-full transition-all duration-300 animate-fade-in"
 style={{ animationDelay: '350ms' }}
 >
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
 </svg>
 What is Oval Labs?
 </button>

 {/* Quick jump — opens each as its own animated page, not a scroll */}
 <div
 className="flex items-center justify-center md:justify-start gap-2 flex-wrap animate-fade-in"
 style={{ animationDelay: '450ms' }}
 >
 {quickLinks.map((link) => (
 <button
 key={link.path}
 onClick={() => navigate(link.path)}
 className="group relative px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-800 bg-primary-200/50 hover:bg-primary-500 hover:text-white border border-primary-400/40 hover:border-primary-600 rounded-full shadow-sm hover:shadow-lg hover:shadow-primary-500/30 animate-glow transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
 >
 <span className="relative flex w-1.5 h-1.5">
 <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500 group-hover:bg-white opacity-75 animate-ping" />
 <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-primary-600 group-hover:bg-white" />
 </span>
 {link.label}
 <svg className="w-3 h-3 -translate-x-0.5 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0-4 4m4-4H3" />
 </svg>
 </button>
 ))}
 </div>

 {/* Quick info */}
 <div
 className="mt-3 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 text-sm text-zinc-700 animate-fade-in"
 style={{ animationDelay: '550ms' }}
 >
 <span className="flex items-center gap-1.5">
 <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
 </svg>
 Swat, Pakistan
 </span>
 <span className="flex items-center gap-1.5">
 <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
 </svg>
 BSc Data Science — GIK Institute
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Mobile floating AI icon — stuck to right side */}
 <button
 onClick={() => window.dispatchEvent(new Event('openChat'))}
 className="fixed right-4 bottom-6 z-50 sm:hidden w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center border border-black/20 shadow-lg shadow-primary-500/40 active:scale-90 transition-transform"
 aria-label="Ask AI"
 >
 <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
 </svg>
 </button>

 <OvalLabsModal open={showOvalLabs} onClose={() => setShowOvalLabs(false)} />

 </section>
 );
}
