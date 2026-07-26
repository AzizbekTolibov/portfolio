# Portfolio — Azizbek Tolibov

Personal portfolio for **Azizbek Tolibov**, a UI/UX designer. Built as a
Figma file you open: a **Pages** list on the left, and an infinite canvas
per page that you pan and zoom across — not a document you scroll.

## Concept — "The Figma File"

The portfolio **is** a Figma file, not a metaphor layered on top of one.
Figma files have **Pages** — Home is one page, and every project is its
own page — and each page is its own infinite 2D canvas of frames. You
don't scroll a document; within a page you pan and zoom, and between
pages you switch in the Pages panel or click a page's own content (a
project tile on Home, or the breadcrumb to go back). The metaphor is
total, not decorative — it determines the entire information architecture
and every navigation affordance, including the part that would look like
"conventional portfolio chrome" if you squinted: the breadcrumb below is
Figma's own top-bar chrome, not a portfolio nav bar wearing a disguise.

The design work is presented in the tool the design work was made in. That is
the whole idea.

## The Hard Rule

**If a feature exists on a conventional portfolio, it does not exist here
in portfolio form — it exists in Figma form, if Figma has an equivalent.**

This is the governing constraint. Before adding anything, ask: "does a normal
portfolio have this, and does Figma have something that looks similar for a
different reason?" If a normal portfolio has it and Figma doesn't have an
equivalent, it's forbidden. Non-exhaustively, there is:

- **no** hamburger menu, nav link list, or "sections" of a single scrolling
  document
- **no** hero section, "scroll to explore" cue, or vertical scroll within a
  page
- **no** work grid / gallery / card list — Home's project tiles are laid out
  as Figma frames in a grid, auto-computed from data, the same way any
  Figma page's frames might happen to be arranged in a grid
- **no** about section or contact form
- **no** footer

What **is** present, because Figma itself has it:

- **A Pages panel** (top of the left sidebar) and **a breadcrumb**
  (`Azizbek Tolibov / Portfolio 2026 / Auravest`) — this is Figma's own
  file/page chrome, pixel-matched, not a portfolio nav bar. The test that
  keeps this honest: would Figma show this exact element, with this exact
  behavior, for a file that had nothing to do with a portfolio? Yes — every
  Figma file has a Pages list and this breadcrumb shape. The breadcrumb is
  the **sole** page-switching affordance in the top bar: `Azizbek Tolibov`
  and `Portfolio 2026` navigate Home (real `<button>`s, not on Home itself,
  where they're already the current location and render as plain
  non-interactive text instead of dead links); the current page name (the
  third segment, only present on a project page) is never interactive —
  `aria-current="page"`, styled as a location, not a link. There is no
  separate Prev/Next-project control — that was tried and dropped as the
  one piece of chrome that was genuinely portfolio-motivated rather than a
  literal Figma pattern (see git history if you're looking for it; it
  isn't coming back without a specific request).

What replaces conventional portfolio ideas is otherwise always **spatial**:
content is frames in 2D space; "navigation" within a page is pan / zoom /
fly-to-frame; a project isn't a card in a grid — it's a page you switch to,
containing frames you pan to.

The one carve-out: **accessibility and crawlability are not "portfolio
features"** — they are baseline requirements, and they are delivered through
the invisible **semantic layer** (below), never through visible conventional
chrome. Providing a screen-reader document does not violate the rule.

## Non-negotiables

These are hard requirements, not goals. A change that breaks one is wrong.

1. **60 fps pan / zoom.** The viewport must stay smooth on a laptop
   trackpad. This dictates the whole rendering approach (see Architecture →
   Viewport). Transform-only movement, no per-frame React re-render, no
   layout thrash. Switching pages is the one exception allowed to be a
   discrete, non-continuous transition (a zoom-to-fit animation, not a
   remount) — it's a deliberate "load a different page" moment, not
   something that needs to stay smooth mid-gesture.
2. **Keyboard navigable.** Everything reachable by pointer is reachable by
   keyboard. Tab moves through frames/links in a logical order; focusing a
   frame flies the viewport to it; explicit pan/zoom keys exist, and in
   FOCUSED state (see Navigation model below) arrows/Space step to the
   next/previous frame **on the current page**. Escape on a project page
   returns to Home; Escape on Home deselects/re-fits.
3. **Screen-reader readable.** A blind user gets a clean, ordered document
   with landmarks, correct heading order, and alt text — via the semantic
   layer, regenerated per page. The canvas's absolute 2D positioning never
   leaks into reading order.
4. **Crawlable.** Server-rendered real HTML — real text, real headings, real
   `<a href>` links — so search engines and link unfurlers get everything.
   The content is not trapped behind canvas JavaScript.
5. **Deep-linkable pages.** Every page (Home, or any project) has its own
   URL that loads the canvas already on it, zoomed to fit, with that page's
   `<title>`/description/OG. Sharing a project link lands the visitor on
   that project's page. (Individual frames are no longer separately
   deep-linkable — only pages are; a page's own fit-all view is its
   "default state" now, the same way it was for the whole canvas before
   Pages existed.)

## Architecture

### One route, many Pages

There is exactly **one** interactive route — `src/app/page.tsx` — serving
every URL via a query param, Figma-style:

- `/` → Home
- `/?page=<slug>` (e.g. `/?page=auravest`) → that project's page, already
  zoomed to fit

`content/canvas.ts` exports `PAGES: PageMeta[]` (Home + one entry per
project) and `getPageNodes(pageId): CanvasNode[]`, which generates that
page's frames fresh on every call. `CanvasWorkspace` holds `currentPageId`
as React state; switching it recomputes `spatialNodes` for the new page and
triggers `zoomToFit()` — the **same** engine instance stays mounted across
a page switch (no remount), it just receives a different `frames` array
and re-fits to it. `generateMetadata` in `page.tsx` reads `?page=` server-side
so a fresh load of a project URL gets that project's title/description in
the initial HTML.

A **separate, fully static** SEO surface lives at `/work/[slug]`
(`generateStaticParams` over every project) — a real server-rendered
document (title, year, description, every photo with alt text) for crawlers
and unfurlers that don't execute the canvas's client JS at all. It mirrors
exactly what a project's page contains — nothing more.

### Transform-based viewport

Canvas space is a large 2D coordinate system in **canvas units**, scoped to
whichever page is currently active — Home's coordinate space and a project
page's coordinate space are unrelated; frame ids and positions don't need
to (and don't) line up across pages. Frames have a position `(x, y)` and
size `(w, h)` in those units. The viewport is a single state `{ x, y, scale
}` applied as **one CSS transform on a parent "world" container**:
`translate(x, y) scale(scale)`. Frames are absolutely positioned children
inside that container, so moving the viewport moves one transform — the
GPU composites it, nothing re-lays-out.

**The 60 fps discipline (non-negotiable #1):**

- Pan/zoom animate **`transform` only** (translate + scale). Never animate
  `top`/`left`/`width`/`height` — those trigger layout and kill the frame
  rate.
- Drive the transform with **Framer Motion motion values**
  (`useMotionValue` for x/y/scale, applied via `motion.div style={{ x, y,
scale }}`). Pointer/wheel handlers write to the motion values directly —
  **React does not re-render on every pointer move.** "Fly to frame" (and
  "switch page") is an `animate()` on those same motion values.
- `will-change: transform` on the world container only; use sparingly.
- Off-screen frames are virtualized (skipped from the DOM) based on the
  current viewport bounds — with a whole page's frames now typically
  numbering in the dozens rather than hundreds, this matters less than it
  did pre-Pages, but the mechanism (`src/lib/canvas/use-canvas-engine.ts`)
  is unchanged.

### Navigation model — Pages, then OVERVIEW and FOCUSED

**Pages** is the top-level navigation unit (see above) — switching pages is
a discrete jump, not a continuous pan. Within whichever page is active, the
canvas has the same two states it always did:

- **OVERVIEW** — the default when a page loads: zoom-to-fit **every** frame
  on that page. Frame labels counter-scale (see `label-transform.ts`) so
  they stay a constant screen size regardless of zoom, with a capped
  reach so a label can never grow far enough to overlap whatever's above
  it even at extreme zoom-out. Hovering a frame highlights it **and** its
  row in the layers panel — one `hoveredId`, not independent hover states.
- **FOCUSED** — clicking any frame (canvas or layers-panel row) flies the
  camera to fill ~80-90% of the viewport with it. From here, scrolling,
  arrow keys, or a Space tap step to the next/previous frame in **this
  page's own node order** — deliberately just the order `getPageNodes()`
  generated the page's frames in (Home: Cover, each project tile, About's
  frames, Contact; a project page: Overview, then Photo 1..N) — not a
  separately hand-authored list any more, since a page's content order
  already **is** its natural viewing order and there's nothing extra to
  keep in sync when a page's content changes. One gesture moves exactly
  one frame (debounced against trackpad-swipe/key-repeat bursts). Escape,
  or clicking empty canvas, returns to this page's own OVERVIEW — **unless**
  the current page is a project page, in which case Escape goes all the way
  back to Home (see `onEscapeUp` in `use-canvas-engine.ts`).

One frame kind is a **page-link**, not a normal frame: Home's project
tiles carry `content.pageLink = <slug>`. Clicking one **navigates** to that
project's page — it does not enter FOCUSED and does not zoom. This is
wired as an engine option (`pageLinks: Map<frameId, pageId>` +
`onNavigatePage`), checked before the normal click-to-zoom logic, so a
page-link frame can never accidentally get "selected" the way a normal
frame does.

Camera travel — entering FOCUSED, stepping, returning to OVERVIEW,
switching pages — animates translate + scale together (~800ms ease-in-out)
so the space between frames is visible; it never cross-fades or jumps.
Gated by `flyBetweenFrames` in `src/lib/canvas/config.ts`.
`prefers-reduced-motion` always wins over that flag regardless of its
value. The hand tool (H) and Space+drag panning still work in either
state — they're never required, only available.

### The pointer cursor is real CSS, not a canvas child

The cursor swaps by tool/state — `default` (move tool default), `grab`
(hand tool idle), `grabbing` (actively panning), `zoom-in` (Cmd/Ctrl held) —
via plain native CSS keywords applied **on the viewport element itself**.
This is the only correct way to do it: a real CSS cursor is screen-space by
definition and can never inherit the world layer's `scale()` — a DOM
element positioned inside the transformed canvas layer would grow and
shrink with zoom instead. The state logic (which cursor applies when) lives
in `use-canvas-engine.ts`'s `updateCursor()`; only the four values
themselves are native keywords rather than custom SVGs.

### Frames as nodes

A frame is an absolutely-positioned node at `(x, y)` sized `(w, h)` in canvas
space, with a **frame label** rendered just above its top-left (Figma-style,
11px, counter-scaled to stay a constant screen size — see
`label-transform.ts`). Frame kinds map one-to-one to content:

- **`site-cover`** — Home's nameplate (name, role, tagline)
- **`project-cover`** — Home's per-project tile: cover image, title, year
  beneath it, wrapped in a page-link
- **`project-overview`** — a project page's title/year/description frame
- **`project-photo`** — one of a project's photos (count varies per
  project, auto-gridded — see below)
- **`about-portrait` / `about-bio` / `about-skills`** — the About cluster
- **`contact`** — email + socials on an artboard

### Spatial composition is auto-computed data

Where each frame sits — its `{ x, y, w, h }`, label, and content — is
generated by `content/canvas.ts`'s `getPageNodes(pageId)`, not hand-placed
per frame. Two grids in particular are **computed, never hardcoded**, via
`src/lib/canvas/auto-grid.ts`'s `autoGrid()`/`autoGridSize()`:

- Home's project-tile grid (4 per row, wraps to as many rows as
  `projects.length` needs)
- Each project page's photo column (a single column — `cols: 1` — of
  however many rows `project.images.length` needs, stacked title → year →
  description → Photo 1..N, all sharing one column width)

Adding a 7th or 10th project, or a 5th photo to an existing project, is a
one-line content edit in `content/projects.ts` — no coordinate anywhere
needs touching, because every position downstream of the array length is
recomputed from it.

### Parallel semantic layer (accessibility + SEO)

The visual canvas is transform-positioned divs in arbitrary 2D — meaningless
to a screen reader or crawler in that order. So content is rendered **twice,
from the same data**, as two projections, regenerated for whichever page is
currently active:

- **Visual layer** — the transform-based canvas of frames. Pixel-faithful to
  Figma. Marked `aria-hidden` where it would otherwise pollute the a11y tree.
- **Semantic layer** (`src/components/semantic/SemanticDocument.tsx`) — a
  real, in-DOM `<main>` with correct `<h1>`/`<h2>` order, alt text, and real
  `<a href>` links: a page-link frame gets both a link to the dedicated
  `/work/[slug]` SEO page (`Read the full X write-up`) and a real client-side
  link to that project's canvas page (`Open the X page`, `href="/?page=X"`).
  Any other frame's link falls back to the **current page's own URL**
  (frames aren't individually deep-linkable any more, only pages are).
  Visually offscreen (`sr-only`), but **never** `display:none` and **never**
  `aria-hidden`.

Both layers are generated from `src/content/*` — content is authored once;
the canvas and the document are two views of it, per page. Keyboard focus
ties them together: Tab moves through the semantic layer in reading order,
and each focus event flies the visual viewport to the matching frame.

## Visual language — Figma's own UI

The chrome is Figma dark-mode UI, to the pixel.

| Token               | Value     | Use                                          |
| ------------------- | --------- | -------------------------------------------- |
| `--color-panel`     | `#1E1E1E` | Toolbar / panel chrome                       |
| `--color-surface`   | `#2C2C2C` | Secondary surfaces, canvas backdrop          |
| `--color-selection` | `#0D99FF` | Selection outlines, focus rings (Figma blue) |

- **UI text is 11px** — Figma's chrome size. Frame labels, toolbar,
  coordinates, zoom %: all 11px, neutral UI sans, a dim gray on dark.
- **Frame labels sit above frames** — the frame's name in 11px just above its
  top-left corner, exactly like Figma renders artboard names.
- **Selection = blue `#0D99FF`.** Use it for focus rings and selection
  outlines — do not invent other accent colors.
- **Artboard interiors keep the editorial palette.** The portfolio content
  inside frames sits on light "artboards": off-white (`#F4F2ED`) and neutral
  gray scale, floating on the dark Figma canvas.
- **Unverified facts render in red (`#F24822`, Figma's own "missing" red).**
  Any `[BRACKETED]` run in a content string — `[YEAR]`, `[RATIONALE — TO
WRITE]`, etc. — is automatically rendered in that color by
  `src/lib/canvas/placeholder-text.tsx`'s `<PlaceholderText>`, used
  everywhere user-authored copy renders (inspector rows, case-study-style
  body copy, OG captions where feasible). This exists so a fact that hasn't
  been supplied yet (or, historically, a fabricated one caught during
  review) can never silently read as real. When adding new content fields,
  wrap their render path in `<PlaceholderText>` too, or a future bracket
  placeholder will render in plain text instead of red.

## Content model

Content lives in typed data files under `src/content/`, the single source
both layers (and both SEO surfaces) project from:

- `types.ts` — `Project`, `PropertyGroup`, `AboutContent`, `ContactContent`,
  `SiteContent`, `HomeContent`.
- `projects.ts` — every project as:
  ```ts
  {
    slug: string;
    title: string;
    year: string;       // "[YEAR]" until real
    description: string;
    cover: ProjectImage;    // { src, width, height, alt }
    images: ProjectImage[]; // however many — the grid follows the length
  }
  ```
  There is no case-study model any more (no sections, no rationale, no
  Role/Team/Duration/Tools/Platform) — a project **is** a title, a year, a
  description, and its photos. All six current projects get a Home tile
  and their own page; the old `featured` flag is gone — every project in
  the array is fully first-class.
- `about.ts` — bio + contact (email, socials, résumé). Unchanged by the
  Pages rewrite.
- `site.ts` — name, role, tagline, location.
- `home.ts` — the Cover's positioning-statement copy.
- `canvas.ts` — **not** static content; the page-generation module described
  under Architecture above (`PAGES`, `getPageNodes`, the `CanvasNode`
  union, the two auto-grids).

Project cover images and photos are placeholder SVGs (`public/projects/`,
`public/photos/`) generated by `scripts/generate-project-photos.mjs` —
re-run it after editing photo counts in `content/projects.ts`.

## File structure (current, not aspirational)

```
src/
  app/
    page.tsx                the one interactive route (?page=<slug>)
    work/[slug]/page.tsx     static per-project SEO page (+ OG/Twitter images)
    layout.tsx               Figma dark shell; root JSON-LD Person schema
    globals.css              Figma UI tokens + artboard-interior tokens
    icon.tsx, opengraph-image.tsx, twitter-image.tsx
    sitemap.ts, robots.ts
  components/
    canvas/                  Canvas (viewport), Frame, Group, TopBar,
                             LeftPanel, PagesPanel, LayerBrowser, RightPanel,
                             InspectorContent, FrameCounter, CommandPalette,
                             mobile equivalents…
    semantic/                SemanticDocument, FrameLink — the parallel doc
  lib/
    canvas/
      use-canvas-engine.ts   viewport + selection + pageLinks/onEscapeUp
      use-intro-sequence.ts  first-load loading screen + zoom-to-fit reveal
      auto-grid.ts           autoGrid()/autoGridSize() — the two grids' math
      label-transform.ts     capped counter-scale for constant-size labels
      geometry.ts, tree.ts, color.ts, blur.ts, config.ts, types.ts
    motion.ts                durations/easings for Framer Motion
    site-url.ts              canonical URL resolver for metadata
    og-content.tsx           OG image visuals
  content/                   the content data model (see above)
scripts/
  generate-project-photos.mjs   placeholder photo generator
```

## Conventions still in force

- **Accessibility contrast** — compute WCAG ratios, don't eyeball. On dark
  Figma chrome, UI text must clear AA against `#1E1E1E`/`#2C2C2C`; artboard
  content keeps the previously-validated light-palette floors (`gray-600` is
  the readable-text minimum on off-white, `gray-400`/`500` are non-text
  only). Every interactive element gets a visible focus ring — reuse the
  Figma **blue `#0D99FF`** for it.
- **`prefers-reduced-motion`** — pan/zoom animations, fly-to, and page
  switches all have a reduced-motion path (instant jumps instead of
  animated flights). The canvas still works with motion off.
- **SEO infra** — `site-url.ts` resolves the canonical URL
  (`NEXT_PUBLIC_SITE_URL` → Vercel env → localhost); root layout sets
  `metadataBase` + a title template + JSON-LD `Person` (including a real
  `address` once supplied); `page.tsx`'s `generateMetadata` reads `?page=`.
  `next/og` images: **Satori needs explicit `display:flex` on any div with
  > 1 child** (this only errors at request time in production — `next
dev`/`tsc` won't catch it).
- **Content decoupled from presentation** — content in `/content`, spatial
  composition (now: page generation) in `/lib/canvas` + `content/canvas.ts`,
  rendering in `/components`. Editing any one must not require touching the
  others.
- **No fabricated specifics.** Every project fact not yet supplied is a
  literal `[BRACKETED]` placeholder rendered in red (see Visual language,
  above) — never invented prose standing in for real research, metrics, or
  team details. Extend this to any new content field before it ships.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.js`)
- **Framer Motion** — drives the viewport transform (motion values) and
  fly-to/page-switch animations; **Lenis is removed** (smooth _scroll_ is
  a page-document idea; there is no scroll within a page)
- **next/font** — self-hosted UI sans (11px chrome); editorial display type
  for artboard content
- **ESLint** + **Prettier** (with `prettier-plugin-tailwindcss`)

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — serve the production build (use this, not `dev`, for any
  real performance/Lighthouse check)
- `npm run lint` — ESLint
- `npm run format` / `format:check` — Prettier
- `node scripts/generate-project-photos.mjs` — regenerate placeholder photos
  after editing photo counts in `content/projects.ts`
