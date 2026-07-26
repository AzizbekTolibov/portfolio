export type ProjectImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * A project is a Figma **page**: a title/year/description frame, then its
 * photos — nothing else. `images` is a plain array of arbitrary length;
 * every layout that reads it (the canvas page, the semantic mirror, the
 * /work/[slug] SEO page) derives its shape from `images.length`, so adding
 * a project — or a photo to an existing one — is a one-line content edit,
 * never a spatial-layout edit.
 */
export type Project = {
  slug: string;
  title: string;
  year: string;
  description: string;
  cover: ProjectImage;
  images: ProjectImage[];
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
  location: { display: string };
};

export type HomeContent = {
  heroHeadline: string;
};
