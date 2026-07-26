import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  // /edit (see src/app/edit/page.tsx) is deliberately absent — only "/"
  // and "/work/[slug]" are ever listed here, so it was never a candidate.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
  ];

  // /work/[slug] is the crawlable surface for every project — every
  // project also gets its own Figma Page on the canvas (see PAGES in
  // content/canvas.ts).
  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/work/${project.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...projectRoutes];
}
