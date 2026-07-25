"use client";

import { FrameLayerIcon } from "./icons";

type MobileBottomBarProps = {
  currentIndex: number | null;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onOpenLayers: () => void;
};

/** Below 768px, this replaces free panning as the primary way to move
 * through the file — every frame reachable by tapping through in order,
 * no panning skill required. */
export function MobileBottomBar({
  currentIndex,
  total,
  onPrev,
  onNext,
  onOpenLayers,
}: MobileBottomBarProps) {
  // Nothing selected yet (fresh visit) disables neither button — either
  // one should be able to kick off the tour at frame 1, not leave a
  // first-time visitor with two dead buttons.
  const atStart = currentIndex !== null && currentIndex <= 0;
  const atEnd = currentIndex !== null && currentIndex >= total - 1;

  return (
    <div className="bg-panel border-off-white/10 flex h-14 shrink-0 items-center gap-2 border-t px-2">
      <button
        type="button"
        onClick={onOpenLayers}
        aria-label="Open layers"
        className="text-off-white/80 flex h-10 shrink-0 items-center gap-1.5 rounded px-3 text-[12px] font-medium hover:bg-white/5"
      >
        <FrameLayerIcon className="h-4 w-4" />
        Layers
      </button>

      <div className="border-off-white/10 flex flex-1 items-center justify-between gap-2 border-l pl-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={atStart}
          aria-label="Previous frame"
          className="text-off-white flex h-10 w-11 shrink-0 items-center justify-center rounded text-[16px] disabled:opacity-30"
        >
          ◀
        </button>
        <span className="text-off-white/70 min-w-0 flex-1 truncate text-center font-mono text-[11px]">
          {currentIndex === null
            ? `${total} frames`
            : `Frame ${currentIndex + 1} of ${total}`}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={atEnd}
          aria-label="Next frame"
          className="text-off-white flex h-10 w-11 shrink-0 items-center justify-center rounded text-[16px] disabled:opacity-30"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
