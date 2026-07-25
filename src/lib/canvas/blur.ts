/** Tiny inline SVG data URI used as a next/image blur placeholder. Every
 * canvas placeholder image is a flat fill, so a 1px swatch of the same
 * color is visually identical to a real blurred-down thumbnail. */
export function blurDataUrl(hex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${hex}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
