# Claude Code prompt — unify the type system on Geist

Copy everything below the line into Claude Code. Run it **after** the four
changes in `claude-code-prompt-changes.md`, so the diffs stay separable.

---

Collapse the whole type system onto **Geist**. Today `src/app/layout.tsx`
loads four faces from `next/font/google`; after this change it loads two —
`Geist` and `Geist_Mono`, which are one family.

## Target state

| CSS variable     | Today            | After                  |
| ---------------- | ---------------- | ---------------------- |
| `--font-display` | Fraunces (serif) | **Geist**              |
| `--font-sans`    | Geist            | Geist (unchanged)      |
| `--font-mono`    | Geist Mono       | Geist Mono (unchanged) |
| `--font-hand`    | Caveat           | **deleted**            |

Remove the `Fraunces` and `Caveat` imports and declarations from
`layout.tsx` entirely.

## Two dead things to delete while you're in here

Verify both before removing, but I'm fairly confident:

1. **`--font-hand` is never used.** It's declared in `layout.tsx` and mapped
   in `globals.css:105-106`, but grep finds no `font-hand` class anywhere in
   `src/`. The "sticky notes on the canvas" the comment refers to don't
   exist. Delete the variable, the `@theme inline` mapping, and the comment —
   don't repoint it at Geist.
2. **Fraunces' italic axis is never used.** The declaration requests
   `style: ["normal", "italic"]` but no `italic` class renders in it. Nothing
   to preserve.

## The part that needs judgement, not just find-and-replace

The display type scale in `src/app/globals.css` was tuned for a serif and
will look wrong on a grotesque at 8rem:

```css
--text-display: clamp(3.5rem, 9vw, 8rem);
--text-display--letter-spacing: -0.02em;
--text-display--font-weight: 500;
```

At display sizes a grotesque generally wants tighter tracking and more
weight than a serif does. Adjust `--text-display--letter-spacing` toward
`-0.03em`/`-0.04em` and try `--text-display--font-weight: 600`. Do the same
sanity check on `--text-h1` (`-0.01em`) and `--text-h2` (no tracking set).

Don't guess and move on — render it and look. The affected surfaces are:

- `src/components/canvas/Frame.tsx:34-35` — the `display` and `heading` text
  variants (`text-display font-display`, `text-h2 font-display`)
- `src/components/canvas/Frame.tsx:68` — the flat-LOD in-block label, which
  has its own per-frame-kind size map (`FLAT_LABEL_SIZE`) and is the largest
  text on the canvas for the Home cover
- `src/app/work/[slug]/page.tsx:78` — the static SEO page's `<h1>`

Report what you changed in the scale and why.

## Knock-on checks

- **Frame heights.** Geist's vertical metrics differ from Fraunces'. In
  `getProjectPageNodes()` (`src/content/canvas.ts`) the title/year/description
  blocks have fixed heights (`TITLE_FRAME_HEIGHT`, description `height: 165`).
  Confirm the longest project title and description still fit without
  clipping or leaving an obvious gap. Check every project, not just the first.
- **OG images.** `src/lib/og-content.tsx` and the `opengraph-image.tsx` /
  `twitter-image.tsx` routes render through Satori, which needs fonts
  supplied explicitly. If any of them reference Fraunces, repoint them at
  Geist — a stale font reference here fails **only at request time in
  production**, which `next dev` and `tsc` will not catch.
- **Contrast.** If you raise a weight, nothing breaks. If you _lower_ one,
  re-check AA on `#1E1E1E`/`#2C2C2C` and on the `#F4F2ED` artboards.
- `next/font` self-hosting and preloading stays as-is — no `<link>` to
  fonts.googleapis.com, no CSS `@import`. Keep the existing comment
  explaining the `display: "swap"` choice.

## CLAUDE.md

Update in the same commit:

- **Stack** — the `next/font` line currently says "self-hosted UI sans (11px
  chrome); editorial display type for artboard content." There is no
  editorial display type any more.
- **Visual language** — anything describing artboard interiors as
  editorial/serif-set.

## Finally

- `npm run lint`, `npm run build`, `npm run format` all pass
- verify with `npm run start`, not `dev`
- confirm `Fraunces` and `Caveat` appear nowhere in `src/` afterwards

## One thing to tell me, not act on

Dropping Fraunces removes the serif/sans contrast that currently separates
artboard _content_ from Figma _chrome_ — the thing that made a project title
read as work rather than as UI. Geist at 8rem in weight 600 may carry that
distinction on size alone, or the canvas may now read as uniformly toolish.
After you build it, tell me honestly which one you think happened. If it's
the second, the cheapest fix is a weight/size contrast bump rather than
bringing a second family back.
