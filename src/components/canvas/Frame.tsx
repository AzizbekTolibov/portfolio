import Image from "next/image";
import type { CanvasNode } from "@/content/canvas";
import { blurDataUrl } from "@/lib/canvas/blur";
import { readableTextColor } from "@/lib/canvas/color";
import { labelTransform } from "@/lib/canvas/label-transform";
import { PlaceholderText } from "@/lib/canvas/placeholder-text";
import type { LodBand } from "@/lib/canvas/types";

/** How far above the frame's top edge the label sits (screen px, capped
 * — see label-transform.ts). Smaller than a group's, so the two never
 * collide when a group and its first child frame share an origin. */
const FRAME_LABEL_OFFSET = -16;

type FrameProps = {
  node: Extract<CanvasNode, { type: "frame" }>;
  childNodes: CanvasNode[];
  lodBand: LodBand;
  /** False below ~40% zoom (see Canvas.tsx) — individual frame labels
   * declutter out of OVERVIEW, leaving only group/project labels. */
  showLabel: boolean;
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

/** Font sizes for the flat-LOD in-block label, by frame kind — Cover's
 * name+role reads as the largest, most prominent text on the whole
 * canvas; a project's own title is next; About/Contact's short labels
 * are smaller supporting text. */
const FLAT_LABEL_SIZE: Partial<Record<string, { primary: number; sub: number }>> = {
  "site-cover": { primary: 96, sub: 34 },
  "project-cover": { primary: 72, sub: 28 },
};
const FLAT_LABEL_SIZE_DEFAULT = { primary: 40, sub: 22 };

function FlatFrame({ frame }: { frame: FrameProps["node"] }) {
  const { accentColor, flatLabel, flatSublabel, kind } = frame.content ?? {};
  if (!accentColor) return null;
  const textColor = readableTextColor(accentColor);
  const size = (kind && FLAT_LABEL_SIZE[kind]) || FLAT_LABEL_SIZE_DEFAULT;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden px-6"
      style={{ backgroundColor: accentColor }}
    >
      {flatLabel && (
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className="font-display leading-tight"
            style={{ fontSize: size.primary, color: textColor }}
          >
            {flatLabel}
          </span>
          {flatSublabel && (
            <span
              className="font-sans leading-tight opacity-80"
              style={{ fontSize: size.sub, color: textColor }}
            >
              {flatSublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function FrameChildren({
  frame,
  childNodes,
  lodBand,
}: {
  frame: FrameProps["node"];
  childNodes: CanvasNode[];
  lodBand: LodBand;
}) {
  if (lodBand === "flat") {
    return <FlatFrame frame={frame} />;
  }

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
            // Tailwind preflight's `img { max-width: 100%; height: auto }`
            // otherwise overrides these to the placeholder SVG's own
            // intrinsic aspect ratio, stretching it to fill (and overlap)
            // whatever sits below it in the frame.
            width: image.width,
            height: image.height,
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
                width: child.width,
                height: child.height,
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
              <PlaceholderText text={child.content.text} />
            </p>
          );
        }
        if (child.type === "property-groups") {
          return (
            <div
              key={child.id}
              className="absolute flex flex-col gap-4 overflow-hidden"
              style={{
                left: child.x - frame.x,
                top: child.y - frame.y,
                width: child.width,
                height: child.height,
              }}
            >
              {child.content.sections.map((section) => (
                <div key={section.heading}>
                  <div className="text-mono-caption mb-1.5 font-mono tracking-[0.08em] text-gray-500 uppercase">
                    {section.heading}
                  </div>
                  <div className="flex flex-col gap-1">
                    {section.groups.map((group) => (
                      <div key={group.label} className="flex gap-4 py-0.5">
                        <span className="w-[140px] shrink-0 font-mono text-[11px] text-gray-500">
                          {group.label}
                        </span>
                        <span className="font-mono text-[11px] text-gray-800">
                          <PlaceholderText text={group.items.join(" · ")} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
  showLabel,
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
      {showLabel && (
        <div className="pointer-events-none absolute bottom-full left-0 whitespace-nowrap">
          <span
            className={`inline-block font-mono text-[11px] ${selected ? "text-selection" : "text-off-white/50"}`}
            style={{
              transform: labelTransform(FRAME_LABEL_OFFSET),
              transformOrigin: "bottom left",
            }}
          >
            {node.name}
          </span>
        </div>
      )}
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
