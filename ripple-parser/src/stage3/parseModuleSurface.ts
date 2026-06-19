// Parses each file's import/export surface without changing Stage 2 symbol identity.
import { parse } from "@babel/parser";
import type {
  Declaration,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  ImportDeclaration,
  ImportSpecifier,
  Node,
  Program,
  Statement,
  VariableDeclaration,
} from "@babel/types";
import type {
  ExportBinding,
  ImportBinding,
  ModuleSurface,
  ReExportBinding,
} from "./types";

function normalizeSpecifier(rawSpecifier: string): string {
  return rawSpecifier.trim().replace(/\\/g, "/").replace(/\s+/g, "");
}

function nodeName(node: Node): string | null {
  if (node.type === "Identifier") {
    return node.name;
  }
  if (node.type === "StringLiteral") {
    return node.value;
  }
  return null;
}

function statementLine(statement: Statement): number {
  return statement.loc?.start.line ?? 0;
}

function declarationNames(declaration: Declaration): string[] {
  if (
    declaration.type === "FunctionDeclaration" ||
    declaration.type === "ClassDeclaration"
  ) {
    return declaration.id ? [declaration.id.name] : ["default"];
  }

  if (declaration.type !== "VariableDeclaration") {
    return [];
  }

  return variableDeclarationNames(declaration);
}

function variableDeclarationNames(declaration: VariableDeclaration): string[] {
  const names: string[] = [];
  for (const declarator of declaration.declarations) {
    if (declarator.id.type === "Identifier") {
      names.push(declarator.id.name);
    }
  }
  return names.sort((left, right) => left.localeCompare(right));
}

function parseImportDeclaration(statement: ImportDeclaration): ImportBinding[] {
  const specifier = normalizeSpecifier(statement.source.value);
  if (statement.specifiers.length === 0) {
    return [
      {
        specifier,
        kind: "side-effect",
        localName: "",
        typeOnly: statement.importKind === "type",
        line: statementLine(statement),
      },
    ];
  }

  return statement.specifiers
    .map((importSpecifier): ImportBinding | null => {
      if (importSpecifier.type === "ImportDefaultSpecifier") {
        return {
          specifier,
          kind: "default",
          localName: importSpecifier.local.name,
          typeOnly: statement.importKind === "type",
          line: statementLine(statement),
        };
      }

      if (importSpecifier.type === "ImportNamespaceSpecifier") {
        return {
          specifier,
          kind: "namespace",
          localName: importSpecifier.local.name,
          typeOnly: statement.importKind === "type",
          line: statementLine(statement),
        };
      }

      return parseNamedImport(statement, importSpecifier);
    })
    .filter((binding): binding is ImportBinding => binding !== null)
    .sort(compareImportBindings);
}

function parseNamedImport(
  statement: ImportDeclaration,
  importSpecifier: ImportSpecifier
): ImportBinding | null {
  const importedName = nodeName(importSpecifier.imported);
  if (!importedName) {
    return null;
  }

  return {
    specifier: normalizeSpecifier(statement.source.value),
    kind: "named",
    localName: importSpecifier.local.name,
    importedName,
    typeOnly:
      statement.importKind === "type" || importSpecifier.importKind === "type",
    line: statementLine(statement),
  };
}

function parseNamedExport(statement: ExportNamedDeclaration): {
  exports: ExportBinding[];
  reExports: ReExportBinding[];
} {
  if (statement.source) {
    return { exports: [], reExports: parseReExportSpecifiers(statement) };
  }

  const exports: ExportBinding[] = [];
  if (statement.declaration) {
    for (const localName of declarationNames(statement.declaration)) {
      exports.push({ kind: "named", exportName: localName, localName });
    }
  }

  for (const specifier of statement.specifiers) {
    if (specifier.type !== "ExportSpecifier") {
      continue;
    }
    const localName = nodeName(specifier.local);
    const exportName = nodeName(specifier.exported);
    if (localName && exportName) {
      exports.push({ kind: "named", exportName, localName });
    }
  }

  return { exports: exports.sort(compareExportBindings), reExports: [] };
}

function parseReExportSpecifiers(
  statement: ExportNamedDeclaration
): ReExportBinding[] {
  const source = statement.source ? normalizeSpecifier(statement.source.value) : "";
  return statement.specifiers
    .map((specifier): ReExportBinding | null => {
      if (specifier.type !== "ExportSpecifier") {
        return null;
      }
      return parseExportSpecifier(source, specifier);
    })
    .filter((binding): binding is ReExportBinding => binding !== null)
    .sort(compareReExportBindings);
}

function parseExportSpecifier(
  specifier: string,
  exportSpecifier: ExportSpecifier
): ReExportBinding | null {
  const importedName = nodeName(exportSpecifier.local);
  const exportedName = nodeName(exportSpecifier.exported);
  if (!importedName || !exportedName) {
    return null;
  }

  return {
    specifier,
    kind: importedName === "default" ? "default" : "named",
    importedName,
    exportedName,
    localAlias: exportedName,
  };
}

function parseDefaultExport(statement: ExportDefaultDeclaration): ExportBinding {
  const declared = statement.declaration;
  if (
    (declared.type === "FunctionDeclaration" ||
      declared.type === "ClassDeclaration") &&
    declared.id
  ) {
    return { kind: "default", exportName: "default", localName: declared.id.name };
  }
  if (declared.type === "Identifier") {
    return { kind: "default", exportName: "default", localName: declared.name };
  }
  return { kind: "default", exportName: "default", localName: "default" };
}

function parseExportAll(statement: ExportAllDeclaration): ReExportBinding {
  return {
    specifier: normalizeSpecifier(statement.source.value),
    kind: "all",
  };
}

function compareImportBindings(left: ImportBinding, right: ImportBinding): number {
  return (
    left.specifier.localeCompare(right.specifier) ||
    left.kind.localeCompare(right.kind) ||
    left.localName.localeCompare(right.localName)
  );
}

function compareExportBindings(left: ExportBinding, right: ExportBinding): number {
  return (
    left.kind.localeCompare(right.kind) ||
    left.exportName.localeCompare(right.exportName) ||
    left.localName.localeCompare(right.localName)
  );
}

function compareReExportBindings(
  left: ReExportBinding,
  right: ReExportBinding
): number {
  return (
    left.specifier.localeCompare(right.specifier) ||
    left.kind.localeCompare(right.kind) ||
    (left.exportedName ?? "").localeCompare(right.exportedName ?? "")
  );
}

function parseProgram(source: string): Program {
  return parse(source, {
    sourceType: "unambiguous",
    allowReturnOutsideFunction: true,
    plugins: ["typescript", "jsx", "decorators-legacy"],
  }).program;
}

function parseSurfaceWithBabel(filePath: string, source: string): ModuleSurface {
  const imports: ImportBinding[] = [];
  const exports: ExportBinding[] = [];
  const reExports: ReExportBinding[] = [];

  for (const statement of parseProgram(source).body) {
    if (statement.type === "ImportDeclaration") {
      imports.push(...parseImportDeclaration(statement));
    } else if (statement.type === "ExportNamedDeclaration") {
      const parsed = parseNamedExport(statement);
      exports.push(...parsed.exports);
      reExports.push(...parsed.reExports);
    } else if (statement.type === "ExportDefaultDeclaration") {
      exports.push(parseDefaultExport(statement));
    } else if (statement.type === "ExportAllDeclaration") {
      reExports.push(parseExportAll(statement));
    }
  }

  return {
    filePath,
    imports: imports.sort(compareImportBindings),
    exports: exports.sort(compareExportBindings),
    reExports: reExports.sort(compareReExportBindings),
    usedFallback: false,
  };
}

function parseSurfaceWithFallback(filePath: string, source: string): ModuleSurface {
  const imports: ImportBinding[] = [];
  const exports: ExportBinding[] = [];
  const reExports: ReExportBinding[] = [];
  const fromPattern = /\bimport\s+([^'";]*?)\s+from\s+['"]([^'"]+)['"]/g;
  const barePattern = /\bimport\s+['"]([^'"]+)['"]/g;
  const exportPattern = /\bexport\s+(?:default\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_$]+)/g;
  const reExportPattern = /\bexport\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g;

  let match: RegExpExecArray | null;
  while ((match = fromPattern.exec(source)) !== null) {
    const clause = match[1] ?? "";
    const specifier = normalizeSpecifier(match[2] ?? "");
    const defaultMatch = clause.match(/^\s*([A-Za-z0-9_$]+)/);
    if (defaultMatch?.[1] && defaultMatch[1] !== "type") {
      imports.push({ specifier, kind: "default", localName: defaultMatch[1], typeOnly: false, line: 0 });
    }
  }
  while ((match = barePattern.exec(source)) !== null) {
    imports.push({ specifier: normalizeSpecifier(match[1] ?? ""), kind: "side-effect", localName: "", typeOnly: false, line: 0 });
  }
  while ((match = exportPattern.exec(source)) !== null) {
    const localName = match[1] ?? "";
    exports.push({ kind: "named", exportName: localName, localName });
  }
  while ((match = reExportPattern.exec(source)) !== null) {
    const names = (match[1] ?? "").split(",");
    const specifier = normalizeSpecifier(match[2] ?? "");
    for (const name of names) {
      const parts = name.trim().split(/\s+as\s+/);
      const importedName = parts[0] ?? "";
      const exportedName = parts[1] ?? importedName;
      if (importedName.length > 0) {
        reExports.push({ specifier, kind: "named", importedName, exportedName, localAlias: exportedName });
      }
    }
  }

  return {
    filePath,
    imports: imports.sort(compareImportBindings),
    exports: exports.sort(compareExportBindings),
    reExports: reExports.sort(compareReExportBindings),
    usedFallback: true,
  };
}

export function parseModuleSurface(filePath: string, source: string): ModuleSurface {
  try {
    return parseSurfaceWithBabel(filePath, source);
  } catch {
    return parseSurfaceWithFallback(filePath, source);
  }
}
