// Resolves PATH queries via first canonical DFS path (rule 4B) — executor only.
import { ExecutorFidelityFailure } from "../../core/Stage5ExecutionError";
import type { RuntimeAdjacency } from "./adjacency";
import { sortEdgesCanonical } from "./adjacency";

export type PathResult = {
  readonly pathNodes: string[];
  readonly pathEdges: string[];
};

/**
 * Finds the first valid path from source to target using canonical DFS.
 * Edge order: type ASC, id ASC. Max depth 15. No enumeration of all paths.
 */
export function findFirstCanonicalPath(
  adjacency: RuntimeAdjacency,
  sourceId: string,
  targetId: string,
  maxDepth: number,
): PathResult {
  const pathNodes: string[] = [];
  const pathEdges: string[] = [];
  const onPath = new Set<string>();

  function dfs(current: string, depth: number): boolean {
    pathNodes.push(current);
    onPath.add(current);

    if (current === targetId) {
      return true;
    }

    if (depth >= maxDepth) {
      pathNodes.pop();
      onPath.delete(current);
      return false;
    }

    const outgoing = sortEdgesCanonical([...(adjacency.outgoing.get(current) ?? [])]);
    for (const edge of outgoing) {
      if (onPath.has(edge.to)) {
        continue;
      }
      pathEdges.push(edge.id);
      if (dfs(edge.to, depth + 1)) {
        return true;
      }
      pathEdges.pop();
    }

    pathNodes.pop();
    onPath.delete(current);
    return false;
  }

  if (!dfs(sourceId, 0)) {
    throw new ExecutorFidelityFailure(
      `PATH not found from "${sourceId}" to "${targetId}" within maxDepth ${maxDepth}`,
    );
  }

  return { pathNodes: [...pathNodes], pathEdges: [...pathEdges] };
}
