import { useState, useEffect, useCallback, useMemo } from 'react';
import SectionHeading from './SectionHeading';
import ProjectCard from './ProjectCard';
import ScrollReveal from './ui/ScrollReveal';
import { fetchProjects, refreshProjects } from '../lib/api';
import { projects as fallbackProjects } from '../data/projects';

const ALL_CATEGORY = 'All';
const PAGE_SIZE = 6;

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-black/10 bg-warm-100/80 backdrop-blur-xl animate-pulse">
      <div className="h-44 bg-zinc-200/70" />
      <div className="p-5 space-y-3">
        <div className="h-2.5 w-20 rounded bg-zinc-300/70" />
        <div className="h-4 w-3/4 rounded bg-zinc-300/70" />
        <div className="h-3 w-full rounded bg-zinc-200/80" />
        <div className="h-3 w-5/6 rounded bg-zinc-200/80" />
        <div className="flex gap-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-14 rounded-full bg-zinc-200/80" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Status line ──────────────────────────────────────────────────────────────
function StatusBadge({ fetched_at, total }) {
  const ago = fetched_at
    ? Math.floor((Date.now() / 1000 - fetched_at) / 60)
    : null;
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-600">
      <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
      <span>
        {total} repos
        {ago !== null && <> · synced {ago < 1 ? 'just now' : `${ago}m ago`}</>}
      </span>
    </div>
  );
}

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

// ── Sync button ──────────────────────────────────────────────────────────────
function SyncButton({ onClick, busy }) {
  return (
    <button
      id="projects-refresh-btn"
      onClick={onClick}
      disabled={busy}
      title="Pull latest repos from GitHub. New/changed repos are sent to the LLM; the rest are reused. Saved to disk."
      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
    >
      <svg
        className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {busy ? 'Syncing…' : 'Sync from GitHub'}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Derive categories + per-category counts from live data
  const { categories, counts } = useMemo(() => {
    const c = {};
    for (const p of projects) {
      c[p.category] = (c[p.category] || 0) + 1;
    }
    const cats = [ALL_CATEGORY, ...Object.keys(c).sort()];
    return { categories: cats, counts: c };
  }, [projects]);

  // Filtered list
  const filtered = useMemo(
    () =>
      activeCategory === ALL_CATEGORY
        ? projects
        : projects.filter((p) => p.category === activeCategory),
    [projects, activeCategory]
  );

  // Visible slice (pagination)
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory]);

  // ── initial load (just reads cache from backend) ──────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjects(false);
      setProjects(data.projects || []);
      setMeta({
        cached: data.cached,
        fetched_at: data.fetched_at,
        total: data.total,
      });
    } catch (err) {
      console.error('Projects fetch failed:', err);
      setProjects(fallbackProjects);
      setMeta({
        cached: true,
        fetched_at: Math.floor(Date.now() / 1000),
        total: fallbackProjects.length,
      });
      setError('Live GitHub sync is unavailable. Showing saved projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── manual sync (POST /api/projects/refresh) ──────────────────────────────
  const sync = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      await refreshProjects();
      // After the sync completes, fetch the fresh list
      const data = await fetchProjects(false);
      setProjects(data.projects || []);
      setMeta({
        cached: data.cached,
        fetched_at: data.fetched_at,
        total: data.total,
      });
    } catch (err) {
      console.error('Manual sync failed:', err);
      setError('Sync failed. Check the backend log.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <section id="projects" className="relative py-24 px-6">
      <div className="relative max-w-6xl mx-auto">
        {/* Header row */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-2">
          <SectionHeading
            eyebrow="Selected Work"
            title="Projects"
            subtitle="Pulled from GitHub · enriched by AI · saved locally"
          />
          <SyncButton onClick={sync} busy={refreshing} />
        </div>

        {/* Status */}
        {meta && !loading && (
          <div className="mb-8">
            <StatusBadge {...meta} />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-primary-100/50 border border-primary-400/40 text-sm text-primary-900">
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Layout: sidebar + content */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-10">
            {/* Sidebar (desktop) */}
            <CategorySidebar
              categories={categories}
              counts={counts}
              active={activeCategory}
              onChange={setActiveCategory}
              total={projects.length}
            />

            {/* Right column */}
            <div>
              {/* Mobile dropdown */}
              <CategoryDropdown
                categories={categories}
                counts={counts}
                active={activeCategory}
                onChange={setActiveCategory}
                total={projects.length}
              />

              {/* Project grid */}
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

                  {/* Load more */}
                  {hasMore && (
                    <div className="flex flex-col items-center mt-12">
                      <button
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        className="group flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-warm-100/90 backdrop-blur-sm border border-black/15 text-zinc-800 hover:border-primary-600/50 hover:text-primary-800 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
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
