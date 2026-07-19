// Fail-closed traversal executor stub — snapshot traversal semantics are not defined in Phase 1.
import { Stage5ExecutionError } from "../core/Stage5ExecutionError";
import type { GSID } from "../core/GSID";
import type { ExecutionTrace } from "../core/ExecutionTrace";
import type { TraversalExecutor } from "./TraversalExecutor";

/** Throws on every traverse attempt until traversal semantics are formally specified. */
export class FailClosedTraversalExecutor implements TraversalExecutor {
  traverse(_nodeId: string, _gsid: GSID): ExecutionTrace {
    throw new Stage5ExecutionError("TraversalExecutor is not implemented");
  }
}

export const failClosedTraversalExecutor: TraversalExecutor =
  new FailClosedTraversalExecutor();
