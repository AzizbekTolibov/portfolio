import { ImageResponse } from "next/og";
import { projects } from "@/content/projects";
import { OG_IMAGE_SIZE, ProjectOgImage } from "@/lib/og-content";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  return new ImageResponse(
    project ? (
      <ProjectOgImage
        title={project.title}
        role={project.role}
        year={project.year}
      />
    ) : (
      <div style={{ width: "100%", height: "100%", display: "flex" }} />
    ),
    size,
  );
}
