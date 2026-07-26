"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLayoutOverrides, type LayoutOverrides } from "@/content/canvas";

// A bounded array of whole-LayoutOverrides snapshots, not per-op inverse
// patches — the object is small (a handful of nodeId -> rect entries),
// and correctness beats elegance here, per the spec.
const MAX_HISTORY = 50;

type Patch = Partial<{ x: number; y: number; width: number; height: number }>;

function withPatch(
  overrides: LayoutOverrides,
  pageId: string,
  nodeId: string,
  patch: Patch,
): LayoutOverrides {
  return {
    ...overrides,
    [pageId]: {
      ...overrides[pageId],
      [nodeId]: { ...overrides[pageId]?.[nodeId], ...patch },
    },
  };
}

/**
 * Owns the editor's in-memory copy of layout.json — the canvas renders
 * from this, not from disk, so drags/resizes/field edits show up
 * immediately without a round trip. Nothing here writes to disk on its
 * own; `save()` is the only path that does, via /api/edit/save. No-ops
 * when `enabled` is false so the public site (which calls this hook too,
 * since hooks can't be conditional) pays for none of it.
 */
export function useEditLayout(enabled: boolean) {
  const [overrides, setOverrides] = useState<LayoutOverrides>(() =>
    enabled ? getLayoutOverrides() : {},
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(1);

  const historyRef = useRef<LayoutOverrides[]>([overrides]);
  const [lastSaved, setLastSaved] = useState<string>(() =>
    JSON.stringify(overrides),
  );

  const dirty = JSON.stringify(overrides) !== lastSaved;

  const pushHistory = useCallback((next: LayoutOverrides) => {
    setHistoryIndex((prevIndex) => {
      const truncated = historyRef.current.slice(0, prevIndex + 1);
      truncated.push(next);
      const overflow = truncated.length - MAX_HISTORY;
      const trimmed = overflow > 0 ? truncated.slice(overflow) : truncated;
      historyRef.current = trimmed;
      setHistoryLength(trimmed.length);
      return trimmed.length - 1;
    });
  }, []);

  const commitPatch = useCallback(
    (pageId: string, nodeId: string, patch: Patch) => {
      setOverrides((prev) => {
        const next = withPatch(prev, pageId, nodeId, patch);
        pushHistory(next);
        return next;
      });
    },
    [pushHistory],
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  const undo = useCallback(() => {
    setHistoryIndex((i) => {
      if (i <= 0) return i;
      const next = i - 1;
      setOverrides(historyRef.current[next]);
      return next;
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((i) => {
      if (i >= historyRef.current.length - 1) return i;
      const next = i + 1;
      setOverrides(historyRef.current[next]);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/edit/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      const data = await res.json();
      setLastSaved(JSON.stringify(data.overrides ?? overrides));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [overrides]);

  // Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z — kept separate from the canvas
  // engine's own keyboard effect, since undo/redo isn't a pan/zoom
  // concern; both listeners coexist fine (the engine never binds "z").
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, undo, redo]);

  // Warn before leaving with unsaved changes — browsers ignore any custom
  // message and show their own, but the preventDefault + returnValue pair
  // is still what triggers the native prompt at all.
  useEffect(() => {
    if (!enabled || !dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled, dirty]);

  return {
    overrides,
    commitPatch,
    dirty,
    saving,
    saveError,
    save,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
