"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { durations, easings } from "@/lib/motion";

type KineticTextProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  splitBy?: "word" | "char";
  /**
   * "mount" plays on mount, "scroll" plays on scroll into view, and a
   * boolean is externally controlled — stays hidden until it becomes
   * `true` (e.g. to sync a hero headline with an intro sequence finishing).
   */
  trigger?: "mount" | "scroll" | boolean;
  className?: string;
  delay?: number;
};

/**
 * Animates a headline in on mount, on scroll into view, or on an external
 * trigger, one word (or character) at a time. The full text is always
 * present for screen readers; the animated split is aria-hidden. Renders
 * plain text when the user prefers reduced motion.
 */
export function KineticText({
  text,
  as: Tag = "h1",
  splitBy = "word",
  trigger = "mount",
  className,
  delay = 0,
}: KineticTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const units = splitBy === "char" ? Array.from(text) : text.split(" ");

  if (shouldReduceMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: splitBy === "char" ? 0.02 : 0.08,
        delayChildren: delay,
      },
    },
  };

  const item: Variants = {
    hidden: { y: "100%" },
    visible: {
      y: "0%",
      transition: { duration: durations.base, ease: easings.out },
    },
  };

  const trigger$ =
    typeof trigger === "boolean"
      ? ({
          initial: "hidden",
          animate: trigger ? "visible" : "hidden",
        } as const)
      : trigger === "mount"
        ? ({ initial: "hidden", animate: "visible" } as const)
        : ({
            initial: "hidden",
            whileInView: "visible",
            viewport: { once: true },
          } as const);

  return (
    <Tag className={className}>
      <motion.span
        aria-hidden="true"
        className="inline"
        variants={container}
        {...trigger$}
      >
        {units.map((unit, i) => (
          <span key={i} className="inline-block overflow-hidden align-top">
            <motion.span className="inline-block" variants={item}>
              {unit}
              {splitBy === "word" && i < units.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </motion.span>
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
