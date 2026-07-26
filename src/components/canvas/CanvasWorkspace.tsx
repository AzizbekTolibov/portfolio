"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { contact } from "@/content/about";
import { FRAME_ORDER, type CanvasNode } from "@/content/canvas";
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
  nodes: CanvasNode[];
  initialFrameId?: string;
  /** Only set when the URL genuinely had ?node=, so a bare "/" doesn't
   * immediately rewrite itself into "/?node=cover". */
  initialSelectedId?: string;
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

function readNodeParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("node");
}

export function CanvasWorkspace({
  nodes,
  initialFrameId,
  initialSelectedId,
}: CanvasWorkspaceProps) {
  const isMobile = useIsMobile();

  const spatialNodes = useMemo(
    () =>
      nodes.filter(
        (n): n is SpatialNode => n.type === "frame" || n.type === "group",
      ),
    [nodes],
  );
  const childrenByParent = useMemo(() => groupChildrenByParent(nodes), [nodes]);
  const layerTree = useMemo(() => buildLayerTree(nodes), [nodes]);

  // The explicit, hand-authored viewing order (see content/canvas.ts) — not
  // derived from the tree or from spatial coordinates, so it can be
  // reordered independently of both.
  const flatFrames = useMemo(
    () =>
      FRAME_ORDER.map((id) => spatialNodes.find((n) => n.id === id)).filter(
        (n): n is Extract<SpatialNode, { type: "frame" }> =>
          !!n && n.type === "frame",
      ),
    [spatialNodes],
  );

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

  const engineMinZoom = isMobile ? MOBILE_MIN_ZOOM : undefined;
  const engineMaxZoom = isMobile ? MOBILE_MAX_ZOOM : undefined;
  const engine = useCanvasEngine(spatialNodes, initialFrameId, {
    minZoom: engineMinZoom,
    maxZoom: engineMaxZoom,
    isMobile,
    frameOrder: FRAME_ORDER,
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

  // Only set for a real deep link — a bare "/" visit has no targetFrame, so
  // the intro sequence lands on the fit-all OVERVIEW instead of zooming
  // into a specific frame (see CLAUDE.md's navigation model).
  const targetFrame = useMemo(
    () => (initialFrameId ? spatialNodes.find((n) => n.id === initialFrameId) : undefined),
    [spatialNodes, initialFrameId],
  );
  const { phase: introPhase } = useIntroSequence({
    containerRef,
    x,
    y,
    scale,
    frames: spatialNodes,
    targetFrame,
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

  // Select whatever the URL named on first load — but only if it actually
  // named something; a bare "/" should stay a bare "/", not adopt "cover"
  // as a selection and rewrite the address bar underneath the visitor.
  useEffect(() => {
    if (initialSelectedId) setSelectedId(initialSelectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selection always drives the camera — this is the deep-link entry
  // point's version of that rule. The intro sequence deliberately skips
  // OVERVIEW and leaves the camera parked at its "way out" prep position
  // for a deep link (see use-intro-sequence.ts); once it signals "done",
  // this fires the exact same zoomToFrame every other selection uses
  // (click, layers panel, command palette, prev/next), so there's one
  // code path responsible for "selected frame is what the camera shows,"
  // not two independent computations that can desync.
  const deepLinkZoomedRef = useRef(false);
  useEffect(() => {
    if (
      initialSelectedId &&
      introPhase === "done" &&
      !deepLinkZoomedRef.current
    ) {
      deepLinkZoomedRef.current = true;
      zoomToFrame(initialSelectedId);
    }
  }, [introPhase, initialSelectedId, zoomToFrame]);

  // Tool shortcuts (V/H), the command palette (Cmd/Ctrl+K), and the
  // shortcuts dialog (?) — separate from the engine's own keyboard handling
  // (space-pan/step, escape-deselect, zoom shortcuts, arrows/stepping),
  // which owns keys unrelated to these.
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

  // ---- URL <-> selection sync ("/?node=<id>", Figma-style deep links) ----

  // Set right before a selectedId change that shouldn't push (or even
  // touch) history: focus-driven sync (tabbing through the semantic
  // document) and popstate-driven sync (the change *is* the navigation).
  const skipUrlSyncRef = useRef(false);

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }
    if (!selectedId) return;
    if (readNodeParam() === selectedId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("node", selectedId);
    window.history.pushState({ node: selectedId }, "", url);
  }, [selectedId]);

  useEffect(() => {
    function onPopState() {
      const id = readNodeParam();
      skipUrlSyncRef.current = true;
      setSelectedId(id);
      if (id) zoomToFrame(id);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setSelectedId, zoomToFrame]);

  const handleSelectFrame = (frameId: string) => {
    setSelectedId(frameId);
    zoomToFrame(frameId);
  };

  // The semantic document's per-frame links: focusing (Tab) just keeps the
  // canvas and right panel in sync, without touching the URL — otherwise
  // tabbing through the document would spam the history stack. Activating
  // (click/Enter) is real navigation intent, same as any other selection.
  const handleFocusFrame = (id: string) => {
    skipUrlSyncRef.current = true;
    setSelectedId(id);
    zoomToFrame(id);
  };
  const handleActivateFrame = handleSelectFrame;

  const handleShare = () => {
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

  // FOCUSED state: the current selection is a real frame in the authored
  // order (not null, not a group) — drives the desktop frame counter.
  const focusedIndex = selectedId ? FRAME_ORDER.indexOf(selectedId) : -1;

  const selectedNode = selectedId
    ? (spatialNodes.find(
        (n): n is Extract<CanvasNode, { type: "frame" | "group" }> =>
          n.id === selectedId && (n.type === "frame" || n.type === "group"),
      ) ?? null)
    : null;
  const selectedProject = selectedNode?.content?.projectSlug
    ? projects.find((p) => p.slug === selectedNode.content?.projectSlug)
    : undefined;

  // ---- mobile Prev/Next: steps through every real frame in reading order ----

  const currentFrameIndex = useMemo(() => {
    if (!selectedId) return null;
    const i = flatFrames.findIndex((f) => f.id === selectedId);
    return i === -1 ? null : i;
  }, [flatFrames, selectedId]);

  const goToFrameIndex = (index: number) => {
    const frame = flatFrames[index];
    if (frame) handleSelectFrame(frame.id);
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
              project={selectedProject}
            />
          )}
        </div>
        <MobileBottomBar
          currentIndex={currentFrameIndex}
          total={flatFrames.length}
          onPrev={handlePrevFrame}
          onNext={handleNextFrame}
          onOpenLayers={() => setLayersSheetOpen(true)}
        />
        {layersSheetOpen && (
          <MobileLayersSheet
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
      />
      <div className="flex min-h-0 flex-1">
        <LeftPanel
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
            <FrameCounter index={focusedIndex} total={FRAME_ORDER.length} />
          )}
        </div>
        <RightPanel selectedNode={selectedNode} project={selectedProject} />
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
