// Provides deterministic Stage 3 edge creation and deduplication helpers.
/// <reference path="../../../ripple-core/schema.ts" />

import { buildEdgeId } from "../stage2/symbolId";

const ZERO_CREATED_AT = 0;

export interface EdgeAccumulator {
  edgesByKey: Map<string, Edge>;
}

export function createEdgeAccumulator(seedEdges: Edge[]): EdgeAccumulator {
  const edgesByKey = new Map<string, Edge>();
  for (const edge of seedEdges) {
    edgesByKey.set(edgeKey(edge.fromId, edge.toId, edge.type, edge.context ?? ""), {
      ...edge,
      context: edge.context,
    });
  }
  return { edgesByKey };
}

export function edgeKey(
  fromId: string,
  toId: string,
  type: EdgeType,
  context: string
): string {
  return `${fromId}:${toId}:${type}:${context}`;
}

export function addEdge(
  accumulator: EdgeAccumulator,
  projectId: string,
  fromId: string,
  toId: string,
  type: EdgeType,
  context: string
): boolean {
  const key = edgeKey(fromId, toId, type, context);
  if (accumulator.edgesByKey.has(key)) {
    return false;
  }

  const edge: Edge = {
    id: buildEdgeId(fromId, toId, type, context),
    projectId,
    fromId,
    toId,
    type,
    createdAt: ZERO_CREATED_AT,
  };
  if (context.length > 0) {
    edge.context = context;
  }

  accumulator.edgesByKey.set(key, edge);
  return true;
}
