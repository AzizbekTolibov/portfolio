import type { AboutContent, ContactContent } from "./types";

export const about: AboutContent = {
  name: "Azizbek Tolibov",
  role: "UI/UX Designer",
  bio: "Placeholder bio copy. A short, warm paragraph about Azizbek's approach to design will go here.",
  photo: "/placeholder-photo.jpg",
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
