import { about, contact } from "@/content/about";
import type { CanvasNode } from "@/content/canvas";
import { site } from "@/content/site";
import type { Project } from "@/content/types";
import { PlaceholderText } from "@/lib/canvas/placeholder-text";
import { ExternalLinkIcon } from "./icons";

type SpatialNode = Extract<CanvasNode, { type: "frame" | "group" }>;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-off-white/60 px-4 pt-4 pb-2 text-[11px] font-medium tracking-wide uppercase">
      {children}
    </h2>
  );
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-1">
      <span className="text-off-white/50 shrink-0 text-[11px]">{label}</span>
      <span className="text-off-white/90 truncate text-right font-mono text-[11px]">
        <PlaceholderText text={value} />
      </span>
    </div>
  );
}

function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-off-white/70 hover:text-selection flex items-center justify-between gap-2 px-4 py-1.5 text-[11px] transition-colors"
    >
      {label}
      <ExternalLinkIcon className="h-3 w-3 shrink-0 opacity-60" />
    </a>
  );
}

function FileInfoPanel() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
      <SectionHeading>File</SectionHeading>
      <div className="px-4 pb-3">
        <div className="text-off-white text-[13px] font-medium">
          {about.name}
        </div>
        <div className="text-off-white/60 text-[11px]">{about.role}</div>
      </div>
      <p className="text-off-white/75 px-4 pb-3 text-[11px] leading-relaxed">
        <PlaceholderText text={about.bioShort} />
      </p>
      <div className="bg-off-white/10 mx-4 h-px" />
      <SectionHeading>Info</SectionHeading>
      <PropertyRow label="Location" value={site.location.display} />
      <PropertyRow label="Status" value={about.availability} />
      <div className="bg-off-white/10 mx-4 my-3 h-px" />
      <SectionHeading>Links</SectionHeading>
      <div className="flex flex-col">
        <LinkRow label="Email" href={`mailto:${contact.email}`} />
        {contact.socials.map((s) => (
          <LinkRow key={s.label} label={s.label} href={s.url} />
        ))}
        <LinkRow label="Résumé (PDF)" href={contact.resumeUrl} />
      </div>
    </div>
  );
}

function ProjectInspector({
  node,
  project,
}: {
  node: SpatialNode;
  project: Project;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
      <SectionHeading>
        {node.type === "group" ? "Group" : "Frame"}
      </SectionHeading>
      <div className="px-4 pb-3">
        <div className="text-off-white text-[13px] font-medium">
          {node.name}
        </div>
      </div>
      <div className="bg-off-white/10 mx-4 h-px" />
      <SectionHeading>Properties</SectionHeading>
      <PropertyRow label="Role" value={project.role} />
      <PropertyRow label="Year" value={String(project.year)} />
      <PropertyRow label="Team" value={project.team} />
      <PropertyRow label="Duration" value={project.duration} />
      <PropertyRow label="Tools" value={project.tools.join(", ")} />
      <PropertyRow label="Platform" value={project.platform} />
      <div className="bg-off-white/10 mx-4 my-3 h-px" />
      <SectionHeading>Rationale</SectionHeading>
      <div className="flex flex-col gap-2 px-4 pb-2">
        {project.rationale.map((line, i) => (
          <p key={i} className="text-off-white/75 text-[11px] leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function GenericFrameInspector({ node }: { node: SpatialNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
      <SectionHeading>
        {node.type === "group" ? "Group" : "Frame"}
      </SectionHeading>
      <div className="px-4 pb-3">
        <div className="text-off-white text-[13px] font-medium">
          {node.name}
        </div>
      </div>
      <div className="bg-off-white/10 mx-4 h-px" />
      <SectionHeading>Properties</SectionHeading>
      {node.type === "frame" && node.content?.kind && (
        <PropertyRow label="Kind" value={node.content.kind} />
      )}
      <PropertyRow label="X" value={String(node.x)} />
      <PropertyRow label="Y" value={String(node.y)} />
      <PropertyRow label="W" value={String(node.width)} />
      <PropertyRow label="H" value={String(node.height)} />
    </div>
  );
}

/** The inspector's content, with no opinion about its own shell — the
 * desktop RightPanel wraps this in a fixed side panel, the mobile
 * InspectorDrawer wraps the exact same component in a collapsible drawer,
 * so "what shows for a selection" can't drift between the two. */
export function InspectorContent({
  selectedNode,
  project,
}: {
  selectedNode: SpatialNode | null;
  project: Project | undefined;
}) {
  if (!selectedNode) return <FileInfoPanel />;
  if (project)
    return <ProjectInspector node={selectedNode} project={project} />;
  return <GenericFrameInspector node={selectedNode} />;
}
