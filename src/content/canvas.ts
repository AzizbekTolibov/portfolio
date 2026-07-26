import { about, contact } from "./about";
import { home } from "./home";
import { projects } from "./projects";
import { site } from "./site";
import type { CaseStudySectionId, Project, PropertyGroup } from "./types";

/**
 * The canvas's content AND spatial composition, in one place — every node
 * that exists on the infinite canvas, where it sits, and what it holds.
 * This is the single source of truth: the visual canvas and the left
 * panel's layer tree are both just projections of this array (see
 * src/lib/canvas/tree.ts), so they can't drift apart.
 */

export type CanvasNodeType = "frame" | "group" | "image" | "text";

export type FrameKind =
  | "site-cover"
  | "project-cover"
  | "research"
  | "user-flow"
  | "wireframes"
  | "final-ui"
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
        projectSlug?: string;
        kind?: FrameKind;
        /** Shown as this frame's background at the low-detail ("flat")
         * LOD, so each project cluster reads as a distinct block at
         * OVERVIEW zoom instead of an identical blank rectangle. Full
         * saturation on the project's Cover frame, a muted tint on its
         * supporting frames. */
        accentColor?: string;
      };
    })
  | (BaseNode & { type: "group"; content?: { projectSlug?: string } })
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

const featuredProjects = projects.filter((p) => p.featured);

// Mirrors scripts/generate-canvas-placeholders.mjs's palette + shade() —
// blur placeholders need to match each generated SVG's flat fill color.
const PROJECT_COLORS: Record<string, string> = {
  auravest: "#E07A5F",
  "north-clinic": "#3D405B",
  fieldnote: "#81B29A",
  "loop-market": "#F2CC8F",
};

function shade(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function sectionBody(project: Project, sectionId: CaseStudySectionId): string {
  const section = project.caseStudy.sections.find((s) => s.id === sectionId);
  const bodyBlock = section?.blocks.find((b) => b.type === "body");
  return bodyBlock && bodyBlock.type === "body" ? bodyBlock.text : "";
}

// ---- Site cover — the nameplate, replaces a conventional hero ----
// Deliberately NOT halved like everything else below — at 1440x900 it's
// noticeably larger than a project's own 720x450 cover sub-frame, so it's
// where the eye lands first in OVERVIEW, per CLAUDE.md's navigation model.

const COVER_X = 1550;
const COVER_Y = 0;

const siteCover: CanvasNode[] = [
  {
    id: "cover",
    type: "frame",
    name: "Cover",
    x: COVER_X,
    y: COVER_Y,
    width: 1440,
    height: 900,
    content: { kind: "site-cover" },
  },
  {
    id: "cover-name",
    type: "text",
    name: "Name",
    parentId: "cover",
    x: COVER_X + 80,
    y: COVER_Y + 280,
    width: 1280,
    height: 140,
    content: { text: site.name, variant: "display" },
  },
  {
    id: "cover-role",
    type: "text",
    name: "Role",
    parentId: "cover",
    x: COVER_X + 80,
    y: COVER_Y + 440,
    width: 1280,
    height: 60,
    content: { text: site.role, variant: "heading" },
  },
  {
    id: "cover-location",
    type: "text",
    name: "Location",
    parentId: "cover",
    x: COVER_X + 80,
    y: COVER_Y + 520,
    width: 1280,
    height: 40,
    content: { text: site.location.display, variant: "caption" },
  },
  {
    id: "cover-statement",
    type: "text",
    name: "Positioning statement",
    parentId: "cover",
    x: COVER_X + 80,
    y: COVER_Y + 620,
    width: 1280,
    height: 80,
    content: { text: home.heroHeadline, variant: "body" },
  },
];

// ---- Project clusters — one per featured project, in a tight 2x2 grid ----
// Half the linear size of every earlier draft of this layout: at full size,
// four 4000x2600 clusters made the OVERVIEW zoom-to-fit land at 5-9%, with
// content filling barely a third of the screen. Halving every internal
// measurement (frames, gutters, image/text placement) preserves each
// cluster's own composition exactly while shrinking the total canvas area
// enough that zoom-to-fit lands in a legible ~15-25% range instead.

const CLUSTER_WIDTH = 2000;
const CLUSTER_HEIGHT = 1300;
const CLUSTER_GRID_GUTTER = 150;
const CLUSTER_POSITIONS = [
  { x: COVER_X, y: COVER_Y + 900 + CLUSTER_GRID_GUTTER },
  {
    x: COVER_X + CLUSTER_WIDTH + CLUSTER_GRID_GUTTER,
    y: COVER_Y + 900 + CLUSTER_GRID_GUTTER,
  },
  {
    x: COVER_X,
    y: COVER_Y + 900 + CLUSTER_GRID_GUTTER + CLUSTER_HEIGHT + CLUSTER_GRID_GUTTER,
  },
  {
    x: COVER_X + CLUSTER_WIDTH + CLUSTER_GRID_GUTTER,
    y: COVER_Y + 900 + CLUSTER_GRID_GUTTER + CLUSTER_HEIGHT + CLUSTER_GRID_GUTTER,
  },
];
const GUTTER = 100;

function projectCluster(project: Project, index: number): CanvasNode[] {
  const gx = CLUSTER_POSITIONS[index].x;
  const gy = CLUSTER_POSITIONS[index].y;
  const groupId = `${project.slug}-group`;

  const coverId = `${project.slug}-cover`;
  const researchId = `${project.slug}-research`;
  const userFlowId = `${project.slug}-user-flow`;
  const wireframesId = `${project.slug}-wireframes`;
  const finalUiId = `${project.slug}-final-ui`;
  const baseColor = PROJECT_COLORS[project.slug] ?? "#888888";
  // Supporting frames get a muted tint of the same hue — full saturation
  // is reserved for the Cover, which is what should read first at a glance.
  const mutedColor = shade(baseColor, 70);

  // Cover + Research share the top row; User Flow / Wireframes / Final UI
  // form the row below, all separated by 100px gutters.
  const coverRect = { x: gx, y: gy, width: 720, height: 450 };
  const researchRect = { x: gx + 820, y: gy, width: 720, height: 450 };
  const userFlowRect = { x: gx, y: gy + 550, width: 600, height: 650 };
  const wireframesRect = {
    x: gx + 700,
    y: gy + 550,
    width: 600,
    height: 650,
  };
  const finalUiRect = { x: gx + 1400, y: gy + 550, width: 600, height: 650 };

  return [
    {
      id: groupId,
      type: "group",
      name: project.title,
      x: gx,
      y: gy,
      width: CLUSTER_WIDTH,
      height: CLUSTER_HEIGHT,
      content: { projectSlug: project.slug },
    },

    // Cover — full-bleed image with a title band along the bottom.
    {
      id: coverId,
      type: "frame",
      name: "Cover",
      parentId: groupId,
      ...coverRect,
      content: {
        projectSlug: project.slug,
        kind: "project-cover",
        accentColor: baseColor,
      },
    },
    {
      id: `${coverId}-image`,
      type: "image",
      name: "Cover image",
      parentId: coverId,
      x: coverRect.x,
      y: coverRect.y,
      width: coverRect.width,
      height: 360,
      content: {
        src: `/canvas/${project.slug}-cover.svg`,
        alt: `${project.title} cover`,
        blurColor: baseColor,
      },
    },
    {
      id: `${coverId}-title`,
      type: "text",
      name: "Title",
      parentId: coverId,
      x: coverRect.x + GUTTER / 2,
      y: coverRect.y + 360 + 15,
      width: coverRect.width - GUTTER,
      height: 75,
      content: { text: project.title, variant: "heading" },
    },

    // Research — image up top, the case study's Research section below.
    {
      id: researchId,
      type: "frame",
      name: "Research",
      parentId: groupId,
      ...researchRect,
      content: {
        projectSlug: project.slug,
        kind: "research",
        accentColor: mutedColor,
      },
    },
    {
      id: `${researchId}-image`,
      type: "image",
      name: "Research image",
      parentId: researchId,
      x: researchRect.x,
      y: researchRect.y,
      width: researchRect.width,
      height: 310,
      content: {
        src: `/canvas/${project.slug}-research.svg`,
        alt: `${project.title} research artifacts`,
        blurColor: shade(baseColor, -18),
      },
    },
    {
      id: `${researchId}-text`,
      type: "text",
      name: "Research notes",
      parentId: researchId,
      x: researchRect.x + GUTTER / 2,
      y: researchRect.y + 310 + 10,
      width: researchRect.width - GUTTER,
      height: 120,
      content: { text: sectionBody(project, "research"), variant: "body" },
    },

    // User Flow — image up top, the case study's Process section below.
    {
      id: userFlowId,
      type: "frame",
      name: "User Flow",
      parentId: groupId,
      ...userFlowRect,
      content: {
        projectSlug: project.slug,
        kind: "user-flow",
        accentColor: mutedColor,
      },
    },
    {
      id: `${userFlowId}-image`,
      type: "image",
      name: "User flow image",
      parentId: userFlowId,
      x: userFlowRect.x,
      y: userFlowRect.y,
      width: userFlowRect.width,
      height: 450,
      content: {
        src: `/canvas/${project.slug}-user-flow.svg`,
        alt: `${project.title} user flow`,
        blurColor: shade(baseColor, -30),
      },
    },
    {
      id: `${userFlowId}-text`,
      type: "text",
      name: "Process notes",
      parentId: userFlowId,
      x: userFlowRect.x + GUTTER / 2,
      y: userFlowRect.y + 450 + 10,
      width: userFlowRect.width - GUTTER,
      height: 180,
      content: { text: sectionBody(project, "process"), variant: "body" },
    },

    // Wireframes — visual only, no case-study section maps cleanly to it.
    {
      id: wireframesId,
      type: "frame",
      name: "Wireframes",
      parentId: groupId,
      ...wireframesRect,
      content: {
        projectSlug: project.slug,
        kind: "wireframes",
        accentColor: mutedColor,
      },
    },
    {
      id: `${wireframesId}-image`,
      type: "image",
      name: "Wireframes image",
      parentId: wireframesId,
      x: wireframesRect.x,
      y: wireframesRect.y,
      width: wireframesRect.width,
      height: wireframesRect.height,
      content: {
        src: `/canvas/${project.slug}-wireframes.svg`,
        alt: `${project.title} wireframes`,
        blurColor: shade(baseColor, -42),
      },
    },

    // Final UI — image up top, the case study's Solution section below.
    {
      id: finalUiId,
      type: "frame",
      name: "Final UI",
      parentId: groupId,
      ...finalUiRect,
      content: {
        projectSlug: project.slug,
        kind: "final-ui",
        accentColor: mutedColor,
      },
    },
    {
      id: `${finalUiId}-image`,
      type: "image",
      name: "Final UI image",
      parentId: finalUiId,
      x: finalUiRect.x,
      y: finalUiRect.y,
      width: finalUiRect.width,
      height: 450,
      content: {
        src: `/canvas/${project.slug}-final-ui.svg`,
        alt: `${project.title} final UI`,
        blurColor: shade(baseColor, -12),
      },
    },
    {
      id: `${finalUiId}-text`,
      type: "text",
      name: "Solution notes",
      parentId: finalUiId,
      x: finalUiRect.x + GUTTER / 2,
      y: finalUiRect.y + 450 + 10,
      width: finalUiRect.width - GUTTER,
      height: 180,
      content: { text: sectionBody(project, "solution"), variant: "body" },
    },
  ];
}

const workClusters = featuredProjects.flatMap((project, i) =>
  projectCluster(project, i),
);

// ---- About cluster — halved like the project clusters (see above), and
// positioned as a column with Contact directly below it, instead of
// leaving Contact orphaned on the far side of the canvas. ----

const ABOUT_X = 0;
const ABOUT_Y = 0;
const COLUMN_WIDTH = 1400;

const aboutCluster: CanvasNode[] = [
  {
    id: "about-group",
    type: "group",
    name: "About",
    x: ABOUT_X,
    y: ABOUT_Y,
    width: COLUMN_WIDTH,
    height: 700,
  },
  {
    id: "about-portrait",
    type: "frame",
    name: "Portrait",
    parentId: "about-group",
    x: ABOUT_X,
    y: ABOUT_Y,
    width: 450,
    height: 700,
    content: { kind: "about-portrait" },
  },
  {
    id: "about-portrait-image",
    type: "image",
    name: "Portrait image",
    parentId: "about-portrait",
    x: ABOUT_X,
    y: ABOUT_Y,
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
    x: ABOUT_X + 550,
    y: ABOUT_Y,
    width: 850,
    height: 300,
    content: { kind: "about-bio" },
  },
  {
    id: "about-bio-text",
    type: "text",
    name: "Bio text",
    parentId: "about-bio",
    x: ABOUT_X + 580,
    y: ABOUT_Y + 30,
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
    x: ABOUT_X + 550,
    y: ABOUT_Y + 400,
    width: 850,
    height: 300,
    content: { kind: "about-skills" },
  },
  {
    id: "about-skills-properties",
    type: "property-groups",
    name: "Tools & skills",
    parentId: "about-skills",
    x: ABOUT_X + 580,
    y: ABOUT_Y + 430,
    width: 790,
    height: 240,
    content: {
      sections: [
        { heading: "Tools", groups: about.tools },
        { heading: "Skills", groups: about.skills },
      ],
    },
  },
];

// ---- Contact — directly beneath About, same column width ----

const CONTACT_X = ABOUT_X;
const CONTACT_Y = ABOUT_Y + 700 + 150;

const contactBody = [
  contact.email,
  ...contact.socials.map((s) => s.label),
  ...(contact.resumeUrl ? ["Résumé (PDF)"] : []),
].join("\n");

const contactCluster: CanvasNode[] = [
  {
    id: "contact",
    type: "frame",
    name: "Contact",
    x: CONTACT_X,
    y: CONTACT_Y,
    width: COLUMN_WIDTH,
    height: 700,
    content: { kind: "contact" },
  },
  {
    id: "contact-heading",
    type: "text",
    name: "Heading",
    parentId: "contact",
    x: CONTACT_X + 70,
    y: CONTACT_Y + 90,
    width: 1260,
    height: 90,
    content: { text: "Let's talk", variant: "heading" },
  },
  {
    id: "contact-body",
    type: "text",
    name: "Contact details",
    parentId: "contact",
    x: CONTACT_X + 70,
    y: CONTACT_Y + 200,
    width: 1260,
    height: 400,
    content: { text: contactBody, variant: "body" },
  },
];

export const canvasNodes: CanvasNode[] = [
  ...siteCover,
  ...workClusters,
  ...aboutCluster,
  ...contactCluster,
];

/**
 * The explicit viewing order for FOCUSED-state navigation (scroll / arrow
 * keys / Space step through this list one at a time) and the mobile
 * Prev/Next bar. Hand-authored on purpose — see CLAUDE.md's navigation
 * model — so the sequence can be reordered here without touching spatial
 * coordinates or component code.
 */
export const FRAME_ORDER: string[] = [
  "cover",

  "auravest-cover",
  "auravest-research",
  "auravest-user-flow",
  "auravest-wireframes",
  "auravest-final-ui",

  "north-clinic-cover",
  "north-clinic-research",
  "north-clinic-user-flow",
  "north-clinic-wireframes",
  "north-clinic-final-ui",

  "fieldnote-cover",
  "fieldnote-research",
  "fieldnote-user-flow",
  "fieldnote-wireframes",
  "fieldnote-final-ui",

  "loop-market-cover",
  "loop-market-research",
  "loop-market-user-flow",
  "loop-market-wireframes",
  "loop-market-final-ui",

  "about-portrait",
  "about-bio",
  "about-skills",

  "contact",
];
