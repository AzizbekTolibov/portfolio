// One-off generator for public/canvas/*.svg — correctly-sized placeholder
// images for the canvas content in src/content/canvas.ts. Re-run if a
// frame's dimensions ever change: `node scripts/generate-canvas-placeholders.mjs`.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "canvas");
mkdirSync(outDir, { recursive: true });

const palette = {
  auravest: "#E07A5F",
  "north-clinic": "#3D405B",
  fieldnote: "#81B29A",
  "loop-market": "#F2CC8F",
};

function svg(width, height, bg, label, sublabel) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <rect x="48" y="${height - 120}" width="56" height="4" fill="#ECE9E2"/>
  <text x="48" y="${height - 72}" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#F4F2ED">${label}</text>
  <text x="48" y="${height - 40}" font-family="'Geist Mono', monospace" font-size="14" letter-spacing="1" fill="#F4F2ED" opacity="0.7">${sublabel}</text>
</svg>`;
}

const jobs = [];

for (const [slug, color] of Object.entries(palette)) {
  const title = slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  jobs.push({
    file: `${slug}-cover.svg`,
    width: 1440,
    height: 900,
    bg: color,
    label: title,
    sublabel: "COVER",
  });
  jobs.push({
    file: `${slug}-research.svg`,
    width: 1440,
    height: 900,
    bg: shade(color, -18),
    label: title,
    sublabel: "RESEARCH",
  });
  jobs.push({
    file: `${slug}-user-flow.svg`,
    width: 1200,
    height: 1300,
    bg: shade(color, -30),
    label: title,
    sublabel: "USER FLOW",
  });
  jobs.push({
    file: `${slug}-wireframes.svg`,
    width: 1200,
    height: 1300,
    bg: shade(color, -42),
    label: title,
    sublabel: "WIREFRAMES",
  });
  jobs.push({
    file: `${slug}-final-ui.svg`,
    width: 1200,
    height: 1300,
    bg: shade(color, -12),
    label: title,
    sublabel: "FINAL UI",
  });
}

jobs.push({
  file: "about-portrait.svg",
  width: 900,
  height: 1400,
  bg: "#B08968",
  label: "Azizbek Tolibov",
  sublabel: "PORTRAIT",
});

function shade(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

for (const job of jobs) {
  const content = svg(job.width, job.height, job.bg, job.label, job.sublabel);
  writeFileSync(path.join(outDir, job.file), content, "utf8");
}

console.log(`Generated ${jobs.length} placeholder SVGs in ${outDir}`);
