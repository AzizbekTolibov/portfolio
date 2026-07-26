"use client";

import type { CanvasNode } from "@/content/canvas";
import type { Project } from "@/content/types";
import { EditInspector } from "./EditInspector";
import { InspectorContent } from "./InspectorContent";

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

type FieldPatch = Partial<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

type RightPanelProps = {
  selectedNode: SpatialNode | null;
  project: Project | undefined;
  /** /edit swaps the normal file/project inspector for the read-only
   * position inspector — see EditInspector. */
  editMode?: boolean;
  /** /edit only — commits an edited x/y/w/h field for the selection. */
  onCommitField?: (patch: FieldPatch) => void;
  /** /edit only — non-blocking note, not a constraint (see the spec). */
  overlapWarning?: boolean;
};

/** Desktop's fixed side panel — the inspector content itself lives in
 * InspectorContent (or, in edit mode, EditInspector), shared with the
 * mobile drawer. */
export function RightPanel({
  selectedNode,
  project,
  editMode = false,
  onCommitField,
  overlapWarning = false,
}: RightPanelProps) {
  return (
    <div className="bg-panel border-off-white/10 flex w-60 shrink-0 flex-col border-l">
      {editMode ? (
        <EditInspector
          selectedNode={selectedNode}
          onCommitField={onCommitField}
          overlapWarning={overlapWarning}
        />
      ) : (
        <InspectorContent selectedNode={selectedNode} project={project} />
      )}
    </div>
  );
}
