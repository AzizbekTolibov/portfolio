import type { CanvasRect } from "./types";

/** A single alignment guide to render during a drag — a line at `position`
 * (canvas units) spanning the union of the moving rect and whatever it
 * snapped to, so the guide visibly connects the two edges/centers that
 * lined up. */
export type SnapGuide = {
  orientation: "vertical" | "horizontal";
  /** Canvas-space x (vertical guide) or y (horizontal guide). */
  position: number;
  from: number;
  to: number;
};

type SnapCandidate = { value: number; guideValue: number };

/** For a moving rect's left/right/h-center (x-axis) or top/bottom/v-center
 * (y-axis), the candidate positions that would snap it into alignment. */
function xCandidates(rect: CanvasRect): SnapCandidate[] {
  return [
    { value: rect.x, guideValue: rect.x },
    { value: rect.x + rect.width, guideValue: rect.x + rect.width },
    {
      value: rect.x + rect.width / 2,
      guideValue: rect.x + rect.width / 2,
    },
  ];
}

function yCandidates(rect: CanvasRect): SnapCandidate[] {
  return [
    { value: rect.y, guideValue: rect.y },
    { value: rect.y + rect.height, guideValue: rect.y + rect.height },
    {
      value: rect.y + rect.height / 2,
      guideValue: rect.y + rect.height / 2,
    },
  ];
}

/**
 * Given a rect at its prospective (unsnapped) position and every other
 * frame/group on the page, finds the smallest correction on each axis
 * that aligns one of the moving rect's edges/center with one of another
 * rect's edges/center, within `threshold` canvas units — independently
 * per axis, so a drag can snap horizontally without also snapping
 * vertically. Returns a zero correction and no guides when nothing is
 * within range (or `others` is empty).
 */
export function computeSnap(
  movingRect: CanvasRect,
  others: CanvasRect[],
  threshold: number,
): { dx: number; dy: number; guides: SnapGuide[] } {
  let bestX: { delta: number; guide: SnapGuide } | null = null;
  let bestY: { delta: number; guide: SnapGuide } | null = null;

  const movingX = xCandidates(movingRect);
  const movingY = yCandidates(movingRect);

  for (const other of others) {
    for (const mine of movingX) {
      for (const theirs of xCandidates(other)) {
        const delta = theirs.guideValue - mine.value;
        if (
          Math.abs(delta) <= threshold &&
          (!bestX || Math.abs(delta) < Math.abs(bestX.delta))
        ) {
          const top = Math.min(movingRect.y, other.y);
          const bottom = Math.max(
            movingRect.y + movingRect.height,
            other.y + other.height,
          );
          bestX = {
            delta,
            guide: {
              orientation: "vertical",
              position: theirs.guideValue,
              from: top,
              to: bottom,
            },
          };
        }
      }
    }
    for (const mine of movingY) {
      for (const theirs of yCandidates(other)) {
        const delta = theirs.guideValue - mine.value;
        if (
          Math.abs(delta) <= threshold &&
          (!bestY || Math.abs(delta) < Math.abs(bestY.delta))
        ) {
          const left = Math.min(movingRect.x, other.x);
          const right = Math.max(
            movingRect.x + movingRect.width,
            other.x + other.width,
          );
          bestY = {
            delta,
            guide: {
              orientation: "horizontal",
              position: theirs.guideValue,
              from: left,
              to: right,
            },
          };
        }
      }
    }
  }

  const guides: SnapGuide[] = [];
  if (bestX) guides.push(bestX.guide);
  if (bestY) guides.push(bestY.guide);

  return { dx: bestX?.delta ?? 0, dy: bestY?.delta ?? 0, guides };
}
