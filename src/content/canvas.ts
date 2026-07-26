import { about, contact } from "./about";
import { home } from "./home";
import { autoGrid, autoGridSize } from "@/lib/canvas/auto-grid";
import { projects } from "./projects";
import { site } from "./site";
import type { Project, PropertyGroup } from "./types";

/**
 * The canvas's content AND spatial composition, in one place — restructured
 * into Figma **Pages**: Home (the project index) plus one page per project.
 * Each page is generated fresh from `getPageNodes(pageId)`; nothing on any
 * page is hand-positioned beyond a handful of macro-layout constants — the
 * project grid (Home) and the photo grid (a project page) are both
 * `autoGrid()` output, so their shape follows purely from array length (see
 * src/lib/canvas/auto-grid.ts). Adding a 7th project, or a 5th photo to an
 * existing one, is a one-line content edit in content/projects.ts — no
 * coordinate ever needs touching.
 */

export type CanvasNodeType = "frame" | "group" | "image" | "text";

export type FrameKind =
  | "site-cover"
  | "project-cover"
  | "project-overview"
  | "project-photo"
  | "about-portrait"
  | "about-bio"
  | "about-skills"
  | "contact";

export type TextVariant = "display" | "heading" | "body" | "caption";

type BaseNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
};

export type CanvasNode =
  | (BaseNode & {
      type: "frame";
      content?: {
        kind?: FrameKind;
        /** Shown as this frame's background at the low-detail ("flat")
         * LOD, so every frame reads as a distinct, legible block at
         * OVERVIEW zoom instead of an identical blank rectangle. */
        accentColor?: string;
        /** Large in-block text at flat LOD, when accentColor is set —
         * explicit rather than inferred from child nodes, so it can't
         * silently break if a frame's children ever get reordered. */
        flatLabel?: string;
        flatSublabel?: string;
        /** Only set on Home's project tiles: clicking this frame
         * NAVIGATES to that project's page (Figma Pages) instead of the
         * normal FOCUSED zoom-to-frame — see use-canvas-engine's
         * pageLinks option. */
        pageLink?: string;
      };
    })
  | (BaseNode & { type: "group"; content?: undefined })
  | (BaseNode & {
      type: "text";
      content: {
        text: string;
        variant: TextVariant;
        /** Semantic-layer-only override — used when a frame's visible
         * space forces a trimmed cut but the accessible/crawlable copy
         * shouldn't be similarly constrained (e.g. the About bio). */
        semanticText?: string;
      };
    })
  | (BaseNode & {
      type: "image";
      content: { src: string; alt: string; blurColor: string };
    })
  | (BaseNode & {
      type: "property-groups";
      content: { sections: { heading: string; groups: PropertyGroup[] }[] };
    });

// ---- Pages (Figma's Pages concept) ----

export type PageId = string; // "home" | a project slug

export type PageMeta = { id: PageId; name: string };

export const PAGES: PageMeta[] = [
  { id: "home", name: "Home" },
  ...projects.map((p) => ({ id: p.slug, name: p.title })),
];

export function isProjectPage(pageId: PageId): boolean {
  return pageId !== "home";
}

// Mirrors scripts/generate-project-photos.mjs's palette + shade() — blur
// placeholders need to match each generated SVG's flat fill color.
const PROJECT_COLORS: Record<string, string> = {
  auravest: "#E07A5F",
  "north-clinic": "#3D405B",
  fieldnote: "#81B29A",
  "loop-market": "#F2CC8F",
  "harbor-analytics": "#5B8A8A",
  kindred: "#C97C9C",
};

function shade(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// One gutter constant for every top-level relationship on Home, and for
// the gap between a project page's title frame and its photo grid — large
// enough that a group label (capped counter-scale, see label-transform.ts)
// never reaches into whatever sits above it, even zoomed out to 10%.
const GRID_GUTTER = 300;

// ==================================================================
// HOME — the project index
// ==================================================================

const COLUMN_WIDTH = 1400; // About/Contact width
const NEUTRAL_ACCENT = "#2C2A25";

const PROJECT_TILE_WIDTH = 450;
const PROJECT_TILE_IMAGE_HEIGHT = 560;
const PROJECT_TILE_TEXT_HEIGHT = 110;
const PROJECT_TILE_HEIGHT =
  PROJECT_TILE_IMAGE_HEIGHT + PROJECT_TILE_TEXT_HEIGHT;
const PROJECT_TILE_GUTTER = 100;
const PROJECT_GRID_COLS = 4;

function buildHomeNodes(): CanvasNode[] {
  const nodes: CanvasNode[] = [];

  // ---- project grid (auto-computed from projects.length) ----
  const gridOriginX = COLUMN_WIDTH + GRID_GUTTER;
  const gridOriginY = 0; // placeholder; corrected once COVER_HEIGHT is known below
  const tileRects = autoGrid({
    count: projects.length,
    cols: PROJECT_GRID_COLS,
    cellWidth: PROJECT_TILE_WIDTH,
    cellHeight: PROJECT_TILE_HEIGHT,
    gutter: PROJECT_TILE_GUTTER,
    // Every tile is wrapped in an always-visible-label group (see below) —
    // its capped counter-scale reach (offset * COUNTER_SCALE_CAP = 40 *
    // 2.5 = 100 canvas units, see label-transform.ts) needs more row
    // clearance than the column gutter, which a label never reaches into.
    rowGutter: GRID_GUTTER,
    originX: gridOriginX,
    originY: gridOriginY,
  });
  const gridSize = autoGridSize(tileRects, gridOriginX, gridOriginY);

  // ---- site cover — spans the full composition width, banner-style ----
  const coverWidth = COLUMN_WIDTH + GRID_GUTTER + gridSize.width;
  const coverHeight = 900;

  nodes.push(
    {
      id: "cover-group",
      type: "group",
      name: "Cover",
      x: 0,
      y: 0,
      width: coverWidth,
      height: coverHeight,
    },
    {
      id: "cover",
      type: "frame",
      name: "Cover",
      parentId: "cover-group",
      x: 0,
      y: 0,
      width: coverWidth,
      height: coverHeight,
      content: {
        kind: "site-cover",
        accentColor: "#0E0E0E",
        flatLabel: site.name,
        flatSublabel: site.role,
      },
    },
    {
      id: "cover-name",
      type: "text",
      name: "Name",
      parentId: "cover",
      x: 80,
      y: 280,
      width: coverWidth - 160,
      height: 140,
      content: { text: site.name, variant: "display" },
    },
    {
      id: "cover-role",
      type: "text",
      name: "Role",
      parentId: "cover",
      x: 80,
      y: 440,
      width: coverWidth - 160,
      height: 60,
      content: { text: site.role, variant: "heading" },
    },
    {
      id: "cover-location",
      type: "text",
      name: "Location",
      parentId: "cover",
      x: 80,
      y: 520,
      width: coverWidth - 160,
      height: 40,
      content: { text: site.location.display, variant: "caption" },
    },
    {
      id: "cover-statement",
      type: "text",
      name: "Positioning statement",
      parentId: "cover",
      x: 80,
      y: 620,
      width: coverWidth - 160,
      height: 80,
      content: { text: home.heroHeadline, variant: "body" },
    },
  );

  // Now that coverHeight is known, re-anchor the grid to sit below it.
  const gridY = coverHeight + GRID_GUTTER;
  const yOffset = gridY - gridOriginY;

  projects.forEach((project, i) => {
    const rect = tileRects[i];
    const tileX = rect.x;
    const tileY = rect.y + yOffset;
    const groupId = `${project.slug}-tile-group`;
    const tileId = `${project.slug}-tile`;
    const baseColor = PROJECT_COLORS[project.slug] ?? "#888888";

    nodes.push(
      {
        id: groupId,
        type: "group",
        name: project.title,
        x: tileX,
        y: tileY,
        width: PROJECT_TILE_WIDTH,
        height: PROJECT_TILE_HEIGHT,
      },
      {
        id: tileId,
        type: "frame",
        name: "Cover",
        parentId: groupId,
        x: tileX,
        y: tileY,
        width: PROJECT_TILE_WIDTH,
        height: PROJECT_TILE_HEIGHT,
        content: {
          kind: "project-cover",
          accentColor: baseColor,
          flatLabel: project.title,
          flatSublabel: project.year,
          pageLink: project.slug,
        },
      },
      {
        id: `${tileId}-image`,
        type: "image",
        name: "Cover image",
        parentId: tileId,
        x: tileX,
        y: tileY,
        width: PROJECT_TILE_WIDTH,
        height: PROJECT_TILE_IMAGE_HEIGHT,
        content: {
          src: project.cover.src,
          alt: project.cover.alt,
          blurColor: baseColor,
        },
      },
      {
        id: `${tileId}-title`,
        type: "text",
        name: "Title",
        parentId: tileId,
        x: tileX + 20,
        y: tileY + PROJECT_TILE_IMAGE_HEIGHT + 16,
        width: PROJECT_TILE_WIDTH - 40,
        height: 44,
        content: { text: project.title, variant: "heading" },
      },
      {
        id: `${tileId}-year`,
        type: "text",
        name: "Year",
        parentId: tileId,
        x: tileX + 20,
        y: tileY + PROJECT_TILE_IMAGE_HEIGHT + 16 + 44 + 4,
        width: PROJECT_TILE_WIDTH - 40,
        height: 24,
        content: { text: project.year, variant: "caption" },
      },
    );
  });

  // ---- About — a column beside the grid, same row start ----
  const aboutY = gridY;

  nodes.push(
    {
      id: "about-group",
      type: "group",
      name: "About",
      x: 0,
      y: aboutY,
      width: COLUMN_WIDTH,
      height: 700,
    },
    {
      id: "about-portrait",
      type: "frame",
      name: "Portrait",
      parentId: "about-group",
      x: 0,
      y: aboutY,
      width: 450,
      height: 700,
      content: {
        kind: "about-portrait",
        accentColor: NEUTRAL_ACCENT,
        flatLabel: "Portrait",
      },
    },
    {
      id: "about-portrait-image",
      type: "image",
      name: "Portrait image",
      parentId: "about-portrait",
      x: 0,
      y: aboutY,
      width: 450,
      height: 700,
      content: {
        src: "/canvas/about-portrait.svg",
        alt: `${about.name} portrait`,
        blurColor: "#B08968",
      },
    },
    {
      id: "about-bio",
      type: "frame",
      name: "Bio",
      parentId: "about-group",
      x: 550,
      y: aboutY,
      width: 850,
      height: 300,
      content: {
        kind: "about-bio",
        accentColor: NEUTRAL_ACCENT,
        flatLabel: "Bio",
      },
    },
    {
      id: "about-bio-text",
      type: "text",
      name: "Bio text",
      parentId: "about-bio",
      x: 580,
      y: aboutY + 30,
      width: 790,
      height: 240,
      content: {
        text: about.bioMedium,
        variant: "body",
        semanticText: about.bioLong,
      },
    },
    {
      id: "about-skills",
      type: "frame",
      name: "Tools & Skills",
      parentId: "about-group",
      x: 550,
      y: aboutY + 400,
      width: 850,
      height: 300,
      content: {
        kind: "about-skills",
        accentColor: NEUTRAL_ACCENT,
        flatLabel: "Tools & Skills",
      },
    },
    {
      id: "about-skills-properties",
      type: "property-groups",
      name: "Tools & skills",
      parentId: "about-skills",
      x: 580,
      y: aboutY + 430,
      width: 790,
      height: 240,
      content: {
        sections: [
          { heading: "Tools", groups: about.tools },
          { heading: "Skills", groups: about.skills },
        ],
      },
    },
  );

  // ---- Contact — directly beneath About, same column width ----
  const contactY = aboutY + 700 + GRID_GUTTER;
  const contactHeight = 450;

  const contactBody = [
    "The best work I've done started with someone who had a real problem and enough trust to figure it out together. If that's you, say hello.",
    contact.email,
    "Freelance · open to projects · Navoiy",
  ].join("\n\n");

  nodes.push(
    {
      id: "contact-group",
      type: "group",
      name: "Contact",
      x: 0,
      y: contactY,
      width: COLUMN_WIDTH,
      height: contactHeight,
    },
    {
      id: "contact",
      type: "frame",
      name: "Contact",
      parentId: "contact-group",
      x: 0,
      y: contactY,
      width: COLUMN_WIDTH,
      height: contactHeight,
      content: {
        kind: "contact",
        accentColor: NEUTRAL_ACCENT,
        flatLabel: "Contact",
        flatSublabel: contact.email,
      },
    },
    {
      id: "contact-heading",
      type: "text",
      name: "Heading",
      parentId: "contact",
      x: 70,
      y: contactY + 90,
      width: COLUMN_WIDTH - 140,
      height: 90,
      content: { text: "Let's build something.", variant: "heading" },
    },
    {
      id: "contact-body",
      type: "text",
      name: "Contact details",
      parentId: "contact",
      x: 70,
      y: contactY + 200,
      width: COLUMN_WIDTH - 140,
      height: 200,
      content: { text: contactBody, variant: "body" },
    },
  );

  return nodes;
}

// ==================================================================
// PROJECT PAGE — a single vertical column: title/year/description, then
// every photo stacked top to bottom, all sharing one column width. Every
// position below is still derived from `project.images.length` via
// autoGrid() (with cols: 1) — nothing is hardcoded; a 5th photo in
// content/projects.ts is still a one-line change, it just adds a row to
// a column instead of a cell to a grid.
// ==================================================================

const TITLE_FRAME_HEIGHT = 420;
const PHOTO_CELL_WIDTH = 900;
// Matches the 1600x1000 (1.6:1) placeholder photos' aspect ratio exactly,
// so a photo frame never stretches or letterboxes its image.
const PHOTO_CELL_HEIGHT = 560;
const PHOTO_GUTTER = 100;
const PHOTO_COLS = 1;

function buildProjectPageNodes(project: Project): CanvasNode[] {
  const baseColor = PROJECT_COLORS[project.slug] ?? "#888888";
  const photoOriginY = TITLE_FRAME_HEIGHT + GRID_GUTTER;

  const photoRects = autoGrid({
    count: project.images.length,
    cols: PHOTO_COLS,
    cellWidth: PHOTO_CELL_WIDTH,
    cellHeight: PHOTO_CELL_HEIGHT,
    gutter: PHOTO_GUTTER,
    originX: 0,
    originY: photoOriginY,
  });
  const photoGridSize = autoGridSize(photoRects, 0, photoOriginY);
  // With a single column, this is always exactly PHOTO_CELL_WIDTH — kept
  // computed (not just `= PHOTO_CELL_WIDTH`) so the title/description
  // frame's width can never drift out of sync with the photo column's.
  const pageWidth = photoGridSize.width;
  const pageHeight = photoOriginY + photoGridSize.height;

  const groupId = `${project.slug}-group`;
  const overviewId = `${project.slug}-overview`;

  const nodes: CanvasNode[] = [
    {
      id: groupId,
      type: "group",
      name: project.title,
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    },
    {
      id: overviewId,
      type: "frame",
      name: "Overview",
      parentId: groupId,
      x: 0,
      y: 0,
      width: pageWidth,
      height: TITLE_FRAME_HEIGHT,
      content: {
        kind: "project-overview",
        accentColor: shade(baseColor, -10),
        flatLabel: project.title,
        flatSublabel: project.year,
      },
    },
    {
      id: `${overviewId}-title`,
      type: "text",
      name: "Title",
      parentId: overviewId,
      x: 60,
      y: 60,
      width: pageWidth - 120,
      height: 100,
      content: { text: project.title, variant: "display" },
    },
    {
      id: `${overviewId}-year`,
      type: "text",
      name: "Year",
      parentId: overviewId,
      x: 60,
      y: 170,
      width: pageWidth - 120,
      height: 30,
      content: { text: project.year, variant: "caption" },
    },
    {
      id: `${overviewId}-description`,
      type: "text",
      name: "Description",
      parentId: overviewId,
      x: 60,
      y: 215,
      width: pageWidth - 120,
      height: 165,
      content: { text: project.description, variant: "body" },
    },
  ];

  project.images.forEach((image, i) => {
    const rect = photoRects[i];
    const photoId = `${project.slug}-photo-${i + 1}`;
    nodes.push(
      {
        id: photoId,
        type: "frame",
        name: `Photo ${i + 1}`,
        parentId: groupId,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        content: {
          kind: "project-photo",
          accentColor: shade(baseColor, (i % 4) * -12),
          flatLabel: `Photo ${i + 1}`,
        },
      },
      {
        id: `${photoId}-image`,
        type: "image",
        name: "Photo image",
        parentId: photoId,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        content: {
          src: image.src,
          alt: image.alt,
          blurColor: baseColor,
        },
      },
    );
  });

  return nodes;
}

// ==================================================================

export function getPageNodes(pageId: PageId): CanvasNode[] {
  if (pageId === "home") return buildHomeNodes();
  const project = projects.find((p) => p.slug === pageId);
  return project ? buildProjectPageNodes(project) : [];
}
