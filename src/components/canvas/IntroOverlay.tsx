"use client";

import { motion } from "framer-motion";
import type { IntroPhase } from "@/lib/canvas/use-intro-sequence";

const LOADING_MS = 650;

/**
 * Figma's file-loading screen: dark canvas, centered file name, thin
 * progress bar. Fades out once the zoom-to-fit/zoom-to-cover sequence
 * (driven by useIntroSequence) starts.
 */
export function IntroOverlay({ phase }: { phase: IntroPhase }) {
  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`bg-off-black pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 ${
        phase === "loading" ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-off-white/80 font-mono text-[13px] tracking-wide">
        Portfolio 2026
      </div>
      <div className="bg-off-white/10 h-px w-40 overflow-hidden rounded-full">
        <motion.div
          className="bg-selection h-full w-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: LOADING_MS / 1000, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
