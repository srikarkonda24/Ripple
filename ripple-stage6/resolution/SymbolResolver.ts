// Maps PRChange line ranges to graph node ids using injected SymbolIndex spans only.
import type { GsidRef } from "../core/GsidRef";
import type { PRChange } from "../core/PRChange";
import type { ImpactEmptyReason } from "../core/PRChange";
import type { ResolvedSymbol } from "../core/ResolvedSymbol";
import { normalizeChangedFilePath } from "../prchange/pathNormalize";
import { lineRangesOverlap } from "./lineOverlap";
import type { SymbolIndex, SymbolSpan } from "./SymbolIndex";

export type SymbolResolutionResult = {
  readonly symbols: readonly ResolvedSymbol[];
  readonly emptyReason?: ImpactEmptyReason;
};

/** Compares resolved symbols by nodeId for deterministic ordering. */
function compareResolvedSymbols(left: ResolvedSymbol, right: ResolvedSymbol): number {
  if (left.nodeId < right.nodeId) {
    return -1;
  }
  if (left.nodeId > right.nodeId) {
    return 1;
  }
  return 0;
}

/** Returns true when a span applies to the normalized changed file path. */
function spanMatchesFile(span: SymbolSpan, normalizedFilePath: string): boolean {
  return normalizeChangedFilePath(span.filePath) === normalizedFilePath;
}

/**
 * Resolves changed symbols by geometric overlap between PRChange ranges and SymbolSpans.
 */
export function resolveSymbols(input: {
  readonly prChange: PRChange;
  readonly gsid: GsidRef;
  readonly symbolIndex: SymbolIndex;
}): SymbolResolutionResult {
  const spans = input.symbolIndex.getSpans(input.gsid);
  const resolvedByNodeId = new Map<string, ResolvedSymbol>();

  for (const changedFile of input.prChange.files) {
    const normalizedPath = normalizeChangedFilePath(changedFile.path);
    const fileSpans = spans.filter((span) => spanMatchesFile(span, normalizedPath));

    for (const hunk of changedFile.hunks) {
      for (const range of hunk.ranges) {
        for (const span of fileSpans) {
          if (!lineRangesOverlap(range, span.startLine, span.endLine)) {
            continue;
          }
          if (resolvedByNodeId.has(span.nodeId)) {
            continue;
          }
          resolvedByNodeId.set(span.nodeId, {
            nodeId: span.nodeId,
            filePath: normalizedPath,
            displayName: span.displayName,
          });
        }
      }
    }
  }

  if (resolvedByNodeId.size === 0) {
    return { symbols: [], emptyReason: "NO_RESOLVED_SYMBOLS" };
  }

  const symbols = [...resolvedByNodeId.values()].sort(compareResolvedSymbols);
  return { symbols };
}
