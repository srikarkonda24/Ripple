// Builds the minimal language-neutral symbol index used by Stage 4 resolver adapters.
/// <reference path="../schema.ts" />
/// <reference path="../interfaces/resolverTypes.ts" />

interface BuildSymbolIndexInput {
  symbols: readonly CodeSymbol[];
  files: readonly FileNode[];
  resolutionSnapshot: ResolutionSnapshot;
}

function firstExistingFilePath(
  candidates: string[],
  repoFilePaths: ReadonlySet<string>
): string | null {
  for (const candidate of candidates) {
    if (repoFilePaths.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

/** Builds lookup indexes from Stage 3 output without re-parsing source files. */
export function buildSymbolIndex(input: BuildSymbolIndexInput): SymbolIndex {
  const symbolsById = new Map<ID, CodeSymbol>();
  const symbolsByFilePath = new Map<string, CodeSymbol[]>();
  const moduleSymbolIdByPath = new Map<string, ID>();
  const exportIndex = new Map<string, Map<string, SnapshotExportEntry>>();
  const reExportsByFilePath = new Map<string, SnapshotReExportBinding[]>();

  for (const symbol of input.symbols) {
    symbolsById.set(symbol.id, symbol);
    if (!symbolsByFilePath.has(symbol.filePath)) {
      symbolsByFilePath.set(symbol.filePath, []);
    }
    symbolsByFilePath.get(symbol.filePath)?.push(symbol);
    if (symbol.type === "module") {
      moduleSymbolIdByPath.set(symbol.filePath, symbol.id);
    }
  }

  for (const file of input.files) {
    if (!moduleSymbolIdByPath.has(file.path)) {
      const moduleSymbol = symbolsByFilePath
        .get(file.path)
        ?.find((symbol) => symbol.type === "module");
      if (moduleSymbol) {
        moduleSymbolIdByPath.set(file.path, moduleSymbol.id);
      }
    }
  }

  for (const exportGroup of input.resolutionSnapshot.exports) {
    const entries = new Map<string, SnapshotExportEntry>();
    for (const entry of exportGroup.entries) {
      entries.set(entry.exportKey, entry);
    }
    exportIndex.set(exportGroup.filePath, entries);
  }

  for (const reExportGroup of input.resolutionSnapshot.reExports) {
    reExportsByFilePath.set(reExportGroup.filePath, [...reExportGroup.bindings]);
  }

  for (const moduleEntry of input.resolutionSnapshot.moduleSymbolIds) {
    moduleSymbolIdByPath.set(moduleEntry.filePath, moduleEntry.symbolId);
  }

  return {
    symbolsById,
    exportIndex,
    reExportsByFilePath,
    moduleSymbolIdByPath,
    symbolsByFilePath,
  };
}
