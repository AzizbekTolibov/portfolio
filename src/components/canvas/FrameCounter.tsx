type FrameCounterProps = {
  /** 0-based index into the authored frame order. */
  index: number;
  total: number;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** A subtle "03 / 25" readout shown only in FOCUSED state — per-page: it
 * counts through the CURRENT page's own frame order (see
 * CanvasWorkspace's frameOrder), so it always matches what
 * scrolling/arrows/Space step across, and resets on every page switch. */
export function FrameCounter({ index, total }: FrameCounterProps) {
  return (
    <div
      aria-hidden="true"
      className="bg-panel/90 text-off-white/60 border-off-white/10 pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide shadow-md"
    >
      {pad(index + 1)} / {pad(total)}
    </div>
  );
}
