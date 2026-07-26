import { useEffect, useRef, useState } from "react";
import type { CanvasNode } from "@/content/canvas";

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

type FieldPatch = Partial<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

function PositionField({
  label,
  value,
  disabled = false,
  onCommit,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onCommit?: (value: number) => void;
}) {
  const [text, setText] = useState(String(Math.round(value)));
  const focusedRef = useRef(false);

  // Follows the selection's live value (from a drag, a resize, or another
  // field's commit) — but only while this field isn't the one being
  // typed into, or every keystroke would get clobbered by the next
  // render.
  useEffect(() => {
    if (!focusedRef.current) setText(String(Math.round(value)));
  }, [value]);

  function commit() {
    const parsed = Number(text);
    if (Number.isFinite(parsed) && parsed !== value) {
      onCommit?.(parsed);
    } else {
      setText(String(Math.round(value)));
    }
  }

  return (
    <label className="flex items-center justify-between gap-3 px-4 py-1.5">
      <span className="text-off-white/50 text-[11px]">{label}</span>
      <input
        type="number"
        value={text}
        disabled={disabled}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          focusedRef.current = false;
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setText(String(Math.round(value)));
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="bg-surface border-off-white/10 text-off-white/90 focus-visible:ring-selection w-20 rounded border px-2 py-1 text-right font-mono text-[11px] focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
      />
    </label>
  );
}

/**
 * The editor's position inspector — swapped in for the normal
 * InspectorContent whenever /edit is open (see RightPanel). Shown for
 * whatever's selected on *any* page, not just Home: unlike InspectorContent
 * (which always shows the project-page info panel on a project page,
 * regardless of selection — see its own comment), a project's Overview and
 * Photo frames need positioning exactly as much as Home's tiles do.
 *
 * X/Y are editable for anything; W/H are editable — and resizable via the
 * canvas's own handles — for frames only. A group's bounds stay derived
 * from its children (see the Phase 2 addendum: there's no single correct
 * answer for "resize a container" — scale children proportionally, or
 * resize the box and leave them pinned? — sidestepped entirely by never
 * offering it), so its W/H here are read-only, matching the absence of
 * resize handles on a selected group.
 */
export function EditInspector({
  selectedNode,
  onCommitField,
  overlapWarning = false,
}: {
  selectedNode: SpatialNode | null;
  onCommitField?: (patch: FieldPatch) => void;
  overlapWarning?: boolean;
}) {
  if (!selectedNode) {
    return (
      <div className="text-off-white/50 flex flex-1 items-center justify-center px-6 text-center text-[11px]">
        Select a frame or group to see its position.
      </div>
    );
  }

  const sizeEditable = selectedNode.type === "frame";

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
      <PositionField
        label="X"
        value={selectedNode.x}
        onCommit={(x) => onCommitField?.({ x })}
      />
      <PositionField
        label="Y"
        value={selectedNode.y}
        onCommit={(y) => onCommitField?.({ y })}
      />
      <PositionField
        label="W"
        value={selectedNode.width}
        disabled={!sizeEditable}
        onCommit={(width) => onCommitField?.({ width })}
      />
      <PositionField
        label="H"
        value={selectedNode.height}
        disabled={!sizeEditable}
        onCommit={(height) => onCommitField?.({ height })}
      />
      {overlapWarning && (
        <div className="mx-4 mt-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
          Overlaps another frame on this page — not a problem, just a note.
        </div>
      )}
    </div>
  );
}
