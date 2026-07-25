# Portfolio — Azizbek Tolibov

Personal portfolio for **Azizbek Tolibov**, a UI/UX designer.

## Concept

A minimal editorial base, with a cinematic intro sequence, a warm narrative
voice, and ONE interactive signature element (on the About page).

**Metaphor: "a quiet studio."** Calm, considered, uncluttered — a space that
lets the work speak, with one moment of surprising craft.

## Design principles

- **Restraint** — no decoration without purpose. Motion and detail are earned,
  not default.
- **Generous whitespace** — let sections breathe; don't crowd content.
- **Oversized typography** — type is a primary design element, not just a
  container for words.
- **Subtle motion** — animation supports meaning (reveals, transitions), never
  decoration for its own sake. Must respect `prefers-reduced-motion`.
- **Fast load** — keep bundle size and asset weight lean; prefer CSS/transform
  animations over heavy JS where possible.
- **Accessible (WCAG AA)** — color contrast, keyboard navigation, semantic
  HTML, and reduced-motion support are non-negotiable, not polish.

## Information architecture

| Route          | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `/`            | Home: intro → kinetic hero → selected work → short about → contact |
| `/work`        | Work index grid (built)                                            |
| `/work/[slug]` | Case study template (built)                                        |
| `/about`       | Bio + interactive signature element                                |

Home is built section-by-section; **intro, kinetic hero, selected work, and
contact** exist so far (`src/components/Intro.tsx`, `Hero.tsx`,
`SelectedWork.tsx`, `Contact.tsx`, wired in `src/app/page.tsx`). Short about
is not built yet. `<Contact>` has `id="contact"`, which is what
`site.nav`'s `/#contact` link actually resolves to.

## Content

All content is **placeholder** for now, and lives in typed data files under
`src/content/`:

- `types.ts` — shared TypeScript types (`Project`, `CaseStudy`,
  `CaseStudyBlock`, `CaseStudyImage`, `AboutContent`, `ContactContent`,
  `SiteContent`, `HomeContent`)
- `site.ts` — site-wide metadata (name, role, tagline, nav)
- `projects.ts` — array of 6 `Project`s (`featured: true` on the 4 shown in
  Home's Selected Work; all 6 appear on `/work`)
- `about.ts` — bio and contact info (`contact.socials` includes LinkedIn,
  Dribbble, Instagram; `contact.resumeUrl` is a **placeholder path**
  (`/resume.pdf`) — add the real file at `public/resume.pdf`, nothing else
  needs to change)
- `home.ts` — hero headline/subhead, and `contactHeadline` (the warm
  closing line in Contact)

Project covers are real placeholder SVGs under `public/projects/` at their
final display dimensions (1200×1500, 4:5) — sized correctly now so there's
no layout shift when real photography replaces them. They're rendered with
next/image's `unoptimized` prop (required for local SVG sources, since
Next's optimizer disallows SVG by default).

Layout and content are decoupled: swap placeholder copy/images for real
content later without touching any component or layout code.

### Case study content model

`Project.caseStudy` is a `CaseStudy` — an ordered list of `CaseStudySection`s
(fixed sequence: `overview`, `problem`, `research`, `process`, `solution`,
`outcome`; each has its own display `heading`, so wording can vary per
project — e.g. "Outcome & Impact"). Each section holds an ordered array of
**blocks**, freely mixed:

- `{ type: "heading", text }` — an inline sub-heading within a section.
- `{ type: "body", text }` — a paragraph.
- `{ type: "pullQuote", quote, attribution? }`.
- `{ type: "fullBleedImage", image, caption? }` — breaks out to true
  edge-to-edge width (see the layout note below).
- `{ type: "imagePair", images: [a, b], caption? }` — two images side by
  side, contained within `max-w-content`.

`src/content/projects.ts` has a `defaultCaseStudy()` helper producing a
light-but-complete case study (one heading + one paragraph per section,
one full-bleed image) — used for 5 of the 6 projects. **Auravest is the
one fully populated example**, hand-written with every block type in use;
read it as the reference for what a complete case study looks like.

Writing a new case study means adding data to `projects.ts` — no component
or layout code needs to change.

**Full-bleed layout note:** `fullBleedImage` breaks out of its container via
the standard `relative left-1/2 right-1/2 -mx-[50vw] w-screen` technique
(in `CaseStudyBody.tsx`). This only avoids introducing a horizontal
scrollbar because `overflow-x: hidden` is set on **both** `<html>` and
`<body>` in `layout.tsx` — Lenis scrolls `documentElement`, not `body`, so
the guard has to be on `<html>` too, not just `body`. If you add another
full-bleed / breakout element and see an 8px-ish horizontal scroll appear,
this is almost certainly why — check both, not just `body`.

## Design system

All tokens are defined once, in the `@theme` block(s) in `src/app/globals.css`
(Tailwind v4 is CSS-first — there is no `tailwind.config.js`). `src/lib/tokens.ts`
mirrors them as structured metadata for the `/styleguide` route to render; if
you change a value, update both files. `src/lib/motion.ts` is the source of
truth for motion values used in Framer Motion (durations/easings need real
JS numbers, not just CSS).

- **Colors** — `off-black` (#0E0E0E), `off-white` (#F4F2ED), one warm
  `accent` (#C1622D), and a 9-step neutral `gray-100`…`gray-900` scale.
  Tailwind's entire default color palette has been reset (`--color-*:
initial` in globals.css) so only these tokens exist as color utilities —
  this is deliberate, to enforce "keep it to these" at the tooling level.
- **Type scale** — `display`, `h1`, `h2` (fluid, via `clamp()`, since
  oversized/responsive headlines are a core design principle), `body`,
  `small`, `mono-caption`. Used as `text-display`, `font-display`, etc.
- **Fonts** (`next/font/google`) — **Fraunces** (`font-display`, expressive
  display serif) and **Geist** / **Geist Mono** (`font-sans` / `font-mono`,
  neutral).
- **Spacing** — semantic scale `xs`/`sm`/`md`/`lg`/`xl`/`2xl`/`section`,
  layered on top of Tailwind's default numeric spacing (both work, e.g.
  `p-md` and `p-4`). **Gotcha:** these names shadow Tailwind's built-in
  `max-w-{xs,sm,md,lg,xl,2xl,3xl}` container presets (both scales key off
  the same names, and ours wins) — `max-w-2xl` silently resolves to our
  6rem spacing token, not Tailwind's 42rem default. For a one-off content
  width that isn't `max-w-content` or `max-w-prose`, use an arbitrary value
  (`max-w-[42rem]`) instead of a named `max-w-*`.
- **Radius** — `sm`/`md`/`lg`; `full` uses Tailwind's built-in
  `rounded-full` rather than a themed value.
- **Container** — `max-w-content` (75rem / 1200px) for the page wrapper;
  `max-w-prose` (Tailwind default) for case-study reading width.
- **Motion** — durations `fast`/`base`/`slow` (0.2s/0.4s/0.8s) and easings
  `out`/`inOut`/`standard`, available as Tailwind utilities
  (`duration-base`, `ease-out`) and as JS constants from `src/lib/motion.ts`
  for Framer Motion.

### Accessibility conventions

These were established during a full WCAG AA pass over every page — follow
them for new UI rather than re-deriving from scratch:

- **Text contrast** — `gray-400` and `gray-600` are the readable-text floor:
  `gray-400` **fails** AA (2.42:1 on off-white) and `gray-500` also fails
  (3.71:1, need 4.5:1) for any real (normal-size) text — captions, kickers,
  meta, labels. **Use `gray-600` (5.65:1) as the minimum for any text meant
  to be read.** `gray-400`/`gray-500` still exist in the palette and are
  fine for non-text use (the styleguide's own color swatches, decorative
  fills) — just not as text color. `gray-700` (8.51:1) is used for
  case-study body copy.
- **Accent as text** — `accent` on off-white is 3.72:1: it passes for
  **large text only** (≥24px regular — e.g. `text-h1`/`text-display`, like
  `NextProjectLink`'s hover title or Contact's email CTA), and **fails**
  for normal-size text (mono-caption labels, buttons). For accent-as-signal
  on small text, don't change the text color — keep the base text color
  and move the accent to a decoration instead:
  `underline decoration-transparent hover:decoration-accent` (or
  `decoration-accent` unconditionally for a persistent active state, as in
  `WorkIndexGrid`'s active tag). This is the established pattern; reuse it
  rather than reaching for `text-accent` on small text.
- **Touch targets (≥44px)** — small mono-caption links/buttons (Nav,
  Footer, tag filters, Contact's socials row) get `inline-block py-sm`
  for a ~49px tap target, offset with `-my-sm` so the row's visual spacing
  doesn't grow. Reuse `-my-sm inline-block py-sm` verbatim for any new
  small text link in a tight row.
- **Focus** — a single global rule in `globals.css`
  (`:focus-visible { outline: 2px solid var(--color-accent); ... }`) gives
  every interactive element a consistent, on-brand focus ring automatically
  — it's unlayered CSS, so it beats Tailwind's `@layer`-scoped utilities
  (including any element's own `outline-none`) regardless of class order.
  You should not need to add per-element focus styles; if an element isn't
  showing a ring, look for what's overriding the global rule rather than
  patching that one element.
- **Heading order** — one `h1` per page (usually inside a `KineticText`).
  Section-level labels that are the only heading for their section (e.g.
  `SelectedWork`'s "Selected Work", `/styleguide`'s `Section` labels) are
  real `h2`/etc. elements, not styled `<p>`s — check new sections for this.
  `ProjectCard`'s title is `h2` in both places it's used (`SelectedWork`
  and `WorkIndexGrid`), which works because both parent pages go directly
  from `h1` to `h2` with no intermediate level to skip.
- **Skip link** — `layout.tsx` has a visually-hidden-until-focused "Skip to
  content" link targeting `id="main-content"` on the wrapper div around
  `{children}`. Keep that id if you touch the layout.
- **`<Intro>`** is keyboard-skippable (Escape, or a visible "Skip intro"
  button that's auto-focused when it appears) — see its own bullet below
  for the full behavior. Any future full-screen/modal-like overlay should
  follow the same pattern: auto-focus something in it, provide a keyboard
  escape hatch, and `aria-hidden` the purely decorative parts.

### Primitives (`src/components/`)

- **`<Reveal>`** — fades + slides content up as it scrolls into view.
  Renders children plainly (no animation) when `prefers-reduced-motion` is
  set.
- **`<KineticText>`** — animates a headline in word-by-word or
  character-by-character. `trigger` is `"mount"`, `"scroll"`, or a
  **boolean** (stays hidden until it becomes `true` — used to sync the
  Hero headline with the Intro finishing). Always renders the full text
  for screen readers (visually hidden), with the animated split marked
  `aria-hidden`. No-op under `prefers-reduced-motion`.
- **`<SmoothScrollProvider>`** — wraps the app root with Lenis smooth
  scroll; skipped entirely under `prefers-reduced-motion` (falls back to
  native scrolling).
- **`<Nav>`** / **`<Footer>`** — global chrome rendered in the root layout.
  Footer shows a live local time + city (from `content/site.ts`) and
  email/socials (from `content/about.ts`); the clock is a client-only
  effect (starts `null` server-side) to avoid a hydration mismatch.
- **`<ProjectCard>`** — a project cover with a subtle scroll parallax
  (skipped under `prefers-reduced-motion`) and a title/role/year caption.
  The caption is hidden until hover on devices that support real hovering
  (`@media (hover: hover)`), but always visible on touch, and revealed on
  keyboard focus either way. Shared by `<SelectedWork>` and
  `<WorkIndexGrid>` — don't fork it per-page.
- **`<WorkIndexGrid>`** — `/work`'s responsive grid (all 6 projects) with a
  simple single-select tag filter (click a tag again, or "All", to clear
  it). Client component (filter state); `<ProjectCard>` does the rest.
- **`<PullQuote>`** — accent left-border, italic `font-display` quote +
  mono-caption attribution. Used by `<CaseStudyBody>`; reusable elsewhere.

### Case study template (`src/components/`, used by `/work/[slug]`)

- **`<CaseStudyHero>`** — tags row, kinetic oversized title, role/year, and
  the project's `cover` image (contained, not full-bleed — full-bleed is
  reserved for in-body images). All server-rendered except the
  `KineticText` title.
- **`<CaseStudyBody>`** — renders `Project.caseStudy.sections`, one
  `<Reveal>` per section with a "0X / 06" progress label above each
  heading. Prose blocks (heading/body/pullQuote) live in a `max-w-prose`
  column; `imagePair` is `max-w-content`; `fullBleedImage` breaks out to
  full viewport width (see the full-bleed layout note above). See the
  Content section above for the full block-type reference.
- **`<NextProjectLink>`** — bottom-of-page link to the next project in
  `content/projects.ts` (wraps to the first after the last). Deliberately
  text-only, no thumbnail — restraint over a second grid card.

### Home page sections (`src/components/`)

- **`<Intro>`** — full-screen off-black overlay with a 0–100% counter and a
  kinetic line, shown once per browser session (`sessionStorage`). Skipped
  entirely under `prefers-reduced-motion` or if already seen this session.
  Skippable by click, wheel, touch-move, the **Escape key**, or a visible
  **"Skip intro" button** — the button is auto-focused the moment the
  overlay appears, so keyboard users always land somewhere operable; the
  decorative counter/kinetic line are `aria-hidden` since they're not real
  page content. Calls `onComplete` the instant its wipe-away exit starts
  (not after it finishes) so `<Hero>` can choreograph its own reveal to
  line up with the wipe rather than waiting for it.
- **`<Hero>`** — takes a `start: boolean` prop (passed as `<Intro>`'s
  `onComplete` result from `src/app/page.tsx`) and uses it to drive
  `KineticText`'s boolean trigger, so the headline stays hidden until the
  intro hands off. Full `min-h-dvh` canvas (not `min-h-screen`, to avoid
  mobile browser-chrome resize jank).
- **`<SelectedWork>`** — the 4 `featured` projects from `content/projects.ts`,
  in a 2-column editorial grid (`<ProjectCard>` + `<Reveal>` per item, staggered).
  Plain server component — no client state of its own.
- **`<Contact>`** — `id="contact"`, scroll-triggered `KineticText` closing
  line, a large `text-display` `mailto:` link (the actual email address,
  set as the biggest single element on the page — deliberately more
  prominent than the headline above it), the socials + résumé row, and
  `<ContactForm>`. Plain server component; `<ContactForm>` is the only
  client piece.
- **`<ContactForm>`** — minimal two-field (name optional, message required)
  fallback to the main CTA. No backend: submit builds a `mailto:` link
  from the fields via `FormData` (uncontrolled inputs) and hands off to
  the visitor's own mail client. Fully labeled for accessibility.

`<WorkIndexGrid>` (used by `/work`, not Home) is a general primitive rather
than a Home section — it's documented above with `<ProjectCard>` since it's
shared UI, not part of the Home sequence.

Every token and primitive above is rendered live at **`/styleguide`** —
check there first before eyeballing values in the CSS/TS files.

## Coding conventions

- **Components** live in `src/components/`, one section per component (e.g.
  `Hero.tsx`, `WorkGrid.tsx`, `SignatureElement.tsx`) — not one giant page
  file.
- **No hardcoded colors or spacing.** Use design tokens defined in
  `src/app/globals.css` (Tailwind v4 `@theme` block) — extend that block
  instead of hardcoding hex values or arbitrary Tailwind spacing.
- **Mobile-first.** Write base styles for mobile, layer in `sm:`/`md:`/`lg:`
  breakpoints for larger screens.
- Prefer server components by default; mark a component `"use client"` only
  when it needs interactivity, animation hooks, or browser APIs (e.g. the
  Lenis scroll provider, Framer Motion components with hooks/gestures).

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`)
- **Framer Motion** — animation
- **Lenis** — smooth scroll
- **ESLint** + **Prettier** (with `prettier-plugin-tailwindcss` for class
  sorting)

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run format` — Prettier write
- `npm run format:check` — Prettier check (no writes)
