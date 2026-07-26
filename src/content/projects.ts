import projectsData from "./data/projects.json";
import type { Project } from "./types";

// The data itself lives in data/projects.json now, meant to be written by
// a future local content editor rather than hand-edited — a JSON literal
// is something a program can safely rewrite; a TS module full of object
// literals is not. This file is just the typed read side, so every
// existing `import { projects } from "@/content/projects"` keeps working
// unchanged.
export const projects: Project[] = projectsData;
