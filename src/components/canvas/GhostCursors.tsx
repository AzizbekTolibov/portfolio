"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Waypoint = { x: number; y: number };

type CursorDef = {
  id: string;
  name: string;
  color: string;
  /** A closed loop of canvas-space waypoints the cursor drifts through. */
  path: Waypoint[];
  /** Relative timing for each waypoint (including the implicit return to
   * the first one) — a longer gap before/after a waypoint reads as a
   * pause near that spot. Must have path.length + 1 entries, 0 to 1. */
  times: number[];
  durationSeconds: number;
};

// Figma's own icon palette — a small, deliberate nod: these read as "other
// people's cursors," so they borrow Figma's brand colors rather than ours.
const CURSORS: CursorDef[] = [
  {
    id: "recruiter",
    name: "Recruiter",
    color: "#F24E1E",
    path: [
      { x: 200, y: 640 },
      { x: 900, y: 500 },
      { x: 1300, y: 950 },
      { x: 500, y: 1050 },
    ],
    times: [0, 0.3, 0.45, 0.8, 1],
    durationSeconds: 26,
  },
  {
    id: "future-teammate",
    name: "Future Teammate",
    color: "#0ACF83",
    path: [
      { x: 1000, y: 1700 },
      { x: 1900, y: 1550 },
      { x: 2100, y: 2200 },
      { x: 1200, y: 2150 },
    ],
    times: [0, 0.25, 0.55, 0.75, 1],
    durationSeconds: 30,
  },
  {
    id: "past-me",
    name: "Past Me",
    color: "#A259FF",
    path: [
      { x: 300, y: -1600 },
      { x: 1400, y: -1500 },
      { x: 1600, y: -700 },
      { x: 600, y: -650 },
    ],
    times: [0, 0.35, 0.5, 0.85, 1],
    durationSeconds: 24,
  },
  {
    id: "someone-from-figma",
    name: "Someone from Figma",
    color: "#1ABCFE",
    path: [
      { x: 18900, y: 250 },
      { x: 19600, y: 150 },
      { x: 20100, y: 650 },
      { x: 19300, y: 700 },
    ],
    times: [0, 0.3, 0.6, 0.8, 1],
    durationSeconds: 28,
  },
];

function CursorGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M2 1.5L15.5 8L9.3 9.3L8 15.5L2 1.5Z"
        fill="currentColor"
        stroke="#0E0E0E"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ghost multiplayer cursors — idle "collaborators" drifting through canvas
 * space, so they pan/zoom with everything rather than staying screen-fixed
 * like the real Figma cursor overlay does. At most one is shown at a time,
 * even if more than one is technically within the viewport. Disabled
 * entirely under prefers-reduced-motion. */
export function GhostCursors({
  containerRef,
  engineX,
  engineY,
  engineScale,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  engineX: MotionValue<number>;
  engineY: MotionValue<number>;
  engineScale: MotionValue<number>;
}) {
  const shouldReduceMotion = useReducedMotion();

  const c0x = useMotionValue(CURSORS[0].path[0].x);
  const c0y = useMotionValue(CURSORS[0].path[0].y);
  const c1x = useMotionValue(CURSORS[1].path[0].x);
  const c1y = useMotionValue(CURSORS[1].path[0].y);
  const c2x = useMotionValue(CURSORS[2].path[0].x);
  const c2y = useMotionValue(CURSORS[2].path[0].y);
  const c3x = useMotionValue(CURSORS[3].path[0].x);
  const c3y = useMotionValue(CURSORS[3].path[0].y);
  const values = useMemo(
    () => [
      { x: c0x, y: c0y },
      { x: c1x, y: c1y },
      { x: c2x, y: c2y },
      { x: c3x, y: c3y },
    ],
    [c0x, c0y, c1x, c1y, c2x, c2y, c3x, c3y],
  );

  const [visibleId, setVisibleId] = useState<string | null>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const controls = CURSORS.flatMap((def, i) => {
      const mv = values[i];
      const xs = [...def.path.map((p) => p.x), def.path[0].x];
      const ys = [...def.path.map((p) => p.y), def.path[0].y];
      return [
        animate(mv.x, xs, {
          duration: def.durationSeconds,
          times: def.times,
          repeat: Infinity,
          ease: "easeInOut",
        }),
        animate(mv.y, ys, {
          duration: def.durationSeconds,
          times: def.times,
          repeat: Infinity,
          ease: "easeInOut",
        }),
      ];
    });
    return () => controls.forEach((c) => c.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = engineScale.get();
      const bounds = {
        left: (0 - engineX.get()) / s,
        top: (0 - engineY.get()) / s,
        width: rect.width / s,
        height: rect.height / s,
      };
      const found = CURSORS.find((def, i) => {
        const mv = values[i];
        const px = mv.x.get();
        const py = mv.y.get();
        return (
          px >= bounds.left &&
          px <= bounds.left + bounds.width &&
          py >= bounds.top &&
          py <= bounds.top + bounds.height
        );
      });
      setVisibleId((prev) =>
        prev === (found?.id ?? null) ? prev : (found?.id ?? null),
      );
    }, 400);
    return () => clearInterval(interval);
  }, [shouldReduceMotion, containerRef, engineX, engineY, engineScale, values]);

  if (shouldReduceMotion) return null;

  return (
    <div aria-hidden="true">
      {CURSORS.map((def, i) => (
        <div
          key={def.id}
          className="pointer-events-none absolute top-0 left-0 transition-opacity duration-700"
          style={{ opacity: visibleId === def.id ? 1 : 0 }}
        >
          <MotionCursor def={def} x={values[i].x} y={values[i].y} />
        </div>
      ))}
    </div>
  );
}

function MotionCursor({
  def,
  x,
  y,
}: {
  def: CursorDef;
  x: MotionValue<number>;
  y: MotionValue<number>;
}) {
  // Positioned via transform (x/y), never left/top — this animates every
  // tick of the drift loop, so it must stay compositor-only like pan/zoom.
  return (
    <motion.div className="absolute top-0 left-0" style={{ x, y }}>
      <div style={{ color: def.color }}>
        <CursorGlyph />
      </div>
      <div
        className="mt-0.5 ml-4 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap shadow"
        style={{ backgroundColor: def.color, color: "#000" }}
      >
        {def.name}
      </div>
    </motion.div>
  );
}
