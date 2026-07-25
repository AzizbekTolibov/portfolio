import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyBody } from "@/components/CaseStudyBody";
import { CaseStudyHero } from "@/components/CaseStudyHero";
import { NextProjectLink } from "@/components/NextProjectLink";
import { projects } from "@/content/projects";

type CaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return { title: "Work" };
  }

  return {
    title: project.title,
    description: project.shortDescription,
    openGraph: {
      title: project.title,
      description: project.shortDescription,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.shortDescription,
    },
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <main>
      <CaseStudyHero project={project} />
      <CaseStudyBody caseStudy={project.caseStudy} />
      <NextProjectLink currentSlug={project.slug} />
    </main>
  );
}
