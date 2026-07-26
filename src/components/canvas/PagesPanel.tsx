"use client";

import { useState } from "react";
import type { PageId, PageMeta } from "@/content/canvas";
import { ChevronRightIcon, PageIcon } from "./icons";

type PagesPanelProps = {
  pages: PageMeta[];
  currentPageId: PageId;
  onSelectPage: (id: PageId) => void;
  /** Taller rows for touch (mobile sheet) vs mouse (desktop panel). */
  dense?: boolean;
};

/** Figma's Pages section, at the very top of the left panel, above the
 * layer tree: a collapsible list, Home first, then one row per project.
 * Selecting a page swaps the entire canvas — the layer tree below always
 * shows only the current page's own frames (see CanvasWorkspace, which
 * regenerates spatialNodes/layerTree from getPageNodes(currentPageId)). */
export function PagesPanel({
  pages,
  currentPageId,
  onSelectPage,
  dense = true,
}: PagesPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-off-white/10 border-b">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={`text-off-white/60 hover:text-off-white/80 flex w-full items-center gap-1.5 px-2 text-[11px] font-medium tracking-wide uppercase ${
          dense ? "h-7" : "h-9"
        }`}
      >
        <ChevronRightIcon
          className={`h-3 w-3 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        Pages
      </button>
      {expanded && (
        <div role="list" aria-label="Pages" className="pb-1">
          {pages.map((page) => {
            const isCurrent = page.id === currentPageId;
            return (
              <button
                key={page.id}
                type="button"
                role="listitem"
                aria-current={isCurrent}
                onClick={() => onSelectPage(page.id)}
                style={{ paddingLeft: 22 }}
                className={`flex w-full items-center gap-1.5 pr-2 text-left font-sans text-[11px] outline-none ${
                  dense ? "h-[26px]" : "h-[38px]"
                } ${
                  isCurrent
                    ? "bg-selection/15 text-selection"
                    : "text-off-white/75 hover:bg-white/5"
                }`}
              >
                <PageIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{page.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
