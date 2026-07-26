import type { CanvasNode } from "@/content/canvas";

/** Every node keyed by its parentId — the one grouping operation both the
 * layer tree and each frame's rendered content are built from, so they can
 * never see a different shape of the same data. */
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
 * content, not navigation targets), nested by parentId. */
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
