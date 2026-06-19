// Resolves Stage 3 import/export bindings to stable symbol or virtual target IDs.
/// <reference path="../../../ripple-core/schema.ts" />

import { resolveImportFilePath } from "../stage2/resolveImport";
import {
  buildExternalTargetId,
  buildUnresolvedTargetId,
} from "../stage2/symbolId";
import { addUnresolved } from "./buildReport";
import { getExportKey, type Stage3Indexes } from "./indexes";
import type {
  BuildReport,
  ImportBinding,
  ReExportBinding,
  ResolutionResult,
} from "./types";

export interface ResolveContext {
  repoFilePaths: Set<string>;
  indexes: Stage3Indexes;
  report: BuildReport;
}

function circularId(parts: string[]): string {
  return buildUnresolvedTargetId(`circular:${parts.sort((left, right) => left.localeCompare(right)).join(">")}`);
}

function resolveTargetFilePath(
  fromFilePath: string,
  specifier: string,
  context: ResolveContext
): string | null {
  return resolveImportFilePath(fromFilePath, specifier, context.repoFilePaths);
}

function unresolvedImport(
  filePath: string,
  specifier: string,
  reason: string,
  context: ResolveContext
): ResolutionResult {
  if (specifier.startsWith("@/")) {
    addUnresolved(context.report.unresolvedAliases, filePath, specifier, reason);
  } else {
    addUnresolved(context.report.unresolvedPaths, filePath, specifier, reason);
  }
  context.report.summary.importsUnresolved++;
  return {
    kind: "unresolved",
    toId: buildUnresolvedTargetId(`${reason}:${filePath}:${specifier}`),
  };
}

export function resolveModuleSpecifier(
  fromFilePath: string,
  specifier: string,
  context: ResolveContext
): ResolutionResult {
  if (specifier.startsWith(".")) {
    const targetFilePath = resolveTargetFilePath(fromFilePath, specifier, context);
    if (!targetFilePath) {
      return unresolvedImport(fromFilePath, specifier, "path_not_found", context);
    }
    return {
      kind: "resolved",
      toId: context.indexes.moduleSymbolIdByPath.get(targetFilePath) ?? buildUnresolvedTargetId(targetFilePath),
      filePath: targetFilePath,
    };
  }

  if (specifier.startsWith("@/")) {
    return unresolvedImport(fromFilePath, specifier, "alias_unconfigured", context);
  }

  context.report.summary.externalImports++;
  return { kind: "external", toId: buildExternalTargetId(specifier) };
}

function reExportKey(binding: ReExportBinding, requestedKey: string): string {
  if (binding.kind === "default") {
    return "default";
  }
  if (binding.importedName) {
    return getExportKey("named", binding.importedName);
  }
  return requestedKey;
}

export function resolveExportEntry(
  filePath: string,
  exportKey: string,
  context: ResolveContext,
  visited: string[] = []
): ResolutionResult {
  const visitKey = `${filePath}:${exportKey}`;
  if (visited.includes(visitKey)) {
    context.report.circularChains.push([...visited, visitKey].join(">"));
    return { kind: "unresolved", toId: circularId([...visited, visitKey]) };
  }

  const nextVisited = [...visited, visitKey];
  const entries = context.indexes.exportIndex.get(filePath);
  const entry = entries?.get(exportKey);
  if (entry?.source === "local" && entry.symbolId) {
    return { kind: "resolved", toId: entry.symbolId, filePath };
  }

  if (entry?.source === "reexport" && entry.reExport) {
    const target = resolveModuleSpecifier(filePath, entry.reExport.specifier, context);
    if (!target.filePath) {
      return target;
    }
    return resolveExportEntry(
      target.filePath,
      reExportKey(entry.reExport, exportKey),
      context,
      nextVisited
    );
  }

  const allReExports = context.indexes.analysisByPath
    .get(filePath)
    ?.surface.reExports.filter((binding) => binding.kind === "all")
    .sort((left, right) => left.specifier.localeCompare(right.specifier)) ?? [];

  for (const binding of allReExports) {
    const target = resolveModuleSpecifier(filePath, binding.specifier, context);
    if (!target.filePath) {
      continue;
    }
    const resolved = resolveExportEntry(target.filePath, exportKey, context, nextVisited);
    if (resolved.kind === "resolved") {
      return resolved;
    }
  }

  addUnresolved(context.report.unresolvedExports, filePath, exportKey, "export_not_found");
  context.report.summary.importsUnresolved++;
  return {
    kind: "unresolved",
    toId: buildUnresolvedTargetId(`export_not_found:${filePath}:${exportKey}`),
  };
}

export function resolveImportBinding(
  filePath: string,
  binding: ImportBinding,
  context: ResolveContext
): ResolutionResult {
  const moduleResolution = resolveModuleSpecifier(filePath, binding.specifier, context);
  if (moduleResolution.kind !== "resolved" || !moduleResolution.filePath) {
    return moduleResolution;
  }

  if (binding.kind === "side-effect" || binding.kind === "namespace") {
    context.report.summary.importsResolved++;
    return moduleResolution;
  }

  const key =
    binding.kind === "default"
      ? "default"
      : getExportKey("named", binding.importedName ?? binding.localName);
  const resolved = resolveExportEntry(moduleResolution.filePath, key, context);
  if (resolved.kind === "resolved") {
    context.report.summary.importsResolved++;
  }
  return resolved;
}
