import { ImageResponse } from "next/og";
import { projects } from "@/content/projects";
import { OG_IMAGE_SIZE, ProjectOgImage } from "@/lib/og-content";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  return new ImageResponse(
    <ProjectOgImage
      title={project?.title ?? slug}
      role={project?.role ?? ""}
      year={project?.year ?? new Date().getFullYear()}
    />,
    size,
  );
}
