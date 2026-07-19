// Derives Evidence deterministically from an execution trace without graph re-execution or inference.
import type { Evidence } from "../core/Evidence";
import type { ExecutionTrace } from "../core/ExecutionTrace";
import type { GSID } from "../core/GSID";
import type { EvidenceBuilder } from "./EvidenceBuilder";

/** Builds a deterministic evidence id from GSID and trace visitation order. */
function buildEvidenceId(trace: ExecutionTrace, gsid: GSID): string {
  const nodePart = trace.visitedNodes.join(",");
  const edgePart = trace.visitedEdges.join(",");
  return `${gsid.id}:${nodePart}:${edgePart}`;
}

/** Maps visited nodes and edges into ordered execution step strings. */
function buildExecutionSteps(trace: ExecutionTrace): string[] {
  const nodeSteps = trace.visitedNodes.map((nodeId) => `node:${nodeId}`);
  const edgeSteps = trace.visitedEdges.map((edgeId) => `edge:${edgeId}`);
  return [...nodeSteps, ...edgeSteps];
}

/** Derives evidence fields exclusively from the trace and GSID metadata. */
export class TraceEvidenceBuilder implements EvidenceBuilder {
  build(trace: ExecutionTrace, gsid: GSID): Evidence {
    return {
      evidenceId: buildEvidenceId(trace, gsid),
      gsid,
      commitId: gsid.commitHash,
      schemaVersion: gsid.schemaVersion,
      graphPath: [...trace.visitedNodes],
      executionSteps: buildExecutionSteps(trace),
    };
  }
}

export const traceEvidenceBuilder: EvidenceBuilder = new TraceEvidenceBuilder();
