import { useCallback, useRef, useState } from 'react';

// Drives the "drag your finger across the grid to preview" interaction used
// on the mobile Projects and CategoryPage grids. Touch has no hover, so the
// only way to know which tile the finger is currently resting on is to
// hit-test the live touch position on every touchmove via
// elementFromPoint(), against tiles marked with a `data-scrub-index`
// attribute. That index is exposed as `activeIndex` so a tile can enlarge
// and reveal its detail while the finger is over it.
//
// Tap-vs-drag matters for what happens on release: a plain stationary tap
// still fires a normal click (handled by each tile's own onClick, unchanged)
// — but browsers suppress the synthetic click after a real drag gesture, so
// we detect that case (the active tile changed at least once during the
// touch) and fire `onActivate` manually in that scenario only. This avoids
// ever double-navigating on a simple tap, which would otherwise fire two
// back-to-back view-transition animations.
export function useScrubActivate(onActivate) {
  const [activeIndex, setActiveIndex] = useState(null);
  const startIndexRef = useRef(null);
  const draggedRef = useRef(false);

  const hitTest = useCallback((clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    const tile = el && el.closest ? el.closest('[data-scrub-index]') : null;
    return tile ? Number(tile.dataset.scrubIndex) : null;
  }, []);

  const onTouchStart = useCallback(
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      const idx = hitTest(t.clientX, t.clientY);
      startIndexRef.current = idx;
      draggedRef.current = false;
      setActiveIndex(idx);
    },
    [hitTest]
  );

  const onTouchMove = useCallback(
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      const idx = hitTest(t.clientX, t.clientY);
      if (idx !== startIndexRef.current) draggedRef.current = true;
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    },
    [hitTest]
  );

  const finish = useCallback(
    (clientX, clientY) => {
      const finalIdx =
        clientX != null && clientY != null ? hitTest(clientX, clientY) : activeIndex;
      if (draggedRef.current && finalIdx != null) {
        onActivate?.(finalIdx);
      }
      startIndexRef.current = null;
      draggedRef.current = false;
      setActiveIndex(null);
    },
    [activeIndex, hitTest, onActivate]
  );

  const onTouchEnd = useCallback(
    (e) => {
      const t = e.changedTouches && e.changedTouches[0];
      finish(t?.clientX, t?.clientY);
    },
    [finish]
  );

  const onTouchCancel = useCallback(() => {
    startIndexRef.current = null;
    draggedRef.current = false;
    setActiveIndex(null);
  }, []);

  return {
    activeIndex,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel },
  };
}
