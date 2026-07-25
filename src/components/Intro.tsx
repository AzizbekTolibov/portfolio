"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { KineticText } from "@/components/KineticText";
import { site } from "@/content/site";
import { easings } from "@/lib/motion";

const SESSION_KEY = "portfolio:intro-seen";
const COUNTER_DURATION = 1.6;
const WIPE_DURATION = 0.6;

type IntroProps = {
  /** Called the instant the reveal wipe starts, so the hero can sync to it. */
  onComplete: () => void;
};

/**
 * Full-screen intro that plays once per browser session: a 0-100% counter
 * alongside a kinetic line, wiping away to reveal the hero underneath. Skips
 * straight to the hero (renders nothing) when the session has already seen
 * it, or when the user prefers reduced motion. Skippable by click, wheel,
 * touch-move, the Escape key, or the visible "Skip intro" button — the
 * button is auto-focused so keyboard users always have a perceivable,
 * operable way out (the decorative counter/kinetic line are aria-hidden).
 */
export function Intro({ onComplete }: IntroProps) {
  const shouldReduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const init = () => {
      const alreadySeen = sessionStorage.getItem(SESSION_KEY) === "1";

      if (shouldReduceMotion || alreadySeen) {
        onComplete();
      } else {
        setVisible(true);
      }
      setReady(true);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) return;

    const controls = animate(0, 100, {
      duration: COUNTER_DURATION,
      ease: easings.standard,
      onUpdate: (value) => setProgress(Math.round(value)),
      onComplete: finish,
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    skipButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function finish() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
    onComplete();
  }

  if (!ready) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          onClick={finish}
          onWheel={finish}
          onTouchMove={finish}
          className="gap-md bg-off-black text-off-white fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{
            clipPath: "inset(0% 0% 100% 0%)",
            transition: { duration: WIPE_DURATION, ease: easings.inOut },
          }}
        >
          <div aria-hidden="true" className="gap-md flex flex-col items-center">
            <p className="text-mono-caption text-off-white/50 font-mono tracking-[0.08em] uppercase">
              {progress}%
            </p>
            <KineticText
              text={`${site.name} — ${site.role}`}
              as="p"
              trigger="mount"
              splitBy="word"
              className="font-display text-h2 text-off-white"
            />
          </div>

          <button
            ref={skipButtonRef}
            type="button"
            onClick={finish}
            className="text-mono-caption text-off-white/70 duration-fast hover:text-off-white right-sm bottom-md p-sm sm:right-md absolute font-mono tracking-[0.08em] uppercase transition-colors"
          >
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
