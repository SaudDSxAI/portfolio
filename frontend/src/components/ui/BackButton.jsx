import { useTransitionNavigate } from '../../lib/useTransitionNavigate';

/**
 * Fixed, floating back button used on every non-landing page (Projects,
 * Skills, Contact, category pages, case-study pages). Pinned to a corner of
 * the viewport so it's always reachable regardless of scroll position or
 * page length, instead of an inline link that scrolls out of view or gets
 * crowded near the top of the page content.
 */
export default function BackButton({ to, label = 'Back' }) {
  const navigate = useTransitionNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      aria-label={label}
      className="group fixed top-5 left-5 z-40 flex items-center gap-2 pl-3 pr-4 h-11 rounded-full bg-warm-50/90 hover:bg-warm-100 border border-black/10 hover:border-black/20 shadow-lg shadow-black/5 backdrop-blur-sm text-sm font-semibold text-zinc-700 hover:text-black transition-all duration-300 hover:-translate-x-0.5"
    >
      <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
