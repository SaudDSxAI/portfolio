import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const sectionLinks = [
 { label: 'About', href: '#about', id: 'about' },
 { label: 'Projects', href: '#projects', id: 'projects' },
 { label: 'Skills', href: '#skills', id: 'skills' },
 { label: 'Contact', href: '#contact', id: 'contact' },
];

const categoryLinks = [
 { label: 'ML Projects', path: '/ml' },
];

export default function Navbar() {
 const [scrolled, setScrolled] = useState(false);
 const [active, setActive] = useState('hero');
 const location = useLocation();
 const navigate = useNavigate();
 const isHome = location.pathname === '/';

 // Header background changes after a small scroll
 useEffect(() => {
 const handleScroll = () => setScrolled(window.scrollY > 20);
 handleScroll();
 window.addEventListener('scroll', handleScroll, { passive: true });
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 // Scroll-spy only makes sense on the home page — the sections it tracks
 // don't exist on category/detail pages.
 useEffect(() => {
 if (!isHome) return;
 const ids = ['hero', ...sectionLinks.map((l) => l.id)];
 const sections = ids
 .map((id) => document.getElementById(id))
 .filter(Boolean);
 if (sections.length === 0) return;

 const observer = new IntersectionObserver(
 (entries) => {
 const visible = entries
 .filter((e) => e.isIntersecting)
 .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
 if (visible[0]) setActive(visible[0].target.id);
 },
 { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
 );

 sections.forEach((s) => observer.observe(s));
 return () => observer.disconnect();
 }, [isHome]);

 // Section links: smooth-scroll if already on home, otherwise navigate
 // home first — Home's own effect picks up the hash once it mounts.
 const goToSection = (e, href) => {
 e.preventDefault();
 if (isHome) {
 const el = document.querySelector(href);
 if (el) el.scrollIntoView({ behavior: 'smooth' });
 } else {
 navigate(`/${href}`);
 }
 };

 const getNavIcon = (label) => {
 switch (label) {
 case 'About':
 return (
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
 </svg>
 );
 case 'Projects':
 return (
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
 </svg>
 );
 case 'Skills':
 return (
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
 </svg>
 );
 case 'Contact':
 return (
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
 </svg>
 );
 case 'ML Projects':
 return (
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
 </svg>
 );
 default:
 return null;
 }
 };

 const allLinks = [...sectionLinks, ...categoryLinks];

 return (
 <>
 <nav
 className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
 scrolled
 ? 'bg-warm-50/75 border-b border-black/10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]'
 : 'bg-transparent border-b border-transparent'
 }`}
 >
 <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
 {/* Logo */}
 <Link to="/" className="group flex items-center gap-3">
 <span className="relative">
 <span className="absolute inset-0 rounded-xl bg-primary-500/40 blur-md group-hover:bg-primary-500/60 transition-all duration-300" />
 <span className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-heading font-bold text-sm tracking-tight shadow-md shadow-primary-700/30">
 SA
 </span>
 </span>
 <span className="hidden sm:flex flex-col leading-tight">
 <span className="text-sm font-heading font-bold text-black">
 Saud Ahmad
 </span>
 <span className="text-[10px] uppercase tracking-[0.2em] text-primary-700 font-semibold">
 AI Engineer
 </span>
 </span>
 </Link>

 {/* Desktop Links */}
 <div className="hidden md:flex items-center gap-1">
 {sectionLinks.map((link) => {
 const isActive = isHome && active === link.id;
 return (
 <a
 key={link.label}
 href={link.href}
 onClick={(e) => goToSection(e, link.href)}
 className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
 isActive
 ? 'text-primary-900'
 : 'text-zinc-600 hover:text-black'
 }`}
 >
 {link.label}
 <span
 className={`absolute left-4 right-4 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 origin-left transition-transform duration-300 ${
 isActive ? 'scale-x-100' : 'scale-x-0'
 }`}
 />
 </a>
 );
 })}

 {categoryLinks.map((link) => {
 const isActive = location.pathname.startsWith(link.path);
 return (
 <Link
 key={link.label}
 to={link.path}
 className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
 isActive ? 'text-primary-900' : 'text-zinc-600 hover:text-black'
 }`}
 >
 {link.label}
 <span
 className={`absolute left-4 right-4 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 origin-left transition-transform duration-300 ${
 isActive ? 'scale-x-100' : 'scale-x-0'
 }`}
 />
 </Link>
 );
 })}

 <button
 onClick={() => window.dispatchEvent(new Event('openChat'))}
 className="ml-4 group flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 rounded-xl shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
 >
 <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
 </svg>
 Ask AI
 </button>
 </div>
 </div>
 </nav>

 {/* Mobile App-Style Bottom Menu */}
 <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-warm-50/90 border-t border-black/10 pb-safe shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)]">
 <div className="flex items-center justify-around px-2 py-2">
 {sectionLinks.map((link) => {
 const isActive = isHome && active === link.id;
 return (
 <a
 key={link.label}
 href={link.href}
 onClick={(e) => goToSection(e, link.href)}
 className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
 isActive
 ? 'text-primary-800 bg-primary-300/30'
 : 'text-zinc-600 hover:text-black'
 }`}
 >
 {getNavIcon(link.label)}
 <span className="text-[10px] uppercase tracking-widest font-semibold">
 {link.label}
 </span>
 {isActive && (
 <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-700" />
 )}
 </a>
 );
 })}
 {categoryLinks.map((link) => {
 const isActive = location.pathname.startsWith(link.path);
 return (
 <Link
 key={link.label}
 to={link.path}
 className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
 isActive
 ? 'text-primary-800 bg-primary-300/30'
 : 'text-zinc-600 hover:text-black'
 }`}
 >
 {getNavIcon(link.label)}
 <span className="text-[10px] uppercase tracking-widest font-semibold">
 ML
 </span>
 {isActive && (
 <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-700" />
 )}
 </Link>
 );
 })}
 </div>
 </div>
 </>
 );
}
