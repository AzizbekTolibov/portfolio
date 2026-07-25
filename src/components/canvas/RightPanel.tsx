"use client";

import type { CanvasNode } from "@/content/canvas";
import type { Project } from "@/content/types";
import { InspectorContent } from "./InspectorContent";

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

type RightPanelProps = {
  selectedNode: SpatialNode | null;
  project: Project | undefined;
};

/** Desktop's fixed side panel — the inspector content itself lives in
 * InspectorContent, shared with the mobile drawer. */
export function RightPanel({ selectedNode, project }: RightPanelProps) {
  return (
    <div className="bg-panel border-off-white/10 flex w-60 shrink-0 flex-col border-l">
      <InspectorContent selectedNode={selectedNode} project={project} />
    </div>
  );
}
