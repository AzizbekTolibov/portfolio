/**
 * Master switch for animated camera travel between frames (see CLAUDE.md's
 * navigation model): true flies the ~800ms ease-in-out fly.to between
 * frames; false jumps instantly instead, for A/B comparison. Independent of
 * prefers-reduced-motion, which always wins over this flag regardless of
 * its value.
 */
export const flyBetweenFrames = true;
