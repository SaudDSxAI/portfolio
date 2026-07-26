import { useState, useEffect } from 'react';

// Tracks whether the viewport is at/below the `sm` breakpoint (640px), kept
// in sync via matchMedia so it updates live on rotation/resize instead of
// only being read once on mount. Used to swap between the compact,
// zero-scroll "fit everything on one screen" mobile grid and the normal
// wrapping desktop grid on pages like Projects and CategoryPage.
export function useIsMobile(breakpoint = 640) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}
