// Defines the traversal executor contract for snapshot-bound node walks.
import type { GSID } from "../core/GSID";
import type { ExecutionTrace } from "../core/ExecutionTrace";

export interface TraversalExecutor {
  traverse(nodeId: string, gsid: GSID): ExecutionTrace;
}
