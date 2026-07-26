# Phase 3 — content editing

Supersedes Phase 3 in `claude-code-prompt-editor.md`. Wider scope than that
spec described: **all** canvas content is editable, not just projects.

---

## Text editing is inspector-based this phase

Select a frame or text node, edit its fields in the right panel, canvas
updates live. **No inline canvas editing.** That's a later phase on its own —
`contentEditable` inside a scaled, translated container fights caret
positioning, IME input, and the LOD bands (text only renders above 80% zoom),
and it isn't what makes this portfolio work. Build the boring path first so
adding a project stops being blocked.

Leave a note in `EditInspector`'s header comment saying inline editing is
deliberately deferred, not forgotten.

## What becomes editable

Everything on the canvas, which means migrating three more content files to
JSON the same way `projects.ts` went in Phase 0 — data file plus thin typed
loader, every existing import unchanged:

| File       | Editable fields                                                                |
| ---------- | ------------------------------------------------------------------------------ |
| `site.ts`  | `name`, `role`, `tagline`, `location.display`                                  |
| `home.ts`  | `heroHeadline`, `contactHeadline`                                              |
| `about.ts` | `bioShort`, `bioMedium`, `bioLong`, `availability`, `tools`, `skills`, `photo` |
| `projects` | full CRUD — see below                                                          |

**Four fields are dead. Delete them, don't build forms for them:**

- `site.nav` — zero references. It's a nav link list, which the Hard Rule
  forbids outright; it survived the Pages rewrite as vestigial data.
- `home.heroSubhead` — zero references.

Confirm both with a grep before deleting. `bioShort`, `bioLong`,
`availability` and `tools` each have exactly one consumer, so they stay.

**The three bio fields need explaining in the UI, not just the type.** A form
showing three near-identical textareas is confusing. Label them by where each
one appears: `bioShort` → right panel when nothing is selected; `bioMedium` →
the canvas About frame (height-constrained); `bioLong` → screen readers and
crawlers only. Show a character count against the frame height for
`bioMedium`, since that's the one that can overflow its frame.

## Project CRUD

- add / duplicate / delete a project
- edit `slug`, `title`, `year`, `description`
- reorder the project list (drag) — drives Home's default grid order
- per project: add, remove, reorder photos; set the cover

**Slug renames are the sharp edge.** The slug is the URL for both `/?page=<slug>`
and `/work/<slug>`. Block a rename that collides with an existing slug, and
warn explicitly that renaming breaks shared links.

**Deleting a project must clean up its layout overrides.** `layout.json` keys
on `pageId → nodeId`, and a deleted project leaves an orphaned page entry plus
every tile-node override on Home. Prune both on delete, or the file
accumulates garbage that resolves against nodes which no longer exist.

Same applies to reordering: tile overrides are keyed by node id
(`<slug>-tile-group`), which follows the project, not the grid slot. Confirm
that reordering the list does what you'd expect when a moved tile also has a
position override — and say plainly which one wins.

## Image upload

`src/app/api/edit/upload/route.ts`, same independent production guard,
`runtime = "nodejs"`:

- accepts a file, writes to `public/photos/<slug>/`, returns `{ src, width, height }`
- read real intrinsic dimensions server-side — add `image-size`, not `sharp`
- reject anything but png/jpg/webp/svg; sanitize the filename; cap the size
- **alt text is required and cannot be saved empty.** Non-negotiable #3 is only
  as good as the content behind it, and an editor that permits empty alt will
  produce a portfolio with no alt text. Make it a validation error, not a
  placeholder.
- deleting a photo should offer to delete the file, not just the reference

Mark `scripts/generate-project-photos.mjs` as vestigial in its header once real
uploads work.

## Save

Extend `/api/edit/save` rather than adding endpoints — it takes a payload
naming which data files changed and writes each with the existing temp-file +
rename + Prettier treatment. Keep the single guard surface; every new route is
another place to forget it.

`verify:edit-guard` must cover any new route.

## Verify

- add a project end to end: it appears on Home, gets its own page, its own
  `/work/<slug>`, and its photos render — without touching a coordinate
- delete it: no orphaned entries left in `layout.json`
- edit `bioMedium` past the frame height: the overflow warning fires
- upload with empty alt: blocked
- the semantic layer and `/work/[slug]` pages reflect every edit
- `[BRACKETED]` placeholder text still renders red through
  `<PlaceholderText>` — new form fields must route through it too, or a
  future placeholder renders as plain text and reads as real
- lint, build, format, `verify:edit-guard`

## Tell me, don't act

Two things after you build it:

1. Whether the editor now duplicates enough of `projects.json`'s structure
   that hand-editing the JSON has become the faster path for text-only
   changes. If so, say it — the editor doesn't have to win every case.
2. Your read on how much of Phase 2's drag/resize surface you actually
   touched while doing Phase 3's work. That's the closest thing to an
   honest answer on whether free positioning earned its place.
