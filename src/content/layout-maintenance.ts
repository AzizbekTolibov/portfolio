import type { LayoutOverrides } from "./canvas";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Removes a project's own page entry and every "<slug>-tile*" key under
 * Home's entry — called when a project is deleted, so layout.json never
 * accumulates overrides that resolve against nodes that no longer exist. */
export function pruneProjectFromLayout(
  layout: LayoutOverrides,
  slug: string,
): LayoutOverrides {
  const next = { ...layout };
  delete next[slug];
  if (next.home) {
    next.home = Object.fromEntries(
      Object.entries(next.home).filter(
        ([nodeId]) => !nodeId.startsWith(`${slug}-tile`),
      ),
    );
  }
  return next;
}

/** Renames every layout.json key that encodes a project's slug — its own
 * page entry, and every "<oldSlug>-…" node id under Home or its own page
 * — to the new slug. Node ids are derived from the slug (see
 * content/canvas.ts), so a rename has to follow them or the override
 * silently stops resolving against anything. */
export function renameProjectInLayout(
  layout: LayoutOverrides,
  oldSlug: string,
  newSlug: string,
): LayoutOverrides {
  if (oldSlug === newSlug) return layout;
  const next: LayoutOverrides = {};
  for (const [pageId, pageOverrides] of Object.entries(layout)) {
    const newPageId = pageId === oldSlug ? newSlug : pageId;
    const renamed = Object.fromEntries(
      Object.entries(pageOverrides).map(([nodeId, rect]) => [
        nodeId.startsWith(`${oldSlug}-`)
          ? newSlug + nodeId.slice(oldSlug.length)
          : nodeId,
        rect,
      ]),
    );
    next[newPageId] = { ...next[newPageId], ...renamed };
  }
  return next;
}

/** Keeps a project's own page's per-photo overrides ("<slug>-photo-N" /
 * "<slug>-photo-N-image") aligned with photos by position, not identity —
 * removing or reordering a photo shifts every later one's node id (see
 * buildProjectPageNodes), so an override on "…-photo-3" has to move (or
 * disappear) with whatever's now actually at that position. `mapping` is
 * old 0-based photo index -> new index, or null for a removed photo. */
export function remapPhotoOverrides(
  layout: LayoutOverrides,
  slug: string,
  mapping: (number | null)[],
): LayoutOverrides {
  const pageOverrides = layout[slug];
  if (!pageOverrides) return layout;

  const pattern = new RegExp(`^${escapeRegExp(slug)}-photo-(\\d+)(-image)?$`);
  const next: LayoutOverrides[string] = {};
  for (const [nodeId, rect] of Object.entries(pageOverrides)) {
    const match = nodeId.match(pattern);
    if (!match) {
      next[nodeId] = rect;
      continue;
    }
    const oldIndex = Number(match[1]) - 1;
    const newIndex = mapping[oldIndex];
    if (newIndex === null || newIndex === undefined) continue;
    next[`${slug}-photo-${newIndex + 1}${match[2] ?? ""}`] = rect;
  }
  return { ...layout, [slug]: next };
}
