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
 * image) for projects that don't need the full showcase treatment. See
 * `auravestCaseStudy` below for one built from every available block type.
 */
function defaultCaseStudy(slug: string, title: string): CaseStudy {
  return {
    sections: [
      {
        id: "overview",
        heading: "Overview",
        blocks: [
          {
            type: "body",
            text: `Placeholder overview copy for ${title} — context, timeline, and team.`,
          },
        ],
      },
      {
        id: "problem",
        heading: "Problem",
        blocks: [
          {
            type: "body",
            text: "Placeholder problem statement — what wasn't working, and for whom.",
          },
        ],
      },
      {
        id: "research",
        heading: "Research & Insight",
        blocks: [
          {
            type: "body",
            text: "Placeholder research copy — what we learned before designing anything.",
          },
        ],
      },
      {
        id: "process",
        heading: "Process",
        blocks: [
          {
            type: "body",
            text: "Placeholder process copy — iterations and key decisions along the way.",
          },
        ],
      },
      {
        id: "solution",
        heading: "Solution",
        blocks: [
          {
            type: "body",
            text: "Placeholder solution copy — what shipped, and why it works.",
          },
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
        blocks: [
          {
            type: "body",
            text: "Placeholder outcome copy — what changed, measured or observed.",
          },
        ],
      },
    ],
  };
}

// The one fully populated example — every block type in use, real-feeling
// (if placeholder) prose. See the other five projects for the lighter,
// still-complete default treatment.
const auravestCaseStudy: CaseStudy = {
  sections: [
    {
      id: "overview",
      heading: "Overview",
      blocks: [
        {
          type: "body",
          text: "Auravest is a personal finance app that had quietly become what it was trying to fix: a wall of charts nobody opened. Over eight weeks, I led design on a rebuild that traded dashboards for a handful of plain-language answers — where your money's going, and whether that's okay.",
        },
        {
          type: "body",
          text: "I worked alongside one PM and two engineers, from early research through the shipped redesign, and stayed on to design the onboarding flow that followed.",
        },
      ],
    },
    {
      id: "problem",
      heading: "Problem",
      blocks: [
        {
          type: "body",
          text: "Retention looked fine on paper. Usage didn't. Most people opened Auravest once, glanced at a dashboard of six charts, and never came back — not because the data was wrong, but because none of it answered the one question they actually had.",
        },
        {
          type: "pullQuote",
          quote: "I don't want a report. I want to know if I'm okay.",
          attribution: "Research participant, age 29",
        },
      ],
    },
    {
      id: "research",
      heading: "Research & Insight",
      blocks: [
        {
          type: "body",
          text: "Twelve interviews later, a pattern emerged: people weren't looking to analyze their finances, they were looking for reassurance. The dashboard was answering a question nobody asked, in a format that took effort to parse.",
        },
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
          caption:
            "Early synthesis: sorting recurring language from interview transcripts.",
        },
      ],
    },
    {
      id: "process",
      heading: "Process",
      blocks: [
        {
          type: "body",
          text: "We prototyped three directions — a chat-like assistant, a single ‘health score,’ and a short daily digest — and tested rough versions of each with eight returning users. The digest won clearly, mostly for a reason we hadn't designed for: people wanted less to look at, not a smarter way to look at more.",
        },
        {
          type: "heading",
          text: "Narrowing to one screen",
        },
        {
          type: "body",
          text: "Every subsequent iteration was really an exercise in subtraction — cutting the six default charts down to the one number that changed useful behavior, and giving everything else a deliberately quieter home two taps away.",
        },
      ],
    },
    {
      id: "solution",
      heading: "Solution",
      blocks: [
        {
          type: "body",
          text: "The rebuilt home screen leads with one line — spendable, plainly stated — and a single supporting number for the month's trend. Charts still exist, but they're opt-in, not load-bearing.",
        },
        {
          type: "fullBleedImage",
          image: wideImage("auravest", "Auravest"),
          caption:
            "The rebuilt home screen, showing the single-line summary in place of the old chart wall.",
        },
      ],
    },
    {
      id: "outcome",
      heading: "Outcome & Impact",
      blocks: [
        {
          type: "body",
          text: "Three months after launch, weekly active use was up 34%, and average session length was down — which, for this product, was the actual goal. People were checking in and moving on, instead of digging through data looking for an answer that was never quite there.",
        },
        {
          type: "body",
          text: "The single-line summary pattern has since been adopted across two other product areas at Auravest.",
        },
      ],
    },
  ],
};

export const projects: Project[] = [
  {
    slug: "auravest",
    title: "Auravest",
    role: "Product Design, Design Systems",
    year: 2025,
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
  },
  {
    slug: "north-clinic",
    title: "North Clinic",
    role: "UX Research, UI Design",
    year: 2024,
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
  },
  {
    slug: "fieldnote",
    title: "Fieldnote",
    role: "Product Design",
    year: 2024,
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
  },
  {
    slug: "loop-market",
    title: "Loop Market",
    role: "UI Design, Design Systems",
    year: 2023,
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
  },
  {
    slug: "harbor-analytics",
    title: "Harbor Analytics",
    role: "UX Design, Data Visualization",
    year: 2023,
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
  },
  {
    slug: "kindred",
    title: "Kindred",
    role: "Brand & Product Design",
    year: 2022,
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
  },
];
