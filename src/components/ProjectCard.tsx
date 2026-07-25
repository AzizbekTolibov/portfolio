"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { Project } from "@/content/types";

type ProjectCardProps = {
  project: Project;
  /** Set for the first visible card so its cover loads eagerly (LCP). */
  priority?: boolean;
};

/**
 * A project cover with a subtle scroll parallax and a title/role/year
 * caption revealed on hover. The caption stays always-visible on touch
 * devices (no true hover) and on keyboard focus. Links to the case study.
 */
export function ProjectCard({ project, priority = false }: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <div
        ref={ref}
        className="relative aspect-[4/5] overflow-hidden bg-gray-100"
      >
        <motion.div
          className="absolute inset-x-0 -top-[15%] h-[130%]"
          style={shouldReduceMotion ? undefined : { y: parallaxY }}
        >
          <Image
            src={project.cover.src}
            // Decorative here: the caption text below (always in the DOM,
            // just opacity-toggled) already names the project, role, and
            // year — a real alt would make the link's accessible name
            // redundant ("Auravest cover Auravest Product Design...").
            alt=""
            fill
            unoptimized
            priority={priority}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </motion.div>

        <div className="gap-xs from-off-black/70 p-md text-off-white duration-base absolute inset-x-0 bottom-0 flex flex-col bg-linear-to-t to-transparent opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100">
          <h2 className="font-display text-h2">{project.title}</h2>
          <p className="text-mono-caption text-off-white/80 font-mono tracking-[0.08em] uppercase">
            {project.role} — {project.year}
          </p>
        </div>
      </div>
    </Link>
  );
}
