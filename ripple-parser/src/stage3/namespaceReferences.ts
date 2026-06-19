// Emits REFERENCES and CALLS edges for namespace import member usage.
/// <reference path="../../../ripple-core/schema.ts" />

import { stripCommentsAndStrings } from "../stage2/stripCommentsAndStrings";
import { addEdge, type EdgeAccumulator } from "./edgeUtils";
import { getExportKey } from "./indexes";
import { resolveExportEntry, type ResolveContext } from "./symbolResolver";
import type { BuildReport, FileAnalysis, ResolutionResult } from "./types";

interface NamespaceBinding {
  localName: string;
  filePath?: string;
  result: ResolutionResult;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveNamespaceMember(
  namespace: NamespaceBinding,
  memberName: string,
  context: ResolveContext
): ResolutionResult {
  return namespace.filePath
    ? resolveExportEntry(namespace.filePath, getExportKey("named", memberName), context)
    : namespace.result;
}

export function addNamespaceReferences(
  analysis: FileAnalysis,
  namespaces: NamespaceBinding[],
  context: ResolveContext,
  accumulator: EdgeAccumulator,
  report: BuildReport
): void {
  for (const symbol of analysis.symbols) {
    if (symbol.type === "module") {
      continue;
    }
    const body = stripCommentsAndStrings(analysis.bodyTextBySymbolId[symbol.id] ?? "");
    for (const namespace of namespaces) {
      const calledMembers = new Set<string>();
      const callPattern = new RegExp(
        `\\b${escapeRegex(namespace.localName)}\\s*\\.\\s*([A-Za-z0-9_$]+)\\s*\\(`,
        "g"
      );
      let match: RegExpExecArray | null;
      while ((match = callPattern.exec(body)) !== null) {
        const memberName = match[1] ?? "";
        calledMembers.add(memberName);
        const resolved = resolveNamespaceMember(namespace, memberName, context);
        if (addEdge(accumulator, analysis.file.projectId, symbol.id, resolved.toId, "REFERENCES", "call")) {
          report.summary.references++;
        }
        if (resolved.kind === "resolved" && resolved.toId !== symbol.id) {
          if (addEdge(accumulator, analysis.file.projectId, symbol.id, resolved.toId, "CALLS", "")) {
            report.summary.crossFileCalls++;
          }
        }
      }

      const valuePattern = new RegExp(
        `\\b${escapeRegex(namespace.localName)}\\s*\\.\\s*([A-Za-z0-9_$]+)\\b`,
        "g"
      );
      while ((match = valuePattern.exec(body)) !== null) {
        const memberName = match[1] ?? "";
        if (calledMembers.has(memberName)) {
          continue;
        }
        const resolved = resolveNamespaceMember(namespace, memberName, context);
        if (addEdge(accumulator, analysis.file.projectId, symbol.id, resolved.toId, "REFERENCES", "value")) {
          report.summary.references++;
        }
      }
    }
  }
}
