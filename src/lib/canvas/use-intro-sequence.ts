"use client";

import { animate, useReducedMotion, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { easings } from "@/lib/motion";
import { MAX_ZOOM, MIN_ZOOM } from "./use-canvas-engine";
import { computeBoundingBox, computeFitTransform } from "./geometry";
import type { CanvasRect } from "./types";

const LOADING_MS = 650;
const ZOOM_TO_FIT_MS = 1000;
const ZOOM_TO_COVER_MS = 900;
const WAY_OUT_RATIO = 0.28;
const FIT_RATIO = 0.8;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export type IntroPhase = "loading" | "animating" | "done";

/**
 * Figma's file-loading sequence, replacing a conventional intro: a loading
 * screen, then a fade-in already zoomed way out, a zoom-to-fit, and — only
 * when a deep link named a specific frame — a second gentle zoom into it.
 * With no deep link, the sequence ends at the zoom-to-fit itself: OVERVIEW
 * (every frame visible) is where the file lands by default, per CLAUDE.md's
 * navigation model. Skippable at any point, and skipped entirely under
 * prefers-reduced-motion (straight to the final target, which the engine's
 * own mount effect already does via initialFrameId).
 */
export function useIntroSequence({
  containerRef,
  x,
  y,
  scale,
  frames,
  targetFrame,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  frames: CanvasRect[];
  targetFrame: CanvasRect | undefined;
  minZoom?: number;
  maxZoom?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>(
    shouldReduceMotion ? "done" : "loading",
  );
  const activeAnimationsRef = useRef<{ stop: () => void }[]>([]);
  const cancelledRef = useRef(false);

  const jumpTo = useCallback(
    (rect: CanvasRect) => {
      const el = containerRef.current;
      if (!el) return;
      const viewport = el.getBoundingClientRect();
      const target = computeFitTransform(
        rect,
        viewport.width,
        viewport.height,
        FIT_RATIO,
        minZoom,
        maxZoom,
      );
      x.set(target.x);
      y.set(target.y);
      scale.set(target.scale);
    },
    [containerRef, x, y, scale, minZoom, maxZoom],
  );

  const skip = useCallback(() => {
    if (cancelledRef.current || phase === "done") return;
    cancelledRef.current = true;
    activeAnimationsRef.current.forEach((c) => c.stop());
    activeAnimationsRef.current = [];
    if (frames.length > 0) jumpTo(targetFrame ?? computeBoundingBox(frames));
    setPhase("done");
  }, [phase, targetFrame, frames, jumpTo]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const el = containerRef.current;
    if (!el || frames.length === 0) {
      setPhase("done");
      return;
    }
    cancelledRef.current = false;
    const viewport = el.getBoundingClientRect();
    const bbox = computeBoundingBox(frames);

    // Start already zoomed way out — instant, invisible behind the loading
    // overlay.
    const wayOut = computeFitTransform(
      bbox,
      viewport.width,
      viewport.height,
      WAY_OUT_RATIO,
      minZoom,
      maxZoom,
    );
    x.set(wayOut.x);
    y.set(wayOut.y);
    scale.set(wayOut.scale);

    async function run() {
      await sleep(LOADING_MS);
      if (cancelledRef.current) return;
      setPhase("animating");

      // Re-measure rather than reuse the pre-sleep `viewport` — panels can
      // still be settling their final width this early (fonts, hydration),
      // and a stale size here bakes a wrong scale into the whole sequence.
      // (el is a const already null-checked above; TS just can't see that
      // narrowing across this closure.)
      const freshViewport = el!.getBoundingClientRect();
      const fitTarget = computeFitTransform(
        bbox,
        freshViewport.width,
        freshViewport.height,
        FIT_RATIO,
        minZoom,
        maxZoom,
      );
      const zoomToFitAnims = [
        animate(x, fitTarget.x, {
          duration: ZOOM_TO_FIT_MS / 1000,
          ease: easings.inOut,
        }),
        animate(y, fitTarget.y, {
          duration: ZOOM_TO_FIT_MS / 1000,
          ease: easings.inOut,
        }),
        animate(scale, fitTarget.scale, {
          duration: ZOOM_TO_FIT_MS / 1000,
          ease: easings.inOut,
        }),
      ];
      activeAnimationsRef.current = zoomToFitAnims;
      await Promise.all(zoomToFitAnims);
      if (cancelledRef.current) return;

      // No deep link: OVERVIEW (the fit-all view just reached) is the
      // landing state — done. A deep link gets one more gentle zoom into
      // its specific frame (FOCUSED).
      if (targetFrame) {
        const finalTarget = computeFitTransform(
          targetFrame,
          freshViewport.width,
          freshViewport.height,
          FIT_RATIO,
          minZoom,
          maxZoom,
        );
        const zoomToFrameAnims = [
          animate(x, finalTarget.x, {
            duration: ZOOM_TO_COVER_MS / 1000,
            ease: easings.out,
          }),
          animate(y, finalTarget.y, {
            duration: ZOOM_TO_COVER_MS / 1000,
            ease: easings.out,
          }),
          animate(scale, finalTarget.scale, {
            duration: ZOOM_TO_COVER_MS / 1000,
            ease: easings.out,
          }),
        ];
        activeAnimationsRef.current = zoomToFrameAnims;
        await Promise.all(zoomToFrameAnims);
        if (cancelledRef.current) return;
      }
      setPhase("done");
    }

    run();

    return () => {
      cancelledRef.current = true;
      activeAnimationsRef.current.forEach((c) => c.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReduceMotion]);

  // Any click, key, or scroll skips straight to the Cover — captured ahead
  // of the canvas's own listeners so the interaction that skips doesn't
  // also pan/zoom/select underneath.
  useEffect(() => {
    if (phase === "done") return;
    function onInteract(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      skip();
    }
    window.addEventListener("pointerdown", onInteract, true);
    window.addEventListener("keydown", onInteract, true);
    window.addEventListener("wheel", onInteract, {
      capture: true,
      passive: false,
    });
    return () => {
      window.removeEventListener("pointerdown", onInteract, true);
      window.removeEventListener("keydown", onInteract, true);
      window.removeEventListener("wheel", onInteract, true);
    };
  }, [phase, skip]);

  return { phase, skip };
}
