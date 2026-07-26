/**
 * Two concerns that must NOT share one scale factor, even though both are
 * "counter-scale the ambient zoom":
 *
 *  - POSITION (how far above its anchor the label sits) must have a
 *    *bounded* canvas-space reach, or a label built for close-up zoom
 *    would float hundreds of canvas units above its frame once zoomed out
 *    to an OVERVIEW-level 10-20%, overlapping whatever sits in the row
 *    above.
 *  - SIZE (the text's on-screen footprint) must be *exactly* constant at
 *    every zoom, uncapped — Figma's frame/group labels never shrink,
 *    at any zoom, full stop.
 *
 * Capping one factor and reusing it for both (the previous approach) made
 * position safe but broke size: below the cap's threshold zoom, the text
 * shrank right along with the (intentionally) capped position factor.
 *
 * The fix composes two scale() calls in one transform instead of one:
 * `scale(posFactor) translateY(offsetPx) scale(sizeCompensation)`. CSS
 * transform functions apply right-to-left, so sizeCompensation affects
 * the box's rendered dimensions (and therefore the text) but — because
 * it's applied *before* the translate, at the anchor point where scaling
 * has no displacement effect — never touches how far the translate
 * actually moves the label. Position keeps exactly its old (capped, safe)
 * behavior; size becomes independently, unconditionally constant.
 *
 * Proof sizeCompensation makes the rendered text size exactly constant:
 * let S = --canvas-scale (ambient world zoom), A = 1/S (uncapped counter-
 * scale), posFactor = min(A, CAP). Combined scale on the glyph =
 * S * posFactor * sizeCompensation. Setting sizeCompensation =
 * max(1, A / CAP):
 *   - S >= 1/CAP (posFactor = A, uncapped region): combined =
 *     S * A * 1 = 1.
 *   - S <  1/CAP (posFactor = CAP, capped region): combined =
 *     S * CAP * (A / CAP) = S * A = 1.
 * Either way, combined scale is exactly 1 — the label renders at its
 * authored size (11px) at *every* zoom level, no exceptions.
 *
 * Position's reach is unaffected: canvas-space distance from the anchor
 * caps at `offsetPx * CAP` once S drops below 1/CAP, same as before
 * (content/canvas.ts's macro gutter is sized to clear that).
 */
const COUNTER_SCALE_CAP = 2.5;
const INV_SCALE = "calc(1 / var(--canvas-scale, 1))";

export function labelTransform(offsetPx: number): string {
  const posFactor = `min(${INV_SCALE}, ${COUNTER_SCALE_CAP})`;
  const sizeCompensation = `max(1, calc(${INV_SCALE} / ${COUNTER_SCALE_CAP}))`;
  return `scale(${posFactor}) translateY(${offsetPx}px) scale(${sizeCompensation})`;
}
