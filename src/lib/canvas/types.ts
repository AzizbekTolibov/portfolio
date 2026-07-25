/** Below 30% zoom: flat color block + label only. 30-80%: a static
 * thumbnail. Above 80%: real DOM content. */
export type LodBand = "flat" | "thumbnail" | "full";

export type ViewportTransform = {
  x: number;
  y: number;
  scale: number;
};

/** Canvas-space rect, in canvas units (not screen pixels) — the shape the
 * viewport engine's geometry math operates on generically, regardless of
 * which content node it came from. */
export type CanvasRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
