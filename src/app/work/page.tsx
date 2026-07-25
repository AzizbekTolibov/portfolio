import type { Metadata } from "next";
import { WorkIndexGrid } from "@/components/WorkIndexGrid";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected UI/UX design work — product design, design systems, and case studies by Azizbek Tolibov.",
};

export default function WorkIndex() {
  return (
    <main className="px-sm pt-xl pb-section sm:px-md">
      <div className="max-w-content mx-auto">
        <h1 className="mb-xl font-display text-h1">Work</h1>
        <WorkIndexGrid projects={projects} />
      </div>
    </main>
  );
}
