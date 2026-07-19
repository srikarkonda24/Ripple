// Builds immutable adjacency views from SnapshotMaterial without mutating the input (G1).
import type { SnapshotMaterial } from "../../core/CompilerInput";
import type { Edge } from "../../snapshot/Edge";
import { compareStrings } from "../../graph/CanonicalSerializer";

export type RuntimeAdjacency = {
  readonly outgoing: ReadonlyMap<string, readonly Edge[]>;
  readonly incoming: ReadonlyMap<string, readonly Edge[]>;
};

/** Sorts edges by type ASC then id ASC for deterministic traversal. */
export function sortEdgesCanonical(edges: readonly Edge[]): Edge[] {
  return [...edges].sort((left, right) => {
    const byType = compareStrings(left.type, right.type);
    if (byType !== 0) {
      return byType;
    }
    return compareStrings(left.id, right.id);
  });
}

/** Builds outgoing and incoming adjacency maps from an immutable snapshot (returns new structures). */
export function buildRuntimeAdjacency(snapshot: SnapshotMaterial): RuntimeAdjacency {
  const outgoing = new Map<string, Edge[]>();
  const incoming = new Map<string, Edge[]>();

  for (const edge of sortEdgesCanonical(snapshot.edges)) {
    const outList = outgoing.get(edge.from);
    if (outList === undefined) {
      outgoing.set(edge.from, [edge]);
    } else {
      outList.push(edge);
    }

    const inList = incoming.get(edge.to);
    if (inList === undefined) {
      incoming.set(edge.to, [edge]);
    } else {
      inList.push(edge);
    }
  }

  return { outgoing, incoming };
}
