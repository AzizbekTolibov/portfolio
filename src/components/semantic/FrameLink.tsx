"use client";

/**
 * A real, crawlable `<a href>` into a specific canvas frame — the semantic
 * layer's per-frame navigation. Visually hidden (sr-only) until it
 * receives keyboard focus, at which point it pops into a fixed, visible
 * badge (same pattern as the skip-link in layout.tsx) so a sighted
 * keyboard user always has a visible focus indicator, not just the canvas
 * flying underneath it.
 *
 * Left click (no modifier) is intercepted to drive the canvas client-side
 * instead of a real navigation; modified clicks (new tab, etc.) and
 * crawlers fall through to the real href.
 */
export function FrameLink({
  id,
  current,
  onFocusFrame,
  onActivateFrame,
  children,
}: {
  id: string;
  current: boolean;
  onFocusFrame: (id: string) => void;
  onActivateFrame: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`/?node=${id}`}
      aria-current={current ? "location" : undefined}
      onFocus={() => onFocusFrame(id)}
      onClick={(e) => {
        if (
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        ) {
          return;
        }
        e.preventDefault();
        onActivateFrame(id);
      }}
      className="focus:bg-off-black focus:text-off-white focus:top-sm focus:left-sm focus:px-md focus:py-sm focus:text-mono-caption sr-only focus:not-sr-only focus:fixed focus:z-[70] focus:block focus:max-w-[80vw] focus:font-mono focus:tracking-[0.08em] focus:uppercase"
    >
      {children}
    </a>
  );
}
