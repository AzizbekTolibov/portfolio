"use client";

import { useState } from "react";
import {
  ChevronRightIcon,
  FrameToolIcon,
  HandToolIcon,
  MoveToolIcon,
} from "./icons";

export type Tool = "move" | "hand";

type TopBarProps = {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  zoomPercent: number;
  onZoomToFit: () => void;
  onZoomToSelection: () => void;
  onZoomToPercent: (percent: number) => void;
  onShare: () => void;
  isMobile?: boolean;
  /** Set only on a project page — the breadcrumb's third segment
   * ("Azizbek Tolibov / Portfolio 2026 / Auravest"), rendered as the
   * current, non-interactive location. */
  pageName?: string;
  /** Navigates Home — wired to the "Azizbek Tolibov" and "Portfolio 2026"
   * breadcrumb segments, which are real clickable links only when
   * `pageName` is set (i.e. those segments aren't already the current
   * location). Undefined on Home itself. */
  onGoHome?: () => void;
  /** Set only on /edit — the one visible signal that this is the editor,
   * not the public site, since the canvas itself renders identically in
   * both. */
  editMode?: boolean;
  /** Opens the project CRUD overlay — see ProjectManager. */
  onOpenProjects?: () => void;
  /** True whenever the in-memory content differs from what's on disk —
   * drives the dot next to Save and the beforeunload warning (see
   * use-edit-content.ts). */
  dirty?: boolean;
  saving?: boolean;
  saveError?: string | null;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
};

const ZOOM_PRESETS = [50, 100, 200];

/** A breadcrumb segment: plain (non-interactive) text when it's already
 * the current location, a real focusable button when it navigates. Never
 * a dead link — `onClick` is only ever passed when there's somewhere to
 * go. */
function BreadcrumbSegment({
  label,
  onClick,
  current,
}: {
  label: string;
  onClick?: () => void;
  current?: boolean;
}) {
  if (!onClick) {
    return (
      <span
        aria-current={current ? "page" : undefined}
        className="text-off-white/80 truncate"
      >
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-visible:ring-selection text-off-white/60 hover:text-off-white/90 focus-visible:text-off-white/90 truncate rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {label}
    </button>
  );
}

function ToolButton({
  label,
  shortcut,
  active,
  onClick,
  children,
}: {
  label: string;
  shortcut: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} (${shortcut})`}
      aria-pressed={active}
      title={`${label} — ${shortcut}`}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active
          ? "bg-selection/20 text-selection"
          : "text-off-white/60 hover:text-off-white hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function ZoomMenu({
  zoomPercent,
  onZoomToFit,
  onZoomToSelection,
  onZoomToPercent,
}: {
  zoomPercent: number;
  onZoomToFit: () => void;
  onZoomToSelection: () => void;
  onZoomToPercent: (percent: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-off-white/70 hover:text-off-white flex h-7 items-center gap-1 rounded px-2 font-mono text-[11px] hover:bg-white/5"
      >
        {zoomPercent}%
      </button>
      {open && (
        <div
          role="menu"
          className="bg-panel border-off-white/10 absolute top-8 right-0 z-10 w-40 rounded border py-1 shadow-lg"
        >
          {ZOOM_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              role="menuitem"
              // onMouseDown fires before the trigger's onBlur closes the menu
              onMouseDown={(e) => {
                e.preventDefault();
                onZoomToPercent(p);
                setOpen(false);
              }}
              className="text-off-white/80 hover:bg-selection/20 hover:text-off-white flex w-full items-center px-3 py-1.5 text-left font-mono text-[11px]"
            >
              {p}%
            </button>
          ))}
          <div className="bg-off-white/10 my-1 h-px" />
          <button
            type="button"
            role="menuitem"
            onMouseDown={(e) => {
              e.preventDefault();
              onZoomToFit();
              setOpen(false);
            }}
            className="text-off-white/80 hover:bg-selection/20 hover:text-off-white flex w-full items-center px-3 py-1.5 text-left text-[11px]"
          >
            Zoom to fit
            <span className="text-off-white/60 ml-auto font-mono">Shift 1</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onMouseDown={(e) => {
              e.preventDefault();
              onZoomToSelection();
              setOpen(false);
            }}
            className="text-off-white/80 hover:bg-selection/20 hover:text-off-white flex w-full items-center px-3 py-1.5 text-left text-[11px]"
          >
            Zoom to selection
            <span className="text-off-white/60 ml-auto font-mono">Shift 2</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar({
  tool,
  onToolChange,
  zoomPercent,
  onZoomToFit,
  onZoomToSelection,
  onZoomToPercent,
  onShare,
  isMobile = false,
  pageName,
  onGoHome,
  editMode = false,
  onOpenProjects,
  dirty = false,
  saving = false,
  saveError = null,
  onSave,
  onUndo,
  onRedo,
}: TopBarProps) {
  return (
    <header className="bg-panel border-off-white/10 relative z-20 flex h-12 shrink-0 items-center border-b px-3">
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <div
          className="bg-selection text-off-black flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] font-mono text-[10px] font-bold"
          aria-hidden="true"
        >
          AT
        </div>
        <nav
          aria-label="Breadcrumb"
          className="text-off-white/60 flex min-w-0 items-center gap-1 font-mono text-[11px] whitespace-nowrap"
        >
          <BreadcrumbSegment
            label="Azizbek Tolibov"
            onClick={pageName ? onGoHome : undefined}
          />
          {!isMobile && (
            <>
              <ChevronRightIcon className="h-3 w-3 shrink-0 opacity-50" />
              <BreadcrumbSegment
                label="Portfolio 2026"
                onClick={pageName ? onGoHome : undefined}
                current={!pageName}
              />
            </>
          )}
          {pageName && (
            <>
              <ChevronRightIcon className="h-3 w-3 shrink-0 opacity-50" />
              <BreadcrumbSegment label={pageName} current />
            </>
          )}
        </nav>
        {editMode && (
          <span className="bg-selection/15 text-selection shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide uppercase">
            Edit mode
          </span>
        )}
        {editMode && onOpenProjects && (
          <button
            type="button"
            onClick={onOpenProjects}
            className="text-off-white/70 hover:text-off-white shrink-0 rounded px-2 py-0.5 text-[11px] hover:bg-white/5"
          >
            Projects
          </button>
        )}
      </div>

      {!isMobile && (
        <div
          role="toolbar"
          aria-label="Canvas tools"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-0.5"
        >
          <ToolButton
            label="Move"
            shortcut="V"
            active={tool === "move"}
            onClick={() => onToolChange("move")}
          >
            <MoveToolIcon className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            label="Hand"
            shortcut="H"
            active={tool === "hand"}
            onClick={() => onToolChange("hand")}
          >
            <HandToolIcon className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            label="Frame"
            shortcut="F"
            active={false}
            onClick={() => {}}
          >
            <FrameToolIcon className="h-4 w-4" />
          </ToolButton>
        </div>
      )}

      <div className="flex flex-1 items-center justify-end gap-3">
        {editMode && onSave && (
          <div className="flex shrink-0 items-center gap-2">
            {saveError && (
              <span className="text-[11px] text-red-400" title={saveError}>
                Save failed
              </span>
            )}
            {!isMobile && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={onUndo}
                  aria-label="Undo (Cmd+Z)"
                  title="Undo — Cmd+Z"
                  className="text-off-white/60 hover:text-off-white flex h-7 w-7 items-center justify-center rounded hover:bg-white/5"
                >
                  ↶
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  aria-label="Redo (Cmd+Shift+Z)"
                  title="Redo — Cmd+Shift+Z"
                  className="text-off-white/60 hover:text-off-white flex h-7 w-7 items-center justify-center rounded hover:bg-white/5"
                >
                  ↷
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={!dirty || saving}
              className="bg-selection hover:bg-selection/90 flex items-center gap-1.5 rounded px-3 py-1 text-[11px] font-medium disabled:opacity-40"
              style={{ color: "#000" }}
            >
              {dirty && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-current"
                  aria-hidden="true"
                />
              )}
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onShare}
          className="bg-selection hover:bg-selection/90 shrink-0 rounded px-3 py-1 text-[11px] font-medium"
          style={{ color: "#000" }}
        >
          Share
        </button>
        {!isMobile && (
          <ZoomMenu
            zoomPercent={zoomPercent}
            onZoomToFit={onZoomToFit}
            onZoomToSelection={onZoomToSelection}
            onZoomToPercent={onZoomToPercent}
          />
        )}
      </div>
    </header>
  );
}
