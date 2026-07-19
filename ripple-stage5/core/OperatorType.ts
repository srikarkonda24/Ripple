// Defines the closed operator catalog used in ExecutionDAG nodes.
export type OperatorType =
  | "RESOLVE_TARGET"
  | "FILTER_EDGES"
  | "TRAVERSE"
  | "SELECT_PATH"
  | "EMIT";

/** Declarative operator parameters — intent and references only, no execution artifacts. */
export type OperatorParams = Record<string, string | number | boolean>;
