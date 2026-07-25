import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStudySectionBlock } from "@/components/work/CaseStudyBlocks";
import { site } from "@/content/site";
import { projects } from "@/content/projects";

type WorkPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};

  const title = `${project.title} — Case Study`;
  return {
    title,
    description: project.shortDescription,
    openGraph: {
      title: `${title} — ${site.name}`,
      description: project.shortDescription,
      type: "article",
    },
    twitter: {
      title: `${title} — ${site.name}`,
      description: project.shortDescription,
    },
  };
}

// A real, crawlable, server-rendered page per project — the SEO surface
// the canvas itself can't be (its content lives behind client-side
// transforms). Styled as a single focused "frame" on the dark canvas —
// same visual language as the interactive tool — with a link back into
// it. Content is the project's full case study, unabridged (the canvas's
// own frames only carry short excerpts).
export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <div className="bg-off-black h-full overflow-y-auto">
      <header className="bg-off-black border-off-white/10 sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-6 py-4">
        <nav
          aria-label="Breadcrumb"
          className="text-off-white/60 flex min-w-0 items-center gap-1.5 font-mono text-[11px] whitespace-nowrap"
        >
          <Link href="/" className="hover:text-off-white transition-colors">
            {site.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-off-white truncate">{project.title}</span>
        </nav>
        <Link
          href={project.featured ? `/?node=${project.slug}-cover` : "/"}
          className="bg-selection hover:bg-selection/90 text-off-black shrink-0 rounded px-3 py-1.5 text-[11px] font-medium"
        >
          Open in canvas
        </Link>
      </header>

      <main className="mx-auto max-w-[75rem] px-6 py-16 sm:py-24">
        <div className="bg-off-white rounded-lg px-6 py-10 sm:px-16 sm:py-20">
          <p className="text-mono-caption mb-sm font-mono tracking-[0.08em] text-gray-600 uppercase">
            {project.role} — {project.year}
          </p>
          <h1 className="text-display font-display mb-lg text-gray-900">
            {project.title}
          </h1>
          <p className="text-body mb-2xl max-w-prose text-gray-700">
            {project.shortDescription}
          </p>

          {project.caseStudy.sections.map((section) => (
            <CaseStudySectionBlock key={section.id} section={section} />
          ))}
        </div>
      </main>
    </div>
  );
}
