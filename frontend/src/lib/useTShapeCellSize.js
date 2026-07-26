import { useLayoutEffect, useRef, useState } from 'react';

// Sizes the two blocks of the mobile Skills "T" (a wide bar row on top, a
// narrower stem block below) so every card is a true square and the whole
// shape always fits inside the measured container with no scrolling.
//
// Unlike useSquareGridDims (which stretches cells to exactly fill a box,
// accepting a near-square compromise), a T only reads clearly as a T if
// every card is genuinely square and the same size across both the bar and
// the stem — so instead this picks one `cellSize` that is small enough to
// satisfy both the width budget (barCols squares across) and the height
// budget (barRows + stemRows squares stacked), then centers the resulting
// shape in whatever space is left over.
// `reserveW`/`reserveH` let a caller wrapping the two blocks in a visible
// bordered frame (padding + border strokes + the connector line between
// them) tell this hook how many pixels that chrome eats, so the computed
// cell size still leaves room for it instead of the frame nudging the
// whole shape a few pixels past the measured box.
export function useTShapeCellSize({ barCols, stemCols, stemRows, gap = 8, reserveW = 0, reserveH = 0 }) {
  const ref = useRef(null);
  const [cellSize, setCellSize] = useState(56);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;

      const widthCols = Math.max(barCols, stemCols);
      const totalRows = 1 + stemRows; // bar's single row + the stem's rows

      const byWidth = (width - reserveW - gap * (widthCols - 1)) / widthCols;
      const byHeight = (height - reserveH - gap * totalRows) / totalRows;

      const next = Math.max(28, Math.floor(Math.min(byWidth, byHeight)));
      setCellSize((prev) => (prev === next ? prev : next));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [barCols, stemCols, stemRows, gap, reserveW, reserveH]);

  return { ref, cellSize };
}
