// Deterministic, order-independent extraction of ES and CommonJS import specifiers and bound names.
import { sortImports } from "./sorter";
import type { ImportParseResult, ParsedImport } from "./types";

function normalizeSpecifier(rawSpecifier: string): string {
  return rawSpecifier.trim().replace(/\\/g, "/").replace(/\s+/g, "");
}

function collectBoundNames(clause: string, names: Set<string>): void {
  const namespaceMatch = clause.match(/\*\s+as\s+([A-Za-z0-9_$]+)/);
  if (namespaceMatch && namespaceMatch[1]) {
    names.add(namespaceMatch[1]);
  }

  const braceMatch = clause.match(/\{([^}]*)\}/);
  if (braceMatch && braceMatch[1]) {
    for (const part of braceMatch[1].split(",")) {
      const trimmed = part.trim();
      if (trimmed.length === 0) {
        continue;
      }
      const asMatch = trimmed.match(/\bas\s+([A-Za-z0-9_$]+)/);
      const local = asMatch && asMatch[1] ? asMatch[1] : trimmed.split(/\s+/)[0];
      if (local) {
        names.add(local);
      }
    }
  }

  const withoutBraces = clause.replace(/\{[^}]*\}/g, "").replace(/\*\s+as\s+[A-Za-z0-9_$]+/g, "");
  const defaultMatch = withoutBraces.match(/^\s*([A-Za-z0-9_$]+)/);
  if (defaultMatch && defaultMatch[1] && defaultMatch[1] !== "from") {
    names.add(defaultMatch[1]);
  }
}

export function parseImports(source: string): ImportParseResult {
  const specifiers = new Map<string, ParsedImport>();
  const importedNames = new Set<string>();

  const esFromPattern =
    /\bimport\s+([^'";]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = esFromPattern.exec(source)) !== null) {
    const clause = match[1] ?? "";
    const rawSpecifier = match[2] ?? "";
    const normalized = normalizeSpecifier(rawSpecifier);
    specifiers.set(normalized, { normalizedSpecifier: normalized, rawSpecifier });
    collectBoundNames(clause, importedNames);
  }

  const esBarePattern = /\bimport\s+['"]([^'"]+)['"]/g;
  while ((match = esBarePattern.exec(source)) !== null) {
    const rawSpecifier = match[1] ?? "";
    const normalized = normalizeSpecifier(rawSpecifier);
    specifiers.set(normalized, { normalizedSpecifier: normalized, rawSpecifier });
  }

  const reExportPattern = /\bexport\s+[^'";]*?\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = reExportPattern.exec(source)) !== null) {
    const rawSpecifier = match[1] ?? "";
    const normalized = normalizeSpecifier(rawSpecifier);
    specifiers.set(normalized, { normalizedSpecifier: normalized, rawSpecifier });
  }

  const requirePattern =
    /(?:(?:const|let|var)\s+([^=;]+?)\s*=\s*)?require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requirePattern.exec(source)) !== null) {
    const binding = match[1];
    const rawSpecifier = match[2] ?? "";
    const normalized = normalizeSpecifier(rawSpecifier);
    specifiers.set(normalized, { normalizedSpecifier: normalized, rawSpecifier });
    if (binding) {
      collectBoundNames(binding, importedNames);
    }
  }

  return {
    imports: sortImports(Array.from(specifiers.values())),
    importedNames: Array.from(importedNames).sort((left, right) =>
      left.localeCompare(right)
    ),
  };
}
