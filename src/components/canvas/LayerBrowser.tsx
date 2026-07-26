"use client";

import { useMemo, useRef, useState } from "react";
import type { LayerTreeNode } from "@/lib/canvas/tree";
import { ChevronRightIcon, FrameLayerIcon, GroupIcon } from "./icons";

type FlatRow = {
  entry: LayerTreeNode;
  depth: number;
  parentId: string | null;
};

function flatten(
  nodes: LayerTreeNode[],
  depth: number,
  parentId: string | null,
  expanded: Set<string>,
  out: FlatRow[],
) {
  for (const entry of nodes) {
    out.push({ entry, depth, parentId });
    if (entry.children.length > 0 && expanded.has(entry.node.id)) {
      flatten(entry.children, depth + 1, entry.node.id, expanded, out);
    }
  }
}

function RowIcon({ type }: { type: "frame" | "group" }) {
  const className = "h-3.5 w-3.5 shrink-0";
  return type === "group" ? (
    <GroupIcon className={className} />
  ) : (
    <FrameLayerIcon className={className} />
  );
}

export function FileTab({
  layerTree,
  selectedId,
  hoveredId,
  onSelectFrame,
  onHoverFrame,
  dense = true,
}: {
  layerTree: LayerTreeNode[];
  selectedId: string | null;
  /** Set when the *canvas* frame is hovered (not this row) — highlights
   * the matching row so hover reads both ways. */
  hoveredId?: string | null;
  onSelectFrame: (frameId: string) => void;
  onHoverFrame: (frameId: string | null) => void;
  /** Desktop (mouse) rows are compact; mobile (touch) rows need a taller
   * hit target. */
  dense?: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const rows = useMemo(() => {
    const out: FlatRow[] = [];
    flatten(layerTree, 0, null, expanded, out);
    return out;
  }, [layerTree, expanded]);

  const [focusedId, setFocusedId] = useState<string>(
    rows[0]?.entry.node.id ?? "",
  );
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(rows.length - 1, index));
    const id = rows[clamped]?.entry.node.id;
    if (id) {
      setFocusedId(id);
      rowRefs.current.get(id)?.focus();
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activate = (row: FlatRow) => {
    if (row.entry.node.type === "frame") {
      onSelectFrame(row.entry.node.id);
    } else {
      toggleExpand(row.entry.node.id);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    row: FlatRow,
    index: number,
  ) => {
    const hasChildren = row.entry.children.length > 0;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusIndex(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusIndex(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (hasChildren) {
        if (!expanded.has(row.entry.node.id)) toggleExpand(row.entry.node.id);
        else focusIndex(index + 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (hasChildren && expanded.has(row.entry.node.id)) {
        toggleExpand(row.entry.node.id);
      } else if (row.parentId) {
        const parentIndex = rows.findIndex(
          (r) => r.entry.node.id === row.parentId,
        );
        if (parentIndex >= 0) focusIndex(parentIndex);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(row);
    }
  };

  return (
    <div
      role="tree"
      aria-label="Canvas layers"
      className="min-h-0 flex-1 overflow-y-auto py-1"
    >
      {rows.map((row, index) => {
        const { node, children } = row.entry;
        const isFrameSelected = node.type === "frame" && node.id === selectedId;
        const isGroupSelected = node.type === "group" && node.id === selectedId;
        const isHovered = hoveredId === node.id;
        const hasChildren = children.length > 0;
        const isExpanded = hasChildren && expanded.has(node.id);
        return (
          <button
            key={node.id}
            ref={(el) => {
              if (el) rowRefs.current.set(node.id, el);
              else rowRefs.current.delete(node.id);
            }}
            type="button"
            role="treeitem"
            aria-selected={isFrameSelected || isGroupSelected}
            aria-expanded={hasChildren ? isExpanded : undefined}
            tabIndex={focusedId === node.id ? 0 : -1}
            onFocus={() => setFocusedId(node.id)}
            onKeyDown={(e) => handleKeyDown(e, row, index)}
            onClick={() => activate(row)}
            onMouseEnter={() => onHoverFrame(node.id)}
            onMouseLeave={() => onHoverFrame(null)}
            style={{ paddingLeft: 8 + row.depth * 14 }}
            className={`flex ${dense ? "h-[26px]" : "h-[38px]"} w-full items-center gap-1.5 pr-2 text-left font-sans text-[11px] outline-none ${
              isFrameSelected || isGroupSelected
                ? "bg-selection/15 text-selection"
                : isHovered
                  ? "bg-white/5 text-off-white/90"
                  : "text-off-white/75 hover:bg-white/5 focus-visible:bg-white/5"
            }`}
          >
            {hasChildren ? (
              <ChevronRightIcon
                className={`h-3 w-3 shrink-0 opacity-60 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            ) : (
              <span className="w-3 shrink-0" />
            )}
            <RowIcon type={node.type} />
            <span className="truncate">{node.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function AssetsTab() {
  return (
    <div className="text-off-white/60 flex flex-1 items-center justify-center px-6 text-center text-[11px]">
      No published assets yet.
    </div>
  );
}

/** The layer panel's guts — tabs plus the File/Assets content — with no
 * opinion about its own shell. The desktop LeftPanel wraps this in a fixed
 * side panel; the mobile LayersSheet wraps the exact same component in a
 * bottom sheet, so the tree (and its keyboard behavior) can't drift
 * between the two. */
export function LayerBrowser({
  layerTree,
  selectedId,
  hoveredId,
  onSelectFrame,
  onHoverFrame,
  dense = true,
  headerExtra,
}: {
  layerTree: LayerTreeNode[];
  selectedId: string | null;
  hoveredId?: string | null;
  onSelectFrame: (frameId: string) => void;
  onHoverFrame: (frameId: string | null) => void;
  dense?: boolean;
  /** Rendered at the end of the tab row — the desktop shell's
   * collapse button. */
  headerExtra?: React.ReactNode;
}) {
  const [tab, setTab] = useState<"file" | "assets">("file");

  return (
    <>
      <div className="border-off-white/10 flex items-center border-b">
        <div
          role="tablist"
          aria-label="Left panel tabs"
          className="flex flex-1"
        >
          {(["file", "assets"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`${dense ? "h-8" : "h-11"} flex-1 px-3 text-[11px] font-medium capitalize ${
                tab === t
                  ? "text-off-white border-off-white/80 border-b-2"
                  : "text-off-white/60 hover:text-off-white/80 border-b-2 border-transparent"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {headerExtra}
      </div>
      {tab === "file" ? (
        <FileTab
          layerTree={layerTree}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelectFrame={onSelectFrame}
          onHoverFrame={onHoverFrame}
          dense={dense}
        />
      ) : (
        <AssetsTab />
      )}
    </>
  );
}
