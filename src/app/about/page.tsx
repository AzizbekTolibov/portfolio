import type { Metadata } from "next";
import { about } from "@/content/about";

export const metadata: Metadata = {
  title: "About",
  description: `About ${about.name}, ${about.role.toLowerCase()}.`,
};

export default function About() {
  return (
    <main className="px-sm pt-xl pb-section sm:px-md">
      <div className="max-w-content mx-auto">
        {/* Sections to build: bio + interactive signature element */}
        <h1 className="font-display text-h1">About</h1>
        <p className="mt-md text-body max-w-prose font-sans text-gray-600">
          Scaffold placeholder — bio and interactive signature element still to
          come.
        </p>
      </div>
    </main>
  );
}
