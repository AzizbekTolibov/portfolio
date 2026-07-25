/**
 * Resolves the canonical site URL for metadata (OG images, sitemap,
 * JSON-LD, etc). Prefers an explicit override, then falls back to
 * Vercel's own env vars (set automatically on every deployment — no
 * setup needed there), then localhost for local dev.
 *
 * Set NEXT_PUBLIC_SITE_URL once a custom domain is connected so
 * metadata points at the real domain instead of the *.vercel.app one.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
