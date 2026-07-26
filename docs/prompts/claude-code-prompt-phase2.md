# Phase 2 — drag, resize, save

Build Phase 2 as written in `claude-code-prompt-editor.md`, plus the addendum
below, which resolves something that spec got wrong.

---

## Addendum: overrides must cascade to descendants

The Phase 0 spec defined `LayoutOverrides` as `pageId → nodeId → partial rect`
and said `getPageNodes()` applies it as its last step. That's incomplete,
because **every node in this canvas stores absolute coordinates — children
included**. A tile's image is `x: tileX`; its title is `x: tileX + 40`; a
group's children are absolute, not relative to the group.

So a naive per-node override means dragging a project tile moves the frame and
leaves its cover image, title and year behind. Dragging `work-group` moves the
dashed box and leaves all six tiles.

Decide and implement one of these before writing any drag code:

**Option A — cascade at generation time (recommended).** An override on a node
is applied as a _delta_ to that node and every descendant, recursively, in
`getPageNodes()`'s final step. `layout.json` stores one entry per node the
user actually moved. Small file, survives auto-layout changes, and a group
drag is a single entry.

**Option B — flatten on write.** The editor computes and writes an absolute
override for the dragged node and every descendant. Simple to apply, but
`layout.json` grows by ~4 entries per tile moved, and every stored descendant
position silently goes stale the moment you change a frame's internal layout
in `canvas.ts`.

Take A unless you find a concrete reason it fails. Whichever you pick, say why
in a comment on `LayoutOverrides` and in CLAUDE.md — this is the kind of
decision that looks arbitrary in six months.

**Resize cascades differently from move,** and this is the sharp edge. Moving
a group translates children by a delta — unambiguous. Resizing a group has no
single correct answer: scale children proportionally, or resize the container
and leave children pinned at their offsets? Figma does the former for frames
with constraints, the latter for sections.

Simplest defensible answer for Phase 2: **allow resize on leaf frames only,
not on groups.** A group's bounds stay derived from its children. Show the
group's w/h in the inspector as read-only, with resize handles suppressed.
That sidesteps the entire constraints problem, and nothing in the portfolio
needs a hand-resized group. If you disagree, argue it before building it.

## Then everything in the spec's Phase 2

Reproduced here so you don't have to hold two files open — the three
non-negotiable rules, in priority order:

1. **60fps.** Dragging writes to Framer Motion motion values, exactly like
   panning. React must not re-render per `pointermove`. Commit to React state
   once, on `pointerup`. If you're calling `setState` in a move handler, stop.
2. **Transform-only during the gesture.** Move via `translate`; write final
   `width`/`height` on release.
3. **Keyboard parity.** Arrow nudges 1 unit, Shift+arrow 10, inspector numeric
   fields commit on Enter/blur. The inspector's fields become editable in this
   phase — that's the keyboard path to precise positioning.

Interactions: drag to move; eight resize handles on leaf frames with Shift to
preserve aspect; snapping to other frames' edges and centers with alignment
guides, Alt to bypass; `Cmd+Z`/`Cmd+Shift+Z` undo-redo over a bounded array of
whole-layout snapshots (not inverse patches — the object is small, correctness
beats elegance); an unsaved-changes indicator and a `beforeunload` warning.

Save endpoint — `src/app/api/edit/save/route.ts`:

- `export const runtime = "nodejs"`
- the production guard, independently — do not rely on the page's guard. Add
  it to `verify:edit-guard` too, so the script asserts the API 404s in a
  production build alongside the page.
- writes `src/content/data/layout.json` via `fs/promises`, Prettier-formatted
- temp file + rename, so an interrupted write can't truncate the file into
  invalid JSON
- returns what it wrote; the client clears its dirty flag only on 200

Overlap is now possible and nothing prevents it. Non-blocking warning in the
inspector when the selection intersects another frame on the same page — a
note, not a constraint.

## Verify

- drag a tile: its image, title and year move with it. Drag `work-group`: all
  six tiles move with it. This is the whole point of the addendum — check it
  explicitly.
- reload after save: positions persist, and `layout.json` is valid,
  human-readable JSON
- set `layout.json` back to `{}`: the page returns exactly to the auto-grid
  layout, byte-identical to before Phase 2
- the semantic layer and Tab order follow the _new_ positions (the Phase
  0b/0c work is what makes this possible — confirm it actually fires)
- `npm run verify:edit-guard` passes, now covering the API route
- pan/zoom still feels 60fps with a drag in progress and after
- lint, build, format

## Tell me, don't act

This is the phase where the spec's promise gets tested. After you've built it,
tell me honestly: does hand-positioning six tiles feel better than the grid
did, or does it feel like work? You'll have both in front of you — the
override layer sits directly on a working `autoGrid()`, and reverting is one
deleted JSON file. That option disappears once Phase 3 starts filling the
override map for real.
