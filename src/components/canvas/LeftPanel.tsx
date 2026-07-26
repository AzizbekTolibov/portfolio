"use client";

import type { PageId, PageMeta } from "@/content/canvas";
import type { LayerTreeNode } from "@/lib/canvas/tree";
import { ChevronRightIcon } from "./icons";
import { LayerBrowser } from "./LayerBrowser";
import { PagesPanel } from "./PagesPanel";

type LeftPanelProps = {
  pages: PageMeta[];
  currentPageId: PageId;
  onSelectPage: (id: PageId) => void;
  layerTree: LayerTreeNode[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedId: string | null;
  hoveredId: string | null;
  onSelectFrame: (frameId: string) => void;
  onHoverFrame: (frameId: string | null) => void;
};

/** Desktop's fixed side panel — Figma's Pages list at the top, the layer
 * tree (LayerBrowser, shared with the mobile bottom sheet) below it. */
export function LeftPanel({
  pages,
  currentPageId,
  onSelectPage,
  layerTree,
  collapsed,
  onToggleCollapse,
  selectedId,
  hoveredId,
  onSelectFrame,
  onHoverFrame,
}: LeftPanelProps) {
  if (collapsed) {
    return (
      <div className="bg-panel border-off-white/10 flex w-3 shrink-0 items-start border-r">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand layers panel"
          className="text-off-white/40 hover:text-off-white/80 flex h-6 w-3 items-center justify-center"
        >
          <ChevronRightIcon className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-panel border-off-white/10 flex w-60 shrink-0 flex-col border-r">
      <PagesPanel
        pages={pages}
        currentPageId={currentPageId}
        onSelectPage={onSelectPage}
      />
      <LayerBrowser
        layerTree={layerTree}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelectFrame={onSelectFrame}
        onHoverFrame={onHoverFrame}
        headerExtra={
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse layers panel"
            className="text-off-white/40 hover:text-off-white/80 mr-1 flex h-6 w-6 shrink-0 items-center justify-center"
          >
            <ChevronRightIcon className="h-3 w-3 rotate-180" />
          </button>
        }
      />
    </div>
  );
}
