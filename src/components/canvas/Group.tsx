import type { CanvasNode } from "@/content/canvas";
import { labelTransform } from "@/lib/canvas/label-transform";

/** How far above the group's top edge its label sits (screen px, capped
 * — see label-transform.ts), as a function of labelDepth (see tree.ts's
 * computeGroupLabelDepths). A group's own top-left often coincides
 * exactly with its first child's (e.g. "About" and "Portrait", "Work" and
 * its first tile group), so each nesting level needs its own fixed
 * clearance beyond the level below it, or two labels draw on top of each
 * other. depth 1 (a group of frames — About, Contact, a single tile
 * group) reaches -40, same as before this was depth-aware; depth 2 (a
 * group of groups — "work-group", wrapping the tile grid) reaches -64,
 * clearing a tile group's own -40 reach plus a label's worth of room;
 * depth 3 would reach -88, and so on, so this doesn't need rediscovering
 * the next time something nests a group inside a group inside a group. */
const LABEL_OFFSET_LEAF = -16; // matches Frame.tsx's FRAME_LABEL_OFFSET
const LABEL_OFFSET_STEP = -24;

function labelOffsetForDepth(depth: number): number {
  return LABEL_OFFSET_LEAF + LABEL_OFFSET_STEP * depth;
}

type GroupProps = {
  node: Extract<CanvasNode, { type: "group" }>;
  /** How many nested group levels sit below this one before a leaf frame
   * — see tree.ts's computeGroupLabelDepths. */
  labelDepth: number;
  selected: boolean;
  hovered: boolean;
  onHoverChange: (hovered: boolean) => void;
};

/**
 * A project/about cluster — a Figma "Section": an outlined region with a
 * label, no fill. Its child frames are independent siblings in the same
 * absolutely-positioned canvas space (not DOM children of this element),
 * so they render, virtualize, and select on their own; this is just the
 * bounding chrome around them.
 */
export function Group({
  node,
  labelDepth,
  selected,
  hovered,
  onHoverChange,
}: GroupProps) {
  return (
    <div
      data-frame-id={node.id}
      className="absolute"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className="pointer-events-none absolute bottom-full left-0 whitespace-nowrap">
        <span
          className={`inline-block font-mono text-[11px] font-medium ${selected ? "text-selection" : "text-off-white/60"}`}
          style={{
            transform: labelTransform(labelOffsetForDepth(labelDepth)),
            transformOrigin: "bottom left",
          }}
        >
          {node.name}
        </span>
      </div>
      <div
        className={`h-full w-full rounded border border-dashed ${
          selected
            ? "border-selection"
            : hovered
              ? "border-selection/50"
              : "border-off-white/15"
        }`}
      />
    </div>
  );
}
