import { useLayoutEffect, useRef, useState } from 'react';

// Picks the column/row split that makes each grid cell as close to square
// as possible for the container's *actual* measured pixel box — not just a
// fixed column count. A grid with a fixed column count produces tall,
// rectangular cells whenever the container is much taller than it is wide
// (the common case on a phone); measuring the real box and testing every
// candidate column count against it is what actually gets a near-square
// result regardless of screen size or item count.
//
// `minCells` puts a floor under how many cells the grid is divided into,
// even if there are fewer real items than that. Without it, a category
// with a single project would compute a 1x1 grid and that one card would
// stretch to fill the entire width/height — instead it should occupy one
// cell of a normal-looking grid, with the rest left empty, so it reads as
// "one item so far" rather than a broken full-bleed card.
export function useSquareGridDims(n, minCells = 4, maxCols = 4) {
  const ref = useRef(null);
  const [dims, setDims] = useState({ cols: 1, rows: 1 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      const count = Math.max(1, n, minCells);
      let best = { cols: 1, rows: count, score: Infinity };
      const cap = Math.min(count, maxCols);
      for (let cols = 1; cols <= cap; cols++) {
        const rows = Math.ceil(count / cols);
        const cellW = width / cols;
        const cellH = height / rows;
        const score = Math.abs(cellW - cellH);
        if (score < best.score) best = { cols, rows, score };
      }
      setDims((prev) =>
        prev.cols === best.cols && prev.rows === best.rows
          ? prev
          : { cols: best.cols, rows: best.rows }
      );
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [n, minCells, maxCols]);

  return { ref, cols: dims.cols, rows: dims.rows };
}
