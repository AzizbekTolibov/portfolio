"use client";

import type { CanvasNode } from "@/content/canvas";
import type {
  AboutContent,
  HomeContent,
  Project,
  SiteContent,
} from "@/content/types";
import { EditInspector } from "./EditInspector";
import { InspectorContent } from "./InspectorContent";

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

type FieldPatch = Partial<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

type RightPanelProps = {
  selectedNode: SpatialNode | null;
  project: Project | undefined;
  /** /edit swaps the normal file/project inspector for the editable one —
   * see EditInspector. */
  editMode?: boolean;
  /** /edit only — commits an edited x/y/w/h field for the selection. */
  onCommitField?: (patch: FieldPatch) => void;
  /** /edit only — non-blocking note, not a constraint (see the spec). */
  overlapWarning?: boolean;
  /** /edit only — live (unsaved) content, and the commit functions for
   * it. Undefined on the public site, where EditInspector never renders. */
  site?: SiteContent;
  home?: HomeContent;
  about?: AboutContent;
  projects?: Project[];
  onCommitSite?: (patch: Partial<SiteContent>) => void;
  onCommitHome?: (patch: Partial<HomeContent>) => void;
  onCommitAbout?: (patch: Partial<AboutContent>) => void;
  onUpdateProject?: (slug: string, patch: Partial<Project>) => void;
  isSlugTaken?: (slug: string, excluding?: string) => boolean;
};

/** Desktop's fixed side panel — the inspector content itself lives in
 * InspectorContent (or, in edit mode, EditInspector), shared with the
 * mobile drawer. */
export function RightPanel({
  selectedNode,
  project,
  editMode = false,
  onCommitField,
  overlapWarning = false,
  site,
  home,
  about,
  projects,
  onCommitSite,
  onCommitHome,
  onCommitAbout,
  onUpdateProject,
  isSlugTaken,
}: RightPanelProps) {
  return (
    <div className="bg-panel border-off-white/10 flex w-60 shrink-0 flex-col border-l">
      {editMode && site && home && about && projects ? (
        <EditInspector
          selectedNode={selectedNode}
          onCommitField={onCommitField}
          overlapWarning={overlapWarning}
          site={site}
          home={home}
          about={about}
          projects={projects}
          currentProject={project}
          onCommitSite={onCommitSite!}
          onCommitHome={onCommitHome!}
          onCommitAbout={onCommitAbout!}
          onUpdateProject={onUpdateProject!}
          isSlugTaken={isSlugTaken!}
        />
      ) : (
        <InspectorContent selectedNode={selectedNode} project={project} />
      )}
    </div>
  );
}
