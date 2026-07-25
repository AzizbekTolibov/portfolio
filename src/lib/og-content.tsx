// Shared visual for the generated OG/Twitter images (src/app/opengraph-image.tsx,
// twitter-image.tsx, work/[slug]/opengraph-image.tsx). ImageResponse (Satori)
// only supports a limited CSS subset via inline styles — no next/font CSS
// variables or Tailwind classes here, so colors are the literal token hex
// values (kept in sync with src/app/globals.css by hand).

const OFF_BLACK = "#0E0E0E";
const OFF_WHITE = "#F4F2ED";
const ACCENT = "#C1622D";
const GRAY_400 = "#A39D8E";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export function SiteOgImage({ name, role }: { name: string; role: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: OFF_BLACK,
        padding: "96px",
      }}
    >
      <div
        style={{
          width: 72,
          height: 4,
          backgroundColor: ACCENT,
          marginBottom: 40,
        }}
      />
      <div style={{ fontSize: 96, color: OFF_WHITE, fontWeight: 600 }}>
        {name}
      </div>
      <div
        style={{
          fontSize: 32,
          color: GRAY_400,
          marginTop: 28,
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        {role}
      </div>
    </div>
  );
}

export function ProjectOgImage({
  title,
  role,
  year,
}: {
  title: string;
  role: string;
  year: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: OFF_WHITE,
        padding: "96px",
      }}
    >
      <div
        style={{
          fontSize: 28,
          color: GRAY_400,
          letterSpacing: 6,
          textTransform: "uppercase",
          marginBottom: 28,
        }}
      >
        {role} — {year}
      </div>
      <div
        style={{
          width: 72,
          height: 4,
          backgroundColor: ACCENT,
          marginBottom: 28,
        }}
      />
      <div style={{ fontSize: 96, color: OFF_BLACK, fontWeight: 600 }}>
        {title}
      </div>
    </div>
  );
}
