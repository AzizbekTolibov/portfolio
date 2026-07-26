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
   * ("Azizbek Tolibov / Portfolio 2026 / Auravest"). */
  pageName?: string;
  /** Present only on a project page. */
  onBackToHome?: () => void;
  onPrevProject?: () => void;
  onNextProject?: () => void;
};

const ZOOM_PRESETS = [50, 100, 200];

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
  onBackToHome,
  onPrevProject,
  onNextProject,
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
          <span className="text-off-white/80 truncate">Azizbek Tolibov</span>
          {!isMobile && (
            <>
              <ChevronRightIcon className="h-3 w-3 shrink-0 opacity-50" />
              <span className={pageName ? "" : "text-off-white/80"}>
                Portfolio 2026
              </span>
            </>
          )}
          {pageName && (
            <>
              <ChevronRightIcon className="h-3 w-3 shrink-0 opacity-50" />
              <span className="text-off-white/80 truncate">{pageName}</span>
            </>
          )}
        </nav>
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
        {!isMobile && pageName && (
          <div
            role="group"
            aria-label="Project navigation"
            className="flex items-center gap-0.5"
          >
            <button
              type="button"
              onClick={onPrevProject}
              disabled={!onPrevProject}
              aria-label="Previous project"
              title="Previous project"
              className="text-off-white/70 hover:text-off-white flex h-7 items-center gap-1 rounded px-1.5 font-mono text-[11px] hover:bg-white/5 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRightIcon className="h-3 w-3 rotate-180" />
              Prev
            </button>
            <button
              type="button"
              onClick={onBackToHome}
              aria-label="Back to Home"
              title="Back to Home"
              className="text-off-white/70 hover:text-off-white flex h-7 items-center rounded px-2 font-mono text-[11px] hover:bg-white/5"
            >
              Home
            </button>
            <button
              type="button"
              onClick={onNextProject}
              disabled={!onNextProject}
              aria-label="Next project"
              title="Next project"
              className="text-off-white/70 hover:text-off-white flex h-7 items-center gap-1 rounded px-1.5 font-mono text-[11px] hover:bg-white/5 disabled:pointer-events-none disabled:opacity-30"
            >
              Next
              <ChevronRightIcon className="h-3 w-3" />
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
