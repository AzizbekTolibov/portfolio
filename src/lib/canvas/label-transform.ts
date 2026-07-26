/**
 * A screen-constant label position (scale, *then* translateY, in that
 * order — that's what makes the offset itself immune to zoom, not just
 * the text size) — but capped. Above ~40% zoom, factor = 1/scale exactly
 * (uncapped): the label sits a true constant `offsetPx` above its anchor
 * at any zoom. Below ~40%, factor caps at COUNTER_SCALE_CAP instead of
 * continuing to grow — because a screen-constant offset's canvas-space
 * *reach* is offsetPx / scale, which is unbounded as scale shrinks. Left
 * uncapped, a label built for 40%+ zoom would reach hundreds of canvas
 * units above its frame once zoomed out to an OVERVIEW-level 10-20%,
 * easily overlapping whatever sits in the row above — which is exactly
 * the bug this caps. Capped, the canvas-space reach maxes out at
 * `offsetPx * COUNTER_SCALE_CAP`, constant no matter how far you zoom
 * out — content/canvas.ts's macro gutter is sized to clear that.
 */
const COUNTER_SCALE_CAP = 2.5;

export function labelTransform(offsetPx: number): string {
  return `scale(min(calc(1 / var(--canvas-scale, 1)), ${COUNTER_SCALE_CAP})) translateY(${offsetPx}px)`;
}
