import type { CanvasRect, ViewportTransform } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Screen-space math for "zoom toward a point": given the viewport's current
 * transform and a target scale, returns the new x/y that keeps the canvas
 * point currently under (screenX, screenY) fixed under that same screen
 * point after the scale changes. (screenX/screenY are container-local,
 * i.e. already relative to the canvas container's top-left.)
 */
export function zoomTowardPoint(
  current: ViewportTransform,
  screenX: number,
  screenY: number,
  targetScale: number,
  minZoom: number,
  maxZoom: number,
): ViewportTransform {
  const newScale = clamp(targetScale, minZoom, maxZoom);
  const factor = newScale / current.scale;
  return {
    x: screenX - factor * (screenX - current.x),
    y: screenY - factor * (screenY - current.y),
    scale: newScale,
  };
}

/**
 * Returns the viewport transform that fits `rect` (canvas-space) into the
 * viewport at `fitRatio` (e.g. 0.8 = frame fills ~80% of the viewport),
 * centered.
 */
export function computeFitTransform(
  rect: CanvasRect,
  viewportWidth: number,
  viewportHeight: number,
  fitRatio: number,
  minZoom: number,
  maxZoom: number,
): ViewportTransform {
  const scaleX = (viewportWidth * fitRatio) / rect.width;
  const scaleY = (viewportHeight * fitRatio) / rect.height;
  const scale = clamp(Math.min(scaleX, scaleY), minZoom, maxZoom);

  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  return {
    x: viewportWidth / 2 - scale * centerX,
    y: viewportHeight / 2 - scale * centerY,
    scale,
  };
}

export function computeBoundingBox(rects: CanvasRect[]): CanvasRect {
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.width));
  const maxY = Math.max(...rects.map((r) => r.y + r.height));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Does canvas-space rect `r` intersect the canvas-space viewport bounds? */
export function rectIntersects(r: CanvasRect, bounds: CanvasRect): boolean {
  return (
    r.x < bounds.x + bounds.width &&
    r.x + r.width > bounds.x &&
    r.y < bounds.y + bounds.height &&
    r.y + r.height > bounds.y
  );
}
