import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { projects } from "@/content/projects";

export function SelectedWork() {
  const featured = projects.filter((project) => project.featured);

  return (
    <section id="work" className="px-sm py-section sm:px-md">
      <div className="max-w-content mx-auto">
        <Reveal className="mb-xl">
          <h2 className="text-mono-caption font-mono tracking-[0.08em] text-gray-600 uppercase">
            Selected Work
          </h2>
        </Reveal>

        <div className="gap-lg md:gap-xl grid grid-cols-1 md:grid-cols-2">
          {featured.map((project, i) => (
            <Reveal key={project.slug} delay={(i % 2) * 0.1}>
              {/* No priority: this section sits below the full-viewport
                  Hero, so none of these covers are actually above the
                  fold — lazy-loading all of them is the correct choice. */}
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
