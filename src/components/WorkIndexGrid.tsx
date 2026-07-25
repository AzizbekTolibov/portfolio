"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/content/types";

type WorkIndexGridProps = {
  projects: Project[];
};

/** Simple single-select tag filter over a responsive project grid. */
export function WorkIndexGrid({ projects }: WorkIndexGridProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((project) => project.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [projects]);

  const visible = activeTag
    ? projects.filter((project) => project.tags.includes(activeTag))
    : projects;

  return (
    <div>
      <div className="mb-lg gap-md flex flex-wrap">
        <TagButton
          label="All"
          active={activeTag === null}
          onClick={() => setActiveTag(null)}
        />
        {tags.map((tag) => (
          <TagButton
            key={tag}
            label={tag}
            active={activeTag === tag}
            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
          />
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {visible.length} of {projects.length} projects
      </p>

      <div className="gap-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Priority covers the widest (lg:grid-cols-3) first row, since
            that's what's actually above the fold on desktop. */}
        {visible.map((project, i) => (
          <ProjectCard key={project.slug} project={project} priority={i < 3} />
        ))}
      </div>
    </div>
  );
}

function TagButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-mono-caption duration-fast -my-sm py-sm inline-block font-mono tracking-[0.08em] uppercase transition-colors ${
        active
          ? "text-off-black decoration-accent underline decoration-2 underline-offset-4"
          : "hover:text-off-black text-gray-600"
      }`}
    >
      {label}
    </button>
  );
}
