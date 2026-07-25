import type { CanvasNode } from "@/content/canvas";
import { projects } from "@/content/projects";
import type { LayerTreeNode } from "@/lib/canvas/tree";
import { site } from "@/content/site";
import { FrameLink } from "./FrameLink";

type Props = {
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
          return <p key={child.id}>{child.content.text}</p>;
        }
        return null;
      })}
    </>
  );
}

function Entry({
  entry,
  depth,
  childrenByParent,
  selectedId,
  onFocusFrame,
  onActivateFrame,
}: {
  entry: LayerTreeNode;
  depth: number;
  childrenByParent: Map<string, CanvasNode[]>;
  selectedId: string | null;
  onFocusFrame: (id: string) => void;
  onActivateFrame: (id: string) => void;
}) {
  const { node, children } = entry;
  const HeadingTag = HEADING_TAGS[Math.min(depth, HEADING_TAGS.length - 1)];
  const headingId = `${node.id}-heading`;

  const caseStudyLink =
    node.type === "group" && node.content?.projectSlug
      ? projects.find((p) => p.slug === node.content?.projectSlug)
      : undefined;

  return (
    <section aria-labelledby={headingId}>
      <HeadingTag id={headingId}>{node.name}</HeadingTag>
      {node.type === "frame" && (
        <FrameContent node={node} childrenByParent={childrenByParent} />
      )}
      {caseStudyLink && (
        <p>
          <a href={`/work/${caseStudyLink.slug}`}>
            Read the full {caseStudyLink.title} case study
          </a>
        </p>
      )}
      <p>
        <FrameLink
          id={node.id}
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
        />
      ))}
    </section>
  );
}

/**
 * The parallel semantic document: every frame's real content, in logical
 * reading order, as a genuine in-DOM `<main>` — landmarks, correct heading
 * hierarchy, alt text, real links. Generated from the exact same
 * layerTree/childrenByParent the canvas and the left panel already use
 * (see src/lib/canvas/tree.ts), so it cannot drift out of sync with what's
 * actually on the canvas. Visually hidden (sr-only) — this is what screen
 * readers and crawlers see; sighted users get the canvas, which is marked
 * aria-hidden precisely because this document duplicates its content.
 */
export function SemanticDocument({
  layerTree,
  childrenByParent,
  selectedId,
  onFocusFrame,
  onActivateFrame,
}: Props) {
  const coverEntry = layerTree.find((e) => e.node.id === "cover");
  const projectEntries = layerTree.filter(
    (e) => e.node.type === "group" && !!e.node.content?.projectSlug,
  );
  const aboutEntry = layerTree.find((e) => e.node.id === "about-group");
  const contactEntry = layerTree.find((e) => e.node.id === "contact");

  const entryProps = {
    childrenByParent,
    selectedId,
    onFocusFrame,
    onActivateFrame,
  };

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

      {projectEntries.length > 0 && (
        <section aria-labelledby="work-heading">
          <h2 id="work-heading">Work</h2>
          {projectEntries.map((entry) => (
            <Entry
              key={entry.node.id}
              entry={entry}
              depth={1}
              {...entryProps}
            />
          ))}
        </section>
      )}

      {aboutEntry && <Entry entry={aboutEntry} depth={0} {...entryProps} />}
      {contactEntry && <Entry entry={contactEntry} depth={0} {...entryProps} />}
    </main>
  );
}
