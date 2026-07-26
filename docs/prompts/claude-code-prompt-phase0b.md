# Phase 0b — wrap Home's project tiles in one shared parent

Run before Phase 1.

---

Your sibling-scoped position sort was the right call, and the About/Contact
interleaving problem you identified is real. But the scope claim in
`tree.ts`'s `buildLayerTree` comment is wrong on one case:

> Position ordering is correct _within_ a shared parent (reorder tiles,
> reorder a project's photos by drag)

Reordering tiles does **not** work under this scheme. Each project tile gets
its own top-level group — `${project.slug}-tile-group`, with no `parentId`
(`src/content/canvas.ts:288`). Tiles are therefore top-level entries, and
top-level entries keep generation order by design. Dragging a tile on Home
will move it visually while the Tab sequence and the screen-reader document
still read the original `projects.json` array order.

That's the exact accessibility trap Phase 0 set out to close, left open on the
one interaction the editor most obviously invites.

## The change

Introduce a single `work-group` (name it "Work") on Home as a top-level group,
and set `parentId: "work-group"` on every `${slug}-tile-group`. Size it to the
tile grid's bounds via `autoGridSize()` — computed, not hardcoded, so it still
follows `projects.length`.

Home's top level then becomes exactly four entries in authored order —
**Cover → Work → About → Contact** — with tiles position-sorted inside Work.
This keeps your About/Contact fix intact for the reason you gave, and makes
tile reordering behave the way your comment already claims it does.

## Then

- correct the `buildLayerTree` comment so it describes what the code actually
  does — and say explicitly that reordering _top-level sections_ is still not
  expressible through position, since that remains true and is a real
  constraint on Phase 2
- check nothing depended on tile groups being top-level: the layers panel's
  nesting depth and indent, `PagesPanel`, `flattenFrameOrder`, and any
  `!n.parentId` filter
- the layers panel now shows tiles nested one level deeper — confirm that
  reads correctly at both `dense` and normal row heights (`LayerBrowser:159`)
- re-run the same SSR heading-order diff you used for Phase 0. With
  `layout.json` still `{}` the output must be byte-identical to `d665327`
- update the CLAUDE.md paragraph describing the sibling sort — it currently
  states the same incorrect claim about top-level groups
- `npm run lint`, `npm run build`, `npm run format`

## Then verify the fix actually fixes it

Temporarily hand-write a `layout.json` that moves the last project tile to the
grid's first slot, and confirm the semantic layer and `flattenFrameOrder` both
now read it first. Revert `layout.json` to `{}` before committing, and show me
the before/after order in your final message.
