// Resolves that query-referenced snapshot nodes exist (G2 Stable Identity).
import type { SnapshotMaterial } from "../../core/CompilerInput";
import { GSIDValidationFailure } from "../../core/Stage5ExecutionError";

/** Throws when a required node id is absent from the immutable snapshot. */
export function assertNodeExists(
  snapshot: SnapshotMaterial,
  nodeId: string,
  label: string,
): void {
  const found = snapshot.nodes.some((node) => node.id === nodeId);
  if (!found) {
    throw new GSIDValidationFailure(
      `Stable identity failure: ${label} node "${nodeId}" not found in snapshot`,
    );
  }
}
