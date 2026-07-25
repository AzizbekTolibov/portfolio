"use client";

import { useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { CanvasNode } from "@/content/canvas";
import type { Project } from "@/content/types";
import { ChevronRightIcon } from "./icons";
import { InspectorContent } from "./InspectorContent";

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

type MobileInspectorDrawerProps = {
  selectedNode: SpatialNode;
  project: Project | undefined;
};

/** Mobile's replacement for the right panel — a collapsible drawer that
 * sits above the bottom bar, under whatever frame is selected, rather
 * than a fixed side panel there's no room for. The caller keys this by
 * selectedNode.id, so a fresh selection remounts it collapsed instead of
 * silently staying open over content the visitor hasn't asked to inspect. */
export function MobileInspectorDrawer({
  selectedNode,
  project,
}: MobileInspectorDrawerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-panel border-off-white/10 absolute right-0 bottom-0 left-0 flex flex-col overflow-hidden border-t shadow-2xl ${
        shouldReduceMotion ? "" : "transition-[height] duration-200 ease-out"
      }`}
      style={{ height: expanded ? "min(60vh, 420px)" : 44 }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex h-11 shrink-0 items-center justify-between gap-2 px-4"
      >
        <span className="text-off-white truncate text-[12px] font-medium">
          {selectedNode.name}
        </span>
        <ChevronRightIcon
          className={`text-off-white/60 h-3.5 w-3.5 shrink-0 transition-transform ${
            expanded ? "-rotate-90" : "rotate-90"
          }`}
        />
      </button>
      <InspectorContent selectedNode={selectedNode} project={project} />
    </div>
  );
}
