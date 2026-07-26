import type { AboutContent, ContactContent } from "./types";

export const about: AboutContent = {
  name: "Azizbek Tolibov",
  role: "Product Designer · UI/UX",
  bioShort:
    "Product designer, 5+ years. I work on software that has too much going on and try to make it feel like it doesn't. Freelance, currently taking projects.",
  bioMedium:
    "I'm Azizbek. I design software that has too much going on, and try to make it feel like it doesn't.\n\nFive years in, most of my work lands in the same place: dense SaaS dashboards, AI products where nobody's sure what the interface should even be yet, mobile apps that have to earn a second open. Different surfaces, same job underneath. Figure out what the person is actually trying to do, then take away everything standing in the way.\n\nI work end to end — research, flows, architecture, the design system, the last four pixels of a hover state. I like the messy early part best, before anyone knows the shape of the thing.\n\nFreelance and open to new projects.",
  bioLong:
    "I'm Azizbek. I design software that has too much going on, and try to make it feel like it doesn't.\n\nFive years in, most of my work lands in the same place. Dense SaaS dashboards where six teams each wanted their thing on the screen. AI products where nobody's sure what the interface should even be yet. Mobile apps that have to earn a second open. Marketplaces, booking systems, event platforms. Different surfaces, same job underneath: figure out what the person is actually trying to do, then take away everything standing in the way.\n\nI work end to end, which mostly means I don't hand off cleanly and I've made peace with that. Research, user flows, information architecture, wireframes, the design system, the last four pixels of a hover state. I like the messy early part best, before anyone knows the shape of the thing, when the only useful move is to sit with the problem longer than feels comfortable.\n\nThe projects where I did my best work had one thing in common: someone on the other side cared about the details as much as I did. Not the brief — the actual thing. I ask uncomfortable questions early, and I'd rather disagree in week one than politely ship something I think is wrong.\n\nFigma is where I live. [CITY] is where I am. Freelance and open to new projects.",
  photo: "/placeholder-photo.jpg",
  availability: "Freelance — currently taking projects",
  tools: [
    {
      label: "Daily",
      items: ["Figma", "FigJam", "Figma Prototyping", "Figma Slides"],
    },
    {
      label: "Regularly",
      items: ["Framer", "Notion", "Miro", "Linear", "Google Analytics"],
    },
    {
      label: "Comfortable with",
      items: [
        "Adobe Illustrator",
        "Photoshop",
        "After Effects",
        "Maze",
        "Hotjar",
      ],
    },
    {
      label: "Reading, not writing",
      items: [
        "HTML",
        "CSS",
        "React basics — enough to spec accurately and argue with engineers in good faith",
      ],
    },
  ],
  skills: [
    {
      label: "Practice",
      items: [
        "Product strategy",
        "UX research",
        "User journey mapping",
        "Information architecture",
        "Wireframing",
        "UI design",
        "Design systems",
        "Prototyping",
        "Usability testing",
        "Design handoff",
      ],
    },
    {
      label: "Domains",
      items: [
        "SaaS platforms",
        "AI products",
        "Enterprise dashboards",
        "Mobile apps (iOS & Android)",
        "Marketplaces",
        "Booking & management systems",
        "Event platforms",
      ],
    },
    {
      label: "How I work",
      items: [
        "End-to-end ownership",
        "Research → shipped UI",
        "Systems over screens",
        "Close collaboration with engineering",
      ],
    },
  ],
};

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
