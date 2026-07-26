"use client";

import {
  animate,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { flyBetweenFrames } from "./config";
import { durations, easings } from "@/lib/motion";
import {
  clamp,
  computeBoundingBox,
  computeFitTransform,
  rectIntersects,
  zoomTowardPoint,
} from "./geometry";
import { computeSnap } from "./snapping";
import type { CanvasRect, LodBand } from "./types";

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 4;
// 0.9 = ~5% padding on each side (frame/overview fills ~90% of the
// available area) — both OVERVIEW's zoom-to-fit-all and FOCUSED's
// zoom-to-frame share this one ratio.
export const FIT_RATIO = 0.9;
/** Screen-space px; converted to canvas units by dividing by scale, so the
 * effective margin shrinks (in canvas units) as you zoom in. */
const VIRTUALIZATION_MARGIN_PX = 300;
const LOD_FLAT_MAX = 0.3;
const LOD_THUMBNAIL_MAX = 0.8;
/** Mobile: virtualize tighter (smaller screen, less need to prefetch), and
 * favor thumbnail/full detail sooner — zoom-fit on a narrow viewport lands
 * around 20-25% for our wide frames, and with only ever ~1 frame in view
 * (no zoomed-out multi-frame overview), showing detail earlier doesn't
 * cost what it would on desktop. Both changes reduce simultaneous
 * full-DOM frames while browsing quickly, which is the actual smoothness
 * risk on mid-range phones. */
const MOBILE_VIRTUALIZATION_MARGIN_PX = 150;
const MOBILE_LOD_FLAT_MAX = 0.15;
const MOBILE_LOD_THUMBNAIL_MAX = 0.5;
const ARROW_PAN_STEP = 60;
const ZOOM_STEP_FACTOR = 1.2;
const WHEEL_ZOOM_SENSITIVITY = 0.003;
const CLICK_MOVE_THRESHOLD = 8;

// ---- Edit mode: drag-to-move, keyboard nudge, snapping ----
/** Canvas units — nudged 1 at a time, 10 with Shift (see the spec). */
const NUDGE_STEP = 1;
const NUDGE_STEP_SHIFT = 10;
/** Screen px, so the snap "feel" stays constant regardless of zoom —
 * converted to canvas units (dividing by scale) at comparison time. */
const SNAP_THRESHOLD_PX = 6;

// ---- FOCUSED-state frame stepping (scroll / arrows / Space) ----
/** Below this, a wheel tick is noise (a light touch on the trackpad), not a
 * deliberate "advance" gesture. */
const WHEEL_STEP_THRESHOLD = 12;
/** One gesture (a trackpad swipe fires many small wheel events, and a held
 * key repeats) must move exactly one frame — ignore further step triggers
 * until the current camera travel has had time to land. */
const STEP_COOLDOWN_MS = 900;

// The browser's own native cursors, screen-space by definition (a real CSS
// `cursor`, never a DOM element inside the transformed canvas layer, which
// is the whole point — see CLAUDE.md's navigation model).
const CURSOR_ARROW = "default";
const CURSOR_HAND_OPEN = "grab";
const CURSOR_HAND_CLOSED = "grabbing";
const CURSOR_ZOOM = "zoom-in";

type DragState = {
  active: boolean;
  /** True for an explicit pan gesture (hand tool, space, middle-mouse) —
   * these never select on release, even if the movement threshold wasn't
   * crossed. A touch drag is *not* explicit: it starts as `active` (so it
   * can pan) but still selects on release if it never actually moved. */
  explicitPan: boolean;
  pointerId: number | null;
  lastX: number;
  lastY: number;
  startX: number;
  startY: number;
  moved: boolean;
};

type PinchState = {
  startDistance: number;
  startScale: number;
};

/**
 * The canvas engine: viewport transform (pan/zoom), selection,
 * virtualization, and level-of-detail — all in one hook because they're too
 * interdependent to cleanly separate (selection needs the same pointer
 * events as pan; virtualization/LOD both derive from the same scale/x/y
 * motion values).
 *
 * Performance discipline: x/y/scale are Framer Motion motion values, not
 * React state — every pointer move / wheel tick writes directly to them,
 * and Framer Motion batches the actual DOM write to once per animation
 * frame. React state (selectedId, visibleFrameIds, lodBand) only updates on
 * discrete, infrequent transitions (a click, a frame crossing in/out of
 * view, a LOD threshold crossing) — never continuously during a drag.
 */
/** The engine only needs a node's spatial rect + id — content/kind are the
 * caller's concern, so it stays decoupled from src/content/canvas.ts. */
export type EngineNode = CanvasRect & { id: string };

export type EngineOptions = {
  /** Tighter zoom bounds — mobile passes 0.25/2 instead of the desktop
   * default. */
  minZoom?: number;
  maxZoom?: number;
  /** Below 768px: touch drag always pans (no hand tool needed), a tap
   * that didn't pan both selects *and* zoom-fits the frame, LOD favors
   * detail sooner, and virtualization is tighter. */
  isMobile?: boolean;
  /** The explicit, hand-authored viewing order (see content/canvas.ts) —
   * when the current selection is one of these ids, scrolling, arrow keys,
   * and Space step to the next/previous entry instead of panning/zooming
   * (the FOCUSED state in CLAUDE.md's navigation model). */
  frameOrder?: string[];
  /** Frame id -> page id: clicking one of these frames (Home's project
   * tiles) NAVIGATES to that Figma Page instead of the normal FOCUSED
   * zoom-to-frame. Requires onNavigatePage. */
  pageLinks?: Map<string, string>;
  onNavigatePage?: (pageId: string) => void;
  /** Called first on Escape; if it returns true, the engine's own default
   * (deselect + zoom-to-fit) is skipped — used to make Escape on a project
   * page go back to Home instead of just re-fitting the same page. */
  onEscapeUp?: () => boolean;
  /** /edit only. Pointerdown on a frame/group drags it instead of panning
   * (or, with no movement, just selects it — same as the public site);
   * arrow keys nudge the selection instead of stepping frameOrder or
   * panning. Page-link navigation on click is suppressed — the editor
   * positions frames on the current page, it doesn't browse with them. */
  editMode?: boolean;
  /** nodeId -> that id plus every recursive frame/group descendant (not
   * text/image — those ride along for free as real DOM children of
   * whichever frame they belong to). Moving a group must visually carry
   * its descendant frames/groups with it, since they're independent
   * absolutely-positioned siblings, not DOM children of the group (see
   * Group.tsx) — this is what makes that possible without touching React
   * state per pointermove. */
  getAffectedIds?: (nodeId: string) => Set<string>;
  /** Called once, on release, with the moved node's final absolute
   * canvas-space position (post-snap). Not called for a click that never
   * actually dragged. */
  onCommitMove?: (nodeId: string, x: number, y: number) => void;
  /** Arrow-key nudge (1 unit, 10 with Shift) — called with the delta, not
   * an absolute position, since the caller already knows the selected
   * node's current rect. */
  onNudge?: (nodeId: string, dx: number, dy: number) => void;
};

export function useCanvasEngine<T extends EngineNode>(
  frames: T[],
  initialFrameId?: string,
  options?: EngineOptions,
) {
  const minZoom = options?.minZoom ?? MIN_ZOOM;
  const maxZoom = options?.maxZoom ?? MAX_ZOOM;
  const isMobile = options?.isMobile ?? false;
  const frameOrder = options?.frameOrder;
  const pageLinks = options?.pageLinks;
  const onNavigatePage = options?.onNavigatePage;
  const onEscapeUp = options?.onEscapeUp;
  const editMode = options?.editMode ?? false;
  const getAffectedIds = options?.getAffectedIds;
  const onCommitMove = options?.onCommitMove;
  const onNudge = options?.onNudge;
  const lodFlatMax = isMobile ? MOBILE_LOD_FLAT_MAX : LOD_FLAT_MAX;
  const lodThumbnailMax = isMobile
    ? MOBILE_LOD_THUMBNAIL_MAX
    : LOD_THUMBNAIL_MAX;
  const virtualizationMargin = isMobile
    ? MOBILE_VIRTUALIZATION_MARGIN_PX
    : VIRTUALIZATION_MARGIN_PX;

  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0) scale(${scale})`;

  // Edit mode's drag-to-move: dragOffsetX/Y are the shared transform every
  // currently-affected node's motion.div binds to (see Canvas.tsx) — a
  // pointermove writes only these two motion values, never React state, so
  // dragging stays exactly as re-render-free as pan/zoom already is.
  // draggingIds (React state) changes only twice per gesture — drag start
  // and drag end — never per pointermove.
  const dragOffsetX = useMotionValue(0);
  const dragOffsetY = useMotionValue(0);
  const [draggingIds, setDraggingIds] = useState<Set<string> | null>(null);
  const moveDragRef = useRef<{
    nodeId: string;
    startRect: CanvasRect;
    affectedIds: Set<string>;
  } | null>(null);
  // Alignment guides during a move — direct DOM style writes (like
  // updateCursor below), not React state, for the same reason: these can
  // change on every pointermove and must not cost a re-render.
  const vGuideRef = useRef<HTMLDivElement | null>(null);
  const hGuideRef = useRef<HTMLDivElement | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [handTool, setHandTool] = useState(false);
  const [visibleFrameIds, setVisibleFrameIds] = useState<Set<string>>(
    () => new Set(frames.map((f) => f.id)),
  );
  const [lodBand, setLodBand] = useState<LodBand>("full");
  const [zoomPercent, setZoomPercent] = useState(100);

  const handToolRef = useRef(false);
  useEffect(() => {
    handToolRef.current = handTool;
  }, [handTool]);

  const spacePressedRef = useRef(false);
  /** Cleared on every space keydown; set the moment a space-triggered drag
   * actually moves the canvas — distinguishes "held space and dragged to
   * pan" from "tapped space" (which, in FOCUSED state, advances a frame;
   * see the keyup handler below). */
  const spaceUsedForPanRef = useRef(false);
  const ctrlPressedRef = useRef(false);
  const dragStateRef = useRef<DragState>({
    active: false,
    explicitPan: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    moved: false,
  });
  const pinchStateRef = useRef<PinchState | null>(null);
  const activeAnimationsRef = useRef<AnimationPlaybackControls[]>([]);
  const stepCooldownRef = useRef(false);

  const stopAnimations = useCallback(() => {
    activeAnimationsRef.current.forEach((controls) => controls.stop());
    activeAnimationsRef.current = [];
  }, []);

  const updateCursor = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (dragStateRef.current.active) {
      el.style.cursor = CURSOR_HAND_CLOSED;
    } else if (ctrlPressedRef.current) {
      el.style.cursor = CURSOR_ZOOM;
    } else if (spacePressedRef.current || handToolRef.current) {
      el.style.cursor = CURSOR_HAND_OPEN;
    } else {
      el.style.cursor = CURSOR_ARROW;
    }
  }, []);

  /** Writes the alignment-guide overlay elements directly (see vGuideRef/
   * hGuideRef above) — imperative, not React state, so a snap changing on
   * every pointermove during a drag never costs a re-render. */
  const updateGuides = useCallback(
    (
      guides: {
        orientation: "vertical" | "horizontal";
        position: number;
        from: number;
        to: number;
      }[],
    ) => {
      const v = guides.find((g) => g.orientation === "vertical");
      const vEl = vGuideRef.current;
      if (vEl) {
        vEl.style.display = v ? "block" : "none";
        if (v) {
          vEl.style.left = `${v.position}px`;
          vEl.style.top = `${v.from}px`;
          vEl.style.height = `${v.to - v.from}px`;
        }
      }
      const h = guides.find((g) => g.orientation === "horizontal");
      const hEl = hGuideRef.current;
      if (hEl) {
        hEl.style.display = h ? "block" : "none";
        if (h) {
          hEl.style.top = `${h.position}px`;
          hEl.style.left = `${h.from}px`;
          hEl.style.width = `${h.to - h.from}px`;
        }
      }
    },
    [],
  );

  const hideGuides = useCallback(() => {
    if (vGuideRef.current) vGuideRef.current.style.display = "none";
    if (hGuideRef.current) hGuideRef.current.style.display = "none";
  }, []);

  // ---- imperative viewport controls ----

  const flyTo = useCallback(
    (target: { x: number; y: number; scale: number }) => {
      stopAnimations();
      if (shouldReduceMotion || !flyBetweenFrames) {
        x.set(target.x);
        y.set(target.y);
        scale.set(target.scale);
        return;
      }
      const options = { duration: durations.slow, ease: easings.inOut };
      activeAnimationsRef.current = [
        animate(x, target.x, options),
        animate(y, target.y, options),
        animate(scale, target.scale, options),
      ];
    },
    [shouldReduceMotion, stopAnimations, x, y, scale],
  );

  const zoomAt = useCallback(
    (clientX: number, clientY: number, targetScale: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = zoomTowardPoint(
        { x: x.get(), y: y.get(), scale: scale.get() },
        clientX - rect.left,
        clientY - rect.top,
        targetScale,
        minZoom,
        maxZoom,
      );
      x.set(next.x);
      y.set(next.y);
      scale.set(next.scale);
    },
    [x, y, scale, minZoom, maxZoom],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      x.set(x.get() + dx);
      y.set(y.get() + dy);
    },
    [x, y],
  );

  const fitTransformForRect = useCallback(
    (rect: CanvasRect) => {
      const el = containerRef.current;
      if (!el) return null;
      const viewportRect = el.getBoundingClientRect();
      return computeFitTransform(
        rect,
        viewportRect.width,
        viewportRect.height,
        FIT_RATIO,
        minZoom,
        maxZoom,
      );
    },
    [minZoom, maxZoom],
  );

  const zoomToFrame = useCallback(
    (id: string) => {
      const frame = frames.find((f) => f.id === id);
      if (!frame) return;
      const target = fitTransformForRect(frame);
      if (target) flyTo(target);
    },
    [frames, fitTransformForRect, flyTo],
  );

  const zoomToFit = useCallback(() => {
    if (frames.length === 0) return;
    const target = fitTransformForRect(computeBoundingBox(frames));
    if (target) flyTo(target);
  }, [frames, fitTransformForRect, flyTo]);

  /** Index of the current selection within the authored viewing order, or
   * -1 when nothing's selected, the selection is a group, or there's no
   * frameOrder at all — i.e. whether we're in the FOCUSED-state stepping
   * sequence right now. */
  const focusedIndex = frameOrder ? frameOrder.indexOf(selectedId ?? "") : -1;

  /** Steps to the next (+1) or previous (-1) frame in the authored order.
   * Clamps at either end rather than wrapping. No-op outside FOCUSED
   * state (see focusedIndex above) or at a boundary. */
  const stepFrame = useCallback(
    (direction: 1 | -1) => {
      if (!frameOrder || focusedIndex === -1) return;
      const nextIndex = clamp(
        focusedIndex + direction,
        0,
        frameOrder.length - 1,
      );
      if (nextIndex === focusedIndex) return;
      const nextId = frameOrder[nextIndex];
      setSelectedId(nextId);
      zoomToFrame(nextId);
    },
    [frameOrder, focusedIndex, zoomToFrame],
  );

  /** One wheel/arrow/Space gesture must move exactly one frame — this
   * guards stepFrame behind a cooldown spanning the travel animation. */
  const stepFrameDebounced = useCallback(
    (direction: 1 | -1) => {
      if (stepCooldownRef.current) return;
      stepCooldownRef.current = true;
      stepFrame(direction);
      setTimeout(() => {
        stepCooldownRef.current = false;
      }, STEP_COOLDOWN_MS);
    },
    [stepFrame],
  );

  const zoomToSelection = useCallback(() => {
    if (selectedId) zoomToFrame(selectedId);
  }, [selectedId, zoomToFrame]);

  /** Zoom-to-fit a specific set of frames (a page or a project group in the
   * layer tree) rather than a single frame or the whole canvas. */
  const zoomToFrames = useCallback(
    (ids: string[]) => {
      const rects = frames.filter((f) => ids.includes(f.id));
      if (rects.length === 0) return;
      const target = fitTransformForRect(computeBoundingBox(rects));
      if (target) flyTo(target);
    },
    [frames, fitTransformForRect, flyTo],
  );

  /** Change scale to an exact percentage (e.g. 100), keeping whatever
   * canvas point is currently centered, centered. */
  const zoomToPercent = useCallback(
    (percent: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerScreenX = rect.width / 2;
      const centerScreenY = rect.height / 2;
      const oldScale = scale.get();
      const canvasCenterX = (centerScreenX - x.get()) / oldScale;
      const canvasCenterY = (centerScreenY - y.get()) / oldScale;
      const targetScale = clamp(percent / 100, minZoom, maxZoom);
      flyTo({
        x: centerScreenX - canvasCenterX * targetScale,
        y: centerScreenY - canvasCenterY * targetScale,
        scale: targetScale,
      });
    },
    [x, y, scale, flyTo, minZoom, maxZoom],
  );

  const resetZoom = useCallback(() => zoomToPercent(100), [zoomToPercent]);

  // ---- initial viewport: deep-linked frame, or fit-to-all ----

  useEffect(() => {
    const initial = initialFrameId
      ? frames.find((f) => f.id === initialFrameId)
      : undefined;
    const target = initial
      ? fitTransformForRect(initial)
      : frames.length > 0
        ? fitTransformForRect(computeBoundingBox(frames))
        : null;
    if (target) {
      x.set(target.x);
      y.set(target.y);
      scale.set(target.scale);
    }
    // Run once on mount only — this sets the *initial* viewport; it isn't a
    // reactive sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- virtualization + LOD (derived from x/y/scale, throttled to rAF) ----

  const rafPendingRef = useRef(false);

  const recomputeDerived = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const currentScale = scale.get();
    const currentX = x.get();
    const currentY = y.get();

    const nextBand: LodBand =
      currentScale < lodFlatMax
        ? "flat"
        : currentScale < lodThumbnailMax
          ? "thumbnail"
          : "full";
    setLodBand((prev) => (prev === nextBand ? prev : nextBand));

    const nextPercent = Math.round(currentScale * 100);
    setZoomPercent((prev) => (prev === nextPercent ? prev : nextPercent));

    const marginCanvas = virtualizationMargin / currentScale;
    const viewBounds: CanvasRect = {
      x: (0 - currentX) / currentScale - marginCanvas,
      y: (0 - currentY) / currentScale - marginCanvas,
      width: rect.width / currentScale + marginCanvas * 2,
      height: rect.height / currentScale + marginCanvas * 2,
    };

    const nextVisible = new Set<string>();
    for (const f of frames) {
      if (rectIntersects(f, viewBounds)) nextVisible.add(f.id);
    }

    setVisibleFrameIds((prev) => {
      if (prev.size === nextVisible.size) {
        let same = true;
        for (const id of nextVisible) {
          if (!prev.has(id)) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return nextVisible;
    });
  }, [frames, x, y, scale, lodFlatMax, lodThumbnailMax, virtualizationMargin]);

  const scheduleRecompute = useCallback(() => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    requestAnimationFrame(() => {
      rafPendingRef.current = false;
      recomputeDerived();
    });
  }, [recomputeDerived]);

  useMotionValueEvent(x, "change", scheduleRecompute);
  useMotionValueEvent(y, "change", scheduleRecompute);
  useMotionValueEvent(scale, "change", scheduleRecompute);

  useEffect(() => {
    recomputeDerived();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => recomputeDerived());
    ro.observe(el);
    return () => ro.disconnect();
  }, [recomputeDerived]);

  // ---- wheel: two-finger trackpad pan, ctrl/cmd+wheel (and trackpad
  // pinch, which browsers report as wheel+ctrlKey) zoom toward cursor —
  // unless a real frame is FOCUSED, in which case plain scrolling steps to
  // the next/previous frame instead (ctrl/cmd+wheel still free-zooms) ----

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        stopAnimations();
        const zoomFactor = Math.exp(-e.deltaY * WHEEL_ZOOM_SENSITIVITY);
        zoomAt(e.clientX, e.clientY, scale.get() * zoomFactor);
        return;
      }
      if (focusedIndex !== -1) {
        if (Math.abs(e.deltaY) >= WHEEL_STEP_THRESHOLD) {
          stepFrameDebounced(e.deltaY > 0 ? 1 : -1);
        }
        return;
      }
      stopAnimations();
      panBy(-e.deltaX, -e.deltaY);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, panBy, scale, stopAnimations, focusedIndex, stepFrameDebounced]);

  // ---- pointer: space/middle-mouse/hand-tool drag to pan, touch pinch to
  // zoom, plain click (no drag) to select ----

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const activePointers = new Map<number, { x: number; y: number }>();

    function pinchMetrics() {
      const pts = Array.from(activePointers.values());
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      return { distance, midX, midY };
    }

    function onPointerDown(e: PointerEvent) {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 2) {
        stopAnimations();
        const { distance } = pinchMetrics();
        pinchStateRef.current = {
          startDistance: distance,
          startScale: scale.get(),
        };
        dragStateRef.current.active = false;
        updateCursor();
        return;
      }
      if (activePointers.size > 2) return;

      const isMiddleMouse = e.button === 1;
      const explicitPan =
        isMiddleMouse || spacePressedRef.current || handToolRef.current;

      // Edit mode: pointerdown on a frame/group (not a resize handle,
      // which stops its own event before this ever sees it) drags that
      // node instead of panning — Figma-style, select-and-move in one
      // gesture. Space/hand-tool/middle-mouse still pan even in edit
      // mode, same priority as the public site.
      if (editMode && !explicitPan) {
        const target = e.target as HTMLElement;
        const onHandle = target.closest("[data-resize-handle]");
        const frameEl = onHandle
          ? null
          : (target.closest("[data-frame-id]") as HTMLElement | null);
        const frameId = frameEl?.dataset.frameId;
        const frame = frameId ? frames.find((f) => f.id === frameId) : null;
        if (frame) {
          e.preventDefault();
          stopAnimations();
          const affectedIds = getAffectedIds?.(frame.id) ?? new Set([frame.id]);
          moveDragRef.current = {
            nodeId: frame.id,
            startRect: {
              x: frame.x,
              y: frame.y,
              width: frame.width,
              height: frame.height,
            },
            affectedIds,
          };
          dragOffsetX.set(0);
          dragOffsetY.set(0);
          setDraggingIds(affectedIds);
          setSelectedId(frame.id);
          dragStateRef.current = {
            active: false,
            explicitPan: false,
            pointerId: e.pointerId,
            lastX: e.clientX,
            lastY: e.clientY,
            startX: e.clientX,
            startY: e.clientY,
            moved: false,
          };
          containerRef.current?.setPointerCapture(e.pointerId);
          return;
        }
      }

      // A touch drag always pans — no hand tool needed — but isn't
      // "explicit": if it turns out not to have moved, it's a tap, and
      // taps still select (see onPointerUp).
      const isPanTrigger = explicitPan || e.pointerType === "touch";

      dragStateRef.current = {
        active: isPanTrigger,
        explicitPan,
        pointerId: e.pointerId,
        lastX: e.clientX,
        lastY: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };

      if (isPanTrigger) {
        e.preventDefault();
        stopAnimations();
        containerRef.current?.setPointerCapture(e.pointerId);
        updateCursor();
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (activePointers.size === 2 && pinchStateRef.current) {
        const { distance, midX, midY } = pinchMetrics();
        const ratio = distance / (pinchStateRef.current.startDistance || 1);
        zoomAt(midX, midY, pinchStateRef.current.startScale * ratio);
        return;
      }

      const drag = dragStateRef.current;
      if (drag.pointerId !== e.pointerId) return;

      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      if (
        Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) >
        CLICK_MOVE_THRESHOLD
      ) {
        drag.moved = true;
        if (spacePressedRef.current) spaceUsedForPanRef.current = true;
      }

      const moveDrag = moveDragRef.current;
      if (moveDrag) {
        const currentScale = scale.get();
        const totalDx = (e.clientX - drag.startX) / currentScale;
        const totalDy = (e.clientY - drag.startY) / currentScale;
        const prospective: CanvasRect = {
          x: moveDrag.startRect.x + totalDx,
          y: moveDrag.startRect.y + totalDy,
          width: moveDrag.startRect.width,
          height: moveDrag.startRect.height,
        };
        let snapDx = 0;
        let snapDy = 0;
        if (!e.altKey) {
          const others = frames.filter((f) => !moveDrag.affectedIds.has(f.id));
          const snap = computeSnap(
            prospective,
            others,
            SNAP_THRESHOLD_PX / currentScale,
          );
          snapDx = snap.dx;
          snapDy = snap.dy;
          updateGuides(snap.guides);
        } else {
          hideGuides();
        }
        dragOffsetX.set(totalDx + snapDx);
        dragOffsetY.set(totalDy + snapDy);
        return;
      }

      if (drag.active) panBy(dx, dy);
    }

    function onPointerUp(e: PointerEvent) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchStateRef.current = null;

      const drag = dragStateRef.current;
      if (drag.pointerId === e.pointerId) {
        const moveDrag = moveDragRef.current;
        if (moveDrag) {
          if (drag.moved) {
            onCommitMove?.(
              moveDrag.nodeId,
              moveDrag.startRect.x + dragOffsetX.get(),
              moveDrag.startRect.y + dragOffsetY.get(),
            );
          }
          moveDragRef.current = null;
          dragOffsetX.set(0);
          dragOffsetY.set(0);
          setDraggingIds(null);
          hideGuides();
          dragStateRef.current = { ...drag, active: false, pointerId: null };
          updateCursor();
          return;
        }
        if (!drag.explicitPan && !drag.moved) {
          const target = e.target as HTMLElement;
          const frameEl = target.closest(
            "[data-frame-id]",
          ) as HTMLElement | null;
          const frameId = frameEl?.dataset.frameId ?? null;
          const linkedPage = frameId ? pageLinks?.get(frameId) : undefined;
          if (linkedPage && onNavigatePage) {
            // A Home project tile: this is real navigation to another
            // Figma Page, not a zoom — never select/zoom here.
            onNavigatePage(linkedPage);
          } else {
            setSelectedId(frameId);
            if (frameId) {
              // Clicking any frame enters FOCUSED state — the camera
              // travels to fill ~80% of the viewport with it.
              zoomToFrame(frameId);
            } else {
              // Empty canvas: back to OVERVIEW.
              zoomToFit();
            }
          }
        }
        dragStateRef.current = { ...drag, active: false, pointerId: null };
        updateCursor();
      }
    }

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [
    zoomAt,
    panBy,
    scale,
    stopAnimations,
    updateCursor,
    zoomToFrame,
    zoomToFit,
    pageLinks,
    onNavigatePage,
    frames,
    editMode,
    getAffectedIds,
    onCommitMove,
    dragOffsetX,
    dragOffsetY,
    updateGuides,
    hideGuides,
  ]);

  // ---- keyboard ----

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if (e.code === "Space" && !spacePressedRef.current) {
        spacePressedRef.current = true;
        spaceUsedForPanRef.current = false;
        updateCursor();
        e.preventDefault();
        return;
      }

      if (e.key === "Control" || e.key === "Meta") {
        ctrlPressedRef.current = true;
        updateCursor();
        return;
      }

      if (e.key === "Escape") {
        if (onEscapeUp?.()) return;
        setSelectedId(null);
        zoomToFit();
        return;
      }

      if (e.shiftKey && e.key === "1") {
        e.preventDefault();
        zoomToFit();
        return;
      }
      if (e.shiftKey && e.key === "2") {
        e.preventDefault();
        zoomToSelection();
        return;
      }
      if (e.shiftKey && e.key === "0") {
        e.preventDefault();
        resetZoom();
        return;
      }

      const el = containerRef.current;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        if (!el) return;
        const rect = el.getBoundingClientRect();
        stopAnimations();
        zoomAt(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          scale.get() * ZOOM_STEP_FACTOR,
        );
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        if (!el) return;
        const rect = el.getBoundingClientRect();
        stopAnimations();
        zoomAt(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          scale.get() / ZOOM_STEP_FACTOR,
        );
        return;
      }

      // Edit mode: arrows nudge the selection (1 unit, 10 with Shift)
      // instead of stepping frameOrder or panning — positioning is the
      // whole point of edit mode, so this takes priority over both.
      if (editMode && selectedId && onNudge) {
        const nudgeMap: Record<string, [number, number]> = {
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
        };
        const dir = nudgeMap[e.key];
        if (dir) {
          e.preventDefault();
          const magnitude = e.shiftKey ? NUDGE_STEP_SHIFT : NUDGE_STEP;
          onNudge(selectedId, dir[0] * magnitude, dir[1] * magnitude);
          return;
        }
      }

      // FOCUSED state: arrows step through the authored frame order instead
      // of panning (forward = right/down, back = left/up). OVERVIEW (or a
      // group selection, which isn't in frameOrder): the original free pan.
      if (focusedIndex !== -1) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          stepFrameDebounced(1);
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          stepFrameDebounced(-1);
          return;
        }
      }

      const arrowMap: Record<string, [number, number]> = {
        ArrowUp: [0, ARROW_PAN_STEP],
        ArrowDown: [0, -ARROW_PAN_STEP],
        ArrowLeft: [ARROW_PAN_STEP, 0],
        ArrowRight: [-ARROW_PAN_STEP, 0],
      };
      const step = arrowMap[e.key];
      if (step) {
        e.preventDefault();
        stopAnimations();
        panBy(step[0], step[1]);
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        spacePressedRef.current = false;
        updateCursor();
        // A tap (no intervening pan-drag) advances a frame in FOCUSED
        // state — the same "next" gesture as scrolling forward. Holding
        // Space and dragging to pan is unaffected (handled entirely by the
        // pointer handlers above).
        if (!spaceUsedForPanRef.current && focusedIndex !== -1) {
          stepFrameDebounced(1);
        }
      }
      if (e.key === "Control" || e.key === "Meta") {
        ctrlPressedRef.current = false;
        updateCursor();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    zoomAt,
    panBy,
    scale,
    stopAnimations,
    updateCursor,
    zoomToFit,
    zoomToSelection,
    resetZoom,
    focusedIndex,
    stepFrameDebounced,
    onEscapeUp,
    editMode,
    selectedId,
    onNudge,
  ]);

  // Keep cursor in sync when hand tool toggles via keyboard (not just
  // pointer/space events, which already call updateCursor themselves).
  useEffect(() => {
    updateCursor();
  }, [handTool, updateCursor]);

  return {
    containerRef,
    transform,
    x,
    y,
    scale,
    selectedId,
    setSelectedId,
    handTool,
    setHandTool,
    visibleFrameIds,
    lodBand,
    zoomPercent,
    zoomToFrame,
    zoomToFrames,
    zoomToFit,
    zoomToSelection,
    zoomToPercent,
    resetZoom,
    // Edit mode only (see EngineOptions.editMode) — inert otherwise.
    draggingIds,
    dragOffsetX,
    dragOffsetY,
    vGuideRef,
    hGuideRef,
  };
}
