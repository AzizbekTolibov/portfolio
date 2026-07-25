import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { OG_IMAGE_SIZE, SiteOgImage } from "@/lib/og-content";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SiteOgImage name={site.name} role={site.role} />,
    size,
  );
}
