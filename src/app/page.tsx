import type { Metadata } from "next";
import { CanvasWorkspace } from "@/components/canvas/CanvasWorkspace";
import { canvasNodes } from "@/content/canvas";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

type CanvasPageProps = {
  searchParams: Promise<{ node?: string }>;
};

function findNavigableNode(id: string) {
  const match = canvasNodes.find((n) => n.id === id);
  return match && (match.type === "frame" || match.type === "group")
    ? match
    : undefined;
}

// Deep links are query-driven ("/?node=<id>", Figma-style — see
// CanvasWorkspace's URL sync), so this page is dynamically rendered per
// request rather than statically generated; the per-project SEO surface
// that *is* statically generated lives at /work/[slug] instead.
export async function generateMetadata({
  searchParams,
}: CanvasPageProps): Promise<Metadata> {
  const { node } = await searchParams;
  if (!node) return {};

  const match = findNavigableNode(node);
  if (!match) return {};

  const project = match.content?.projectSlug
    ? projects.find((p) => p.slug === match.content?.projectSlug)
    : undefined;

  const title = project ? `${project.title} — ${match.name}` : match.name;
  const description = project ? project.shortDescription : site.tagline;

  return {
    title,
    description,
    openGraph: { title: `${title} — ${site.name}`, description },
    twitter: { title: `${title} — ${site.name}`, description },
  };
}

export default async function CanvasPage({ searchParams }: CanvasPageProps) {
  const { node } = await searchParams;
  const initialFrameId = node ?? "cover";

  return (
    <CanvasWorkspace
      nodes={canvasNodes}
      initialFrameId={initialFrameId}
      initialSelectedId={node}
    />
  );
}
