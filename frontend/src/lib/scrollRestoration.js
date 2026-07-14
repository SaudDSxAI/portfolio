// In-memory, per-pathname scroll position store. Lives for the lifetime of
// the tab (module-level, not persisted across a hard refresh) — enough to
// make each page "remember" where you were when you navigate away and come
// back to it, without needing sessionStorage read/write on every scroll tick.
const positions = new Map();

export function saveScrollPosition(key, y) {
  positions.set(key, y);
}

export function getScrollPosition(key) {
  return positions.get(key);
}
