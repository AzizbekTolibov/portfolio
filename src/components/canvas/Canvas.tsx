"use client";

import { motion, type MotionValue } from "framer-motion";
import { useMemo } from "react";
import type { CanvasNode } from "@/content/canvas";
import { computeBoundingBox } from "@/lib/canvas/geometry";
import type { LodBand } from "@/lib/canvas/types";
import { Frame } from "./Frame";
import { Group } from "./Group";

const GRID_PADDING = 800;
const GRID_SPACING = 24;

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

type CanvasProps = {
  spatialNodes: SpatialNode[];
  childrenByParent: Map<string, CanvasNode[]>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  transform: MotionValue<string>;
  scale: MotionValue<number>;
  visibleFrameIds: Set<string>;
  lodBand: LodBand;
  selectedId: string | null;
  hoveredId: string | null;
  onHoverFrame: (id: string | null) => void;
};

/**
 * The infinite canvas viewport: a full-screen, overflow-hidden container
 * with a single transform layer (translate3d + scale) that every node sits
 * inside as an absolutely-positioned sibling in shared canvas-space
 * coordinates — frame/group nodes come from the engine (which owns
 * pan/zoom/selection/virtualization/LOD); each frame looks up its own
 * text/image children from childrenByParent to render its content.
 */
export function Canvas({
  spatialNodes,
  childrenByParent,
  containerRef,
  transform,
  scale,
  visibleFrameIds,
  lodBand,
  selectedId,
  hoveredId,
  onHoverFrame,
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
      </motion.div>
    </div>
  );
}
