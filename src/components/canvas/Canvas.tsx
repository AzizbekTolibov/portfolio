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

/** Below this, individual frame labels hide — only group/project labels
 * stay, decluttering OVERVIEW. */
const FRAME_LABEL_MIN_ZOOM_PERCENT = 40;

type CanvasProps = {
  spatialNodes: SpatialNode[];
  childrenByParent: Map<string, CanvasNode[]>;
  /** nodeId → how many nested group levels sit below it before a leaf
   * frame (see tree.ts's computeGroupLabelDepths) — lets a group's label
   * clear a nested group's label, not just a nested frame's. */
  groupLabelDepths: Map<string, number>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  transform: MotionValue<string>;
  scale: MotionValue<number>;
  visibleFrameIds: Set<string>;
  lodBand: LodBand;
  zoomPercent: number;
  selectedId: string | null;
  hoveredId: string | null;
  onHoverFrame: (id: string | null) => void;
  /** /edit only — see use-canvas-engine's identically-named return values. */
  editMode?: boolean;
  draggingIds?: Set<string> | null;
  dragOffsetX?: MotionValue<number>;
  dragOffsetY?: MotionValue<number>;
  vGuideRef?: React.RefObject<HTMLDivElement | null>;
  hGuideRef?: React.RefObject<HTMLDivElement | null>;
  onCommitResize?: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
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
  groupLabelDepths,
  containerRef,
  transform,
  scale,
  visibleFrameIds,
  lodBand,
  zoomPercent,
  selectedId,
  hoveredId,
  onHoverFrame,
  editMode = false,
  draggingIds,
  dragOffsetX,
  dragOffsetY,
  vGuideRef,
  hGuideRef,
  onCommitResize,
}: CanvasProps) {
  const showFrameLabels = zoomPercent >= FRAME_LABEL_MIN_ZOOM_PERCENT;
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
          const isDragging = draggingIds?.has(node.id) ?? false;
          if (node.type === "group") {
            return (
              <Group
                key={node.id}
                node={node}
                labelDepth={groupLabelDepths.get(node.id) ?? 1}
                selected={selectedId === node.id}
                hovered={hoveredId === node.id}
                onHoverChange={(h) => onHoverFrame(h ? node.id : null)}
                dragOffsetX={isDragging ? dragOffsetX : 0}
                dragOffsetY={isDragging ? dragOffsetY : 0}
              />
            );
          }
          return (
            <Frame
              key={node.id}
              node={node}
              childNodes={childrenByParent.get(node.id) ?? []}
              lodBand={lodBand}
              showLabel={showFrameLabels}
              selected={selectedId === node.id}
              hovered={hoveredId === node.id}
              onHoverChange={(h) => onHoverFrame(h ? node.id : null)}
              dragOffsetX={isDragging ? dragOffsetX : 0}
              dragOffsetY={isDragging ? dragOffsetY : 0}
              editMode={editMode}
              scale={scale}
              onCommitResize={onCommitResize}
            />
          );
        })}

        {editMode && (
          // Alignment guides during a move — hidden by default; the engine
          // toggles these directly via inline style (see updateGuides in
          // use-canvas-engine.ts), never through React state, so a snap
          // engaging/disengaging on every pointermove never re-renders
          // anything. Selection blue, not the editorial accent — this is
          // Figma chrome, not artboard content (see CLAUDE.md).
          <>
            <div
              ref={vGuideRef}
              className="bg-selection pointer-events-none absolute hidden w-px"
            />
            <div
              ref={hGuideRef}
              className="bg-selection pointer-events-none absolute hidden h-px"
            />
          </>
        )}
      </motion.div>
    </div>
  );
}
