import Image from "next/image";
import type { CanvasNode } from "@/content/canvas";
import { blurDataUrl } from "@/lib/canvas/blur";
import type { LodBand } from "@/lib/canvas/types";

type FrameProps = {
  node: Extract<CanvasNode, { type: "frame" }>;
  childNodes: CanvasNode[];
  lodBand: LodBand;
  selected: boolean;
  hovered: boolean;
  onHoverChange: (hovered: boolean) => void;
};

const CORNER_CLASSES = [
  "-top-0.75 -left-0.75",
  "-top-0.75 -right-0.75",
  "-bottom-0.75 -left-0.75",
  "-bottom-0.75 -right-0.75",
];

const TEXT_VARIANT_CLASSES: Record<string, string> = {
  display: "text-display font-display text-gray-900",
  heading: "text-h2 font-display text-gray-900",
  body: "text-body text-gray-700 whitespace-pre-line",
  caption:
    "text-mono-caption text-gray-600 font-mono tracking-[0.08em] uppercase",
};

function FrameChildren({
  frame,
  childNodes,
  lodBand,
}: {
  frame: FrameProps["node"];
  childNodes: CanvasNode[];
  lodBand: LodBand;
}) {
  if (lodBand === "flat") return null;

  const image = childNodes.find((c) => c.type === "image");

  if (lodBand === "thumbnail") {
    if (image && image.type === "image") {
      return (
        <Image
          src={image.content.src}
          alt=""
          unoptimized
          loading="lazy"
          placeholder="blur"
          blurDataURL={blurDataUrl(image.content.blurColor)}
          width={image.width}
          height={image.height}
          className="absolute"
          style={{
            left: image.x - frame.x,
            top: image.y - frame.y,
          }}
        />
      );
    }
    return (
      <span className="text-mono-caption absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono tracking-[0.08em] text-gray-600 uppercase">
        {frame.name}
      </span>
    );
  }

  return (
    <>
      {childNodes.map((child) => {
        if (child.type === "image") {
          return (
            <Image
              key={child.id}
              src={child.content.src}
              alt={child.content.alt}
              unoptimized
              loading="lazy"
              placeholder="blur"
              blurDataURL={blurDataUrl(child.content.blurColor)}
              width={child.width}
              height={child.height}
              className="absolute"
              style={{
                left: child.x - frame.x,
                top: child.y - frame.y,
              }}
            />
          );
        }
        if (child.type === "text") {
          return (
            <p
              key={child.id}
              className={`absolute m-0 ${TEXT_VARIANT_CLASSES[child.content.variant]}`}
              style={{
                left: child.x - frame.x,
                top: child.y - frame.y,
                width: child.width,
                height: child.height,
              }}
            >
              {child.content.text}
            </p>
          );
        }
        return null;
      })}
    </>
  );
}

/**
 * A single frame: absolutely positioned in canvas space, with a Figma-style
 * label above its top-left corner, an off-white "artboard" interior, and
 * its own text/image children (see src/content/canvas.ts) gated by LOD.
 */
export function Frame({
  node,
  childNodes,
  lodBand,
  selected,
  hovered,
  onHoverChange,
}: FrameProps) {
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
          className={`inline-block origin-bottom-left font-mono text-[11px] ${selected ? "text-selection" : "text-off-white/50"}`}
          style={{ transform: "scale(calc(1 / var(--canvas-scale, 1)))" }}
        >
          {node.name}
        </span>
      </div>
      <div
        className={`bg-off-white relative h-full w-full overflow-hidden ${
          selected
            ? "outline-selection outline-2 outline-offset-2"
            : hovered
              ? "outline-selection/50 outline-1 outline-offset-2"
              : ""
        }`}
      >
        <FrameChildren frame={node} childNodes={childNodes} lodBand={lodBand} />

        {selected &&
          CORNER_CLASSES.map((positionClasses) => (
            <div
              key={positionClasses}
              className={`border-selection bg-off-white absolute h-1.5 w-1.5 border ${positionClasses}`}
              style={{ transform: "scale(calc(1 / var(--canvas-scale, 1)))" }}
            />
          ))}
      </div>
    </div>
  );
}
