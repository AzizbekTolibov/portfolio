import siteData from "./data/site.json";
import type { SiteContent } from "./types";

// Data lives in data/site.json now, meant to be written by the local
// editor rather than hand-edited — see content/projects.ts for why JSON,
// not a TS module, is the format a program can safely rewrite. Every
// existing `import { site } from "@/content/site"` keeps working
// unchanged.
export const site: SiteContent = siteData;
