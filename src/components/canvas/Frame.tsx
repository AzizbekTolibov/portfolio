import { motion, useMotionValue, type MotionValue } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
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
  /** /edit only. The shared drag-offset transform (see use-canvas-engine's
   * dragOffsetX/Y) when this frame is one of the nodes currently being
   * dragged; a plain 0 otherwise, so every other frame's motion.div stays
   * inert. */
  dragOffsetX?: MotionValue<number> | number;
  dragOffsetY?: MotionValue<number> | number;
  /** Renders the 8 resize handles and wires them to onCommitResize — only
   * when selected, in edit mode (RightPanel/EditInspector shows w/h
   * read-only and suppresses handles for groups; Frame is frames only, so
   * no further gating is needed here beyond selected + editMode). */
  editMode?: boolean;
  scale?: MotionValue<number>;
  onCommitResize?: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
};

const CORNER_CLASSES = [
  "-top-0.75 -left-0.75",
  "-top-0.75 -right-0.75",
  "-bottom-0.75 -left-0.75",
  "-bottom-0.75 -right-0.75",
];

const TEXT_VARIANT_CLASSES: Record<string, string> = {
  // flex + items-end: `text-display`'s clamp() can render as one line or
  // wrap to two depending on the title's length (verified: 128px vs
  // 256px at this box's width), and its own box is sized for the
  // worst case — bottom-aligning means a short single-line title still
  // sits flush against whatever follows it (Year), with the slack
  // collapsing above the text instead of appearing as a gap below it.
  display: "text-display font-display text-gray-900 flex items-end",
  heading: "text-h2 font-display text-gray-900",
  body: "text-body text-gray-700 whitespace-pre-line",
  caption:
    "text-mono-caption text-gray-600 font-mono tracking-[0.08em] uppercase",
};

/** Font sizes for the flat-LOD in-block label, by frame kind — Cover's
 * name+role reads as the largest, most prominent text on the whole
 * canvas; a project's own title is next; About/Contact's short labels
 * are smaller supporting text. */
const FLAT_LABEL_SIZE: Partial<
  Record<string, { primary: number; sub: number }>
> = {
  "site-cover": { primary: 96, sub: 34 },
  "project-cover": { primary: 72, sub: 28 },
  "project-overview": { primary: 72, sub: 28 },
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
            style={{
              fontSize: size.primary,
              color: textColor,
              // This is the largest text on the canvas but doesn't use
              // the `text-display` utility (it needs its own per-kind
              // pixel size, not the clamp() scale) — so it wouldn't
              // otherwise inherit the tuned tracking/weight that utility
              // carries. Reference the same tokens directly instead of
              // duplicating their values.
              letterSpacing: "var(--text-display--letter-spacing)",
              fontWeight: "var(--text-display--font-weight)",
            }}
          >
            <PlaceholderText text={flatLabel} />
          </span>
          {flatSublabel && (
            <span
              className="font-sans leading-tight opacity-80"
              style={{ fontSize: size.sub, color: textColor }}
            >
              <PlaceholderText text={flatSublabel} />
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

// ---- Resize handles (/edit only, leaf frames only — see the addendum in
// claude-code-prompt-phase2.md: a group's bounds stay derived from its
// children, so only frames ever get resize handles). ----

type ResizeHandlePos = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const RESIZE_HANDLES: ResizeHandlePos[] = [
  "nw",
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
];
const HANDLE_SIZE = 7;
const MIN_SIZE = 20;

const HANDLE_STYLE: Record<ResizeHandlePos, React.CSSProperties> = {
  nw: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: "nwse-resize" },
  n: {
    top: -HANDLE_SIZE / 2,
    left: "50%",
    marginLeft: -HANDLE_SIZE / 2,
    cursor: "ns-resize",
  },
  ne: {
    top: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
    cursor: "nesw-resize",
  },
  e: {
    top: "50%",
    right: -HANDLE_SIZE / 2,
    marginTop: -HANDLE_SIZE / 2,
    cursor: "ew-resize",
  },
  se: {
    bottom: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
    cursor: "nwse-resize",
  },
  s: {
    bottom: -HANDLE_SIZE / 2,
    left: "50%",
    marginLeft: -HANDLE_SIZE / 2,
    cursor: "ns-resize",
  },
  sw: {
    bottom: -HANDLE_SIZE / 2,
    left: -HANDLE_SIZE / 2,
    cursor: "nesw-resize",
  },
  w: {
    top: "50%",
    left: -HANDLE_SIZE / 2,
    marginTop: -HANDLE_SIZE / 2,
    cursor: "ew-resize",
  },
};
// The corner/edge that stays visually fixed while this handle drags —
// doubles as the handle's transform-origin (so scaleX/scaleY grows the
// box from the right anchor, live, with no translate needed — see below)
// and as the rule for which edge's commit needs a new x/y, not just a
// new width/height.
const RESIZE_ORIGIN: Record<ResizeHandlePos, string> = {
  nw: "100% 100%",
  n: "50% 100%",
  ne: "0% 100%",
  e: "0% 50%",
  se: "0% 0%",
  s: "50% 0%",
  sw: "100% 0%",
  w: "100% 50%",
};
const AFFECTS_WIDTH: Record<ResizeHandlePos, boolean> = {
  nw: true,
  n: false,
  ne: true,
  e: true,
  se: true,
  s: false,
  sw: true,
  w: true,
};
const AFFECTS_HEIGHT: Record<ResizeHandlePos, boolean> = {
  nw: true,
  n: true,
  ne: true,
  e: false,
  se: true,
  s: true,
  sw: true,
  w: false,
};
// Sign of the on-screen delta that GROWS this handle's dimension(s) —
// e.g. dragging the "w" handle left (negative dx) grows width, so its
// sign is -1.
const WIDTH_SIGN: Record<ResizeHandlePos, number> = {
  nw: -1,
  n: 0,
  ne: 1,
  e: 1,
  se: 1,
  s: 0,
  sw: -1,
  w: -1,
};
const HEIGHT_SIGN: Record<ResizeHandlePos, number> = {
  nw: -1,
  n: -1,
  ne: -1,
  e: 0,
  se: 1,
  s: 1,
  sw: 1,
  w: 0,
};
const AFFECTS_LEFT: Record<ResizeHandlePos, boolean> = {
  nw: true,
  n: false,
  ne: false,
  e: false,
  se: false,
  s: false,
  sw: true,
  w: true,
};
const AFFECTS_TOP: Record<ResizeHandlePos, boolean> = {
  nw: true,
  n: true,
  ne: true,
  e: false,
  se: false,
  s: false,
  sw: false,
  w: false,
};

function ResizeHandles({
  node,
  scale,
  onCommitResize,
}: {
  node: FrameProps["node"];
  scale: MotionValue<number>;
  onCommitResize: NonNullable<FrameProps["onCommitResize"]>;
}) {
  const resizeScaleX = useMotionValue(1);
  const resizeScaleY = useMotionValue(1);
  const originRef = useRef<string>("center");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<{
    pos: ResizeHandlePos;
    startClientX: number;
    startClientY: number;
    startRect: { x: number; y: number; width: number; height: number };
  } | null>(null);

  function computeSize(
    pos: ResizeHandlePos,
    startRect: { x: number; y: number; width: number; height: number },
    dxCanvas: number,
    dyCanvas: number,
    shiftKey: boolean,
  ) {
    let width = AFFECTS_WIDTH[pos]
      ? startRect.width + WIDTH_SIGN[pos] * dxCanvas
      : startRect.width;
    let height = AFFECTS_HEIGHT[pos]
      ? startRect.height + HEIGHT_SIGN[pos] * dyCanvas
      : startRect.height;
    if (shiftKey && AFFECTS_WIDTH[pos] && AFFECTS_HEIGHT[pos]) {
      const widthRatio = width / startRect.width;
      const heightRatio = height / startRect.height;
      const ratio =
        Math.abs(widthRatio - 1) > Math.abs(heightRatio - 1)
          ? widthRatio
          : heightRatio;
      width = startRect.width * ratio;
      height = startRect.height * ratio;
    }
    width = Math.max(MIN_SIZE, width);
    height = Math.max(MIN_SIZE, height);
    return { width, height };
  }

  function onHandlePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    pos: ResizeHandlePos,
  ) {
    e.stopPropagation();
    e.preventDefault();
    // Best-effort — pointer capture can throw (e.g. no real active pointer
    // behind this id) without meaning the gesture itself is invalid, and a
    // throw here must never prevent the pointermove/pointerup listeners
    // below from being registered, or the whole resize silently breaks.
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // Not fatal — window-level listeners below still track the drag.
    }
    activeRef.current = {
      pos,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
      },
    };
    originRef.current = RESIZE_ORIGIN[pos];
    if (wrapperRef.current) {
      wrapperRef.current.style.transformOrigin = originRef.current;
    }

    function onMove(ev: PointerEvent) {
      const active = activeRef.current;
      if (!active) return;
      const s = scale.get();
      const dxCanvas = (ev.clientX - active.startClientX) / s;
      const dyCanvas = (ev.clientY - active.startClientY) / s;
      const { width, height } = computeSize(
        active.pos,
        active.startRect,
        dxCanvas,
        dyCanvas,
        ev.shiftKey,
      );
      resizeScaleX.set(width / active.startRect.width);
      resizeScaleY.set(height / active.startRect.height);
    }

    function onUp(ev: PointerEvent) {
      const active = activeRef.current;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (!active) return;
      const s = scale.get();
      const dxCanvas = (ev.clientX - active.startClientX) / s;
      const dyCanvas = (ev.clientY - active.startClientY) / s;
      const { width, height } = computeSize(
        active.pos,
        active.startRect,
        dxCanvas,
        dyCanvas,
        ev.shiftKey,
      );
      const x = AFFECTS_LEFT[active.pos]
        ? active.startRect.x + active.startRect.width - width
        : active.startRect.x;
      const y = AFFECTS_TOP[active.pos]
        ? active.startRect.y + active.startRect.height - height
        : active.startRect.y;
      resizeScaleX.set(1);
      resizeScaleY.set(1);
      activeRef.current = null;
      onCommitResize(node.id, x, y, width, height);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <motion.div
      ref={wrapperRef}
      className="absolute inset-0"
      style={{ scaleX: resizeScaleX, scaleY: resizeScaleY }}
    >
      {RESIZE_HANDLES.map((pos) => (
        <div
          key={pos}
          data-resize-handle="true"
          onPointerDown={(e) => onHandlePointerDown(e, pos)}
          className="border-selection bg-off-white absolute rounded-[1px] border"
          style={{
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            ...HANDLE_STYLE[pos],
            transform: "scale(calc(1 / var(--canvas-scale, 1)))",
          }}
        />
      ))}
    </motion.div>
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
  dragOffsetX = 0,
  dragOffsetY = 0,
  editMode = false,
  scale,
  onCommitResize,
}: FrameProps) {
  // Home's project tiles are page-links — hover is the only affordance
  // signalling they navigate, so they get an extra lift + cover-image
  // scale on top of every frame's ordinary hover outline. `selected` here
  // never comes from a real click (a page-link click navigates away
  // before selection ever sticks) — it only ever comes from Tab-focusing
  // the tile's semantic-layer link (see CanvasWorkspace's
  // handleFocusFrame), which makes `hovered || selected` exactly
  // "pointer hover OR keyboard :focus-visible" for this one kind, with no
  // second hover state to keep in sync.
  const isProjectTile = node.content?.kind === "project-cover";
  const tileActive = isProjectTile && (hovered || selected);

  return (
    <motion.div
      data-frame-id={node.id}
      className="absolute"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        x: dragOffsetX,
        y: dragOffsetY,
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
        className={`bg-off-white relative h-full w-full overflow-hidden transition-transform duration-150 ease-out motion-reduce:transition-none ${
          selected
            ? "outline-selection outline-2 outline-offset-2"
            : hovered
              ? "outline-selection/50 outline-1 outline-offset-2"
              : ""
        }`}
        style={{ transform: tileActive ? "translateY(-4px)" : undefined }}
      >
        <div
          className="h-full w-full transition-transform duration-150 ease-out motion-reduce:transition-none"
          style={{ transform: tileActive ? "scale(1.03)" : undefined }}
        >
          <FrameChildren
            frame={node}
            childNodes={childNodes}
            lodBand={lodBand}
          />
        </div>

        {selected &&
          CORNER_CLASSES.map((positionClasses) => (
            <div
              key={positionClasses}
              className={`border-selection bg-off-white absolute h-1.5 w-1.5 border ${positionClasses}`}
              style={{ transform: "scale(calc(1 / var(--canvas-scale, 1)))" }}
            />
          ))}
      </div>
      {editMode && selected && scale && onCommitResize && (
        <ResizeHandles
          node={node}
          scale={scale}
          onCommitResize={onCommitResize}
        />
      )}
    </motion.div>
  );
}
