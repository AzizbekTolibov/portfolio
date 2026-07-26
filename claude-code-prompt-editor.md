# Spec + prompts — a Figma-style editor for the portfolio

Build a local-only visual editor at `/edit` where projects can be added,
positioned and resized directly on the canvas, then published to production
with one click.

**Do not paste this whole file into Claude Code.** It's five phases; run one
prompt per session, verify, commit, then move on. Phase 0 alone is worth
shipping — the rest can stop at any phase without leaving the repo broken.

---

## Decisions already made (don't re-litigate these)

| Question       | Decision                                                              |
| -------------- | --------------------------------------------------------------------- |
| Where          | Local `npm run dev` only. `/edit` must **never** exist in production. |
| Positioning    | Free — hand-placed `x/y/w/h` per frame, stored as overrides.          |
| Responsive     | Canvas is fixed. Small screens zoom out to fit. No second layout.     |
| Publish        | Save writes files → Publish commits and pushes → Vercel rebuilds.     |
| Content format | JSON, not TS — machines can't safely rewrite a TypeScript literal.    |

## The architectural cost, stated plainly

CLAUDE.md's central claim is that no coordinate is ever hand-authored:
`autoGrid()` derives every position from array length, so adding a project is
a one-line edit. Free positioning ends that. After this work, adding a project
is a **layout task** — you place it, and nothing places it for you.

The design below softens that as far as is honest: `autoGrid()` still runs and
supplies the starting position for any frame with no override, so a new
project appears in a sensible grid slot rather than at `0,0`. But once you
move it, that frame is yours to maintain. Every CLAUDE.md section asserting
auto-computed composition has to be rewritten in Phase 0, not left lying.

---

# Phase 0 — Move content to JSON

_No editor yet. The site must look byte-identical when this lands._

Convert `src/content/projects.ts` into data + loader:

- `src/content/data/projects.json` — the `projects` array as plain JSON.
  Inline the `photos()` helper's output; the editor will manage image lists
  explicitly from here on, so a generated `PHOTO_COUNTS` map can't survive.
- `src/content/projects.ts` — now just reads that JSON and exports it typed as
  `Project[]`. Every existing import keeps working unchanged.

Add `src/content/data/layout.json`, initially `{}`, typed as:

```ts
type LayoutOverrides = {
  // pageId → nodeId → partial rect. Any omitted field falls back to
  // whatever autoGrid()/getPageNodes() computed.
  [pageId: string]: {
    [nodeId: string]: Partial<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  };
};
```

Then in `getPageNodes()` (`src/content/canvas.ts`): generate nodes exactly as
today, and as the **last step** apply the override map over the result. Keep
the auto-grid path fully intact — it is now the default, not the only mode.

**The accessibility trap.** Right now the semantic layer's reading order is
node-generation order, which matches visual order because a grid generates
top-to-bottom. Once frames move freely those diverge, and non-negotiable #3
breaks silently — a screen reader would read a visually-last frame first. Fix
it in this phase, before any dragging exists: sort the semantic layer (and the
FOCUSED-state stepping order) by final resolved position — `y` ascending, then
`x` ascending — rather than by generation order. Verify with all overrides
empty that the order is unchanged from today.

Update CLAUDE.md: **Architecture → Spatial composition is auto-computed data**
and the **Content model** section both describe a world that no longer exists.

`npm run build` passes; the rendered site is visually identical.

---

# Phase 1 — The `/edit` shell

Add `src/app/edit/page.tsx` reusing the existing `CanvasWorkspace`.

**The production guard is the most important line in this phase.** All of:

- the page returns `notFound()` when `process.env.NODE_ENV === "production"`
- same guard, independently, in every `/api/edit/*` route handler — never rely
  on the page alone
- excluded from `sitemap.ts`, disallowed in `robots.ts`, `robots: { index: false }`

Write a test or a build-time assertion that fails if `/edit` appears in the
production build output. A leaked editor route is a filesystem-write endpoint
on a public URL.

In this phase the editor is **read-only**: the existing canvas, plus a right
panel showing the selected frame's live `x / y / w / h` as numeric inputs that
display but don't yet commit. An "Edit mode" badge in the top bar so it's never
ambiguous which mode you're in.

---

# Phase 2 — Drag, resize, save

The core interaction. Three rules, in priority order:

1. **60fps is still non-negotiable.** Dragging writes to Framer Motion motion
   values, exactly like panning does — React must not re-render per
   `pointermove`. Commit to React state once, on `pointerup`. If you find
   yourself calling `setState` in a move handler, the approach is wrong.
2. **Transform-only during the gesture.** Move via `translate`, resize via a
   transform where possible; write final `width`/`height` on release.
3. Everything reachable by pointer is reachable by keyboard (non-negotiable
   #2): arrow keys nudge 1 unit, Shift+arrow 10 units, and the inspector's
   numeric fields commit on Enter/blur.

Interactions to build:

- drag a selected frame to move
- eight resize handles, `Shift` to preserve aspect ratio
- snapping to other frames' edges and centers, with Figma-red alignment
  guides; hold `Alt` to bypass snapping
- `Cmd+Z` / `Cmd+Shift+Z` undo/redo over an in-memory stack of layout states.
  Keep this dumb — a bounded array of whole-layout snapshots, not per-op
  inverse patches. The layout object is small; correctness beats elegance.
- an unsaved-changes indicator, and a `beforeunload` warning

Save endpoint — `src/app/api/edit/save/route.ts`:

- `export const runtime = "nodejs"` (needs `fs`)
- production guard, again, independently
- writes `src/content/data/layout.json` via `fs/promises`, formatted with the
  repo's Prettier config so the diff stays readable
- write to a temp file and rename, so an interrupted save can't truncate the
  file into invalid JSON
- returns the written content; the client only clears its dirty flag on 200

Overlap is now possible and nothing prevents it. Add a non-blocking warning in
the inspector when the selected frame's rect intersects another frame on the
same page — a note, not a constraint.

---

# Phase 3 — Content CRUD and image upload

Add a content panel to `/edit`:

- add / duplicate / delete a project; edit `slug`, `title`, `year`,
  `description`
- reorder projects (drag the list) — this drives Home's default grid order
- per project: add, remove, reorder photos; set the cover
- writes `src/content/data/projects.json` through the same save endpoint
  pattern

Slug changes are the sharp edge: the slug is the URL (`/?page=<slug>` and
`/work/<slug>`). Warn explicitly that renaming breaks any shared link, and
block a rename that collides with an existing slug.

Image upload — `src/app/api/edit/upload/route.ts`, same guards:

- accepts a file, writes it to `public/photos/<slug>/`, returns
  `{ src, width, height }`
- read real intrinsic dimensions server-side (add `image-size`; it's tiny and
  dependency-free — don't pull in `sharp` for this)
- **alt text is a required field in the form.** Empty alt cannot be saved. The
  screen-reader non-negotiable is only as good as the content behind it, and
  an editor that lets you skip alt text will produce a portfolio with no alt
  text.
- reject anything that isn't png/jpg/webp/svg; sanitize the filename

Note that `scripts/generate-project-photos.mjs` becomes vestigial once real
images land — say so in its header rather than silently leaving it.

---

# Phase 4 — Publish

`src/app/api/edit/publish/route.ts`, same guards, `runtime = "nodejs"`:

1. `git status --porcelain` → return the changed file list
2. UI shows the diff summary and asks for a commit message (default:
   `Update portfolio content`)
3. on confirm: `git add src/content/data public/photos`, commit, push to the
   current branch
4. stream back stdout/stderr and surface failures verbatim — auth failures,
   non-fast-forward rejects and dirty unrelated files all land here

Constraints:

- **only** ever stage `src/content/data/` and `public/photos/`. Never `git add
-A` — the editor must not commit unrelated work-in-progress.
- refuse to publish if the working tree has staged changes outside those paths;
  tell me to handle it manually
- use `execFile` with an argument array, never string interpolation into a
  shell — the commit message is user input
- after a successful push, show the deploy will take ~60s. Don't fake a
  progress bar for a build you can't observe.

---

## Final checks, every phase

- `npm run lint`, `npm run build`, `npm run format`
- verify with `npm run start` that `/edit` **404s** in a production build
- the public site's 60fps pan/zoom, keyboard nav, semantic layer and
  crawlability are all unchanged — the editor is additive, never a rewrite of
  the viewer
- summarise every CLAUDE.md edit in your final message

## Tell me, don't act

After Phase 2, give me your honest read on whether free positioning is
actually paying for itself, or whether after moving six project tiles by hand
I'd have been better served by the grid plus a handful of layout presets. You
will have just built both — the override layer sits directly on top of a
working `autoGrid()`, so reverting to auto is a one-line change per frame at
that point, and never again after Phase 3 fills the override map.
