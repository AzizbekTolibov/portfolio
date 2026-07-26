"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { about } from "@/content/about";
import { getLayoutOverrides, type EditableContent } from "@/content/canvas";
import { home } from "@/content/home";
import {
  pruneProjectFromLayout,
  remapPhotoOverrides,
  renameProjectInLayout,
} from "@/content/layout-maintenance";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import type { LayoutOverrides } from "@/content/canvas";
import type { Project, ProjectImage } from "@/content/types";

// A bounded array of whole-state snapshots, not per-op inverse patches —
// covers layout AND content edits in one Cmd+Z stack, the same reasoning
// Phase 2 used for layout alone: the combined object is still small, and
// correctness beats elegance.
const MAX_HISTORY = 50;

type EditableState = EditableContent & { layout: LayoutOverrides };

type LayoutPatch = Partial<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

function uniqueSlug(base: string, existing: Project[]): string {
  const taken = new Set(existing.map((p) => p.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

const BLANK_COVER: ProjectImage = {
  src: "/projects/new-project-placeholder.svg",
  width: 1200,
  height: 1500,
  alt: "[ALT TEXT — TO WRITE]",
};

/**
 * Owns the editor's in-memory copy of every editable data file — layout
 * overrides AND site/home/about/projects content — plus undo/redo and
 * save. The canvas renders from this, not from disk, so any edit (drag,
 * resize, a typed field, adding a project) shows up immediately without a
 * round trip. Nothing here writes to disk on its own; `save()` is the
 * only path that does, via /api/edit/save, and only sends the data files
 * that actually changed since the last save. No-ops when `enabled` is
 * false so the public site (which calls this hook too, since hooks can't
 * be conditional) pays for none of it.
 */
export function useEditContent(enabled: boolean) {
  const [state, setState] = useState<EditableState>(() => ({
    layout: enabled ? getLayoutOverrides() : {},
    site: enabled ? structuredClone(site) : site,
    home: enabled ? structuredClone(home) : home,
    about: enabled ? structuredClone(about) : about,
    projects: enabled ? structuredClone(projects) : projects,
  }));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(1);

  const historyRef = useRef<EditableState[]>([state]);
  const [lastSaved, setLastSaved] = useState(state);

  const dirty =
    JSON.stringify(state) !== JSON.stringify(lastSaved) ? true : false;

  const pushHistory = useCallback((next: EditableState) => {
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

  const commit = useCallback(
    (updater: (prev: EditableState) => EditableState) => {
      setState((prev) => {
        const next = updater(prev);
        pushHistory(next);
        return next;
      });
    },
    [pushHistory],
  );

  // ---- layout (position/size) — same as Phase 2's commitPatch ----

  const commitPatch = useCallback(
    (pageId: string, nodeId: string, patch: LayoutPatch) => {
      commit((prev) => ({
        ...prev,
        layout: {
          ...prev.layout,
          [pageId]: {
            ...prev.layout[pageId],
            [nodeId]: { ...prev.layout[pageId]?.[nodeId], ...patch },
          },
        },
      }));
    },
    [commit],
  );

  // ---- site / home / about — shallow merge one level deep; a nested
  // field (e.g. site.location) is provided whole by the caller ----

  const commitSite = useCallback(
    (patch: Partial<EditableState["site"]>) => {
      commit((prev) => ({ ...prev, site: { ...prev.site, ...patch } }));
    },
    [commit],
  );

  const commitHome = useCallback(
    (patch: Partial<EditableState["home"]>) => {
      commit((prev) => ({ ...prev, home: { ...prev.home, ...patch } }));
    },
    [commit],
  );

  const commitAbout = useCallback(
    (patch: Partial<EditableState["about"]>) => {
      commit((prev) => ({ ...prev, about: { ...prev.about, ...patch } }));
    },
    [commit],
  );

  // ---- projects: full CRUD ----

  const isSlugTaken = useCallback(
    (slug: string, excluding?: string) =>
      state.projects.some((p) => p.slug === slug && p.slug !== excluding),
    [state.projects],
  );

  const updateProject = useCallback(
    (slug: string, patch: Partial<Project>) => {
      commit((prev) => {
        const project = prev.projects.find((p) => p.slug === slug);
        if (!project) return prev;
        const newSlug = patch.slug ?? slug;
        if (newSlug !== slug && prev.projects.some((p) => p.slug === newSlug)) {
          return prev; // collision — the UI must validate before calling
        }
        const projects = prev.projects.map((p) =>
          p.slug === slug ? { ...p, ...patch, slug: newSlug } : p,
        );
        const layout =
          newSlug !== slug
            ? renameProjectInLayout(prev.layout, slug, newSlug)
            : prev.layout;
        return { ...prev, projects, layout };
      });
    },
    [commit],
  );

  const addProject = useCallback(() => {
    commit((prev) => {
      const slug = uniqueSlug("untitled-project", prev.projects);
      const project: Project = {
        slug,
        title: "[UNTITLED PROJECT]",
        year: "[YEAR]",
        description: "[DESCRIPTION — TO WRITE]",
        cover: BLANK_COVER,
        images: [],
      };
      return { ...prev, projects: [...prev.projects, project] };
    });
  }, [commit]);

  const duplicateProject = useCallback(
    (slug: string) => {
      commit((prev) => {
        const index = prev.projects.findIndex((p) => p.slug === slug);
        if (index === -1) return prev;
        const source = prev.projects[index];
        const newSlug = uniqueSlug(`${source.slug}-copy`, prev.projects);
        const copy: Project = {
          ...source,
          slug: newSlug,
          title: `${source.title} copy`,
        };
        const projects = [...prev.projects];
        projects.splice(index + 1, 0, copy);
        return { ...prev, projects };
      });
    },
    [commit],
  );

  const deleteProject = useCallback(
    (slug: string) => {
      commit((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.slug !== slug),
        layout: pruneProjectFromLayout(prev.layout, slug),
      }));
    },
    [commit],
  );

  // Reordering never touches layout.json: node ids are derived from the
  // slug (see content/canvas.ts), not the array index, so the same
  // override keys keep resolving to the same project either way. What
  // DOES change is that project's auto-computed default grid slot — and
  // since a position override is a delta from that default (see
  // LayoutOverrides' own comment in canvas.ts), a tile that was already
  // hand-positioned will visibly jump on reorder: the override still
  // "wins" in that it still applies, but it reapplies the same delta from
  // a new starting point, not the position the user actually dragged it
  // to. There's no reorder-time fix for this that doesn't mean silently
  // rewriting the user's own override to something they didn't set.
  const reorderProject = useCallback(
    (slug: string, direction: -1 | 1) => {
      commit((prev) => {
        const index = prev.projects.findIndex((p) => p.slug === slug);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= prev.projects.length) {
          return prev;
        }
        const projects = [...prev.projects];
        [projects[index], projects[target]] = [
          projects[target],
          projects[index],
        ];
        return { ...prev, projects };
      });
    },
    [commit],
  );

  // ---- photos within a project ----

  const addPhoto = useCallback(
    (slug: string, image: ProjectImage) => {
      commit((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.slug === slug ? { ...p, images: [...p.images, image] } : p,
        ),
      }));
    },
    [commit],
  );

  const removePhoto = useCallback(
    (slug: string, index: number) => {
      commit((prev) => {
        const project = prev.projects.find((p) => p.slug === slug);
        if (!project) return prev;
        const mapping = project.images.map((_, i) =>
          i === index ? null : i < index ? i : i - 1,
        );
        const projects = prev.projects.map((p) =>
          p.slug === slug
            ? { ...p, images: p.images.filter((_, i) => i !== index) }
            : p,
        );
        return {
          ...prev,
          projects,
          layout: remapPhotoOverrides(prev.layout, slug, mapping),
        };
      });
    },
    [commit],
  );

  const reorderPhoto = useCallback(
    (slug: string, index: number, direction: -1 | 1) => {
      commit((prev) => {
        const project = prev.projects.find((p) => p.slug === slug);
        if (!project) return prev;
        const target = index + direction;
        if (target < 0 || target >= project.images.length) return prev;
        const images = [...project.images];
        [images[index], images[target]] = [images[target], images[index]];
        const mapping = project.images.map((_, i) =>
          i === index ? target : i === target ? index : i,
        );
        const projects = prev.projects.map((p) =>
          p.slug === slug ? { ...p, images } : p,
        );
        return {
          ...prev,
          projects,
          layout: remapPhotoOverrides(prev.layout, slug, mapping),
        };
      });
    },
    [commit],
  );

  const setCoverPhoto = useCallback(
    (slug: string, image: ProjectImage) => {
      commit((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.slug === slug ? { ...p, cover: image } : p,
        ),
      }));
    },
    [commit],
  );

  // ---- undo/redo ----

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  const undo = useCallback(() => {
    setHistoryIndex((i) => {
      if (i <= 0) return i;
      const next = i - 1;
      setState(historyRef.current[next]);
      return next;
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((i) => {
      if (i >= historyRef.current.length - 1) return i;
      const next = i + 1;
      setState(historyRef.current[next]);
      return next;
    });
  }, []);

  // ---- save: only the data files that actually changed ----

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const files: Partial<Record<keyof EditableState, unknown>> = {};
      (Object.keys(state) as (keyof EditableState)[]).forEach((key) => {
        if (JSON.stringify(state[key]) !== JSON.stringify(lastSaved[key])) {
          files[key] = state[key];
        }
      });
      if (Object.keys(files).length === 0) return;

      const res = await fetch("/api/edit/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      setLastSaved(state);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [state, lastSaved]);

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
    layout: state.layout,
    site: state.site,
    home: state.home,
    about: state.about,
    projects: state.projects,
    commitPatch,
    commitSite,
    commitHome,
    commitAbout,
    isSlugTaken,
    updateProject,
    addProject,
    duplicateProject,
    deleteProject,
    reorderProject,
    addPhoto,
    removePhoto,
    reorderPhoto,
    setCoverPhoto,
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
