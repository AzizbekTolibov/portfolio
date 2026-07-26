"use client";

import { useEffect } from "react";

type Shortcut = { keys: string; label: string };
type Group = { title: string; shortcuts: Shortcut[] };

const GROUPS: Group[] = [
  {
    title: "Navigate",
    shortcuts: [
      { keys: "Tab / Shift Tab", label: "Move through frames and controls" },
      { keys: "Enter", label: "Activate the focused link or button" },
      {
        keys: "Scroll / ↑ ↓ ← →",
        label: "Pan (overview) or step frames (focused)",
      },
      { keys: "Space", label: "Advance a frame (focused)" },
      { keys: "Space + drag", label: "Pan with the pointer" },
      { keys: "Esc", label: "Return to overview / deselect" },
    ],
  },
  {
    title: "Zoom",
    shortcuts: [
      { keys: "+ / −", label: "Zoom in / out" },
      { keys: "Shift 1", label: "Zoom to fit (overview)" },
      { keys: "Shift 2", label: "Zoom to selection" },
      { keys: "Shift 0", label: "Reset to 100%" },
      { keys: "Ctrl/Cmd + Scroll", label: "Zoom toward the cursor" },
    ],
  },
  {
    title: "Tools",
    shortcuts: [
      { keys: "V", label: "Move tool" },
      { keys: "H", label: "Hand tool" },
    ],
  },
  {
    title: "Global",
    shortcuts: [
      { keys: "Ctrl/Cmd K", label: "Open the command palette" },
      { keys: "?", label: "Open this dialog" },
    ],
  },
];

export function KeyboardShortcutsDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-heading"
        onClick={(e) => e.stopPropagation()}
        className="bg-panel border-off-white/10 relative w-full max-w-[36rem] overflow-hidden rounded-lg border shadow-2xl"
      >
        <div className="border-off-white/10 flex items-center justify-between border-b px-4 py-3">
          <h2
            id="shortcuts-heading"
            className="text-off-white text-[13px] font-medium"
          >
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-off-white/60 hover:text-off-white text-[13px]"
          >
            Esc
          </button>
        </div>
        <div className="grid max-h-[70vh] grid-cols-1 gap-x-8 gap-y-5 overflow-y-auto p-4 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-off-white/60 mb-2 text-[11px] font-medium tracking-wide uppercase">
                {group.title}
              </h3>
              <dl className="flex flex-col gap-1.5">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <dt className="text-off-white/80 text-[12px]">{s.label}</dt>
                    <dd className="text-off-white/70 border-off-white/15 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap">
                      {s.keys}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
