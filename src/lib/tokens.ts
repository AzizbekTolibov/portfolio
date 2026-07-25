/**
 * Structured mirror of the design tokens defined in src/app/globals.css.
 * This is the single source the /styleguide route renders from — if you
 * change a value here, change it in globals.css too (and vice versa).
 */

export const colorTokens = [
  { name: "Off-black", className: "bg-off-black", value: "#0E0E0E" },
  { name: "Off-white", className: "bg-off-white", value: "#F4F2ED" },
  { name: "Accent", className: "bg-accent", value: "#C1622D" },
  { name: "Gray 100", className: "bg-gray-100", value: "#ECE9E2" },
  { name: "Gray 200", className: "bg-gray-200", value: "#DBD7CD" },
  { name: "Gray 300", className: "bg-gray-300", value: "#C2BDB0" },
  { name: "Gray 400", className: "bg-gray-400", value: "#A39D8E" },
  { name: "Gray 500", className: "bg-gray-500", value: "#837C6C" },
  { name: "Gray 600", className: "bg-gray-600", value: "#665F52" },
  { name: "Gray 700", className: "bg-gray-700", value: "#4A453B" },
  { name: "Gray 800", className: "bg-gray-800", value: "#2C2A25" },
  { name: "Gray 900", className: "bg-gray-900", value: "#1A1815" },
] as const;

export const typeScaleTokens = [
  {
    name: "Display",
    className: "font-display text-display",
    value: "clamp(3.5rem, 9vw, 8rem)",
    sample: "A quiet studio",
  },
  {
    name: "H1",
    className: "font-display text-h1",
    value: "clamp(2.5rem, 6vw, 4.5rem)",
    sample: "A quiet studio",
  },
  {
    name: "H2",
    className: "font-display text-h2",
    value: "clamp(1.75rem, 3.5vw, 2.5rem)",
    sample: "A quiet studio",
  },
  {
    name: "Body",
    className: "font-sans text-body",
    value: "1.125rem",
    sample: "Design is the quiet art of noticing what matters.",
  },
  {
    name: "Small",
    className: "font-sans text-small",
    value: "0.875rem",
    sample: "Design is the quiet art of noticing what matters.",
  },
  {
    name: "Mono caption",
    className: "font-mono text-mono-caption tracking-[0.08em] uppercase",
    value: "0.75rem",
    sample: "Selected Work — 2026",
  },
] as const;

export const spacingTokens = [
  { name: "xs", className: "w-xs", value: "0.5rem" },
  { name: "sm", className: "w-sm", value: "1rem" },
  { name: "md", className: "w-md", value: "1.5rem" },
  { name: "lg", className: "w-lg", value: "2.5rem" },
  { name: "xl", className: "w-xl", value: "4rem" },
  { name: "2xl", className: "w-2xl", value: "6rem" },
  { name: "section", className: "w-section", value: "8rem" },
] as const;

export const radiusTokens = [
  { name: "sm", className: "rounded-sm", value: "0.125rem" },
  { name: "md", className: "rounded-md", value: "0.375rem" },
  { name: "lg", className: "rounded-lg", value: "0.75rem" },
  {
    name: "full",
    className: "rounded-full",
    value: "9999px (Tailwind built-in)",
  },
] as const;

export const containerTokens = [
  { name: "content", className: "max-w-content", value: "75rem (1200px)" },
] as const;

export { durations, easings } from "./motion";
