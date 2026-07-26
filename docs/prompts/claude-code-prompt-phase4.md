# Phase 4 — Publish

The last phase. Free positioning stays — that decision is made, so
`layout.json`, `layout-maintenance.ts` and the drag/resize surface are
permanent, not provisional. Reflect that in CLAUDE.md rather than leaving them
described as an experiment.

---

## The endpoint

`src/app/api/edit/publish/route.ts` — same independent `NODE_ENV` guard as the
other three, `runtime = "nodejs"`, and added to `verify:edit-guard`.

Two operations, not one:

**`GET`** (or a `?dry=true` POST) — returns `git status --porcelain` filtered to
publishable paths, so the UI can show what's about to be committed before
anything happens.

**`POST`** — stages, commits, pushes. Returns stdout/stderr verbatim.

## Safety rules, in priority order

1. **Only ever stage `src/content/data/` and `public/photos/`.** Never `git
add -A`, never `git add .`. The editor must not commit unrelated
   work-in-progress — including your own uncommitted source edits, which is the
   realistic failure here since you develop in the same tree you publish from.
2. **Refuse to publish if anything is already staged outside those paths.**
   Return the offending file list and tell me to sort it out by hand. Don't try
   to unstage on my behalf.
3. **`execFile` with an argument array, never string interpolation into a
   shell.** The commit message is user input.
4. **Never force-push, never rebase, never amend.** If the push is rejected
   (non-fast-forward, remote ahead), surface the actual git error and stop.
   Resolving a diverged branch is not the editor's job.
5. Confirm a clean `git rev-parse --abbrev-ref HEAD` first and show me which
   branch I'm publishing to. Publishing to the wrong branch silently is worse
   than failing.

## The UI

In the top bar next to Save:

- **Publish** is disabled while there are unsaved changes — save first, always.
  Two buttons that both sound like "make it real" is a trap; make the order
  obvious.
- clicking it opens a confirmation showing the changed file list from the dry
  run, plus a commit message field defaulting to `Update portfolio content`
- on success: show the pushed commit's short SHA and that the deploy takes
  roughly a minute. **Do not fake a progress bar** for a build you can't
  observe.
- on failure: show the raw git error. Don't paraphrase it into something
  friendlier — I'll need the real text to fix it.

## Housekeeping this phase

- The prompt files (`claude-code-prompt-*.md`) are untracked in the repo root
  and will confuse the publish diff. Move them to `docs/prompts/` and commit
  them, or gitignore them. Pick one and do it — don't leave them loose now that
  a button reads `git status`.
- Check `.claude/` too, which is also untracked.

## CLAUDE.md

- document the publish flow and, explicitly, the "only these two paths ever get
  staged" rule — that's the constraint most likely to get loosened later by
  someone who finds it inconvenient
- update anything still describing free positioning as provisional or
  under evaluation. It's the committed model now.

## Verify

- dry run with nothing changed: reports no changes, Publish is a no-op
- edit content, save, publish: exactly the expected files are committed and
  nothing else — check with `git show --stat`
- deliberately leave an unrelated modified source file in the tree, then
  publish: that file is **not** in the commit
- stage something outside the allowed paths, then publish: refused, with the
  offending path named
- a commit message containing quotes, backticks and a semicolon commits
  literally and executes nothing
- `verify:edit-guard` covers all four routes
- lint, build, format

## After it works

Add a real project through the editor and publish it. That's the whole system
running end to end for the first time — and the first time free positioning
gets used on content that isn't a test. Tell me how it went, including
anything that felt slower than editing JSON by hand.
