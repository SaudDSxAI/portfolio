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

// Tailwind's JIT scanner only picks up class names it finds written out in
// full somewhere in the source — a template-interpolated `origin-${a}-${b}`
// would silently produce no CSS. This table exists so every literal class
// name (`origin-top-left`, `origin-right`, etc.) appears in the file once,
// while the lookup itself can still be dynamic per tile.
const ORIGIN_CLASSES = {
  'top-left': 'origin-top-left',
  'top-center': 'origin-top',
  'top-right': 'origin-top-right',
  'center-left': 'origin-left',
  'center-center': 'origin-center',
  'center-right': 'origin-right',
  'bottom-left': 'origin-bottom-left',
  'bottom-center': 'origin-bottom',
  'bottom-right': 'origin-bottom-right',
};

// A tile that scales up while sitting flush against the edge of a clipped
// (`overflow-hidden`) container will visibly clip on whichever side is
// against that edge, even at a modest 5-6% scale — the growth is
// symmetric around the tile's center by default. Biasing the
// transform-origin toward whichever edge(s) the tile is touching makes it
// grow inward instead, so it never reaches past the container boundary no
// matter how small the gutter is.
export function getTileOriginClass(index, cols, rows) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const vert = row === 0 ? 'top' : row === rows - 1 ? 'bottom' : 'center';
  const horiz = col === 0 ? 'left' : col === cols - 1 ? 'right' : 'center';
  return ORIGIN_CLASSES[`${vert}-${horiz}`];
}
