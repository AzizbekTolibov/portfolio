import type { CanvasNode } from "@/content/canvas";

/** Sorts siblings by final resolved position (y ascending, then x) rather
 * than by generation/array order — the fix for the accessibility trap
 * layout overrides introduce (see LayoutOverrides in content/canvas.ts):
 * once a frame's position can be hand-overridden, the order it was
 * *generated* in no longer reliably matches the order it's *shown* in, and
 * the semantic layer / keyboard stepping must follow the latter. Scoped to
 * siblings sharing a parent (never a global flatten across separate
 * top-level sections) — see buildLayerTree below for why. */
function sortByPosition<T extends { x: number; y: number }>(nodes: T[]): T[] {
  return [...nodes].sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Every node keyed by its parentId — the one grouping operation both the
 * layer tree and each frame's rendered content are built from, so they can
 * never see a different shape of the same data. Each parent's children are
 * sorted by final resolved position (see sortByPosition) — this is what
 * keeps a frame's text/image reading order, and a group's own frame
 * descendants, correct once positions can be overridden. */
export function groupChildrenByParent<T extends CanvasNode>(
  nodes: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const siblings = map.get(node.parentId);
    if (siblings) siblings.push(node);
    else map.set(node.parentId, [node]);
  }
  for (const [parentId, siblings] of map) {
    map.set(parentId, sortByPosition(siblings));
  }
  return map;
}

export type NavigableNode = Extract<CanvasNode, { type: "frame" | "group" }>;

export type LayerTreeNode = {
  node: NavigableNode;
  children: LayerTreeNode[];
};

/** The left panel's layer tree, derived directly from the current page's
 * nodes (see content/canvas.ts's getPageNodes): only
 * frame/group nodes are navigable destinations (sticky/text/image are
 * content, not navigation targets), nested by parentId. Each level's
 * children are position-sorted (via groupChildrenByParent) — but top-level
 * entries (no parentId) keep generation order, not a position sort: Home's
 * About/Contact column and its project-tile grid are independent top-level
 * groups that intentionally start at the same y beside each other, and a
 * global (y, x) sort would interleave "About" into the middle of the
 * grid's rows. Position ordering is correct *within* a shared parent
 * (reorder tiles, reorder a project's photos by drag); reordering entire
 * top-level sections isn't something free positioning is meant to express. */
export function buildLayerTree(nodes: CanvasNode[]): LayerTreeNode[] {
  const navigable = nodes.filter(
    (n): n is NavigableNode => n.type === "frame" || n.type === "group",
  );
  const byParent = groupChildrenByParent(navigable);

  function build(node: NavigableNode): LayerTreeNode {
    return {
      node,
      children: (byParent.get(node.id) ?? []).map(build),
    };
  }

  return navigable.filter((n) => !n.parentId).map(build);
}

/** Pre-order DFS over the layer tree, collecting frame ids only (groups are
 * layout containers, never focus targets themselves) — this is the
 * FOCUSED-state stepping order (Tab / arrow keys / Space, see
 * CanvasWorkspace's frameOrder), kept in lockstep with the semantic
 * layer's reading order since both walk this exact tree. */
export function flattenFrameOrder(tree: LayerTreeNode[]): string[] {
  const ids: string[] = [];
  function visit(entries: LayerTreeNode[]) {
    for (const entry of entries) {
      if (entry.node.type === "frame") ids.push(entry.node.id);
      visit(entry.children);
    }
  }
  visit(tree);
  return ids;
}
