// Builds Stage 3 IMPORTS, EXPORTS, RE_EXPORTS, REFERENCES, and cross-file CALLS edges.
/// <reference path="../../../ripple-core/schema.ts" />

import { hasFunctionCall } from "../stage2/callsMatcher";
import { stripCommentsAndStrings } from "../stage2/stripCommentsAndStrings";
import { addEdge, type EdgeAccumulator } from "./edgeUtils";
import { listResolvedExports } from "./exportCatalog";
import { getExportKey, type Stage3Indexes } from "./indexes";
import { addNamespaceReferences } from "./namespaceReferences";
import {
  resolveExportEntry,
  resolveImportBinding,
  resolveModuleSpecifier,
  type ResolveContext,
} from "./symbolResolver";
import type { BuildReport, FileAnalysis, ImportBinding, ResolutionResult } from "./types";

interface LocalBinding {
  localName: string;
  result: ResolutionResult;
  typeOnly: boolean;
}

interface NamespaceBinding {
  localName: string;
  filePath?: string;
  result: ResolutionResult;
}

interface FileBindings {
  locals: LocalBinding[];
  namespaces: NamespaceBinding[];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function importContext(binding: ImportBinding): string {
  if (binding.kind === "side-effect") {
    return "side-effect";
  }
  if (binding.kind === "namespace") {
    return `namespace:${binding.localName}`;
  }
  if (binding.kind === "default") {
    return "default";
  }
  return `named:${binding.localName}`;
}

function hasIdentifier(body: string, name: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`);
  return pattern.test(stripCommentsAndStrings(body));
}

function hasJsxUsage(body: string, name: string): boolean {
  const pattern = new RegExp(`<${escapeRegex(name)}\\b`);
  return pattern.test(stripCommentsAndStrings(body));
}

function addReferenceEdges(
  analysis: FileAnalysis,
  bindings: FileBindings,
  accumulator: EdgeAccumulator,
  report: BuildReport
): void {
  for (const symbol of analysis.symbols) {
    if (symbol.type === "module") {
      continue;
    }
    const body = analysis.bodyTextBySymbolId[symbol.id] ?? "";
    const strippedBody = stripCommentsAndStrings(body);
    for (const binding of bindings.locals) {
      if (!hasIdentifier(body, binding.localName)) {
        continue;
      }
      const isJsx = hasJsxUsage(body, binding.localName);
      const isFunctionCall = hasFunctionCall(strippedBody, binding.localName);
      const context = binding.typeOnly
        ? "type"
        : isJsx
          ? "jsx"
          : isFunctionCall
            ? "call"
            : "value";
      if (addEdge(accumulator, analysis.file.projectId, symbol.id, binding.result.toId, "REFERENCES", context)) {
        report.summary.references++;
      }
      if (
        (isJsx || isFunctionCall) &&
        binding.result.kind === "resolved" &&
        binding.result.toId !== symbol.id
      ) {
        if (addEdge(accumulator, analysis.file.projectId, symbol.id, binding.result.toId, "CALLS", "")) {
          report.summary.crossFileCalls++;
        }
      }
    }
  }
}

function addExportEdges(
  analysis: FileAnalysis,
  indexes: Stage3Indexes,
  accumulator: EdgeAccumulator
): void {
  const entries = indexes.exportIndex.get(analysis.file.path);
  if (!entries) {
    return;
  }
  for (const entry of Array.from(entries.values()).sort((left, right) => left.exportKey.localeCompare(right.exportKey))) {
    if (entry.source === "local" && entry.symbolId) {
      const context = entry.exportKey === "default" ? "default" : `export-${entry.exportKey}`;
      addEdge(accumulator, analysis.file.projectId, analysis.file.id, entry.symbolId, "EXPORTS", context);
    }
  }
}

function addReExportEdges(
  analysis: FileAnalysis,
  context: ResolveContext,
  accumulator: EdgeAccumulator
): void {
  const moduleId = context.indexes.moduleSymbolIdByPath.get(analysis.file.path);
  if (!moduleId) {
    return;
  }
  for (const binding of analysis.surface.reExports) {
    if (binding.kind === "all") {
      const target = resolveModuleSpecifier(analysis.file.path, binding.specifier, context);
      const edgeContext = `reexport-all:${binding.specifier}`;
      if (target.filePath) {
        const resolvedExports = listResolvedExports(target.filePath, context);
        if (resolvedExports.length === 0) {
          addEdge(accumulator, analysis.file.projectId, moduleId, target.toId, "RE_EXPORTS", edgeContext);
        } else {
          for (const resolvedExport of resolvedExports) {
            addEdge(
              accumulator,
              analysis.file.projectId,
              moduleId,
              resolvedExport.result.toId,
              "RE_EXPORTS",
              edgeContext
            );
          }
        }
      } else {
        addEdge(accumulator, analysis.file.projectId, moduleId, target.toId, "RE_EXPORTS", edgeContext);
      }
      continue;
    }

    const resolved = resolveExportEntry(
      resolveModuleSpecifier(analysis.file.path, binding.specifier, context).filePath ?? analysis.file.path,
      binding.kind === "default" ? "default" : getExportKey("named", binding.importedName ?? binding.exportedName ?? ""),
      context
    );
    const edgeContext =
      binding.kind === "default"
        ? "reexport-default"
        : `reexport-named:${binding.localAlias ?? binding.exportedName ?? binding.importedName ?? ""}`;
    addEdge(accumulator, analysis.file.projectId, moduleId, resolved.toId, "RE_EXPORTS", edgeContext);
  }
}

export function buildReferenceGraph(
  analyses: FileAnalysis[],
  context: ResolveContext,
  accumulator: EdgeAccumulator
): void {
  for (const analysis of analyses.sort((left, right) => left.file.path.localeCompare(right.file.path))) {
    const bindings: FileBindings = { locals: [], namespaces: [] };
    addExportEdges(analysis, context.indexes, accumulator);
    addReExportEdges(analysis, context, accumulator);

    for (const binding of analysis.surface.imports) {
      const resolved = resolveImportBinding(analysis.file.path, binding, context);
      addEdge(accumulator, analysis.file.projectId, analysis.file.id, resolved.toId, "IMPORTS", importContext(binding));
      if (binding.kind === "namespace") {
        bindings.namespaces.push({ localName: binding.localName, filePath: resolved.filePath, result: resolved });
      } else if (binding.localName.length > 0) {
        bindings.locals.push({ localName: binding.localName, result: resolved, typeOnly: binding.typeOnly });
      }
    }

    addReferenceEdges(analysis, bindings, accumulator, context.report);
    addNamespaceReferences(analysis, bindings.namespaces, context, accumulator, context.report);
  }
}
