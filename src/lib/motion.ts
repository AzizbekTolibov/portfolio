/**
 * Motion tokens: shared durations and easing curves for Framer Motion.
 * CSS-side transitions use the mirrored --duration- and --ease- custom
 * properties in globals.css — keep both in sync if these change.
 */

type CubicBezier = [number, number, number, number];

export const durations = {
  fast: 0.2,
  base: 0.4,
  slow: 0.8,
} as const satisfies Record<"fast" | "base" | "slow", number>;

export const easings = {
  /** Decelerate into rest — the default for reveals and entrances. */
  out: [0.16, 1, 0.3, 1],
  /** Symmetric ease — for transitions that start and end in motion. */
  inOut: [0.65, 0, 0.35, 1],
  /** Standard UI ease — for small, functional transitions (hover, focus). */
  standard: [0.4, 0, 0.2, 1],
} as const satisfies Record<"out" | "inOut" | "standard", CubicBezier>;
