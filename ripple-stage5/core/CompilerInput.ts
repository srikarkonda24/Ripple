// Defines compiler input: Query plus immutable snapshot material for reference resolution.
import type { Query } from "./Query";
import type { Edge } from "../snapshot/Edge";
import type { Node } from "../snapshot/Node";

/** Immutable GSID-bound snapshot material used at compile and execute time. */
export type SnapshotMaterial = {
  readonly nodes: readonly Node[];
  readonly edges: readonly Edge[];
};

/** Explicit compiler input — snapshot is never loaded implicitly inside the compiler. */
export type CompilerInput = {
  readonly query: Query;
  readonly snapshot: SnapshotMaterial;
};
