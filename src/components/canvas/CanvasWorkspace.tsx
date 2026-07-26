"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { contact } from "@/content/about";
import { getPageNodes, PAGES, type CanvasNode, type PageId } from "@/content/canvas";
import { projects } from "@/content/projects";
import { buildLayerTree, groupChildrenByParent } from "@/lib/canvas/tree";
import { useCanvasEngine } from "@/lib/canvas/use-canvas-engine";
import { useIntroSequence } from "@/lib/canvas/use-intro-sequence";
import { useIsMobile } from "@/lib/canvas/use-is-mobile";
import { SemanticDocument } from "@/components/semantic/SemanticDocument";
import { Canvas } from "./Canvas";
import type { NavigateItem } from "./CommandPalette";
import { FrameCounter } from "./FrameCounter";
import { IntroOverlay } from "./IntroOverlay";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { LeftPanel } from "./LeftPanel";
import { MobileBottomBar } from "./MobileBottomBar";
import { MobileInspectorDrawer } from "./MobileInspectorDrawer";
import { MobileLayersSheet } from "./MobileLayersSheet";
import { RightPanel } from "./RightPanel";
import { TopBar, type Tool } from "./TopBar";

// Keyboard-triggered overlay, never needed for first paint or SSR — its
// own chunk, fetched only once the user actually opens the palette.
const CommandPalette = dynamic(
  () => import("./CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;
type NavNode = Extract<CanvasNode, { type: "frame" | "group" }>;

const MOBILE_MIN_ZOOM = 0.25;
const MOBILE_MAX_ZOOM = 2;

type CanvasWorkspaceProps = {
  /** Only set when the URL genuinely had ?page=<slug> for a real project —
   * a bare "/" stays on Home rather than immediately rewriting itself. */
  initialPageId?: PageId;
};

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.isContentEditable)
  );
}

function readPageParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("page");
}

export function CanvasWorkspace({ initialPageId }: CanvasWorkspaceProps) {
  const isMobile = useIsMobile();

  const [pageId, setPageId] = useState<PageId>(initialPageId ?? "home");
  const currentProject =
    pageId === "home" ? undefined : projects.find((p) => p.slug === pageId);

  const pageNodes = useMemo(() => getPageNodes(pageId), [pageId]);
  const spatialNodes = useMemo(
    () =>
      pageNodes.filter(
        (n): n is SpatialNode => n.type === "frame" || n.type === "group",
      ),
    [pageNodes],
  );
  const childrenByParent = useMemo(
    () => groupChildrenByParent(pageNodes),
    [pageNodes],
  );
  const layerTree = useMemo(() => buildLayerTree(pageNodes), [pageNodes]);

  // The FOCUSED-state stepping order for THIS page — its own frames, in
  // the order content/canvas.ts generated them. Deliberately not a
  // separately hand-authored list any more: a page's node order already
  // is its natural viewing order, so there's nothing extra to keep in
  // sync when a page's content changes.
  const frameOrder = useMemo(
    () =>
      spatialNodes
        .filter((n): n is Extract<SpatialNode, { type: "frame" }> =>
          n.type === "frame",
        )
        .map((n) => n.id),
    [spatialNodes],
  );

  // Home's project tiles: clicking one navigates to that project's page
  // instead of the normal FOCUSED zoom-to-frame.
  const pageLinks = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of spatialNodes) {
      if (n.type === "frame" && n.content?.pageLink) {
        map.set(n.id, n.content.pageLink);
      }
    }
    return map;
  }, [spatialNodes]);

  const navigateItems: NavigateItem[] = useMemo(() => {
    const byId = new Map(spatialNodes.map((n) => [n.id, n]));
    return spatialNodes
      .filter((n): n is NavNode => n.type === "frame" || n.type === "group")
      .map((n) => {
        const parent = n.parentId ? byId.get(n.parentId) : undefined;
        const label =
          parent && parent.type === "group"
            ? `${parent.name} — ${n.name}`
            : n.name;
        return {
          id: n.id,
          label,
          icon: n.type === "group" ? "group" : "frame",
        } as const;
      });
  }, [spatialNodes]);

  // Skip re-pushing history when the pageId change *is* the navigation
  // (a popstate event) — otherwise back/forward would fight itself.
  const skipUrlSyncRef = useRef(false);

  const navigateToPage = useCallback(
    (id: PageId) => {
      setPageId((prev) => (prev === id ? prev : id));
    },
    [],
  );

  const engineMinZoom = isMobile ? MOBILE_MIN_ZOOM : undefined;
  const engineMaxZoom = isMobile ? MOBILE_MAX_ZOOM : undefined;

  const onEscapeUp = useCallback(() => {
    if (pageId === "home") return false;
    navigateToPage("home");
    return true;
  }, [pageId, navigateToPage]);

  const engine = useCanvasEngine(spatialNodes, undefined, {
    minZoom: engineMinZoom,
    maxZoom: engineMaxZoom,
    isMobile,
    frameOrder,
    pageLinks,
    onNavigatePage: navigateToPage,
    onEscapeUp,
  });
  const {
    containerRef,
    transform,
    x,
    y,
    scale,
    selectedId,
    setSelectedId,
    setHandTool,
    visibleFrameIds,
    lodBand,
    zoomPercent,
    zoomToFrame,
    zoomToFit,
    zoomToSelection,
    zoomToPercent,
  } = engine;

  // The very first reveal (whatever page we booted on) is owned entirely
  // by useIntroSequence's own zoom-to-fit-all animation — a page's own
  // "everything" IS its fit-all view now, deep-linked or not, so it needs
  // no special per-frame target the way the old single-canvas deep links
  // did.
  const { phase: introPhase } = useIntroSequence({
    containerRef,
    x,
    y,
    scale,
    frames: spatialNodes,
    targetFrame: undefined,
    minZoom: engineMinZoom,
    maxZoom: engineMaxZoom,
  });

  const [tool, setTool] = useState<Tool>("move");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [layersSheetOpen, setLayersSheetOpen] = useState(false);

  useEffect(() => {
    setHandTool(tool === "hand");
  }, [tool, setHandTool]);

  // ---- switching pages: zoom-to-fit the new page (or a pending focus
  // frame, e.g. Share jumping to Contact from a project page) ----

  const isFirstPageRef = useRef(true);
  const pendingFocusRef = useRef<string | null>(null);

  useEffect(() => {
    if (isFirstPageRef.current) {
      // The very first page is the intro sequence's job, not this effect's.
      isFirstPageRef.current = false;
      return;
    }
    if (pendingFocusRef.current) {
      const id = pendingFocusRef.current;
      pendingFocusRef.current = null;
      setSelectedId(id);
      zoomToFrame(id);
    } else {
      setSelectedId(null);
      zoomToFit();
    }
    // Only page changes should re-fit — zoomToFit/zoomToFrame identity
    // changes with every spatialNodes update, which itself changes with
    // pageId, so this still only fires once per real page switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  // ---- Tool shortcuts (V/H), the command palette (Cmd/Ctrl+K), and the
  // shortcuts dialog (?) ----

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "v") setTool("move");
      else if (key === "h") setTool("hand");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ---- URL <-> page sync ("/?page=<slug>", Home stays at "/") ----

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }
    const current = readPageParam();
    if (pageId === "home") {
      if (current === null) return;
      const url = new URL(window.location.href);
      url.searchParams.delete("page");
      window.history.pushState({ page: null }, "", url);
      return;
    }
    if (current === pageId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("page", pageId);
    window.history.pushState({ page: pageId }, "", url);
  }, [pageId]);

  useEffect(() => {
    function onPopState() {
      const id = readPageParam() ?? "home";
      const valid = PAGES.some((p) => p.id === id) ? id : "home";
      skipUrlSyncRef.current = true;
      setPageId(valid);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleSelectFrame = (frameId: string) => {
    const linkedPage = pageLinks.get(frameId);
    if (linkedPage) {
      navigateToPage(linkedPage);
      return;
    }
    setSelectedId(frameId);
    zoomToFrame(frameId);
  };

  // The semantic document's per-frame links: focusing (Tab) just keeps the
  // canvas and right panel in sync, without navigating — otherwise tabbing
  // past a project tile would fly you away from Home mid-traversal.
  // Activating (click/Enter) is real intent, same as any other selection —
  // including, for a project tile, navigating to that project's page.
  const handleFocusFrame = (id: string) => {
    setSelectedId(id);
    zoomToFrame(id);
  };
  const handleActivateFrame = handleSelectFrame;

  const handleShare = () => {
    if (pageId !== "home") {
      pendingFocusRef.current = "contact";
      navigateToPage("home");
      return;
    }
    setSelectedId("contact");
    zoomToFrame("contact");
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contact.email).catch(() => {});
  };

  const handleOpenResume = contact.resumeUrl
    ? () => {
        window.open(contact.resumeUrl, "_blank", "noopener,noreferrer");
      }
    : undefined;

  // FOCUSED state: the current selection is a real frame in this page's
  // own order (not null, not a group) — drives the desktop frame counter.
  const focusedIndex = selectedId ? frameOrder.indexOf(selectedId) : -1;

  const selectedNode = selectedId
    ? (spatialNodes.find(
        (n): n is Extract<CanvasNode, { type: "frame" | "group" }> =>
          n.id === selectedId && (n.type === "frame" || n.type === "group"),
      ) ?? null)
    : null;

  // ---- Previous/Next project + Back to Home (project pages only) ----

  const projectIndex =
    pageId === "home" ? -1 : projects.findIndex((p) => p.slug === pageId);
  const prevProject = projectIndex > 0 ? projects[projectIndex - 1] : undefined;
  const nextProject =
    projectIndex !== -1 && projectIndex < projects.length - 1
      ? projects[projectIndex + 1]
      : undefined;

  // ---- mobile Prev/Next: steps through every real frame on this page ----

  const currentFrameIndex = useMemo(() => {
    if (!selectedId) return null;
    const i = frameOrder.indexOf(selectedId);
    return i === -1 ? null : i;
  }, [frameOrder, selectedId]);

  const goToFrameIndex = (index: number) => {
    const id = frameOrder[index];
    if (id) handleSelectFrame(id);
  };
  const handlePrevFrame = () => {
    goToFrameIndex(currentFrameIndex === null ? 0 : currentFrameIndex - 1);
  };
  const handleNextFrame = () => {
    goToFrameIndex(currentFrameIndex === null ? 0 : currentFrameIndex + 1);
  };

  const canvasEl = (
    <Canvas
      spatialNodes={spatialNodes}
      childrenByParent={childrenByParent}
      containerRef={containerRef}
      transform={transform}
      scale={scale}
      zoomPercent={zoomPercent}
      visibleFrameIds={visibleFrameIds}
      lodBand={lodBand}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onHoverFrame={setHoveredId}
    />
  );
  const semanticDocEl = (
    <SemanticDocument
      project={currentProject}
      layerTree={layerTree}
      childrenByParent={childrenByParent}
      selectedId={selectedId}
      onFocusFrame={handleFocusFrame}
      onActivateFrame={handleActivateFrame}
    />
  );

  if (isMobile) {
    return (
      <div className="flex h-full w-full flex-col">
        <IntroOverlay phase={introPhase} />
        <TopBar
          tool={tool}
          onToolChange={setTool}
          zoomPercent={zoomPercent}
          onZoomToFit={zoomToFit}
          onZoomToSelection={zoomToSelection}
          onZoomToPercent={zoomToPercent}
          onShare={handleShare}
          isMobile
        />
        <div className="relative min-h-0 flex-1">
          {canvasEl}
          {semanticDocEl}
          {selectedNode && (
            <MobileInspectorDrawer
              key={selectedNode.id}
              selectedNode={selectedNode}
              project={currentProject}
            />
          )}
        </div>
        <MobileBottomBar
          currentIndex={currentFrameIndex}
          total={frameOrder.length}
          onPrev={handlePrevFrame}
          onNext={handleNextFrame}
          onOpenLayers={() => setLayersSheetOpen(true)}
        />
        {layersSheetOpen && (
          <MobileLayersSheet
            pages={PAGES}
            currentPageId={pageId}
            onSelectPage={navigateToPage}
            layerTree={layerTree}
            selectedId={selectedId}
            onSelectFrame={handleSelectFrame}
            onClose={() => setLayersSheetOpen(false)}
          />
        )}
        {paletteOpen && (
          <CommandPalette
            onClose={() => setPaletteOpen(false)}
            navigateItems={navigateItems}
            onNavigate={handleSelectFrame}
            onZoomToFit={zoomToFit}
            onCopyEmail={handleCopyEmail}
            onOpenResume={handleOpenResume}
          />
        )}
        {shortcutsOpen && (
          <KeyboardShortcutsDialog onClose={() => setShortcutsOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <IntroOverlay phase={introPhase} />
      <TopBar
        tool={tool}
        onToolChange={setTool}
        zoomPercent={zoomPercent}
        onZoomToFit={zoomToFit}
        onZoomToSelection={zoomToSelection}
        onZoomToPercent={zoomToPercent}
        onShare={handleShare}
        pageName={currentProject?.title}
        onBackToHome={pageId !== "home" ? () => navigateToPage("home") : undefined}
        onPrevProject={
          prevProject ? () => navigateToPage(prevProject.slug) : undefined
        }
        onNextProject={
          nextProject ? () => navigateToPage(nextProject.slug) : undefined
        }
      />
      <div className="flex min-h-0 flex-1">
        <LeftPanel
          pages={PAGES}
          currentPageId={pageId}
          onSelectPage={navigateToPage}
          layerTree={layerTree}
          collapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed((v) => !v)}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelectFrame={handleSelectFrame}
          onHoverFrame={setHoveredId}
        />
        <div className="relative flex min-h-0 flex-1">
          {canvasEl}
          {semanticDocEl}
          {focusedIndex !== -1 && (
            <FrameCounter index={focusedIndex} total={frameOrder.length} />
          )}
        </div>
        <RightPanel selectedNode={selectedNode} project={currentProject} />
      </div>
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          navigateItems={navigateItems}
          onNavigate={handleSelectFrame}
          onZoomToFit={zoomToFit}
          onCopyEmail={handleCopyEmail}
          onOpenResume={handleOpenResume}
        />
      )}
      {shortcutsOpen && (
        <KeyboardShortcutsDialog onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  );
}
