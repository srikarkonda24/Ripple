// Resolve GSID-bound snapshot material at compile time only — no runtime loading.
import type { SnapshotMaterial } from "../core/CompilerInput";
import type { GSID } from "../core/GSID";
import { GSIDValidationFailure } from "../core/Stage5ExecutionError";
import type { Edge } from "./Edge";
import type { Node } from "./Node";

export interface SnapshotResolver {
  resolve(gsid: GSID): SnapshotMaterial;
}

/** Creates an immutable SnapshotMaterial from node and edge arrays. */
export function createSnapshotMaterial(
  nodes: readonly Node[],
  edges: readonly Edge[],
): SnapshotMaterial {
  return {
    nodes: nodes.map((node) => ({ id: node.id })),
    edges: edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      type: edge.type,
      direction: edge.direction,
    })),
  };
}

/**
 * In-memory SnapshotResolver for Phase 2 tests and CLI wiring.
 * Maps GSID.id to pre-registered SnapshotMaterial. Compile-time use only.
 */
export class InMemorySnapshotResolver implements SnapshotResolver {
  private readonly store: ReadonlyMap<string, SnapshotMaterial>;

  constructor(entries: ReadonlyMap<string, SnapshotMaterial> | Record<string, SnapshotMaterial>) {
    if (entries instanceof Map) {
      this.store = new Map(entries);
    } else {
      this.store = new Map(Object.entries(entries));
    }
  }

  resolve(gsid: GSID): SnapshotMaterial {
    const material = this.store.get(gsid.id);
    if (material === undefined) {
      throw new GSIDValidationFailure(
        `Snapshot not found for GSID id "${gsid.id}"`,
      );
    }
    return material;
  }
}
