import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Belt-and-suspenders alongside the page's own notFound() guard and
      // its robots: { index: false } — see src/app/edit/page.tsx. It 404s
      // everywhere this file is served from (any real build), but a
      // crawler shouldn't even try.
      disallow: "/edit",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
