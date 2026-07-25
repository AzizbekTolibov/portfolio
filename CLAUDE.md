# Portfolio — Azizbek Tolibov

Personal portfolio for **Azizbek Tolibov**, a UI/UX designer. Built as a
single **infinite Figma canvas** you pan and zoom across — not a page you
scroll.

## Concept — "The Figma File"

The portfolio **is** a Figma file. You don't scroll a document; you pan and
zoom across an infinite 2D canvas of frames. Every piece of content — the
nameplate, each project cover, each case study, the bio, the contact card —
is a **frame positioned in canvas space**. Navigation is spatial: you move
the viewport, or you jump ("fly to") a frame. The metaphor is total, not
decorative — it determines the entire information architecture and every
navigation affordance.

The design work is presented in the tool the design work was made in. That is
the whole idea.

## The Hard Rule

**If a feature exists on a conventional portfolio, it does not exist here.**

This is the governing constraint. Before adding anything, ask: "does a normal
portfolio have this?" If yes, it is forbidden. Non-exhaustively, there is:

- **no** navbar, hamburger menu, or link list
- **no** hero section, "scroll to explore" cue, or vertical scroll at all
- **no** work grid / gallery / card list
- **no** about section or contact form
- **no** footer, breadcrumbs, or page-to-page route transitions
- **no** "sections" of any kind — a section is a page-document idea

What replaces them is always **spatial**: content is frames in 2D space;
"navigation" is pan / zoom / fly-to-frame; "sections" are regions of the
canvas. A project isn't a card in a grid — it's a frame you pan to. The bio
isn't an About page — it's a frame. Contact isn't a form — it's a frame with
an email on it (a business card / a comment pin), never a `<form>`.

The one carve-out: **accessibility and crawlability are not "portfolio
features"** — they are baseline requirements, and they are delivered through
the invisible **semantic layer** (below), never through visible conventional
chrome. Providing a screen-reader document does not violate the rule;
adding a visible nav menu does.

## Non-negotiables

These are hard requirements, not goals. A change that breaks one is wrong.

1. **60 fps pan / zoom.** The viewport must stay smooth on a laptop
   trackpad. This dictates the whole rendering approach (see Architecture →
   Viewport). Transform-only movement, no per-frame React re-render, no
   layout thrash.
2. **Keyboard navigable.** Everything reachable by pointer is reachable by
   keyboard. Tab moves through frames/links in a logical order; focusing a
   frame flies the viewport to it; there are explicit pan/zoom keys and a
   "reset view" / "next frame" affordance.
3. **Screen-reader readable.** A blind user gets a clean, ordered document
   with landmarks, correct heading order, and alt text — via the semantic
   layer. The canvas's absolute 2D positioning never leaks into reading
   order.
4. **Crawlable.** Server-rendered real HTML — real text, real headings, real
   `<a href>` links — so search engines and link unfurlers get everything.
   The content is not trapped behind canvas JavaScript.
5. **Deep-linkable frames.** Every frame has its own URL that loads the
   canvas already focused on it (and sets that frame's `<title>`/description/
   OG). Sharing a project link lands the visitor on that project.

## Architecture

### Single canvas route

There is exactly **one** route: the canvas. It is implemented as an optional
catch-all — `src/app/[[...frame]]/page.tsx` — so one page component serves
every URL:

- `/` → the whole canvas, default viewport
- `/[slug]` (e.g. `/auravest`) → canvas focused on that project's frame
- `/about`, `/contact` → canvas focused on those frames

`generateStaticParams()` enumerates the root plus every project slug and
special frame, so each frame URL is **statically pre-rendered** (SSG) and
`generateMetadata()` gives each one frame-specific title/description/OG.
Same single component, many crawlable, deep-linkable, pre-rendered URLs —
this is how "single canvas route" and "deep-linkable + crawlable" reconcile.
The `frame` param sets the canvas's **initial viewport transform** and the
semantic layer's initial focus.

### Transform-based viewport

Canvas space is a large 2D coordinate system in **canvas units**. Frames
have a position `(x, y)` and size `(w, h)` in those units. The viewport is a
single state `{ x, y, scale }` applied as **one CSS transform on a parent
"world" container**: `translate(x, y) scale(scale)`. Frames are absolutely
positioned children inside that container, so moving the viewport moves one
transform — the GPU composites it, nothing re-lays-out.

**The 60 fps discipline (non-negotiable #1):**

- Pan/zoom animate **`transform` only** (translate + scale). Never animate
  `top`/`left`/`width`/`height` — those trigger layout and kill the frame
  rate.
- Drive the transform with **Framer Motion motion values**
  (`useMotionValue` for x/y/scale, applied via `motion.div style={{ x, y,
scale }}`). Pointer/wheel handlers write to the motion values directly —
  **React does not re-render on every pointer move.** "Fly to frame" is an
  `animate()` on those same motion values.
- `will-change: transform` on the world container only; use sparingly.
- If frame count grows, **virtualize** off-screen frames (skip rendering
  frames far outside the viewport) rather than letting the DOM balloon.

### Frames as nodes

A frame is an absolutely-positioned node at `(x, y)` sized `(w, h)` in canvas
space, with a **frame label** rendered just above its top-left (Figma-style,
11px). Frame kinds map one-to-one to content:

- **Nameplate frame** — name, role, tagline (replaces the hero)
- **Project frames** — one per project, the cover (replaces the work grid;
  arranged spatially, not in a list)
- **Case-study frames** — a project's full case study, a large frame (or a
  small cluster of frames) you zoom into (replaces the `/work/[slug]` page)
- **About frame** — the bio (replaces the About page)
- **Contact frame** — email + socials on an artboard / comment pin (replaces
  the contact form)

### Spatial composition is data

Where each frame sits on the canvas — its `{ x, y, w, h }`, label, and which
content it carries — lives in a **data file** (planned:
`src/lib/canvas/frames.ts`), not hard-coded in components. This continues the
project's existing principle — _content is decoupled from layout_ — now as
**spatial composition is decoupled from rendering**: you can rearrange the
canvas by editing coordinates, without touching frame components. Frame
content still comes from `src/content/*` (unchanged).

### Parallel semantic layer (accessibility + SEO)

The visual canvas is transform-positioned divs in arbitrary 2D — meaningless
to a screen reader or crawler in that order. So content is rendered **twice,
from the same data**, as two projections:

- **Visual layer** — the transform-based canvas of frames. Pixel-faithful to
  Figma. Marked `aria-hidden` where it would otherwise pollute the a11y tree.
- **Semantic layer** — a real, in-DOM document (`src/components/semantic/`):
  `<main>` with an `<article>` per project, correct `<h1>`/`<h2>` order,
  prose, alt text, and real `<a href>` deep-links. It is **present in the DOM
  and the accessibility tree and the server HTML** (visually offscreen à la
  `sr-only`, but **never** `display:none` and **never** `aria-hidden`). This
  is what AT reads, what crawlers index, and what a "reader mode" would show.

Both layers are generated from `src/content/*` — content is authored once;
the canvas and the document are two views of it. Keyboard focus ties them
together: Tab moves through the semantic layer in reading order, and each
focus event flies the visual viewport to the matching frame, so the two stay
in sync.

## Visual language — Figma's own UI

The chrome is Figma dark-mode UI, to the pixel. Tokens (planned, in
`globals.css` `@theme`):

| Token               | Value     | Use                                          |
| ------------------- | --------- | -------------------------------------------- |
| `--color-panel`     | `#1E1E1E` | Toolbar / panel chrome                       |
| `--color-surface`   | `#2C2C2C` | Secondary surfaces, canvas backdrop          |
| `--color-selection` | `#0D99FF` | Selection outlines, focus rings (Figma blue) |
| `--color-comment`   | `#9747FF` | Comment pins / annotations (Figma purple)    |

- **UI text is 11px** — Figma's chrome size. Frame labels, toolbar,
  coordinates, zoom %: all 11px, neutral UI sans, a dim gray on dark.
- **Frame labels sit above frames** — the frame's name in 11px just above its
  top-left corner, exactly like Figma renders artboard names.
- **Selection = blue `#0D99FF`**; **comments/annotations = purple `#9747FF`**.
  Use the blue for focus/selection and the purple for any pinned annotation
  or callout — do not invent other accent colors.
- **Artboard interiors keep the editorial palette.** The portfolio content
  inside frames sits on light "artboards": the previous off-white (`#F4F2ED`)
  and neutral gray scale survive **as artboard-interior tokens**, floating on
  the dark Figma canvas. So the chrome is Figma-dark; the content is
  editorial-light — the bridge between the two concepts.

## Content (unchanged data model)

Content still lives in typed data files under `src/content/` and is the
single source both layers project from:

- `types.ts` — `Project`, `CaseStudy`, `CaseStudyBlock` (`heading` / `body` /
  `pullQuote` / `fullBleedImage` / `imagePair`), `CaseStudySection`,
  `CaseStudyImage`, plus `AboutContent` / `ContactContent` / `SiteContent`.
- `projects.ts` — the 6 projects, each with its `caseStudy`. **Auravest** is
  the one fully populated example (every block type); the rest use the
  `defaultCaseStudy()` helper.
- `about.ts` — bio + contact (email, socials, résumé).
- `site.ts` — name, role, tagline, location. (Its old `nav` array is a
  conventional-nav artifact and will be dropped; there is no nav.)
- `home.ts` — old hero/contact copy; its lines get repurposed as frame text
  (tagline → nameplate, contact line → contact frame).

Project covers are placeholder SVGs in `public/projects/` at final display
dimensions, rendered via next/image with `unoptimized` (SVG). The
case-study block model is unchanged and is what the case-study **frame**
renderer and the semantic layer both consume.

## Planned file structure

```
src/
  app/
    [[...frame]]/page.tsx   the single canvas route (SSG per frame)
    layout.tsx              Figma dark shell (no nav/footer/scroll provider)
    globals.css             Figma UI tokens + artboard-interior tokens
    icon.tsx, opengraph-image.tsx, twitter-image.tsx   (kept; restyle OG)
    sitemap.ts, robots.ts   (rewritten for the new URL shape)
  components/
    canvas/                 Canvas (viewport), Frame, FrameLabel, CommentPin…
    frames/                 NameplateFrame, ProjectFrame, CaseStudyFrame,
                            AboutFrame, ContactFrame (projections of content)
    semantic/               the parallel semantic document
  lib/
    canvas/frames.ts        spatial composition data ({x,y,w,h}+label+content)
    canvas/viewport.ts      motion-value viewport controller + fly-to math
    motion.ts               (kept) durations/easings for Framer Motion
    site-url.ts             (kept) canonical URL resolver for metadata
    og-content.tsx          (kept) OG image visuals
  content/                  (kept, unchanged) the content data model
```

## Removed with the old concept

The previous build was a conventional scrolling editorial site (cinematic
intro → hero → work grid → about → contact, plus a case-study page template).
All of that chrome is deleted because it is exactly what the Hard Rule
forbids. See the deletion list maintained alongside this rewrite. The
**content and data survive**; only the page-document presentation of it is
gone.

## Conventions still in force

Carried over from the prior build because they're concept-independent:

- **Accessibility contrast** — compute WCAG ratios, don't eyeball. On dark
  Figma chrome, UI text must clear AA against `#1E1E1E`/`#2C2C2C`; artboard
  content keeps the previously-validated light-palette floors (`gray-600` is
  the readable-text minimum on off-white, `gray-400`/`500` are non-text
  only). Every interactive element gets a visible focus ring — reuse the
  Figma **blue `#0D99FF`** for it.
- **`prefers-reduced-motion`** — pan/zoom animations and any fly-to must have
  a reduced-motion path (instant jumps instead of animated flights). The
  canvas still works with motion off.
- **SEO infra** — `site-url.ts` resolves the canonical URL
  (`NEXT_PUBLIC_SITE_URL` → Vercel env → localhost); root layout sets
  `metadataBase` + a title template + JSON-LD `Person`; per-frame
  `generateMetadata`. `next/og` images: **Satori needs explicit
  `display:flex` on any div with >1 child** (this only errors at request
  time in production — `next dev`/`tsc` won't catch it).
- **Content decoupled from presentation** — now generalized: content in
  `/content`, spatial composition in `/lib/canvas`, rendering in
  `/components`. Editing any one must not require touching the others.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.js`)
- **Framer Motion** — drives the viewport transform (motion values) and
  fly-to animations; **Lenis is removed** (smooth _scroll_ is a
  page-document idea; there is no scroll)
- **next/font** — self-hosted UI sans (11px chrome); editorial display type
  for artboard content is optional, revisit during build
- **ESLint** + **Prettier** (with `prettier-plugin-tailwindcss`)

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — serve the production build (use this, not `dev`, for any
  real performance/Lighthouse check)
- `npm run lint` — ESLint
- `npm run format` / `format:check` — Prettier
