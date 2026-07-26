import aboutData from "./data/about.json";
import type { AboutContent, ContactContent } from "./types";

// Data lives in data/about.json now — see content/projects.ts for why.
export const about: AboutContent = aboutData;

// contact stays a plain literal, not JSON — none of its fields are
// editable this phase (see claude-code-prompt-phase3.md's table, which
// lists site/home/about's editable fields explicitly and omits contact
// entirely). Moving it to JSON now would just be data-model churn with no
// UI behind it yet.
export const contact: ContactContent = {
  email: "diyorbekismatullayev2004@gmail.com",
  // Dribbble/Instagram still not supplied — omitted rather than linking to
  // a generic homepage. Add real ones here when available.
  socials: [
    {
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/azizbek-tolibov-741998201/",
    },
  ],
  resumeUrl: "/resume.pdf",
};
