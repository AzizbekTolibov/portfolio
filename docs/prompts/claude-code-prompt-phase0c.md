# Phase 0c — `work-group` collides with its first child

Run before Phase 1.

---

The thing you reasoned about but didn't confirm is broken, and it's provable
from the coordinates rather than by eye.

`work-group` is pushed at `x: gridOriginX, y: gridY` with
`width: gridSize.width, height: gridSize.height` — the exact bounds of the
tile grid. The first tile group, `auravest-tile-group`, is at
`tileX = tileRects[0].x` (`= gridOriginX`) and `tileY = rect.y + yOffset`
(`= gridY`). Identical origin.

Both are `type: "group"`, so both render through `Group.tsx` with the same
`GROUP_LABEL_OFFSET` of `-40`. Result:

- the labels "Work" and "Auravest" draw at the same screen position, on top
  of each other, at every zoom level
- the two dashed borders are coincident along the top and left edges

`Group.tsx`'s own comment predicts exactly this failure — but only for the
group-vs-frame case, which is why the offsets are `-40` and `-16`. A group
nested inside a group at identical bounds is new as of 3bd4401.

## Fix both halves, not just the visible one

**1. Give `work-group` padding.** A Figma Section has padding around its
contents; it never traces its children's bounding box exactly. Add a
`WORK_GROUP_PADDING` constant and inset the tiles within it — the group's
origin moves up/left by the padding, its size grows by twice it. Keep it
derived from `autoGridSize()`, not hardcoded dimensions.

Check the knock-on: `coverWidth` is computed as
`COLUMN_WIDTH + GRID_GUTTER + gridSize.width`, and `gridY` from
`coverHeight + GRID_GUTTER`. If the group now extends past the grid, confirm
the Cover frame above it and the About column beside it still clear it, and
that `zoomToFit()` bounds include the padding.

**2. Make the label offset depth-aware.** Padding alone doesn't fully solve
it. Labels are counter-scaled to a constant _screen_ size (`label-transform.ts`),
while padding is in _canvas units_ — so at OVERVIEW zoom the padding shrinks
on screen while the 40px label offset doesn't. At a fit-scale near 0.3, 60
units of padding is only ~18 screen px of separation between two ~11px labels.
Tight, and it gets worse the more projects you add (the grid widens, fit-scale
drops).

So offset the label by nesting depth: a depth-1 group's label clears a
depth-2 group's by a fixed screen distance, independent of zoom. This
generalizes — Phase 3 adds more nesting, and you don't want to rediscover
this each time.

## Verify by looking, this time

Run `npm run start` and actually view Home at fit-zoom and at 100%. Confirm
"Work" and "Auravest" are separately legible at both, and that the Work
outline reads as a container around the grid rather than a doubled border on
the first tile. Describe what you see — if you can't view it, say so plainly
rather than reasoning about it.

Also re-check the About/Contact groups at their new relative position, since
`work-group`'s new bounds may shift what's beside it.

Then: lint, build, format, and update `Group.tsx`'s `GROUP_LABEL_OFFSET`
comment to cover the group-in-group case it currently doesn't.
