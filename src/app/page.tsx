import type { Metadata } from "next";
import { CanvasWorkspace } from "@/components/canvas/CanvasWorkspace";
import { PAGES } from "@/content/canvas";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

type CanvasPageProps = {
  searchParams: Promise<{ page?: string }>;
};

// Deep links are query-driven ("/?page=<slug>", Figma-style — see
// CanvasWorkspace's URL sync), so this page is dynamically rendered per
// request rather than statically generated; the per-project SEO surface
// that *is* statically generated lives at /work/[slug] instead.
export async function generateMetadata({
  searchParams,
}: CanvasPageProps): Promise<Metadata> {
  const { page } = await searchParams;
  if (!page) return {};

  const project = projects.find((p) => p.slug === page);
  if (!project) return {};

  const title = `${project.title} — ${project.year}`;
  return {
    title,
    description: project.description,
    openGraph: {
      title: `${title} — ${site.name}`,
      description: project.description,
    },
    twitter: {
      title: `${title} — ${site.name}`,
      description: project.description,
    },
  };
}

export default async function CanvasPage({ searchParams }: CanvasPageProps) {
  const { page } = await searchParams;
  // Only a real page id counts as a deep link — an unrecognized ?page=
  // value falls back to Home rather than rendering an empty page.
  const initialPageId =
    page && PAGES.some((p) => p.id === page) ? page : undefined;

  return <CanvasWorkspace initialPageId={initialPageId} />;
}
