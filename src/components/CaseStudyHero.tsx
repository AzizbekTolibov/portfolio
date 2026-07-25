import Image from "next/image";
import { KineticText } from "@/components/KineticText";
import { Reveal } from "@/components/Reveal";
import type { Project } from "@/content/types";

export function CaseStudyHero({ project }: { project: Project }) {
  return (
    <header className="px-sm pt-xl sm:px-md">
      <div className="max-w-content mx-auto">
        <Reveal>
          <div className="gap-sm flex flex-wrap items-center">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>

        <KineticText
          text={project.title}
          as="h1"
          trigger="mount"
          splitBy="word"
          className="mt-sm font-display text-display"
        />

        <Reveal delay={0.2}>
          <p className="mt-md text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase">
            {project.role} — {project.year}
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.3} className="mt-xl">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[36rem] overflow-hidden bg-gray-100">
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            fill
            unoptimized
            priority
            sizes="(min-width: 640px) 36rem, 100vw"
            className="object-cover"
          />
        </div>
      </Reveal>
    </header>
  );
}
