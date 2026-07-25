import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
  ];

  // /work/[slug] is the crawlable surface for every project — including
  // the ones not visualized on the canvas (only `featured` projects get a
  // cluster there; every project gets a case-study page here).
  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/work/${project.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...projectRoutes];
}
