import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { projects } from "@/content/projects";

export function NextProjectLink({ currentSlug }: { currentSlug: string }) {
  const index = projects.findIndex((project) => project.slug === currentSlug);
  const next = projects[(index + 1) % projects.length];

  return (
    <Reveal className="border-t border-gray-200">
      <Link
        href={`/work/${next.slug}`}
        className="group gap-md px-sm py-section sm:px-md flex flex-col items-center text-center"
      >
        <p className="text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase">
          Next Project
        </p>
        <p className="font-display text-h1 duration-fast group-hover:text-accent transition-colors">
          {next.title}
        </p>
        <p className="text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase">
          {next.role} — {next.year}
        </p>
      </Link>
    </Reveal>
  );
}
