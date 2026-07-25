"use client";

import { motion, useReducedMotion } from "framer-motion";
import { KineticText } from "@/components/KineticText";
import { home } from "@/content/home";
import { durations, easings } from "@/lib/motion";

type HeroProps = {
  /** Becomes true the instant the intro starts wiping away (or immediately
   * if there's no intro to wait for), so the headline reveal stays in sync
   * with it rather than firing while still hidden underneath. */
  start: boolean;
};

export function Hero({ start }: HeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const play = shouldReduceMotion || start;

  return (
    <section className="px-sm sm:px-md relative flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col justify-center">
        <div className="max-w-content mx-auto w-full">
          <KineticText
            text={home.heroHeadline}
            as="h1"
            trigger={shouldReduceMotion ? true : start}
            splitBy="word"
            className="font-display text-h1"
          />
          <motion.p
            className="mt-md text-body max-w-prose font-sans text-gray-600"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={play ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{
              duration: durations.base,
              ease: easings.out,
              delay: 0.5,
            }}
          >
            {home.heroSubhead}
          </motion.p>
        </div>
      </div>

      <div className="bottom-lg absolute inset-x-0 flex justify-center">
        <ScrollCue play={play} reduceMotion={!!shouldReduceMotion} />
      </div>
    </section>
  );
}

function ScrollCue({
  play,
  reduceMotion,
}: {
  play: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      className="gap-xs flex flex-col items-center"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: play ? 1 : 0 }}
      transition={{ duration: durations.base, ease: easings.out, delay: 0.9 }}
    >
      <span className="text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase">
        Scroll
      </span>
      <motion.span
        className="h-8 w-px origin-top bg-gray-300"
        animate={reduceMotion || !play ? undefined : { scaleY: [1, 0.4, 1] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 1.6, repeat: Infinity, ease: easings.inOut }
        }
      />
    </motion.div>
  );
}
