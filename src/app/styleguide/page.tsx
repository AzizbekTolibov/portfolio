import type { Metadata } from "next";
import { KineticText } from "@/components/KineticText";
import { Reveal } from "@/components/Reveal";
import {
  colorTokens,
  containerTokens,
  durations,
  easings,
  radiusTokens,
  spacingTokens,
  typeScaleTokens,
} from "@/lib/tokens";
import { MotionSamples } from "./MotionSamples";

export const metadata: Metadata = {
  title: "Styleguide",
  description: "Internal design system reference — not a public page.",
  robots: { index: false, follow: false },
};

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="py-xl border-t border-gray-200">
      <div className="max-w-content px-sm sm:px-md mx-auto">
        <h2 className="mb-md text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase">
          {label}
        </h2>
        {children}
      </div>
    </Reveal>
  );
}

export default function StyleguidePage() {
  return (
    <main>
      <div className="max-w-content px-sm pt-xl sm:px-md mx-auto">
        <KineticText
          text="Design System"
          as="h1"
          trigger="mount"
          splitBy="word"
          className="font-display text-display"
        />
        <p className="mt-md text-body max-w-prose font-sans text-gray-600">
          Every token and primitive that makes up the quiet studio — colors,
          type, spacing, radius, motion, and the shared building blocks used
          across the site.
        </p>
      </div>

      <Section label="Color">
        <div className="gap-md grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {colorTokens.map((token) => (
            <div key={token.name} className="gap-xs flex flex-col">
              <div
                className={`h-16 w-full rounded-md border border-gray-200 ${token.className}`}
              />
              <p className="text-mono-caption font-mono text-gray-600">
                {token.name}
              </p>
              <p className="text-mono-caption font-mono text-gray-600">
                {token.value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Typography">
        <div className="gap-lg flex flex-col">
          {typeScaleTokens.map((token) => (
            <div key={token.name} className="gap-xs flex flex-col">
              <p className={token.className}>{token.sample}</p>
              <p className="text-mono-caption font-mono text-gray-600 uppercase">
                {token.name} — {token.value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Spacing">
        <div className="gap-sm flex flex-col">
          {spacingTokens.map((token) => (
            <div key={token.name} className="gap-md flex items-center">
              <div className={`bg-accent h-3 ${token.className}`} />
              <p className="text-mono-caption font-mono text-gray-600 uppercase">
                {token.name} — {token.value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Radius">
        <div className="gap-lg flex flex-wrap">
          {radiusTokens.map((token) => (
            <div key={token.name} className="gap-xs flex flex-col">
              <div className={`bg-accent h-16 w-16 ${token.className}`} />
              <p className="text-mono-caption font-mono text-gray-600 uppercase">
                {token.name} — {token.value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Reveal className="py-xl border-t border-gray-200">
        <div className="px-sm sm:px-md">
          <h2 className="mb-md max-w-content text-mono-caption mx-auto font-mono tracking-[0.08em] text-gray-600 uppercase">
            Container
          </h2>
          {/* Rendered full-bleed (unlike other sections) so the bar below
              can actually show the max-w-content constraint against the
              viewport, rather than against an already-clipped wrapper. */}
          {containerTokens.map((token) => (
            <div key={token.name} className="gap-xs flex flex-col">
              <div className={`bg-accent mx-auto h-3 ${token.className}`} />
              <p className="text-mono-caption font-mono text-gray-600 uppercase">
                {token.name} — {token.value}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Section label="Motion">
        <div className="gap-lg flex flex-col">
          <div>
            <p className="mb-sm text-mono-caption font-mono text-gray-600 uppercase">
              Durations
            </p>
            <MotionSamples />
          </div>
          <div>
            <p className="mb-sm text-mono-caption font-mono text-gray-600 uppercase">
              Easings
            </p>
            <ul className="gap-xs flex flex-col">
              {Object.entries(easings).map(([name, curve]) => (
                <li
                  key={name}
                  className="text-mono-caption font-mono text-gray-600 uppercase"
                >
                  {name} — cubic-bezier({curve.join(", ")})
                </li>
              ))}
            </ul>
          </div>
          <p className="text-mono-caption font-mono text-gray-600 uppercase">
            fast {durations.fast}s / base {durations.base}s / slow{" "}
            {durations.slow}s
          </p>
        </div>
      </Section>

      <Section label="Primitives">
        <div className="gap-2xl flex flex-col">
          <div>
            <p className="mb-sm text-mono-caption font-mono text-gray-600 uppercase">
              Reveal — scroll down to trigger
            </p>
            <div className="gap-sm flex flex-col">
              {["One", "Two", "Three"].map((label, i) => (
                <Reveal key={label} delay={i * 0.1}>
                  <div className="text-mono-caption flex h-24 items-center justify-center rounded-md bg-gray-100 font-mono text-gray-600 uppercase">
                    {label}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-sm text-mono-caption font-mono text-gray-600 uppercase">
              KineticText — char split, scroll trigger
            </p>
            <KineticText
              text="Scroll to reveal"
              as="h2"
              trigger="scroll"
              splitBy="char"
              className="font-display text-h2"
            />
          </div>
        </div>
      </Section>
    </main>
  );
}
