# Claude Code prompt — 4 portfolio changes

Copy everything below the line into Claude Code.

---

Make four changes to this portfolio. Read `CLAUDE.md` first — three of these
changes contradict what's currently documented there, so **CLAUDE.md must be
updated in the same commit**, not left stale. Keep every non-negotiable
(60fps transform-only pan/zoom, keyboard navigable, screen-reader readable,
crawlable, deep-linkable pages) intact.

## 1. Use the default system cursor

Remove the custom Figma cursors entirely. In
`src/lib/canvas/use-canvas-engine.ts`, `CURSOR_ARROW`, `CURSOR_HAND_OPEN`,
`CURSOR_HAND_CLOSED` and `CURSOR_ZOOM` (~lines 58-65) point at
`public/cursors/*.svg`. Replace them with plain CSS keywords —
`default` / `grab` / `grabbing` / `zoom-in` — so the browser's native
cursors are used. Keep the state logic itself (hand tool idle vs. actively
panning vs. Cmd/Ctrl-held zoom) exactly as-is; only the values change.
Delete the now-unused `public/cursors/` SVGs.

Then rewrite the CLAUDE.md section **"The pointer cursor is real CSS, not a
canvas child"** — the principle (a real CSS cursor on the viewport element,
never a DOM node inside the transformed world layer) still holds, but it's
now native keywords rather than custom SVGs.

## 2. Hover effect on Home's project cards

Home's project tiles are `kind: "project-cover"` frames (generated in
`src/content/canvas.ts`, rendered by `src/components/canvas/Frame.tsx`,
which already receives `hovered` / `onHoverChange` — line ~22). The tiles are
page-links, so hover is the only affordance signalling they're clickable.

Add a hover treatment that:

- reads as Figma-native, not as a marketing card — the existing
  `--color-selection` (`#0D99FF`) outline vocabulary, plus a subtle lift
  and a slight cover-image scale, is the right register
- animates **`transform` and `opacity` only** — no `top`/`left`/`width`/
  `height`/`box-shadow` size changes, since these frames live inside the
  world container and must not trigger layout during a pan
- applies to `project-cover` only, not to every frame kind
- stays in sync with the existing single `hoveredId` that already links a
  frame to its layers-panel row — do not introduce a second hover state
- mirrors on keyboard `:focus-visible`, so tab-focusing a tile shows the same
  treatment (non-negotiable #2)
- has a `prefers-reduced-motion` path (state change, no movement)

## 3. Project page content: strictly vertical Title → Year → Description → Images

Currently `getProjectPageNodes()` in `src/content/canvas.ts` builds an
"Overview" frame (title, year, description) and then lays the photos out in a
**4-column** grid via `autoGrid({ cols: PHOTO_COLS ... })`.

Change it to a single vertical column: `Title`, `Year`, `Description`, then
every photo stacked one below the next, top to bottom, all left-aligned to
the same x and sharing one column width. Practically that means
`PHOTO_COLS = 1` and a consistent frame width across the whole page — but
keep it **computed**, not hardcoded: photo positions must still come from
`autoGrid()`/`autoGridSize()` so adding a 5th photo in
`content/projects.ts` remains a one-line change.

Also:

- verify `zoomToFit()` handles the now much taller/narrower page bounds
  sensibly on a wide screen (it may fit to a very small scale — check and
  adjust the fit padding if it looks wrong)
- FOCUSED-state stepping order (`Overview`, `Photo 1..N`) already matches
  this vertical order — confirm it still does
- confirm the semantic layer (`SemanticDocument.tsx`) reading order still
  matches the visual order

Then update CLAUDE.md: the "4 per row" claim for the photo grid appears under
**Architecture → Spatial composition is auto-computed data**.

## 4. Remove Prev/Next, make the breadcrumb functional

In `src/components/canvas/TopBar.tsx`, delete the "Project navigation" group
(the Prev / Home / Next buttons, ~lines 221-258) along with the
`onPrevProject` / `onNextProject` props and their handlers in
`CanvasWorkspace.tsx` and anywhere else they're threaded through.

Replace that navigation with the breadcrumb itself:

- `Azizbek Tolibov` → navigates to Home
- `Portfolio 2026` → navigates to Home
- the current page name (third segment) → **not** interactive, styled as the
  current location (`aria-current="page"`)

Requirements:

- on Home, the breadcrumb has no third segment and the first two are
  non-interactive (already the current location) — don't render dead links
- clickable segments must be real `<button>` or `<a>` elements: keyboard
  focusable, visible `#0D99FF` focus ring, hover state
- the semantic layer and `/work/[slug]` static pages must still link to Home
  and to project pages — check nothing depended on the removed buttons
- Escape on a project page still goes to Home (`onEscapeUp` in
  `use-canvas-engine.ts`) — unchanged
- check the mobile top bar / `MobileBottomBar.tsx` for equivalent Prev/Next
  affordances and remove them too

This one actually brings the code _closer_ to CLAUDE.md's Hard Rule — the
Prev/Next group was explicitly documented as the one piece of genuinely
portfolio-motivated chrome. Update the **Hard Rule** section to drop that
carve-out and describe the breadcrumb as the sole page-switching affordance
in the top bar.

## Finally

- `npm run lint` and `npm run build` must pass
- `npm run format`
- Verify with `npm run start` (not `dev`): pan/zoom still feels 60fps, tab
  order is sane, breadcrumb navigation works from a project page and from a
  direct `/?page=<slug>` load
- Summarise every CLAUDE.md edit you made in your final message
