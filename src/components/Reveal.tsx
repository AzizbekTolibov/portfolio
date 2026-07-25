"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { durations, easings } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Fades and slides content up as it scrolls into view. Renders children
 * plainly (no animation) when the user prefers reduced motion.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: durations.slow, ease: easings.out, delay }}
    >
      {children}
    </motion.div>
  );
}
