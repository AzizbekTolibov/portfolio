"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { SelectedWork } from "@/components/SelectedWork";

// Code-split: Intro's own module (state machine, KineticText, site content)
// loads in a separate chunk so it doesn't block Hero's critical-path JS.
// ssr: false is safe here — Intro already renders null until a client-only
// effect (sessionStorage check) resolves, so there was no SSR content to lose.
const Intro = dynamic(
  () => import("@/components/Intro").then((mod) => mod.Intro),
  { ssr: false },
);

export default function Home() {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <main>
      <Intro onComplete={() => setIntroComplete(true)} />
      <Hero start={introComplete} />
      <SelectedWork />
      <Contact />
    </main>
  );
}
