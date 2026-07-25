import type { CanvasNode } from "@/content/canvas";

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
      <div className="pointer-events-none absolute bottom-full left-0 mb-1.5 whitespace-nowrap">
        <span
          className={`inline-block origin-bottom-left font-mono text-[11px] font-medium ${selected ? "text-selection" : "text-off-white/60"}`}
          style={{ transform: "scale(calc(1 / var(--canvas-scale, 1)))" }}
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
