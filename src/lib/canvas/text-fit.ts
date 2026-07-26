/**
 * Rough "how many characters fit" estimate for a text box, given the
 * canvas-unit box size and the type-scale numbers it renders with — not a
 * precise layout measurement (that needs a live, rendered DOM, which a
 * form field validating as you type doesn't have), just enough to flag
 * "this is probably going to overflow" before a save. Tuned against the
 * About Bio frame's own copy, which is known to fit today: at 790x240
 * canvas units / 18px body text, it lands well under the estimate here,
 * which is the sanity check that matters more than the formula's rigor.
 */
export function estimateCharCapacity(
  widthPx: number,
  heightPx: number,
  fontSizePx: number,
  lineHeightMultiplier: number,
): number {
  const avgCharWidth = fontSizePx * 0.52; // proportional-font rule of thumb
  const charsPerLine = Math.floor(widthPx / avgCharWidth);
  const lineHeightPx = fontSizePx * lineHeightMultiplier;
  const lines = Math.floor(heightPx / lineHeightPx);
  return Math.max(1, charsPerLine * lines);
}
