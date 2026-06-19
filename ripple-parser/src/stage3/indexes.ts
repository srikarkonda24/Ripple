// Builds deterministic Stage 3 lookup indexes from FileAnalysis artifacts.
/// <reference path="../../../ripple-core/schema.ts" />

import { buildModuleSymbolId } from "../stage2/symbolId";
import type { BuildReport, ExportEntry, FileAnalysis } from "./types";

export type ExportIndex = Map<string, Map<string, ExportEntry>>;

export interface Stage3Indexes {
  analysisByPath: Map<string, FileAnalysis>;
  symbolsByFilePath: Map<string, CodeSymbol[]>;
  moduleSymbolIdByPath: Map<string, string>;
  exportIndex: ExportIndex;
}

function exportKey(kind: "default" | "named", name: string): string {
  return kind === "default" ? "default" : `named:${name}`;
}

function findLocalSymbol(
  symbols: CodeSymbol[],
  localName: string,
  filePath: string,
  report: BuildReport
): string | undefined {
  const matches = symbols
    .filter((symbol) => symbol.name === localName)
    .sort((left, right) => (left.startLine ?? 0) - (right.startLine ?? 0));

  if (matches.length > 1) {
    report.exportAmbiguities.push({
      filePath,
      exportName: localName,
      symbolIds: matches.map((symbol) => symbol.id).sort((left, right) => left.localeCompare(right)),
    });
  }

  return matches[0]?.id;
}

function buildExportEntries(
  analysis: FileAnalysis,
  report: BuildReport
): Map<string, ExportEntry> {
  const entries = new Map<string, ExportEntry>();
  for (const binding of analysis.surface.exports) {
    const key = exportKey(binding.kind, binding.exportName);
    const localSymbolId =
      binding.localName === "default"
        ? analysis.symbols.find((symbol) => symbol.type === "module")?.id
        : findLocalSymbol(analysis.symbols, binding.localName, analysis.file.path, report);

    if (!localSymbolId) {
      report.orphanExports.push({
        filePath: analysis.file.path,
        specifier: binding.exportName,
        reason: "symbol_not_found",
      });
      continue;
    }

    entries.set(key, {
      filePath: analysis.file.path,
      exportKey: key,
      symbolId: localSymbolId,
      source: "local",
    });
  }

  for (const reExport of analysis.surface.reExports) {
    if (reExport.kind === "all") {
      report.summary.reExportsProcessed++;
      continue;
    }
    const name = reExport.localAlias ?? reExport.exportedName ?? reExport.importedName ?? "default";
    const key = reExport.kind === "default" ? "default" : `named:${name}`;
    entries.set(key, {
      filePath: analysis.file.path,
      exportKey: key,
      source: "reexport",
      reExport,
    });
    report.summary.reExportsProcessed++;
  }

  return entries;
}

export function buildStage3Indexes(
  analyses: FileAnalysis[],
  report: BuildReport
): Stage3Indexes {
  const analysisByPath = new Map<string, FileAnalysis>();
  const symbolsByFilePath = new Map<string, CodeSymbol[]>();
  const moduleSymbolIdByPath = new Map<string, string>();
  const exportIndex: ExportIndex = new Map();

  for (const analysis of analyses.sort((left, right) => left.file.path.localeCompare(right.file.path))) {
    analysisByPath.set(analysis.file.path, analysis);
    symbolsByFilePath.set(analysis.file.path, analysis.symbols);
    moduleSymbolIdByPath.set(
      analysis.file.path,
      analysis.symbols.find((symbol) => symbol.type === "module")?.id ??
        buildModuleSymbolId(analysis.file.path, analysis.file.contentHash)
    );
    exportIndex.set(analysis.file.path, buildExportEntries(analysis, report));
  }

  return {
    analysisByPath,
    symbolsByFilePath,
    moduleSymbolIdByPath,
    exportIndex,
  };
}

export function getExportKey(kind: "default" | "named", name: string): string {
  return exportKey(kind, name);
}
