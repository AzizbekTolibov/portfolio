"use client";

import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Below 768px, the canvas degrades deliberately (bottom nav, sheet/drawer
 * chrome, tighter zoom, no ghost cursors) rather than just shrinking —
 * see CLAUDE.md. `useSyncExternalStore` keeps this correct across
 * resizes/rotation without a hydration mismatch: the server snapshot is
 * always `false`, matching first paint, then the real value takes over.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
