// Generator for public/photos/*.svg — placeholder project photos, one set
// per project, at a consistent 1600x1000 size (so the auto-grid layout can
// use one uniform cell size). Counts deliberately vary per project (see
// `counts` below) to prove the grid is really computed from array length,
// not hardcoded. Re-run after editing `counts`:
// `node scripts/generate-project-photos.mjs`.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "photos");
mkdirSync(outDir, { recursive: true });

const PALETTE = {
  auravest: "#E07A5F",
  "north-clinic": "#3D405B",
  fieldnote: "#81B29A",
  "loop-market": "#F2CC8F",
  "harbor-analytics": "#5B8A8A",
  kindred: "#C97C9C",
};

// Deliberately different per project.
const counts = {
  auravest: 5,
  "north-clinic": 3,
  fieldnote: 4,
  "loop-market": 6,
  "harbor-analytics": 2,
  kindred: 4,
};

const WIDTH = 1600;
const HEIGHT = 1000;

function shade(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function svg(bg, title, index) {
  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${bg}"/>
  <rect x="64" y="${HEIGHT - 150}" width="56" height="4" fill="#ECE9E2"/>
  <text x="64" y="${HEIGHT - 96}" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="#F4F2ED">${title}</text>
  <text x="64" y="${HEIGHT - 52}" font-family="'Geist Mono', monospace" font-size="16" letter-spacing="1" fill="#F4F2ED" opacity="0.7">PHOTO ${index}</text>
</svg>`;
}

let written = 0;
for (const [slug, color] of Object.entries(PALETTE)) {
  const title = slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  const count = counts[slug] ?? 4;
  for (let i = 1; i <= count; i++) {
    const bg = shade(color, (i - 1) * -14);
    writeFileSync(
      path.join(outDir, `${slug}-${i}.svg`),
      svg(bg, title, i),
      "utf8",
    );
    written++;
  }
}

console.log(`Generated ${written} placeholder photos in ${outDir}`);
