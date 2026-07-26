import type { CaseStudy, CaseStudyImage, Project } from "./types";

function wideImage(slug: string, title: string): CaseStudyImage {
  return {
    src: `/projects/${slug}-wide.svg`,
    width: 1920,
    height: 1080,
    alt: `${title} — full-screen product shot`,
  };
}

/**
 * A light but complete case study (one section per beat, one full-bleed
 * image) for projects that don't have real, verified case-study copy yet.
 * Every section is an explicit `[BRACKETED — TO WRITE]` placeholder (see
 * src/lib/canvas/placeholder-text.tsx) rather than prose that merely reads
 * as a placeholder — so it renders in Figma's "missing" red everywhere,
 * and can't be mistaken for a real, finished case study.
 */
function defaultCaseStudy(slug: string, title: string): CaseStudy {
  return {
    sections: [
      {
        id: "overview",
        heading: "Overview",
        blocks: [{ type: "body", text: "[OVERVIEW — TO WRITE]" }],
      },
      {
        id: "problem",
        heading: "Problem",
        blocks: [{ type: "body", text: "[PROBLEM — TO WRITE]" }],
      },
      {
        id: "research",
        heading: "Research & Insight",
        blocks: [{ type: "body", text: "[RESEARCH FINDINGS — TO WRITE]" }],
      },
      {
        id: "process",
        heading: "Process",
        blocks: [{ type: "body", text: "[PROCESS — TO WRITE]" }],
      },
      {
        id: "solution",
        heading: "Solution",
        blocks: [
          { type: "body", text: "[SOLUTION — TO WRITE]" },
          {
            type: "fullBleedImage",
            image: wideImage(slug, title),
            caption: `${title}, final UI.`,
          },
        ],
      },
      {
        id: "outcome",
        heading: "Outcome & Impact",
        blocks: [{ type: "body", text: "[OUTCOME — TO WRITE]" }],
      },
    ],
  };
}

// Previously contained invented research findings, a fabricated user
// quote, and made-up metrics presented as if real — none of that work was
// actually done, and it must not read as though it were. Every claim below
// is now an explicit `[BRACKETED — TO WRITE]` placeholder (rendered in
// Figma's "missing" red) until Azizbek supplies the real case study.
const auravestCaseStudy: CaseStudy = {
  sections: [
    {
      id: "overview",
      heading: "Overview",
      blocks: [
        {
          type: "body",
          text: "Auravest is a personal finance app that had quietly become what it was trying to fix: a wall of charts nobody opened. [OVERVIEW — TO WRITE]",
        },
      ],
    },
    {
      id: "problem",
      heading: "Problem",
      blocks: [
        { type: "body", text: "[PROBLEM — TO WRITE]" },
        { type: "pullQuote", quote: "[RESEARCH QUOTE — TO WRITE]" },
      ],
    },
    {
      id: "research",
      heading: "Research & Insight",
      blocks: [
        { type: "body", text: "[RESEARCH FINDINGS — TO WRITE]" },
        {
          type: "imagePair",
          images: [
            {
              src: "/projects/auravest-detail-1.svg",
              width: 1200,
              height: 1500,
              alt: "Auravest research synthesis, board one",
            },
            {
              src: "/projects/auravest-detail-2.svg",
              width: 1200,
              height: 1500,
              alt: "Auravest research synthesis, board two",
            },
          ],
          caption: "[RESEARCH ARTIFACTS — TO WRITE]",
        },
      ],
    },
    {
      id: "process",
      heading: "Process",
      blocks: [{ type: "body", text: "[PROCESS — TO WRITE]" }],
    },
    {
      id: "solution",
      heading: "Solution",
      blocks: [
        { type: "body", text: "[OUTCOME — TO WRITE]" },
        {
          type: "fullBleedImage",
          image: wideImage("auravest", "Auravest"),
          caption: "[OUTCOME — TO WRITE]",
        },
      ],
    },
    {
      id: "outcome",
      heading: "Outcome & Impact",
      blocks: [{ type: "body", text: "[OUTCOME — TO WRITE]" }],
    },
  ],
};

export const projects: Project[] = [
  {
    slug: "auravest",
    title: "Auravest",
    role: "[ROLE]",
    year: "[YEAR]",
    tags: ["Product Design", "Design Systems", "Fintech"],
    cover: {
      src: "/projects/auravest.svg",
      width: 1200,
      height: 1500,
      alt: "Auravest cover",
    },
    shortDescription:
      "A calmer way to track personal finances, rebuilt around clarity over dashboards.",
    caseStudy: auravestCaseStudy,
    featured: true,
    team: "[TEAM]",
    duration: "[DURATION]",
    tools: ["[TOOLS]"],
    platform: "[PLATFORM]",
    rationale: ["[RATIONALE — TO WRITE]"],
  },
  {
    slug: "north-clinic",
    title: "North Clinic",
    role: "[ROLE]",
    year: "[YEAR]",
    tags: ["Healthcare", "Mobile App", "UX Research"],
    cover: {
      src: "/projects/north-clinic.svg",
      width: 1200,
      height: 1500,
      alt: "North Clinic cover",
    },
    shortDescription:
      "Booking and records for a small clinic network, designed for patients who don't consider themselves 'good with apps.'",
    caseStudy: defaultCaseStudy("north-clinic", "North Clinic"),
    featured: true,
    team: "[TEAM]",
    duration: "[DURATION]",
    tools: ["[TOOLS]"],
    platform: "[PLATFORM]",
    rationale: ["[RATIONALE — TO WRITE]"],
  },
  {
    slug: "fieldnote",
    title: "Fieldnote",
    role: "[ROLE]",
    year: "[YEAR]",
    tags: ["Productivity", "Web App", "Branding"],
    cover: {
      src: "/projects/fieldnote.svg",
      width: 1200,
      height: 1500,
      alt: "Fieldnote cover",
    },
    shortDescription:
      "A quieter note-taking tool for field researchers, built around structure instead of folders.",
    caseStudy: defaultCaseStudy("fieldnote", "Fieldnote"),
    featured: true,
    team: "[TEAM]",
    duration: "[DURATION]",
    tools: ["[TOOLS]"],
    platform: "[PLATFORM]",
    rationale: ["[RATIONALE — TO WRITE]"],
  },
  {
    slug: "loop-market",
    title: "Loop Market",
    role: "[ROLE]",
    year: "[YEAR]",
    tags: ["E-commerce", "Design Systems"],
    cover: {
      src: "/projects/loop-market.svg",
      width: 1200,
      height: 1500,
      alt: "Loop Market cover",
    },
    shortDescription:
      "A component system for a marketplace's storefronts, so small sellers ship pages that don't look templated.",
    caseStudy: defaultCaseStudy("loop-market", "Loop Market"),
    featured: true,
    team: "[TEAM]",
    duration: "[DURATION]",
    tools: ["[TOOLS]"],
    platform: "[PLATFORM]",
    rationale: ["[RATIONALE — TO WRITE]"],
  },
  {
    slug: "harbor-analytics",
    title: "Harbor Analytics",
    role: "[ROLE]",
    year: "[YEAR]",
    tags: ["B2B SaaS", "Data Visualization"],
    cover: {
      src: "/projects/harbor-analytics.svg",
      width: 1200,
      height: 1500,
      alt: "Harbor Analytics cover",
    },
    shortDescription:
      "Making a dense analytics product legible again, one chart at a time.",
    caseStudy: defaultCaseStudy("harbor-analytics", "Harbor Analytics"),
    team: "[TEAM]",
    duration: "[DURATION]",
    tools: ["[TOOLS]"],
    platform: "[PLATFORM]",
    rationale: ["[RATIONALE — TO WRITE]"],
  },
  {
    slug: "kindred",
    title: "Kindred",
    role: "[ROLE]",
    year: "[YEAR]",
    tags: ["Branding", "Mobile App"],
    cover: {
      src: "/projects/kindred.svg",
      width: 1200,
      height: 1500,
      alt: "Kindred cover",
    },
    shortDescription:
      "Brand and product design for a family-messaging app, from wordmark to empty states.",
    caseStudy: defaultCaseStudy("kindred", "Kindred"),
    team: "[TEAM]",
    duration: "[DURATION]",
    tools: ["[TOOLS]"],
    platform: "[PLATFORM]",
    rationale: ["[RATIONALE — TO WRITE]"],
  },
];
