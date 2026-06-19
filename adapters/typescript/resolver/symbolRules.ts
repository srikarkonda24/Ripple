// Resolves export bindings and re-export chains for the TypeScript Stage 4 adapter.
/// <reference path="../../../ripple-core/schema.ts" />
/// <reference path="../../../ripple-core/interfaces/resolverTypes.ts" />

import {
  buildExternalTargetId,
  buildUnresolvedTargetId,
} from "../../../ripple-parser/src/stage2/symbolId";
import { readAliasConfig, resolveAliasImportPathWithDiagnostics } from "./aliasRules";
import { resolveRelativeImportPath } from "./pathRules";

function exportKey(kind: "default" | "named", name: string): string {
  return kind === "default" ? "default" : `named:${name}`;
}

function circularId(parts: string[]): string {
  return buildUnresolvedTargetId(
    `circular:${parts.sort((left, right) => left.localeCompare(right)).join(">")}`
  );
}

function recordUnresolvedPath(
  context: ResolverContext,
  filePath: string,
  specifier: string,
  reason: string
): void {
  if (!context.report) {
    return;
  }
  context.report.unresolvedPaths.push({ filePath, specifier, reason });
  context.report.importsUnresolved++;
}

function recordUnresolvedAlias(
  context: ResolverContext,
  filePath: string,
  specifier: string,
  reason: string
): void {
  if (!context.report) {
    return;
  }
  context.report.unresolvedAliases.push({ filePath, specifier, reason });
  context.report.importsUnresolved++;
}

function reExportKey(binding: SnapshotReExportBinding, requestedKey: string): string {
  if (binding.kind === "default") {
    return "default";
  }
  if (binding.importedName) {
    return exportKey("named", binding.importedName);
  }
  return requestedKey;
}

/** Resolves a module specifier to a file, external, or unresolved target ID. */
export function resolveModuleSpecifier(
  fromFilePath: string,
  specifier: string,
  context: ResolverContext
): ResolveImportOutput {
  if (specifier.startsWith(".")) {
    const targetFilePath = resolveRelativeImportPath(
      fromFilePath,
      specifier,
      context.repoFilePaths
    );
    if (!targetFilePath) {
      recordUnresolvedPath(context, fromFilePath, specifier, "path_not_found");
      return {
        kind: "unresolved",
        toId: buildUnresolvedTargetId(`path_not_found:${fromFilePath}:${specifier}`),
        reason: "path_not_found",
      };
    }
    return {
      kind: "resolved",
      toId: context.symbolIndex.moduleSymbolIdByPath.get(targetFilePath) ??
        buildUnresolvedTargetId(targetFilePath),
      filePath: targetFilePath,
    };
  }

  if (specifier.includes("/") || specifier.startsWith("@")) {
    const aliasDiagnostics = resolveAliasImportPathWithDiagnostics(
      fromFilePath,
      specifier,
      context.repoFilePaths,
      readAliasConfig(context)
    );
    if (aliasDiagnostics.selected) {
      if (context.report) {
        context.report.aliasesResolved++;
      }
      return {
        kind: "resolved",
        toId: context.symbolIndex.moduleSymbolIdByPath.get(aliasDiagnostics.selected) ??
          buildUnresolvedTargetId(aliasDiagnostics.selected),
        filePath: aliasDiagnostics.selected,
      };
    }
    if (specifier.startsWith("@/")) {
      recordUnresolvedAlias(context, fromFilePath, specifier, "alias_unconfigured");
      return {
        kind: "unresolved",
        toId: buildUnresolvedTargetId(`alias_unconfigured:${fromFilePath}:${specifier}`),
        reason: "alias_unconfigured",
      };
    }
  }

  if (context.report) {
    context.report.externalImports++;
  }
  return { kind: "external", toId: buildExternalTargetId(specifier) };
}

/** Resolves one export key inside a file, following re-export chains when needed. */
export function resolveExportEntry(
  filePath: string,
  exportKeyName: string,
  context: ResolverContext,
  visited: string[] = []
): ResolveSymbolOutput {
  const visitKey = `${filePath}:${exportKeyName}`;
  if (visited.includes(visitKey)) {
    return { kind: "unresolved", toId: circularId([...visited, visitKey]) };
  }

  const nextVisited = [...visited, visitKey];
  const entries = context.symbolIndex.exportIndex.get(filePath);
  const entry = entries?.get(exportKeyName);

  if (entry?.source === "local" && entry.symbolId) {
    return { kind: "resolved", toId: entry.symbolId, filePath, symbolId: entry.symbolId };
  }

  if (entry?.source === "reexport" && entry.reExport) {
    const target = resolveModuleSpecifier(filePath, entry.reExport.specifier, context);
    if (!target.filePath) {
      return target;
    }
    return resolveExportEntry(
      target.filePath,
      reExportKey(entry.reExport, exportKeyName),
      context,
      nextVisited
    );
  }

  const snapshotReExports = context.symbolIndex.reExportsByFilePath.get(filePath) ?? [];
  for (const binding of snapshotReExports) {
    if (binding.kind !== "all") {
      continue;
    }
    const target = resolveModuleSpecifier(filePath, binding.specifier, context);
    if (!target.filePath) {
      continue;
    }
    const resolved = resolveExportEntry(target.filePath, exportKeyName, context, nextVisited);
    if (resolved.kind === "resolved") {
      return resolved;
    }
  }

  return {
    kind: "unresolved",
    toId: buildUnresolvedTargetId(`export_not_found:${filePath}:${exportKeyName}`),
  };
}

/** Resolves one import binding through file resolution and export lookup passes. */
export function resolveImportBinding(
  filePath: string,
  binding: SnapshotImportBinding,
  context: ResolverContext
): ResolveSymbolOutput | ResolveImportOutput {
  return resolveImportBindingWithDiagnostics(filePath, binding, context).result;
}

function buildImportPathDiagnostics(
  filePath: string,
  binding: SnapshotImportBinding,
  context: ResolverContext
): Pick<
  ResolutionDecisionTrace,
  "candidates" | "rejected" | "selected" | "rule" | "scoreBreakdown"
> {
  const { specifier } = binding;

  if (specifier.startsWith(".")) {
    const targetFilePath = resolveRelativeImportPath(
      filePath,
      specifier,
      context.repoFilePaths
    );
    if (!targetFilePath) {
      return {
        candidates: [],
        rejected: [{ candidate: specifier, reason: "path_not_found" }],
        selected: null,
        rule: "relative path resolution",
        scoreBreakdown: { relativeMatch: 0 },
      };
    }
    return {
      candidates: [targetFilePath],
      rejected: [],
      selected: targetFilePath,
      rule: "relative path resolution",
      scoreBreakdown: { relativeMatch: 1 },
    };
  }

  if (specifier.includes("/") || specifier.startsWith("@")) {
    const aliasDiagnostics = resolveAliasImportPathWithDiagnostics(
      filePath,
      specifier,
      context.repoFilePaths,
      readAliasConfig(context)
    );
    if (aliasDiagnostics.selected) {
      return {
        candidates: aliasDiagnostics.candidates,
        rejected: aliasDiagnostics.rejected,
        selected: aliasDiagnostics.selected,
        rule: aliasDiagnostics.rule ?? "tsconfig.paths match",
        scoreBreakdown: aliasDiagnostics.scoreBreakdown,
      };
    }
    if (specifier.startsWith("@/")) {
      return {
        candidates: aliasDiagnostics.candidates,
        rejected: aliasDiagnostics.rejected.length
          ? aliasDiagnostics.rejected
          : [{ candidate: specifier, reason: "alias_unconfigured" }],
        selected: null,
        rule: "tsconfig.paths match",
        scoreBreakdown: aliasDiagnostics.scoreBreakdown,
      };
    }
  }

  return {
    candidates: [],
    rejected: [],
    selected: null,
    rule: "package specifier (external)",
    scoreBreakdown: {},
  };
}

/** Resolves one import binding and returns resolver diagnostics for Stage 4 observability. */
export function resolveImportBindingWithDiagnostics(
  filePath: string,
  binding: SnapshotImportBinding,
  context: ResolverContext
): {
  result: ResolveSymbolOutput | ResolveImportOutput;
  diagnostics: ResolutionDecisionTrace;
} {
  const pathDiagnostics = buildImportPathDiagnostics(filePath, binding, context);
  const requestedName =
    binding.kind === "default"
      ? "default"
      : binding.kind === "named"
        ? binding.importedName ?? binding.localName
        : undefined;

  const moduleResolution = resolveModuleSpecifier(filePath, binding.specifier, context);
  if (moduleResolution.kind !== "resolved" || !moduleResolution.filePath) {
    return {
      result: moduleResolution,
      diagnostics: {
        filePath,
        specifier: binding.specifier,
        bindingKind: binding.kind,
        requestedName,
        candidates: pathDiagnostics.candidates,
        rejected: pathDiagnostics.rejected,
        selected: pathDiagnostics.selected,
        selectedToId: moduleResolution.toId,
        rule: pathDiagnostics.rule,
        scoreBreakdown: pathDiagnostics.scoreBreakdown,
        currentToId: "",
        resolvedToId: moduleResolution.toId,
        resolvedKind: moduleResolution.kind,
        upgradeApplied: false,
      },
    };
  }

  if (binding.kind === "side-effect" || binding.kind === "namespace") {
    if (context.report) {
      context.report.importsResolved++;
    }
    return {
      result: moduleResolution,
      diagnostics: {
        filePath,
        specifier: binding.specifier,
        bindingKind: binding.kind,
        requestedName,
        candidates: pathDiagnostics.candidates,
        rejected: pathDiagnostics.rejected,
        selected: pathDiagnostics.selected,
        selectedToId: moduleResolution.toId,
        rule: pathDiagnostics.rule,
        scoreBreakdown: pathDiagnostics.scoreBreakdown,
        currentToId: "",
        resolvedToId: moduleResolution.toId,
        resolvedKind: moduleResolution.kind,
        upgradeApplied: false,
      },
    };
  }

  const key =
    binding.kind === "default"
      ? "default"
      : exportKey("named", binding.importedName ?? binding.localName);
  const resolved = resolveExportEntry(moduleResolution.filePath, key, context);
  if (resolved.kind === "resolved" && context.report) {
    context.report.importsResolved++;
  }

  const symbolRule =
    resolved.kind === "resolved" ? "export catalog lookup" : "export not found";
  const scoreBreakdown: ResolutionScoreBreakdown = {
    ...pathDiagnostics.scoreBreakdown,
    exportMatch: resolved.kind === "resolved" ? 1 : 0,
  };

  return {
    result: resolved,
    diagnostics: {
      filePath,
      specifier: binding.specifier,
      bindingKind: binding.kind,
      requestedName,
      candidates: pathDiagnostics.candidates,
      rejected: pathDiagnostics.rejected,
      selected: pathDiagnostics.selected,
      selectedToId: resolved.toId,
      rule: `${pathDiagnostics.rule} → ${symbolRule}`,
      scoreBreakdown,
      currentToId: "",
      resolvedToId: resolved.toId,
      resolvedKind: resolved.kind,
      upgradeApplied: false,
    },
  };
}
