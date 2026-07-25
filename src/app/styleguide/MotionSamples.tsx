"use client";

import { motion, useReducedMotion } from "framer-motion";
import { durations, easings } from "@/lib/motion";

const samples = [
  { name: "fast", duration: durations.fast },
  { name: "base", duration: durations.base },
  { name: "slow", duration: durations.slow },
] as const;

/** Hover each box to feel the fast/base/slow duration tokens (out easing). */
export function MotionSamples() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="gap-lg flex flex-wrap">
      {samples.map((sample) => (
        <div key={sample.name} className="gap-xs flex flex-col">
          <div className="p-xs h-16 w-32 rounded-md bg-gray-100">
            <motion.div
              className="bg-accent h-full w-8 rounded-sm"
              whileHover={shouldReduceMotion ? undefined : { x: 72 }}
              transition={{ duration: sample.duration, ease: easings.out }}
            />
          </div>
          <p className="text-mono-caption font-mono text-gray-600 uppercase">
            {sample.name} — {sample.duration}s
          </p>
        </div>
      ))}
    </div>
  );
}
