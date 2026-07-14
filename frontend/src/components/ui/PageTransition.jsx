import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getScrollPosition, saveScrollPosition } from '../../lib/scrollRestoration';

/**
 * Keys the routed page content by pathname so React fully remounts it on
 * every navigation — this replays each page's own entrance animations
 * (animate-fade-in, animate-slide-up, etc.) instead of them only firing
 * once. The actual page-to-page transition (cross-fade/slide) is handled
 * separately by the native View Transitions API (see
 * useTransitionNavigate.js + the ::view-transition-* rules in index.css),
 * which animates the real before/after screenshots rather than a CSS class.
 *
 * This is also where per-page scroll persistence lives: each page's scroll
 * position is tracked continuously while you're on it and restored the
 * next time you land back on that exact path, instead of every page
 * always opening at the top.
 */
export default function PageTransition({ children }) {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Restore this page's last known scroll position (0 if we've never
    // been here this session). rAF lets layout settle first — important
    // since some pages lazy-load their content via Suspense.
    const saved = getScrollPosition(path);
    requestAnimationFrame(() => window.scrollTo(0, saved ?? 0));

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        saveScrollPosition(path, window.scrollY);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  return <div key={location.pathname}>{children}</div>;
}
