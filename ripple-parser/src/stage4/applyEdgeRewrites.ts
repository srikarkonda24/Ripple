// Applies Stage 4 edge target rewrites without mutating edge identity or topology fields.
/// <reference path="../../../ripple-core/schema.ts" />
/// <reference path="../../../ripple-core/interfaces/resolverTypes.ts" />

/** Returns a new edge list with upgraded toId values; edge.id and topology fields stay unchanged. */
export function applyEdgeRewrites(
  edges: readonly Edge[],
  rewriteMap: EdgeRewriteMap
): Edge[] {
  if (rewriteMap.size === 0) {
    return edges.map((edge) => ({ ...edge }));
  }

  return edges.map((edge) => {
    const upgradedToId = rewriteMap.get(edge.id);
    if (!upgradedToId || upgradedToId === edge.toId) {
      return { ...edge };
    }
    return {
      ...edge,
      toId: upgradedToId,
    };
  });
}
