import type { AboutContent, ContactContent } from "./types";

export const about: AboutContent = {
  name: "Azizbek Tolibov",
  role: "UI/UX Designer",
  bio: "Placeholder bio copy. A short, warm paragraph about Azizbek's approach to design will go here.",
  photo: "/placeholder-photo.jpg",
  availability: "Available for select engagements",
  skills: [
    "Product Design",
    "Design Systems",
    "User Research",
    "Prototyping",
    "Interaction Design",
    "Figma",
    "Design Tokens",
    "Accessibility",
  ],
};

export const contact: ContactContent = {
  email: "hello@example.com",
  socials: [
    { label: "LinkedIn", url: "https://linkedin.com" },
    { label: "Dribbble", url: "https://dribbble.com" },
    { label: "Instagram", url: "https://instagram.com" },
  ],
  resumeUrl: "/resume.pdf",
};
