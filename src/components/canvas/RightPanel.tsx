"use client";

import type { CanvasNode } from "@/content/canvas";
import type { Project } from "@/content/types";
import { EditInspector } from "./EditInspector";
import { InspectorContent } from "./InspectorContent";

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

type RightPanelProps = {
  selectedNode: SpatialNode | null;
  project: Project | undefined;
  /** /edit swaps the normal file/project inspector for the read-only
   * position inspector — see EditInspector. */
  editMode?: boolean;
};

/** Desktop's fixed side panel — the inspector content itself lives in
 * InspectorContent (or, in edit mode, EditInspector), shared with the
 * mobile drawer. */
export function RightPanel({
  selectedNode,
  project,
  editMode = false,
}: RightPanelProps) {
  return (
    <div className="bg-panel border-off-white/10 flex w-60 shrink-0 flex-col border-l">
      {editMode ? (
        <EditInspector selectedNode={selectedNode} />
      ) : (
        <InspectorContent selectedNode={selectedNode} project={project} />
      )}
    </div>
  );
}
