// Builds deterministic MVP Stage 5 query inputs from resolved symbols.
import type { GsidRef } from "../core/GsidRef";
import type { ResolvedSymbol } from "../core/ResolvedSymbol";
import {
  type ImpactQuery,
  MVP_QUERY_TYPE_ORDER,
  REGISTERED_EVID_REF,
} from "./ImpactQuery";
import type { WorkflowCatalog } from "./WorkflowCatalog";

export type ImpactQueryBuildInput = {
  readonly gsid: GsidRef;
  readonly symbols: readonly ResolvedSymbol[];
  readonly workflowCatalog: WorkflowCatalog;
};

/** Compares resolved symbols by nodeId ascending. */
function compareSymbolsByNodeId(left: ResolvedSymbol, right: ResolvedSymbol): number {
  if (left.nodeId < right.nodeId) {
    return -1;
  }
  if (left.nodeId > right.nodeId) {
    return 1;
  }
  return 0;
}

/** Builds MVP impact queries; returns empty array when no symbols are resolved. */
export function buildImpactQueries(input: ImpactQueryBuildInput): readonly ImpactQuery[] {
  if (input.symbols.length === 0) {
    return [];
  }

  const sortedSymbols = [...input.symbols].sort(compareSymbolsByNodeId);
  const endpoints = [...input.workflowCatalog.listEndpoints(input.gsid)].sort((left, right) => {
    if (left.targetId < right.targetId) {
      return -1;
    }
    if (left.targetId > right.targetId) {
      return 1;
    }
    return 0;
  });

  const queries: ImpactQuery[] = [];

  for (const symbol of sortedSymbols) {
    for (const queryType of MVP_QUERY_TYPE_ORDER) {
      if (queryType === "PATH") {
        for (const endpoint of endpoints) {
          queries.push({
            type: "PATH",
            source: symbol.nodeId,
            target: endpoint.targetId,
            gsid: input.gsid,
            evid: REGISTERED_EVID_REF,
          });
        }
        continue;
      }

      queries.push({
        type: queryType,
        target: symbol.nodeId,
        gsid: input.gsid,
        evid: REGISTERED_EVID_REF,
      });
    }
  }

  return queries;
}

/** Serializes queries for golden determinism tests. */
export function serializeImpactQueriesForTest(queries: readonly ImpactQuery[]): string {
  return JSON.stringify(queries);
}

/** Returns true when every query type is within the MVP closed set. */
export function usesOnlyMvpQueryTypes(queries: readonly ImpactQuery[]): boolean {
  return queries.every((query) => MVP_QUERY_TYPE_ORDER.includes(query.type));
}
