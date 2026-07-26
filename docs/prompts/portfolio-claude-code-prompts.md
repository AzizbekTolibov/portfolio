# Portfolio Site — Claude Code Prompt Pack

For: Azizbek Tolibov — UI/UX Designer
Goal: ship a memorable personal portfolio, built with Claude Code, in the spirit of jijo.fyi + aikawakenichi.com + parinazkassemi.com.

---

## The concept we're building

A **minimal editorial** portfolio (Aikawa's restraint and huge kinetic type) with a **cinematic intro moment and a warm narrative voice** (Jijo), plus **one interactive signature element** (a Parinaz-style playful touch, not a whole fake OS).

Why this blend, specifically for you:
- Recruiters and design leads skim fast. Editorial minimalism reads as "confident senior designer" and never fights the work.
- The intro sequence + narrative voice make you *memorable* in a sea of Notion-template portfolios.
- The single interactive element proves you think in systems and interaction — without turning the whole site into a maintenance burden or an accessibility problem.

**Working metaphor:** "A quiet studio." The site opens like walking into a calm workspace, the work is presented like prints on a wall, and one corner of the room is interactive (your signature element).

### Information architecture (v1)

```
/                → Home: intro sequence → kinetic hero → selected work → short about → contact
/work            → Full work index (grid of projects)
/work/[slug]     → Case study template (problem → process → UI → outcome)
/about           → Longer bio + the interactive signature element
(contact is a section, not a page)
```

### Recommended stack (and why)

| Layer | Choice | Why it fits you |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Claude Code builds this fluently; easy Vercel deploy; room to grow. |
| Styling | **Tailwind CSS** | Fast, consistent, tokens map cleanly to a design system. |
| Motion | **Framer Motion** | Best-in-class React animation for reveals, kinetic type, the intro. |
| Smooth scroll | **Lenis** | The buttery scroll feel all three reference sites have. |
| Content | **Local TypeScript/MDX data files** | Swap real projects in later without touching layout. |
| Deploy | **Vercel** | One command, free tier, custom domain support. |

You are not expected to write code. Each prompt below tells Claude Code exactly what to do; you paste it, watch, and answer any questions it asks.

---

## How to use this pack

1. Install Claude Code (`npm install -g @anthropic-ai/claude-code`), then in an empty folder run `claude`.
2. Paste the prompts **in order**. Let each one fully finish before the next.
3. After Prompt 1, a file called `CLAUDE.md` exists — it's the project's memory. Every later prompt builds on it.
4. To preview at any point, tell Claude Code: *"Run the dev server and give me the local URL."* Open it in your browser.
5. When something looks off, don't hand-edit — describe the change in plain words (e.g. *"the hero headline is too small on mobile, make it fill the width"*) and let Claude Code fix it.
6. **Feed it visuals.** Claude Code accepts images. Drag in screenshots of the three reference sites (or your Figma frames) and say *"match this feeling."* This is the single biggest quality lever.

A note on originality: don't ask it to *clone* these sites. Borrow the *principles* (restraint, an intro moment, kinetic type, one interaction). Cloning looks derivative to the exact people you're trying to impress.

---

## PROMPT 1 — Bootstrap the project + write the spec

```
You are helping me build a personal portfolio website. I'm a UI/UX designer, not an engineer, so explain decisions briefly and keep the codebase clean and well-organized.

Set up a new project with this stack:
- Next.js (latest, App Router) + TypeScript
- Tailwind CSS
- Framer Motion (animation)
- Lenis (smooth scroll)
- ESLint + Prettier

Then create a CLAUDE.md file at the project root that documents:
- Project: personal portfolio for Azizbek Tolibov, UI/UX designer
- Concept: minimal editorial base + a cinematic intro sequence + a warm narrative voice + ONE interactive signature element. Metaphor: "a quiet studio."
- Design principles: restraint, generous whitespace, oversized typography, subtle motion, respects prefers-reduced-motion, fast load, accessible (WCAG AA).
- Information architecture:
  / (home: intro → kinetic hero → selected work → short about → contact)
  /work (work index grid)
  /work/[slug] (case study template)
  /about (bio + interactive signature element)
- Content is placeholder for now, stored in typed data files under /content so it can be swapped later without touching layout.
- Coding conventions: reusable components in /components, one section per component, no hardcoded colors/spacing (use design tokens), mobile-first.

Set up the folder structure, install everything, and confirm the dev server runs. Don't build any UI yet — just scaffold and confirm.
```

---

## PROMPT 2 — Design system & tokens

```
Before building sections, create the design system. Read CLAUDE.md first.

Define design tokens in the Tailwind config and a tokens file:
- Palette: an off-black (#0E0E0E) and off-white (#F4F2ED) as the two primary canvases, one warm accent color, and a neutral gray scale. Keep it to these — restraint is the point.
- Typography: a large expressive display face for headlines and a clean neutral sans for body. Use variable fonts via next/font. Build a modular type scale (at least: display, h1, h2, body, small, mono-caption).
- Spacing scale, radius scale, and max-width container.
- Motion tokens: standard easing curves and durations (fast/base/slow) as constants I can reuse everywhere.

Then build these reusable primitives:
- A <Reveal> component (Framer Motion) that fades + slides children up when they scroll into view, and does nothing if prefers-reduced-motion is on.
- A <KineticText> component that animates a headline word-by-word or char-by-char on mount/scroll.
- A smooth-scroll provider using Lenis, wired at the app root.
- A minimal <Nav> (Work / About / Contact) and a <Footer> with a live local time + city label (like the reference sites), and email + social links.

Create a /styleguide route that renders every token, type style, and primitive on one page so I can review them. Show me the local URL when done.
```

---

## PROMPT 3 — The intro sequence + kinetic hero (home top)

```
Build the top of the home page: the intro sequence and hero. Read CLAUDE.md.

Intro sequence (plays once on first visit per session):
- Full-screen off-black overlay with a percentage counter (0–100%) and a single line of kinetic type that assembles, e.g. "Azizbek Tolibov — UI/UX Designer".
- When it reaches 100%, the overlay elegantly wipes/dissolves away to reveal the hero. Total duration ~2–2.5s, skippable by clicking or scrolling.
- If prefers-reduced-motion is on, skip straight to the hero (no counter animation).
- Don't block real content loading behind it.

Hero:
- Off-white canvas, oversized kinetic headline using <KineticText>. Headline copy (placeholder): "Designing calm, useful interfaces for products people actually use."
- A short one-line subhead and a subtle scroll cue.
- Minimal — lots of whitespace. This should feel like Aikawa: type-forward, almost no chrome.

Keep it performant and make sure it looks right on mobile. Show me the local URL.
```

---

## PROMPT 4 — Selected work section + work index page

```
Build the work presentation. Read CLAUDE.md.

First, create typed placeholder content in /content/projects.ts: 6 projects, each with { slug, title, role, year, tags[], cover image, shortDescription, and a case-study body outline }. Use placeholder images (solid color blocks or a placeholder service) sized correctly so layout is final.

On the home page, add a "Selected Work" section:
- A large editorial grid/list of 3–4 featured projects. Big covers, project title + role + year on hover, generous spacing.
- Each item reveals on scroll with the <Reveal> primitive and a subtle image parallax.
- Clicking a project routes to /work/[slug].

Then build /work:
- The full index of all 6 projects as a responsive grid.
- A minimal filter by tag (optional, keep it simple).

Match the restrained, image-forward feeling of aikawakenichi.com. Show me the local URL.
```

---

## PROMPT 5 — Case study template (/work/[slug])

```
Build the case study template at /work/[slug], driven by the project data. Read CLAUDE.md.

This is the most important page for hiring, so make it a clean, scannable editorial case study with this structure:
- Hero: project title, role, year, tags, and a large cover image.
- Overview: 2–3 sentences on the problem and context.
- The sections: Problem → Research/Insight → Process → Solution (UI) → Outcome/Impact. Support headings, body text, full-bleed images, side-by-side image pairs, and pull quotes.
- A "next project" link at the bottom.

Make the content come from a structured data/MDX source so I can write case studies without touching layout. Use placeholder copy and images for now. Everything reveals gently on scroll. Ensure it reads well on mobile and has strong typographic hierarchy. Show me one populated example at its URL.
```

---

## PROMPT 6 — About page + the interactive signature element

```
Build the /about page and our one interactive signature element. Read CLAUDE.md.

About page:
- A warm, personal narrative bio (placeholder copy) in the voice of a designer who cares — think jijo.fyi's tone, first person, a few short paragraphs. Include a portrait placeholder, a short skills/tools list, and selected experience.

Interactive signature element (this is our one playful moment — keep it tasteful, not gimmicky):
- Build a draggable cluster of "artifacts" — small cards/notes/sketch thumbnails that I can drag around within a bounded canvas, with subtle physics (spring on release). Each card reveals a tiny detail about how I work when hovered or opened.
- It must be keyboard-accessible and must degrade gracefully: if prefers-reduced-motion is on or on touch/mobile, show the same cards in a simple static grid instead of draggable.
- Performance matters — don't let this jank the page.

This should feel like a small, delightful corner of an otherwise calm site. Show me the local URL.
```

---

## PROMPT 7 — Contact section + narrative outro

```
Build the contact section (bottom of home, reused where useful). Read CLAUDE.md.

- A warm closing line in my voice (placeholder), e.g. an invitation to build something together — echo jijo.fyi's friendly outro energy.
- A large, obvious email CTA (mailto), plus links to LinkedIn, Instagram/Dribbble, and a resume link (placeholder).
- Optionally a simple, elegant contact form that opens the user's mail client or posts to a form service — keep it minimal and accessible.
- Reuse the footer with live local time + city.

Keep it minimal and confident. Show me the local URL.
```

---

## PROMPT 8 — Responsiveness, accessibility, and reduced motion

```
Do a full quality pass across every page and component. Read CLAUDE.md.

Responsiveness:
- Test and fix mobile, tablet, and desktop. Typography should scale fluidly. No horizontal overflow. Touch targets ≥ 44px.

Accessibility (target WCAG AA):
- Semantic HTML and landmarks, logical heading order, visible focus states, full keyboard navigation, alt text on all images, and sufficient color contrast against both canvases.
- Every animation must respect prefers-reduced-motion. The intro sequence and the draggable element must have non-motion fallbacks.

Give me a short written report of what you found and fixed, and flag anything I need to decide on.
```

---

## PROMPT 9 — Performance, SEO, and deploy

```
Final pass: performance, SEO, and deployment. Read CLAUDE.md.

Performance:
- Optimize images with next/image, lazy-load below the fold, preload critical fonts, and code-split heavy animation. Aim for a Lighthouse performance score of 90+.

SEO / metadata:
- Per-page titles and descriptions, Open Graph + Twitter card images, favicon, sitemap, robots.txt, and JSON-LD Person schema for me.

Deploy:
- Prepare the project for Vercel. Walk me step-by-step (in plain language, I'm not an engineer) through: pushing to GitHub, importing to Vercel, and connecting a custom domain. List exactly what I click.

Run a final Lighthouse check and report the scores.
```

---

## After v1 — how to keep improving

- **Swap in real work:** *"Replace the placeholder projects in /content with these real ones,"* then paste your project details and drop in images.
- **Tune the feel:** describe changes in plain language and give reference screenshots. Motion, spacing, and type size are all one sentence away.
- **Add a signature detail later:** ambient sound toggle, a cursor effect, or a subtle grain — add one at a time so the site stays calm.
- **Keep it fast:** re-run Prompt 9's Lighthouse check whenever you add heavy media.

## Tips that make Claude Code much better here

- Work in **small, reviewable steps** — one prompt, preview, then continue. Don't ask for the whole site in one go.
- **Show, don't just tell.** Paste reference screenshots and your Figma frames; say "match this."
- If a build breaks, paste the error back and say *"fix this."* You don't need to understand it.
- Commit after each working prompt: *"commit this with a clear message."* It gives you save points to roll back to.
- Keep `CLAUDE.md` updated: *"update CLAUDE.md to reflect what we changed."*
