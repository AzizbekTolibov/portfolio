import type { CanvasNode } from "@/content/canvas";
import { projects } from "@/content/projects";
import type { Project } from "@/content/types";
import type { LayerTreeNode } from "@/lib/canvas/tree";
import { site } from "@/content/site";
import { FrameLink } from "./FrameLink";

type Props = {
  /** undefined on Home; the current project on a project page — decides
   * the document's <h1> and whether a "read the full write-up" link to
   * the dedicated /work/[slug] SEO page is shown. */
  project: Project | undefined;
  layerTree: LayerTreeNode[];
  childrenByParent: Map<string, CanvasNode[]>;
  selectedId: string | null;
  onFocusFrame: (id: string) => void;
  onActivateFrame: (id: string) => void;
};

const HEADING_TAGS = ["h2", "h3", "h4"] as const;

function FrameContent({
  node,
  childrenByParent,
}: {
  node: Extract<CanvasNode, { type: "frame" }>;
  childrenByParent: Map<string, CanvasNode[]>;
}) {
  const children = childrenByParent.get(node.id) ?? [];
  return (
    <>
      {children.map((child) => {
        if (child.type === "image") {
          return (
            <img
              key={child.id}
              src={child.content.src}
              alt={child.content.alt}
            />
          );
        }
        if (child.type === "text" && child.content.text) {
          return (
            <p key={child.id}>
              {child.content.semanticText ?? child.content.text}
            </p>
          );
        }
        if (child.type === "property-groups") {
          return (
            <div key={child.id}>
              {child.content.sections.map((section) => (
                <div key={section.heading}>
                  <h4>{section.heading}</h4>
                  <dl>
                    {section.groups.map((group) => (
                      <div key={group.label}>
                        <dt>{group.label}</dt>
                        <dd>{group.items.join(", ")}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          );
        }
        return null;
      })}
    </>
  );
}

type EntryProps = {
  entry: LayerTreeNode;
  depth: number;
  childrenByParent: Map<string, CanvasNode[]>;
  selectedId: string | null;
  onFocusFrame: (id: string) => void;
  onActivateFrame: (id: string) => void;
  /** The current page's own URL — the honest no-JS/crawler fallback
   * destination for any FrameLink that isn't itself a page-link (frames
   * aren't individually deep-linkable, only pages are). */
  pageHref: string;
};

function Entry({
  entry,
  depth,
  childrenByParent,
  selectedId,
  onFocusFrame,
  onActivateFrame,
  pageHref,
}: EntryProps) {
  const { node, children } = entry;
  const HeadingTag = HEADING_TAGS[Math.min(depth, HEADING_TAGS.length - 1)];
  const headingId = `${node.id}-heading`;

  // Home's project tiles: a group wrapping one frame with content.pageLink.
  // Rendered as one cohesive section (image alt, title, year, two real
  // actions) rather than recursing into a redundant nested "Cover" heading.
  const pageLinkChild = children.find(
    (c): c is LayerTreeNode & { node: Extract<CanvasNode, { type: "frame" }> } =>
      c.node.type === "frame" && !!c.node.content?.pageLink,
  );
  const linkedProject = pageLinkChild
    ? projects.find((p) => p.slug === pageLinkChild.node.content?.pageLink)
    : undefined;

  if (linkedProject && pageLinkChild) {
    const frameNode = pageLinkChild.node;
    return (
      <section aria-labelledby={headingId}>
        <HeadingTag id={headingId}>{node.name}</HeadingTag>
        <FrameContent node={frameNode} childrenByParent={childrenByParent} />
        <p>
          <a href={`/work/${linkedProject.slug}`}>
            Read the full {linkedProject.title} write-up
          </a>
        </p>
        <p>
          <FrameLink
            id={frameNode.id}
            href={`/?page=${linkedProject.slug}`}
            current={selectedId === frameNode.id}
            onFocusFrame={onFocusFrame}
            onActivateFrame={onActivateFrame}
          >
            Open the {linkedProject.title} page
          </FrameLink>
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId}>
      <HeadingTag id={headingId}>{node.name}</HeadingTag>
      {node.type === "frame" && (
        <FrameContent node={node} childrenByParent={childrenByParent} />
      )}
      <p>
        <FrameLink
          id={node.id}
          href={pageHref}
          current={selectedId === node.id}
          onFocusFrame={onFocusFrame}
          onActivateFrame={onActivateFrame}
        >
          {node.type === "group"
            ? `View the ${node.name} cluster in the canvas`
            : `Jump to "${node.name}" in the canvas`}
        </FrameLink>
      </p>
      {children.map((child) => (
        <Entry
          key={child.node.id}
          entry={child}
          depth={depth + 1}
          childrenByParent={childrenByParent}
          selectedId={selectedId}
          onFocusFrame={onFocusFrame}
          onActivateFrame={onActivateFrame}
          pageHref={pageHref}
        />
      ))}
    </section>
  );
}

function isProjectTileEntry(entry: LayerTreeNode): boolean {
  return entry.children.some(
    (c) => c.node.type === "frame" && !!c.node.content?.pageLink,
  );
}

/**
 * The parallel semantic document: every frame's real content, in logical
 * reading order, as a genuine in-DOM `<main>` — landmarks, correct heading
 * hierarchy, alt text, real links. Generated from the exact same
 * layerTree/childrenByParent the canvas and the left panel already use
 * (see src/lib/canvas/tree.ts) for whichever Figma Page is currently
 * active, so it cannot drift out of sync with what's actually on screen —
 * and is regenerated fresh on every page switch, same as the canvas.
 * Visually hidden (sr-only) — this is what screen readers and crawlers
 * see; sighted users get the canvas, which is marked aria-hidden precisely
 * because this document duplicates its content.
 */
export function SemanticDocument({
  project,
  layerTree,
  childrenByParent,
  selectedId,
  onFocusFrame,
  onActivateFrame,
}: Props) {
  const pageHref = project ? `/?page=${project.slug}` : "/";
  const entryProps = {
    childrenByParent,
    selectedId,
    onFocusFrame,
    onActivateFrame,
    pageHref,
  };

  if (project) {
    return (
      <main
        id="semantic-content"
        className="sr-only"
        aria-label={`${project.title} project page`}
      >
        <h1>
          {project.title} — {project.year}
        </h1>
        <p>
          <a href={`/work/${project.slug}`}>
            Read the full {project.title} write-up
          </a>
        </p>
        {layerTree.map((entry) => (
          <Entry key={entry.node.id} entry={entry} depth={1} {...entryProps} />
        ))}
      </main>
    );
  }

  const workEntries = layerTree.filter(isProjectTileEntry);
  const otherEntries = layerTree.filter((e) => !isProjectTileEntry(e));
  const coverEntry = otherEntries.find((e) => e.node.id === "cover-group");
  const restEntries = otherEntries.filter((e) => e.node.id !== "cover-group");

  return (
    <main
      id="semantic-content"
      className="sr-only"
      aria-label="Portfolio contents"
    >
      <h1>
        {site.name} — {site.role}
      </h1>

      {coverEntry && <Entry entry={coverEntry} depth={0} {...entryProps} />}

      {workEntries.length > 0 && (
        <section aria-labelledby="work-heading">
          <h2 id="work-heading">Work</h2>
          {workEntries.map((entry) => (
            <Entry key={entry.node.id} entry={entry} depth={1} {...entryProps} />
          ))}
        </section>
      )}

      {restEntries.map((entry) => (
        <Entry key={entry.node.id} entry={entry} depth={0} {...entryProps} />
      ))}
    </main>
  );
}
