import type { CanvasRect } from "./types";

/**
 * Lays out `count` equal-size cells into a wrapping grid — `cols` per row,
 * uniform `gutter` between cells both directions — purely from the count
 * and cell size. No caller ever hand-positions a grid item: add an entry
 * to the data array and this recomputes every position, including how
 * many rows exist. This is what makes adding a 7th or 10th project (or a
 * 5th photo to an existing one) a one-line content change, never a
 * spatial-layout change.
 */
export function autoGrid(options: {
  count: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  gutter: number;
  /** Vertical gutter between rows, if it needs to differ from the
   * horizontal `gutter` — e.g. a grid of always-labeled groups needs a
   * bigger row gutter than column gutter, since a label only ever reaches
   * upward (see label-transform.ts's capped counter-scale), never
   * sideways. Defaults to `gutter`. */
  rowGutter?: number;
  originX?: number;
  originY?: number;
}): CanvasRect[] {
  const {
    count,
    cols,
    cellWidth,
    cellHeight,
    gutter,
    rowGutter = gutter,
    originX = 0,
    originY = 0,
  } = options;
  const rects: CanvasRect[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    rects.push({
      x: originX + col * (cellWidth + gutter),
      y: originY + row * (cellHeight + rowGutter),
      width: cellWidth,
      height: cellHeight,
    });
  }
  return rects;
}

/** The bounding size of a set of grid rects, relative to (originX, originY)
 * — how wide/tall the grid ended up being once wrapped, so a caller (e.g.
 * a banner frame above it) can size itself to match without hardcoding a
 * column count of its own. */
export function autoGridSize(
  rects: CanvasRect[],
  originX = 0,
  originY = 0,
): { width: number; height: number } {
  if (rects.length === 0) return { width: 0, height: 0 };
  const maxRight = Math.max(...rects.map((r) => r.x + r.width));
  const maxBottom = Math.max(...rects.map((r) => r.y + r.height));
  return { width: maxRight - originX, height: maxBottom - originY };
}
