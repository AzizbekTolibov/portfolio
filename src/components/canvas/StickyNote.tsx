import type { CanvasNode } from "@/content/canvas";
import type { LodBand } from "@/lib/canvas/types";

type StickyNoteProps = {
  node: Extract<CanvasNode, { type: "sticky" }>;
  lodBand: LodBand;
};

/** A handwritten-feel working note — decorative, not a navigation target
 * (no data-frame-id, not in the layer tree), but still LOD-gated like
 * everything else on the canvas. */
export function StickyNote({ node, lodBand }: StickyNoteProps) {
  return (
    <div
      className="absolute rounded-sm shadow-md"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: "#FFD966",
      }}
    >
      {lodBand !== "flat" && (
        <span className="font-hand block h-full w-full -rotate-2 p-4 text-[22px] leading-snug text-[#4A3F1A]">
          {node.content.text}
        </span>
      )}
    </div>
  );
}
