/** WCAG relative luminance, used to pick readable text color against an
 * arbitrary background — the project accent colors span dark navy to
 * pale mustard, so a single hardcoded text color can't stay legible
 * across all of them (see CLAUDE.md's contrast-auditing convention). */
function relativeLuminance(hex: string): number {
  const num = parseInt(hex.slice(1), 16);
  const channels = [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff].map(
    (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    },
  );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Off-black or off-white — whichever clears WCAG contrast against the
 * given background. Both project tokens (see globals.css), never an
 * invented color. */
export function readableTextColor(backgroundHex: string): "#0E0E0E" | "#F4F2ED" {
  const withDark = contrastRatio(backgroundHex, "#0E0E0E");
  const withLight = contrastRatio(backgroundHex, "#F4F2ED");
  return withDark >= withLight ? "#0E0E0E" : "#F4F2ED";
}
