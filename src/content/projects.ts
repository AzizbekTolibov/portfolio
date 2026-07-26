import type { Project } from "./types";

// Deliberately different per project — proves the photo grid is really
// computed from `images.length`, not a hardcoded count. See
// scripts/generate-project-photos.mjs for the placeholder assets.
const PHOTO_COUNTS: Record<string, number> = {
  auravest: 5,
  "north-clinic": 3,
  fieldnote: 4,
  "loop-market": 6,
  "harbor-analytics": 2,
  kindred: 4,
};

function photos(slug: string, title: string): Project["images"] {
  const count = PHOTO_COUNTS[slug] ?? 4;
  return Array.from({ length: count }, (_, i) => ({
    src: `/photos/${slug}-${i + 1}.svg`,
    width: 1600,
    height: 1000,
    alt: `${title} — photo ${i + 1}`,
  }));
}

export const projects: Project[] = [
  {
    slug: "auravest",
    title: "Auravest",
    year: "[YEAR]",
    description:
      "A calmer way to track personal finances, rebuilt around clarity over dashboards.",
    cover: {
      src: "/projects/auravest.svg",
      width: 1200,
      height: 1500,
      alt: "Auravest cover",
    },
    images: photos("auravest", "Auravest"),
  },
  {
    slug: "north-clinic",
    title: "North Clinic",
    year: "[YEAR]",
    description:
      "Booking and records for a small clinic network, designed for patients who don't consider themselves 'good with apps.'",
    cover: {
      src: "/projects/north-clinic.svg",
      width: 1200,
      height: 1500,
      alt: "North Clinic cover",
    },
    images: photos("north-clinic", "North Clinic"),
  },
  {
    slug: "fieldnote",
    title: "Fieldnote",
    year: "[YEAR]",
    description:
      "A quieter note-taking tool for field researchers, built around structure instead of folders.",
    cover: {
      src: "/projects/fieldnote.svg",
      width: 1200,
      height: 1500,
      alt: "Fieldnote cover",
    },
    images: photos("fieldnote", "Fieldnote"),
  },
  {
    slug: "loop-market",
    title: "Loop Market",
    year: "[YEAR]",
    description:
      "A component system for a marketplace's storefronts, so small sellers ship pages that don't look templated.",
    cover: {
      src: "/projects/loop-market.svg",
      width: 1200,
      height: 1500,
      alt: "Loop Market cover",
    },
    images: photos("loop-market", "Loop Market"),
  },
  {
    slug: "harbor-analytics",
    title: "Harbor Analytics",
    year: "[YEAR]",
    description:
      "Making a dense analytics product legible again, one chart at a time.",
    cover: {
      src: "/projects/harbor-analytics.svg",
      width: 1200,
      height: 1500,
      alt: "Harbor Analytics cover",
    },
    images: photos("harbor-analytics", "Harbor Analytics"),
  },
  {
    slug: "kindred",
    title: "Kindred",
    year: "[YEAR]",
    description:
      "Brand and product design for a family-messaging app, from wordmark to empty states.",
    cover: {
      src: "/projects/kindred.svg",
      width: 1200,
      height: 1500,
      alt: "Kindred cover",
    },
    images: photos("kindred", "Kindred"),
  },
];
