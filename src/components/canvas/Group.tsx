import type { CanvasNode } from "@/content/canvas";
import { labelTransform } from "@/lib/canvas/label-transform";

/** How far above the group's top edge its label sits (screen px, capped
 * — see label-transform.ts). Bigger than a frame's -16px: a group's own
 * top-left often coincides exactly with its first child frame's top-left
 * (e.g. "About" and "Portrait", or a project cluster and its Cover), so
 * this has to clear both the frame label's own offset AND its rendered
 * height before the two can ever be mistaken for one label. */
const GROUP_LABEL_OFFSET = -40;

type GroupProps = {
  node: Extract<CanvasNode, { type: "group" }>;
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
export function Group({ node, selected, hovered, onHoverChange }: GroupProps) {
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
            transform: labelTransform(GROUP_LABEL_OFFSET),
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
