import type { CanvasNode } from "@/content/canvas";

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

function PositionField({ label, value }: { label: string; value: number }) {
  return (
    <label className="flex items-center justify-between gap-3 px-4 py-1.5">
      <span className="text-off-white/50 text-[11px]">{label}</span>
      <input
        type="number"
        value={value}
        readOnly
        // Phase 2 wires these up to commit on Enter/blur and to drive the
        // same values from drag/resize — this phase is read-only, so
        // there's nothing to commit to yet.
        className="bg-surface border-off-white/10 text-off-white/90 w-20 rounded border px-2 py-1 text-right font-mono text-[11px] focus-visible:outline-none"
      />
    </label>
  );
}

/**
 * The editor's read-only position inspector — swapped in for the normal
 * InspectorContent whenever /edit is open (see RightPanel). Shown for
 * whatever's selected on *any* page, not just Home: unlike InspectorContent
 * (which always shows the project-page info panel on a project page,
 * regardless of selection — see its own comment), a project's Overview and
 * Photo frames need positioning exactly as much as Home's tiles do.
 */
export function EditInspector({
  selectedNode,
}: {
  selectedNode: SpatialNode | null;
}) {
  if (!selectedNode) {
    return (
      <div className="text-off-white/50 flex flex-1 items-center justify-center px-6 text-center text-[11px]">
        Select a frame or group to see its position.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
      <div className="px-4 pt-4 pb-2">
        <div className="text-off-white text-[13px] font-medium">
          {selectedNode.name}
        </div>
        <div className="text-off-white/50 text-[11px]">
          {selectedNode.type === "group" ? "Group" : "Frame"}
        </div>
      </div>
      <div className="bg-off-white/10 mx-4 mb-2 h-px" />
      <PositionField label="X" value={selectedNode.x} />
      <PositionField label="Y" value={selectedNode.y} />
      <PositionField label="W" value={selectedNode.width} />
      <PositionField label="H" value={selectedNode.height} />
    </div>
  );
}
