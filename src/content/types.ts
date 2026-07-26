export type CaseStudyImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * The content primitives a case study can be built from. Sections are a
 * fixed sequence (see CASE_STUDY_SECTION_IDS); each holds an ordered list
 * of these blocks — mix and match freely within a section.
 */
export type CaseStudyBlock =
  | { type: "heading"; text: string }
  | { type: "body"; text: string }
  | { type: "pullQuote"; quote: string; attribution?: string }
  | { type: "fullBleedImage"; image: CaseStudyImage; caption?: string }
  | {
      type: "imagePair";
      images: [CaseStudyImage, CaseStudyImage];
      caption?: string;
    };

export const CASE_STUDY_SECTION_IDS = [
  "overview",
  "problem",
  "research",
  "process",
  "solution",
  "outcome",
] as const;

export type CaseStudySectionId = (typeof CASE_STUDY_SECTION_IDS)[number];

export type CaseStudySection = {
  id: CaseStudySectionId;
  heading: string;
  blocks: CaseStudyBlock[];
};

export type CaseStudy = {
  sections: CaseStudySection[];
};

export type Project = {
  slug: string;
  title: string;
  role: string;
  year: number;
  tags: string[];
  cover: CaseStudyImage;
  shortDescription: string;
  caseStudy: CaseStudy;
  /** Shown in Home's Selected Work section. */
  featured?: boolean;
  /** Canvas right-panel inspector fields — repurposing Figma's property
   * rows to show project metadata instead of CSS. */
  team: string;
  duration: string;
  tools: string[];
  platform: string;
  /** 2-3 short lines on the key design decisions, shown in the inspector's
   * "Rationale" section. */
  rationale: string[];
};

/** A labeled group of items — "Daily", "Regularly", etc. for tools, or
 * "Practice", "Domains", etc. for skills — rendered as Figma inspector
 * property rows (label left, mono value right) rather than bullet lists. */
export type PropertyGroup = { label: string; items: string[] };

export type AboutContent = {
  name: string;
  role: string;
  /** Right panel, nothing selected. */
  bioShort: string;
  /** Canvas About frame — space-constrained, so this is the trimmed cut. */
  bioMedium: string;
  /** Semantic-layer-only (screen readers, crawlers, the /about deep link)
   * — no frame-height constraint, so this is the full version. */
  bioLong: string;
  photo: string;
  availability: string;
  tools: PropertyGroup[];
  skills: PropertyGroup[];
};

export type ContactContent = {
  email: string;
  socials: { label: string; url: string }[];
  /** Only set once a real file exists at public/resume.pdf — every
   * consumer must treat this as optional and hide the affordance
   * entirely when it isn't set, never link to a missing file. */
  resumeUrl?: string;
};

export type SiteContent = {
  name: string;
  role: string;
  tagline: string;
  nav: { label: string; href: string }[];
  location: { display: string };
};

export type HomeContent = {
  heroHeadline: string;
  heroSubhead: string;
  contactHeadline: string;
};
