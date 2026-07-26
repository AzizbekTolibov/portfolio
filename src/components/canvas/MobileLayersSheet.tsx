"use client";

import { useEffect } from "react";
import type { PageId, PageMeta } from "@/content/canvas";
import type { LayerTreeNode } from "@/lib/canvas/tree";
import { ChevronRightIcon } from "./icons";
import { LayerBrowser } from "./LayerBrowser";
import { PagesPanel } from "./PagesPanel";

type MobileLayersSheetProps = {
  pages: PageMeta[];
  currentPageId: PageId;
  onSelectPage: (id: PageId) => void;
  layerTree: LayerTreeNode[];
  selectedId: string | null;
  onSelectFrame: (frameId: string) => void;
  onClose: () => void;
};

/** Mobile's replacement for the left panel — the same Pages list +
 * LayerBrowser (tree, tabs, keyboard behavior) as desktop, in a bottom
 * sheet instead of a fixed side panel. */
export function MobileLayersSheet({
  pages,
  currentPageId,
  onSelectPage,
  layerTree,
  selectedId,
  onSelectFrame,
  onClose,
}: MobileLayersSheetProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Layers"
        className="bg-panel border-off-white/10 relative flex max-h-[75vh] flex-col rounded-t-xl border-t shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-off-white text-[13px] font-medium">Layers</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close layers"
            className="text-off-white/60 hover:text-off-white flex h-9 w-9 items-center justify-center"
          >
            <ChevronRightIcon className="h-4 w-4 rotate-90" />
          </button>
        </div>
        <PagesPanel
          pages={pages}
          currentPageId={currentPageId}
          onSelectPage={(id) => {
            onSelectPage(id);
            onClose();
          }}
          dense={false}
        />
        <LayerBrowser
          layerTree={layerTree}
          selectedId={selectedId}
          onSelectFrame={(id) => {
            onSelectFrame(id);
            onClose();
          }}
          onHoverFrame={() => {}}
          dense={false}
        />
      </div>
    </div>
  );
}
