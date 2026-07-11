import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading';
import ProjectCard from './ProjectCard';
import ScrollReveal from './ui/ScrollReveal';
import { projects } from '../data/projects';

const ALL_CATEGORY = 'All';
const PAGE_SIZE = 6;

// ── Category sidebar (desktop) ───────────────────────────────────────────────
function CategorySidebar({ categories, counts, active, onChange, total }) {
 return (
 <aside className="hidden lg:block">
 <div className="sticky top-24">
 <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-700 mb-4">
 Categories
 </p>
 <ul className="space-y-1">
 {categories.map((cat) => {
 const isActive = active === cat;
 const count = cat === ALL_CATEGORY ? total : counts[cat] || 0;
 return (
 <li key={cat}>
 <button
 onClick={() => onChange(cat)}
 className={`group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
 isActive
 ? 'bg-primary-300/40 text-primary-900 font-semibold'
 : 'text-zinc-700 hover:bg-warm-100 hover:text-primary-800'
 }`}
 >
 <span className="flex items-center gap-2.5 min-w-0">
 <span
 className={`w-1 h-5 rounded-full transition-all duration-200 ${
 isActive
 ? 'bg-primary-700'
 : 'bg-transparent group-hover:bg-primary-400'
 }`}
 />
 <span className="truncate">{cat}</span>
 </span>
 <span
 className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
 isActive
 ? 'bg-primary-700 text-white'
 : 'bg-warm-100 text-zinc-500 group-hover:bg-primary-200/60 group-hover:text-primary-800'
 }`}
 >
 {count}
 </span>
 </button>
 </li>
 );
 })}
 </ul>
 </div>
 </aside>
 );
}

// ── Category dropdown (mobile/tablet) ────────────────────────────────────────
function CategoryDropdown({ categories, counts, active, onChange, total }) {
 return (
 <div className="lg:hidden mb-6">
 <label htmlFor="category-select" className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-700 mb-2">
 Category
 </label>
 <div className="relative">
 <select
 id="category-select"
 value={active}
 onChange={(e) => onChange(e.target.value)}
 className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-black/15 bg-warm-100 text-zinc-800 font-medium text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-300/40"
 >
 {categories.map((cat) => {
 const count = cat === ALL_CATEGORY ? total : counts[cat] || 0;
 return (
 <option key={cat} value={cat}>
 {cat} ({count})
 </option>
 );
 })}
 </select>
 <svg
 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 strokeWidth={2}
 >
 <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
 </svg>
 </div>
 </div>
 );
}

// ── Main component ───────────────────────────────────────────────────────────
// Projects are maintained by hand in ../data/projects.js — no GitHub sync,
// no AI-generated descriptions. Add/edit entries there directly.
export default function Projects() {
 const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
 const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

 const { categories, counts } = useMemo(() => {
 const c = {};
 for (const p of projects) {
 c[p.category] = (c[p.category] || 0) + 1;
 }
 const cats = [ALL_CATEGORY, ...Object.keys(c).sort()];
 return { categories: cats, counts: c };
 }, []);

 const filtered = useMemo(
 () =>
 activeCategory === ALL_CATEGORY
 ? projects
 : projects.filter((p) => p.category === activeCategory),
 [activeCategory]
 );

 const visible = filtered.slice(0, visibleCount);
 const hasMore = filtered.length > visibleCount;

 const changeCategory = (cat) => {
 setActiveCategory(cat);
 setVisibleCount(PAGE_SIZE);
 };

 return (
 <section id="projects" className="relative py-24 px-6">
 <div className="relative max-w-6xl mx-auto">
 <SectionHeading
 eyebrow="Selected Work"
 title="Projects"
 subtitle="A hand-picked selection — the ones worth your time"
 />

 {/* Callout: hand-crafted technical case studies live on their own pages */}
 <Link
 to="/ml"
 className="group flex items-center justify-between gap-4 mb-10 p-5 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
 >
 <div>
 <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-100 mb-1">
 Deep dives
 </div>
 <div className="text-lg font-heading font-bold">
 Explore ML case studies — real benchmarks, real charts
 </div>
 </div>
 <svg className="w-6 h-6 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
 </svg>
 </Link>

 {projects.length === 0 && (
 <div className="flex flex-col items-center py-20 text-center text-zinc-600">
 <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.5v15m7.5-7.5h-15" />
 </svg>
 <p className="text-sm">Project write-ups are being refreshed — check back soon.</p>
 </div>
 )}

 {projects.length > 0 && (
 <div className="grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-10">
 <CategorySidebar
 categories={categories}
 counts={counts}
 active={activeCategory}
 onChange={changeCategory}
 total={projects.length}
 />

 <div>
 <CategoryDropdown
 categories={categories}
 counts={counts}
 active={activeCategory}
 onChange={changeCategory}
 total={projects.length}
 />

 {visible.length > 0 ? (
 <>
 <div className="grid md:grid-cols-2 auto-rows-fr gap-6">
 {visible.map((project, index) => {
 const isWide = !!project.featured;
 return (
 <ScrollReveal
 key={project.id ?? project.repoName}
 delay={index * 50}
 className={isWide ? 'md:col-span-2' : ''}
 >
 <ProjectCard project={project} index={index} wide={isWide} />
 </ScrollReveal>
 );
 })}
 </div>

 {hasMore && (
 <div className="flex flex-col items-center mt-12">
 <button
 onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
 className="group flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-warm-100/90 border border-black/15 text-zinc-800 hover:border-primary-600/50 hover:text-primary-800 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
 >
 Load more
 <span className="text-xs text-zinc-500 group-hover:text-primary-700">
 ({filtered.length - visibleCount} remaining)
 </span>
 <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
 </svg>
 </button>
 <p className="mt-3 text-[11px] text-zinc-500">
 Showing {visibleCount} of {filtered.length}
 </p>
 </div>
 )}
 </>
 ) : (
 <div className="flex flex-col items-center py-20 text-zinc-600">
 <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
 </svg>
 <p className="text-sm">No projects found in this category.</p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </section>
 );
}
