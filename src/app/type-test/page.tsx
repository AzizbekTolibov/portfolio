// TEMPORARY comparison page — not part of the canvas, `robots: { index:
// false }` below. Delete this whole route (src/app/type-test/) once a UI
// sans has been chosen; nothing else in the app links to it.
import type { Metadata } from "next";
import { projects } from "@/content/projects";
import { UI_SANS_VARIABLE, type UISans } from "../layout";

export const metadata: Metadata = {
  title: "Type test",
  robots: { index: false },
};

const CANDIDATES: {
  key: UISans;
  label: string;
  direction: string;
}[] = [
  {
    key: "inter-tight",
    label: "Inter Tight",
    direction:
      "Neutral Swiss grotesque. Tighter and more current than plain Inter.",
  },
  {
    key: "instrument",
    label: "Instrument Sans",
    direction: "Contemporary grotesque, slightly narrow, 2023-vintage.",
  },
  {
    key: "space",
    label: "Space Grotesk",
    direction: "Technical/geometric, most character, most opinionated.",
  },
];

// The real thing, not lorem ipsum — projects[0] is Auravest.
const SAMPLE_DESCRIPTION = projects[0].description;
const ALPHABET_LINE =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789";
const DISAMBIGUATION_LINE = "Il1 O0 rn m";

// Sizes pulled directly from where --font-sans actually renders in the
// app, so this page judges the real thing, not an approximation:
// LayerBrowser.tsx:159 (row labels) and Frame.tsx's FLAT_LABEL_SIZE for
// "project-cover" (the tile's year sublabel).
const ROW_LABEL_SIZE = 11;
const YEAR_SUBLABEL_SIZE = 28;

function Specimen({
  candidateKey,
  label,
  direction,
}: {
  candidateKey: UISans;
  label: string;
  direction: string;
}) {
  const fontFamily = `var(${UI_SANS_VARIABLE[candidateKey]})`;

  return (
    <section className="mb-16">
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h2 className="font-display text-display text-off-white leading-none">
          {label}
        </h2>
        <span className="text-off-white/50 font-mono text-[11px]">
          {candidateKey}
        </span>
      </div>
      <p className="text-off-white/60 mb-4 max-w-prose font-mono text-[11px]">
        {direction}
      </p>

      {/* Artboard background — the real off-white/gray editorial palette. */}
      <div
        className="mb-3 rounded-lg p-8"
        style={{ backgroundColor: "#F4F2ED", fontFamily }}
      >
        <p className="text-body mb-6 max-w-prose text-gray-700">
          {SAMPLE_DESCRIPTION}
        </p>
        <p
          className="mb-2 text-gray-900"
          style={{ fontSize: YEAR_SUBLABEL_SIZE }}
        >
          {ALPHABET_LINE}
        </p>
        <p className="text-gray-900" style={{ fontSize: YEAR_SUBLABEL_SIZE }}>
          {DISAMBIGUATION_LINE}
        </p>
        <p className="text-mono-caption mt-4 text-gray-500">
          Year sublabel size ({YEAR_SUBLABEL_SIZE}px, Frame.tsx&apos;s
          project-cover FLAT_LABEL_SIZE)
        </p>
      </div>

      {/* Dark panel background — the chrome context (LayerBrowser rows). */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "#1E1E1E", fontFamily }}
      >
        <div className="text-off-white/75" style={{ fontSize: ROW_LABEL_SIZE }}>
          Auravest — Research
        </div>
        <p className="text-mono-caption text-off-white/40 mt-2">
          Row label size ({ROW_LABEL_SIZE}px, LayerBrowser.tsx:159)
        </p>
      </div>
    </section>
  );
}

export default function TypeTestPage() {
  return (
    <div className="bg-off-black h-full overflow-y-auto px-8 py-16 sm:px-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-h1 text-off-white mb-2">
          UI sans comparison
        </h1>
        <p className="text-off-white/50 mb-16 max-w-prose font-mono text-[11px]">
          Temporary — delete src/app/type-test/ once a candidate is chosen. Not
          linked from anywhere in the app.
        </p>
        {CANDIDATES.map((c) => (
          <Specimen
            key={c.key}
            candidateKey={c.key}
            label={c.label}
            direction={c.direction}
          />
        ))}
      </div>
    </div>
  );
}
