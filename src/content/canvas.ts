import { about, contact } from "./about";
import { home } from "./home";
import { projects } from "./projects";
import { site } from "./site";
import type { CaseStudySectionId, Project } from "./types";

/**
 * The canvas's content AND spatial composition, in one place — every node
 * that exists on the infinite canvas, where it sits, and what it holds.
 * This is the single source of truth: the visual canvas and the left
 * panel's layer tree are both just projections of this array (see
 * src/lib/canvas/tree.ts), so they can't drift apart.
 */

export type CanvasNodeType =
  "frame" | "group" | "sticky" | "image" | "text" | "comment";

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

export type CommentAuthor = {
  name: string;
  initials: string;
  color: string;
};

export type CommentReply = CommentAuthor & {
  timestamp: string;
  body: string;
};

export type CommentThread = CommentAuthor & {
  timestamp: string;
  body: string;
  replies?: CommentReply[];
};

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
      content?: { projectSlug?: string; kind?: FrameKind };
    })
  | (BaseNode & { type: "group"; content?: { projectSlug?: string } })
  | (BaseNode & {
      type: "text";
      content: { text: string; variant: TextVariant };
    })
  | (BaseNode & {
      type: "image";
      content: { src: string; alt: string; blurColor: string };
    })
  | (BaseNode & { type: "sticky"; content: { text: string } })
  | (BaseNode & { type: "comment"; content: CommentThread });

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

const siteCover: CanvasNode[] = [
  {
    id: "cover",
    type: "frame",
    name: "Cover",
    x: 0,
    y: 0,
    width: 1440,
    height: 900,
    content: { kind: "site-cover" },
  },
  {
    id: "cover-name",
    type: "text",
    name: "Name",
    parentId: "cover",
    x: 80,
    y: 280,
    width: 1280,
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
    width: 1280,
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
    width: 1280,
    height: 40,
    content: {
      text: `${site.location.city} — ${site.location.timeZone}`,
      variant: "caption",
    },
  },
  {
    id: "cover-statement",
    type: "text",
    name: "Positioning statement",
    parentId: "cover",
    x: 80,
    y: 620,
    width: 1280,
    height: 80,
    content: { text: home.heroHeadline, variant: "body" },
  },
];

// ---- Project clusters — one per featured project, arranged in a row ----

const CLUSTER_WIDTH = 4000;
const CLUSTER_HEIGHT = 2600;
const CLUSTER_Y = 1400;
const CLUSTER_XS = [0, 4800, 9600, 14400];
const GUTTER = 200;

function projectCluster(project: Project, index: number): CanvasNode[] {
  const gx = CLUSTER_XS[index];
  const gy = CLUSTER_Y;
  const groupId = `${project.slug}-group`;

  const coverId = `${project.slug}-cover`;
  const researchId = `${project.slug}-research`;
  const userFlowId = `${project.slug}-user-flow`;
  const wireframesId = `${project.slug}-wireframes`;
  const finalUiId = `${project.slug}-final-ui`;
  const baseColor = PROJECT_COLORS[project.slug] ?? "#888888";

  // Cover + Research share the top row; User Flow / Wireframes / Final UI
  // form the row below, all separated by 200px gutters.
  const coverRect = { x: gx, y: gy, width: 1440, height: 900 };
  const researchRect = { x: gx + 1640, y: gy, width: 1440, height: 900 };
  const userFlowRect = { x: gx, y: gy + 1100, width: 1200, height: 1300 };
  const wireframesRect = {
    x: gx + 1400,
    y: gy + 1100,
    width: 1200,
    height: 1300,
  };
  const finalUiRect = { x: gx + 2800, y: gy + 1100, width: 1200, height: 1300 };

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
      content: { projectSlug: project.slug, kind: "project-cover" },
    },
    {
      id: `${coverId}-image`,
      type: "image",
      name: "Cover image",
      parentId: coverId,
      x: coverRect.x,
      y: coverRect.y,
      width: coverRect.width,
      height: 720,
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
      y: coverRect.y + 720 + 30,
      width: coverRect.width - GUTTER,
      height: 150,
      content: { text: project.title, variant: "heading" },
    },

    // Research — image up top, the case study's Research section below.
    {
      id: researchId,
      type: "frame",
      name: "Research",
      parentId: groupId,
      ...researchRect,
      content: { projectSlug: project.slug, kind: "research" },
    },
    {
      id: `${researchId}-image`,
      type: "image",
      name: "Research image",
      parentId: researchId,
      x: researchRect.x,
      y: researchRect.y,
      width: researchRect.width,
      height: 620,
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
      y: researchRect.y + 620 + 20,
      width: researchRect.width - GUTTER,
      height: 240,
      content: { text: sectionBody(project, "research"), variant: "body" },
    },

    // User Flow — image up top, the case study's Process section below.
    {
      id: userFlowId,
      type: "frame",
      name: "User Flow",
      parentId: groupId,
      ...userFlowRect,
      content: { projectSlug: project.slug, kind: "user-flow" },
    },
    {
      id: `${userFlowId}-image`,
      type: "image",
      name: "User flow image",
      parentId: userFlowId,
      x: userFlowRect.x,
      y: userFlowRect.y,
      width: userFlowRect.width,
      height: 900,
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
      y: userFlowRect.y + 900 + 20,
      width: userFlowRect.width - GUTTER,
      height: 360,
      content: { text: sectionBody(project, "process"), variant: "body" },
    },

    // Wireframes — visual only, no case-study section maps cleanly to it.
    {
      id: wireframesId,
      type: "frame",
      name: "Wireframes",
      parentId: groupId,
      ...wireframesRect,
      content: { projectSlug: project.slug, kind: "wireframes" },
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
      content: { projectSlug: project.slug, kind: "final-ui" },
    },
    {
      id: `${finalUiId}-image`,
      type: "image",
      name: "Final UI image",
      parentId: finalUiId,
      x: finalUiRect.x,
      y: finalUiRect.y,
      width: finalUiRect.width,
      height: 900,
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
      y: finalUiRect.y + 900 + 20,
      width: finalUiRect.width - GUTTER,
      height: 360,
      content: { text: sectionBody(project, "solution"), variant: "body" },
    },
  ];
}

const workClusters = featuredProjects.flatMap((project, i) =>
  projectCluster(project, i),
);

// ---- Comment threads — design rationale, pinned to project frames ----
// Figma's comment system repurposed to carry real decisions instead of
// review feedback: why a call was made, what tradeoff it cost, and (where
// it's honest) what I'd do differently now.

const AT: CommentAuthor = {
  name: "Azizbek Tolibov",
  initials: "AT",
  color: "#0D99FF",
};
const RK: CommentAuthor = {
  name: "Rustam Karimov",
  initials: "RK",
  color: "#9747FF",
};
const MS: CommentAuthor = {
  name: "Malika Saidova",
  initials: "MS",
  color: "#E07A5F",
};

function pin(
  id: string,
  parentId: string,
  x: number,
  y: number,
  thread: CommentThread,
): CanvasNode {
  return {
    id,
    type: "comment",
    name: "Comment",
    parentId,
    x,
    y,
    width: 24,
    height: 24,
    content: thread,
  };
}

/** The same rect math projectCluster() uses to lay out a project's five
 * frames — recomputed here so pins can be placed against real frame
 * geometry without projectCluster having to export its internals. */
function projectFrameRects(index: number) {
  const gx = CLUSTER_XS[index];
  const gy = CLUSTER_Y;
  return {
    cover: { x: gx, y: gy, width: 1440, height: 900 },
    research: { x: gx + 1640, y: gy, width: 1440, height: 900 },
    userFlow: { x: gx, y: gy + 1100, width: 1200, height: 1300 },
    wireframes: { x: gx + 1400, y: gy + 1100, width: 1200, height: 1300 },
    finalUi: { x: gx + 2800, y: gy + 1100, width: 1200, height: 1300 },
  };
}

const auravestRects = projectFrameRects(0);
const northClinicRects = projectFrameRects(1);
const fieldnoteRects = projectFrameRects(2);
const loopMarketRects = projectFrameRects(3);

const commentThreads: CanvasNode[] = [
  // ---- Auravest ----
  pin(
    "c-auravest-1",
    "auravest-cover",
    auravestRects.cover.x + 1180,
    auravestRects.cover.y + 120,
    {
      ...AT,
      timestamp: "Feb 2025",
      body: "Almost called this ‘AuraVest’ with a capital V to match the old brand mark. Dropped it — the case study isn’t about the logo, and the capital V read as trying too hard.",
    },
  ),
  pin(
    "c-auravest-2",
    "auravest-research",
    auravestRects.research.x + 220,
    auravestRects.research.y + 220,
    {
      ...AT,
      timestamp: "Feb 2025",
      body: "The ‘I don’t want a report, I want to know if I’m okay’ line came from participant 7, verbatim. I was tempted to smooth it into something more polished — the bluntness is what actually convinced the team.",
      replies: [
        {
          ...MS,
          timestamp: "Feb 2025",
          body: "Still the best slide from that research readout. Nobody argued with a direct quote.",
        },
      ],
    },
  ),
  pin(
    "c-auravest-3",
    "auravest-user-flow",
    auravestRects.userFlow.x + 200,
    auravestRects.userFlow.y + 950,
    {
      ...AT,
      timestamp: "Feb 2025",
      body: "Cut onboarding from six screens to two by making account-linking optional. Tradeoff: more people finish signup, but more people also never link a real account.",
      replies: [
        {
          ...AT,
          timestamp: "Feb 2025",
          body: "I’d add a day-3 nudge for anyone who skipped linking if I did this again — we never built that, and I think it’s quietly costing activation.",
        },
      ],
    },
  ),
  pin(
    "c-auravest-4",
    "auravest-final-ui",
    auravestRects.finalUi.x + 900,
    auravestRects.finalUi.y + 150,
    {
      ...AT,
      timestamp: "Mar 2025",
      body: "Kept the charts instead of cutting them entirely, even though 80% of sessions only touched the one-line summary.",
      replies: [
        {
          ...RK,
          timestamp: "Mar 2025",
          body: "Did we ever validate that the other 20% actually needed full charts, or just that they were there?",
        },
        {
          ...AT,
          timestamp: "Mar 2025",
          body: "Fair — we didn’t. I trusted the interview signal over instrumenting it properly. Next time I’d run that A/B before shipping, not after.",
        },
      ],
    },
  ),

  // ---- North Clinic ----
  pin(
    "c-north-clinic-1",
    "north-clinic-cover",
    northClinicRects.cover.x + 1180,
    northClinicRects.cover.y + 120,
    {
      ...AT,
      timestamp: "Sep 2024",
      body: "This cover is a stock photo. Swap it for a real waiting-room shot before this goes live — the current one reads more corporate than the product actually is.",
    },
  ),
  pin(
    "c-north-clinic-2",
    "north-clinic-research",
    northClinicRects.research.x + 220,
    northClinicRects.research.y + 220,
    {
      ...AT,
      timestamp: "Sep 2024",
      body: "We sat in the actual waiting room instead of a lab. Half our best insights came from watching people abandon the paper form, not from what they said in interviews.",
      replies: [
        {
          ...RK,
          timestamp: "Sep 2024",
          body: "The paper-form observation is what got the calendar redesign approved. Good call pushing for field visits over another round table.",
        },
      ],
    },
  ),
  pin(
    "c-north-clinic-3",
    "north-clinic-user-flow",
    northClinicRects.userFlow.x + 200,
    northClinicRects.userFlow.y + 950,
    {
      ...AT,
      timestamp: "Sep 2024",
      body: "Booking defaults to ‘next available’ instead of a full calendar grid. Clinic staff pushed back hard on this in review.",
      replies: [
        {
          ...MS,
          timestamp: "Sep 2024",
          body: "We still get the occasional patient asking to just see the whole week, for what it’s worth.",
        },
        {
          ...AT,
          timestamp: "Oct 2024",
          body: "Yeah — I’d add a ‘see more times’ link now instead of assuming next-available covers everyone. Optimizing for the common case shouldn’t mean hiding the rest.",
        },
      ],
    },
  ),
  pin(
    "c-north-clinic-4",
    "north-clinic-final-ui",
    northClinicRects.finalUi.x + 900,
    northClinicRects.finalUi.y + 150,
    {
      ...AT,
      timestamp: "Oct 2024",
      body: "The confirmation screen has almost no visual hierarchy on purpose — one line, one button. For this audience, calm mattered more than informative.",
    },
  ),

  // ---- Fieldnote ----
  pin(
    "c-fieldnote-1",
    "fieldnote-cover",
    fieldnoteRects.cover.x + 1180,
    fieldnoteRects.cover.y + 120,
    {
      ...AT,
      timestamp: "May 2024",
      body: "Early pitch decks called this a ‘Notion competitor.’ Glad that framing died in week one — chasing Notion would’ve meant inheriting Notion’s complexity, exactly what this audience doesn’t want.",
    },
  ),
  pin(
    "c-fieldnote-2",
    "fieldnote-research",
    fieldnoteRects.research.x + 220,
    fieldnoteRects.research.y + 220,
    {
      ...AT,
      timestamp: "May 2024",
      body: "Offline-first wasn’t a nice-to-have, it was the whole brief. Most interviewees had gone days without signal in the field.",
      replies: [
        {
          ...MS,
          timestamp: "May 2024",
          body: "Which is why the sync-status indicator became such a big deal in testing — people needed to trust it before they’d stop keeping paper as backup.",
        },
      ],
    },
  ),
  pin(
    "c-fieldnote-3",
    "fieldnote-wireframes",
    fieldnoteRects.wireframes.x + 600,
    fieldnoteRects.wireframes.y + 650,
    {
      ...AT,
      timestamp: "May 2024",
      body: "Early wireframes had a folder tree. Killed it by week two — tags plus location and time metadata matched how researchers actually think about their notes. Folders didn’t.",
    },
  ),
  pin(
    "c-fieldnote-4",
    "fieldnote-final-ui",
    fieldnoteRects.finalUi.x + 900,
    fieldnoteRects.finalUi.y + 150,
    {
      ...AT,
      timestamp: "Jun 2024",
      body: "One persistent capture button instead of a ‘new note’ menu with type options. Fewer decisions when you’re standing in a field with wet hands.",
      replies: [
        {
          ...AT,
          timestamp: "Jun 2024",
          body: "In hindsight it hides voice-memo mode a little too well — usage is lower than I’d expect, and that’s a discoverability problem I underestimated.",
        },
      ],
    },
  ),

  // ---- Loop Market ----
  pin(
    "c-loop-market-1",
    "loop-market-cover",
    loopMarketRects.cover.x + 1180,
    loopMarketRects.cover.y + 120,
    {
      ...AT,
      timestamp: "Nov 2023",
      body: "This one’s a systems project wearing a UI project’s cover. Most of the actual work — the token structure — is invisible in a single screenshot.",
    },
  ),
  pin(
    "c-loop-market-2",
    "loop-market-research",
    loopMarketRects.research.x + 220,
    loopMarketRects.research.y + 220,
    {
      ...AT,
      timestamp: "Nov 2023",
      body: "Audited eleven existing storefronts before touching the system. Was tempted to skip this to move faster — would’ve been a mistake, that’s exactly where the token structure came from.",
    },
  ),
  pin(
    "c-loop-market-3",
    "loop-market-user-flow",
    loopMarketRects.userFlow.x + 200,
    loopMarketRects.userFlow.y + 950,
    {
      ...AT,
      timestamp: "Dec 2023",
      body: "Sellers configure their storefront through a token panel, not a raw theme editor. Tradeoff: less flexibility, far fewer broken layouts.",
      replies: [
        {
          ...RK,
          timestamp: "Dec 2023",
          body: "A few power sellers in the beta specifically asked for CSS override access — did we ever revisit saying no to that?",
        },
        {
          ...AT,
          timestamp: "Dec 2023",
          body: "Not seriously enough. It’s still on the backlog, and I’ve been treating ‘no CSS access’ as more settled than it should be.",
        },
      ],
    },
  ),
  pin(
    "c-loop-market-4",
    "loop-market-final-ui",
    loopMarketRects.finalUi.x + 900,
    loopMarketRects.finalUi.y + 150,
    {
      ...AT,
      timestamp: "Dec 2023",
      body: "Deliberately kept the default component set small. Every seller wanted the system to do more; almost none of them used what was already there, so ‘more options’ felt like the wrong problem to solve.",
    },
  ),
];

// ---- About cluster ----

const ABOUT_X = 0;
const ABOUT_Y = -1800;

const aboutCluster: CanvasNode[] = [
  {
    id: "about-group",
    type: "group",
    name: "About",
    x: ABOUT_X,
    y: ABOUT_Y,
    width: 2800,
    height: 1400,
  },
  {
    id: "about-portrait",
    type: "frame",
    name: "Portrait",
    parentId: "about-group",
    x: ABOUT_X,
    y: ABOUT_Y,
    width: 900,
    height: 1400,
    content: { kind: "about-portrait" },
  },
  {
    id: "about-portrait-image",
    type: "image",
    name: "Portrait image",
    parentId: "about-portrait",
    x: ABOUT_X,
    y: ABOUT_Y,
    width: 900,
    height: 1400,
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
    x: ABOUT_X + 1100,
    y: ABOUT_Y,
    width: 1700,
    height: 600,
    content: { kind: "about-bio" },
  },
  {
    id: "about-bio-text",
    type: "text",
    name: "Bio text",
    parentId: "about-bio",
    x: ABOUT_X + 1160,
    y: ABOUT_Y + 60,
    width: 1580,
    height: 480,
    content: { text: about.bio, variant: "body" },
  },
  {
    id: "about-skills",
    type: "frame",
    name: "Tools & Skills",
    parentId: "about-group",
    x: ABOUT_X + 1100,
    y: ABOUT_Y + 800,
    width: 1700,
    height: 600,
    content: { kind: "about-skills" },
  },
  {
    id: "about-skills-text",
    type: "text",
    name: "Skills list",
    parentId: "about-skills",
    x: ABOUT_X + 1160,
    y: ABOUT_Y + 860,
    width: 1580,
    height: 480,
    content: { text: about.skills.join("  ·  "), variant: "body" },
  },
];

// ---- Contact ----

const contactBody = [
  contact.email,
  ...contact.socials.map((s) => s.label),
  "Résumé (PDF)",
].join("\n");

const contactCluster: CanvasNode[] = [
  {
    id: "contact",
    type: "frame",
    name: "Contact",
    x: 19200,
    y: 0,
    width: 1440,
    height: 900,
    content: { kind: "contact" },
  },
  {
    id: "contact-heading",
    type: "text",
    name: "Heading",
    parentId: "contact",
    x: 19280,
    y: 120,
    width: 1280,
    height: 100,
    content: { text: "Let's talk", variant: "heading" },
  },
  {
    id: "contact-body",
    type: "text",
    name: "Contact details",
    parentId: "contact",
    x: 19280,
    y: 260,
    width: 1280,
    height: 500,
    content: { text: contactBody, variant: "body" },
  },
];

// ---- Sticky notes — working notes scattered through the gutters ----

const stickies: CanvasNode[] = [
  { id: "sticky-1", x: 1600, y: 300, text: "tighten kerning on name?" },
  {
    id: "sticky-2",
    x: 400,
    y: 1050,
    text: "no scroll — remember that when it's tempting",
  },
  { id: "sticky-3", x: 4200, y: 1700, text: "get real Auravest shots" },
  { id: "sticky-4", x: 9000, y: 2200, text: "client logo ok to show?" },
  { id: "sticky-5", x: 13800, y: 1700, text: "reorder case studies by year?" },
  { id: "sticky-6", x: 800, y: 4100, text: "measure engagement lift again" },
  { id: "sticky-7", x: 1800, y: -200, text: "new headshot before launch" },
  { id: "sticky-8", x: 600, y: -250, text: "shorten bio para two" },
  { id: "sticky-9", x: 18700, y: 600, text: "double check résumé link" },
  {
    id: "sticky-10",
    x: 8000,
    y: 1150,
    text: "add motion to case-study transitions?",
  },
].map((s): CanvasNode => ({
  id: s.id,
  type: "sticky",
  name: "Note",
  x: s.x,
  y: s.y,
  width: 240,
  height: 240,
  content: { text: s.text },
}));

export const canvasNodes: CanvasNode[] = [
  ...siteCover,
  ...workClusters,
  ...commentThreads,
  ...aboutCluster,
  ...contactCluster,
  ...stickies,
];
