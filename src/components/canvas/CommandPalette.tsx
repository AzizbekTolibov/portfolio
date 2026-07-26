"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLinkIcon,
  FitIcon,
  FrameLayerIcon,
  GroupIcon,
  MailIcon,
  SearchIcon,
} from "./icons";

export type NavigateItem = {
  id: string;
  label: string;
  icon: "frame" | "group";
};

type PaletteItem =
  | ({ kind: "navigate" } & NavigateItem)
  | { kind: "action"; id: string; label: string; run: () => void };

type CommandPaletteProps = {
  onClose: () => void;
  navigateItems: NavigateItem[];
  onNavigate: (id: string) => void;
  onZoomToFit: () => void;
  onCopyEmail: () => void;
  onOpenResume: () => void;
};

/** Subsequence fuzzy match — every query character must appear in order in
 * the target; lower score is a tighter, earlier match. Null means no
 * match. No dependency needed for something this small. */
function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  let searchFrom = 0;
  let firstIndex = -1;
  let lastIndex = -1;
  for (const ch of q) {
    const idx = t.indexOf(ch, searchFrom);
    if (idx === -1) return null;
    if (firstIndex === -1) firstIndex = idx;
    lastIndex = idx;
    searchFrom = idx + 1;
  }
  return lastIndex - firstIndex + firstIndex * 0.5;
}

function ItemIcon({ item }: { item: PaletteItem }) {
  const className = "text-off-white/60 h-3.5 w-3.5 shrink-0";
  if (item.kind === "navigate") {
    return item.icon === "group" ? (
      <GroupIcon className={className} />
    ) : (
      <FrameLayerIcon className={className} />
    );
  }
  if (item.id === "copy-email") return <MailIcon className={className} />;
  if (item.id === "open-resume")
    return <ExternalLinkIcon className={className} />;
  return <FitIcon className={className} />;
}

export function CommandPalette({
  onClose,
  navigateItems,
  onNavigate,
  onZoomToFit,
  onCopyEmail,
  onOpenResume,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actionItems: PaletteItem[] = useMemo(
    () => [
      {
        kind: "action",
        id: "zoom-fit",
        label: "Zoom to fit",
        run: onZoomToFit,
      },
      {
        kind: "action",
        id: "copy-email",
        label: "Copy email",
        run: onCopyEmail,
      },
      {
        kind: "action",
        id: "open-resume",
        label: "Open résumé",
        run: onOpenResume,
      },
    ],
    [onZoomToFit, onCopyEmail, onOpenResume],
  );

  const allItems: PaletteItem[] = useMemo(
    () => [
      ...navigateItems.map((n): PaletteItem => ({ kind: "navigate", ...n })),
      ...actionItems,
    ],
    [navigateItems, actionItems],
  );

  const results = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 8);
    return allItems
      .map((item) => ({ item, score: fuzzyScore(query, item.label) }))
      .filter(
        (scored): scored is { item: PaletteItem; score: number } =>
          scored.score !== null,
      )
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map((scored) => scored.item);
  }, [query, allItems]);

  // Mounted only while open (see CanvasWorkspace), so a fresh query/
  // activeIndex on every open falls out of useState's initial value —
  // no reset effect needed. Focusing the input is the one real effect.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const activate = (item: PaletteItem) => {
    if (item.kind === "navigate") onNavigate(item.id);
    else item.run();
    onClose();
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = results[activeIndex];
        if (item) activate(item);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, activeIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="bg-panel border-off-white/10 relative h-fit w-full max-w-[32rem] overflow-hidden rounded-lg border shadow-2xl"
      >
        <div className="border-off-white/10 flex items-center gap-2 border-b px-3 py-2.5">
          <SearchIcon className="text-off-white/40 h-4 w-4 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Jump to a frame, project, or action…"
            className="text-off-white placeholder:text-off-white/50 w-full bg-transparent text-[13px] outline-none"
          />
          <kbd className="text-off-white/60 border-off-white/15 shrink-0 rounded border px-1.5 py-0.5 text-[10px]">
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 && (
            <div className="text-off-white/60 px-3 py-4 text-center text-[12px]">
              No results
            </div>
          )}
          {results.map((item, i) => (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              onClick={() => activate(item)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] ${
                i === activeIndex
                  ? "bg-selection/20 text-off-white"
                  : "text-off-white/75"
              }`}
            >
              <ItemIcon item={item} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
