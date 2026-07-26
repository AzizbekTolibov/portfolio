import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CanvasWorkspace } from "@/components/canvas/CanvasWorkspace";

// Defense in depth alongside robots.ts's disallow and sitemap.ts's simple
// omission (it only ever lists "/" and "/work/[slug]", so /edit was never
// going to appear there) — this is the one that actually matters: `next
// start` and Vercel both always run with NODE_ENV=production regardless
// of the shell's own env, so this 404s everywhere except `next dev`. A
// leaked editor route is a filesystem-write endpoint on a public URL
// (Phase 2+ wires real fs writes behind /api/edit/*), so every one of
// those route handlers gets this exact same check independently — never
// rely on this page alone to keep them safe.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EditPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <CanvasWorkspace editMode />;
}
