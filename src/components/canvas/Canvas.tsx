"use client";

import { motion, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { CanvasNode } from "@/content/canvas";
import { computeBoundingBox } from "@/lib/canvas/geometry";
import type { LodBand } from "@/lib/canvas/types";
import { Frame } from "./Frame";
import { Group } from "./Group";
import { StickyNote } from "./StickyNote";

// Decorative, aria-hidden layers with no SEO/first-paint value — split into
// their own chunks, loaded after the canvas itself has painted.
const CommentPin = dynamic(
  () => import("./CommentPin").then((m) => m.CommentPin),
  { ssr: false },
);
const GhostCursors = dynamic(
  () => import("./GhostCursors").then((m) => m.GhostCursors),
  { ssr: false },
);

const GRID_PADDING = 800;
const GRID_SPACING = 24;

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" | "sticky" }>;
type CommentNode = Extract<CanvasNode, { type: "comment" }>;

type CanvasProps = {
  spatialNodes: SpatialNode[];
  childrenByParent: Map<string, CanvasNode[]>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  transform: MotionValue<string>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  visibleFrameIds: Set<string>;
  lodBand: LodBand;
  selectedId: string | null;
  hoveredId: string | null;
  onHoverFrame: (id: string | null) => void;
  commentNodes: CommentNode[];
  commentNumbers: Map<string, number>;
  openThreadId: string | null;
  onToggleThread: (id: string) => void;
  isMobile: boolean;
};

/**
 * The infinite canvas viewport: a full-screen, overflow-hidden container
 * with a single transform layer (translate3d + scale) that every node sits
 * inside as an absolutely-positioned sibling in shared canvas-space
 * coordinates — frame/group/sticky nodes come from the engine (which owns
 * pan/zoom/selection/virtualization/LOD); each frame looks up its own
 * text/image children from childrenByParent to render its content. Comment
 * pins are passed in pre-filtered (zoom threshold, global visibility toggle,
 * parent-frame visibility) so this component just renders what it's given.
 */
export function Canvas({
  spatialNodes,
  childrenByParent,
  containerRef,
  transform,
  x,
  y,
  scale,
  visibleFrameIds,
  lodBand,
  selectedId,
  hoveredId,
  onHoverFrame,
  commentNodes,
  commentNumbers,
  openThreadId,
  onToggleThread,
  isMobile,
}: CanvasProps) {
  const gridBounds = useMemo(() => {
    const box = computeBoundingBox(spatialNodes);
    return {
      left: box.x - GRID_PADDING,
      top: box.y - GRID_PADDING,
      width: box.width + GRID_PADDING * 2,
      height: box.height + GRID_PADDING * 2,
    };
  }, [spatialNodes]);

  const visible = spatialNodes.filter((n) => visibleFrameIds.has(n.id));

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="bg-off-black relative flex-1 touch-none overflow-hidden select-none"
    >
      <motion.div
        className="absolute top-0 left-0"
        style={
          {
            transform,
            transformOrigin: "0 0",
            "--canvas-scale": scale,
          } as unknown as React.CSSProperties
        }
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: gridBounds.left,
            top: gridBounds.top,
            width: gridBounds.width,
            height: gridBounds.height,
            backgroundImage:
              "radial-gradient(circle, rgba(244,242,237,0.12) 1px, transparent 1px)",
            backgroundSize: `${GRID_SPACING}px ${GRID_SPACING}px`,
          }}
        />

        {visible.map((node) => {
          if (node.type === "group") {
            return (
              <Group
                key={node.id}
                node={node}
                selected={selectedId === node.id}
                hovered={hoveredId === node.id}
                onHoverChange={(h) => onHoverFrame(h ? node.id : null)}
              />
            );
          }
          if (node.type === "sticky") {
            return <StickyNote key={node.id} node={node} lodBand={lodBand} />;
          }
          return (
            <Frame
              key={node.id}
              node={node}
              childNodes={childrenByParent.get(node.id) ?? []}
              lodBand={lodBand}
              selected={selectedId === node.id}
              hovered={hoveredId === node.id}
              onHoverChange={(h) => onHoverFrame(h ? node.id : null)}
            />
          );
        })}

        {commentNodes.map((node) => (
          <CommentPin
            key={node.id}
            node={node}
            number={commentNumbers.get(node.id) ?? 0}
            open={openThreadId === node.id}
            onToggle={onToggleThread}
          />
        ))}

        {!isMobile && (
          <GhostCursors
            containerRef={containerRef}
            engineX={x}
            engineY={y}
            engineScale={scale}
          />
        )}
      </motion.div>
    </div>
  );
}
