// Babel-based symbol extraction shared by the JavaScript extractor and the TypeScript fallback path.
import { parse } from "@babel/parser";
import type {
  ClassDeclaration,
  Declaration,
  Node,
  Statement,
  VariableDeclaration,
} from "@babel/types";
import type { ExtractedSymbol, OriginReason, Stage2SymbolType } from "../types";
import { looksLikeComponent, makeSymbol } from "./makeSymbol";

function sliceBody(source: string, node: Node): string {
  if (typeof node.start === "number" && typeof node.end === "number") {
    return source.slice(node.start, node.end);
  }
  return "";
}

function classifyFunction(name: string, bodyText: string): Stage2SymbolType {
  return looksLikeComponent(name, bodyText) ? "component" : "function";
}

function isFunctionInitializer(node: Node | null | undefined): boolean {
  return (
    node !== null &&
    node !== undefined &&
    (node.type === "ArrowFunctionExpression" ||
      node.type === "FunctionExpression")
  );
}

function extractFromVariableDeclaration(
  declaration: VariableDeclaration,
  source: string,
  originReason: OriginReason,
  collected: ExtractedSymbol[]
): void {
  for (const declarator of declaration.declarations) {
    if (declarator.id.type !== "Identifier") {
      continue;
    }
    if (!isFunctionInitializer(declarator.init)) {
      continue;
    }
    const name = declarator.id.name;
    const bodyText = sliceBody(source, declarator);
    collected.push(
      makeSymbol({
        name,
        type: classifyFunction(name, bodyText),
        anchorSource: source,
        bodyText,
        originReason,
      })
    );
  }
}

function extractFromClass(
  declaration: ClassDeclaration,
  source: string,
  originReason: OriginReason,
  collected: ExtractedSymbol[]
): void {
  const className = declaration.id ? declaration.id.name : "default";
  collected.push(
    makeSymbol({
      name: className,
      type: "class",
      anchorSource: source,
      bodyText: sliceBody(source, declaration),
      originReason,
    })
  );

  for (const member of declaration.body.body) {
    if (
      (member.type === "ClassMethod" || member.type === "ClassPrivateMethod") &&
      member.key.type === "Identifier"
    ) {
      const methodName = member.key.name;
      collected.push(
        makeSymbol({
          name: methodName,
          type: "function",
          anchorSource: source,
          bodyText: sliceBody(source, member),
          parentClassName: className,
          originReason,
        })
      );
    }
  }
}

function extractFromDeclaration(
  declaration: Declaration,
  source: string,
  originReason: OriginReason,
  collected: ExtractedSymbol[],
  defaultName?: string
): void {
  if (declaration.type === "FunctionDeclaration") {
    const name = declaration.id ? declaration.id.name : defaultName ?? "default";
    const bodyText = sliceBody(source, declaration);
    collected.push(
      makeSymbol({
        name,
        type: classifyFunction(name, bodyText),
        anchorSource: source,
        bodyText,
        originReason,
      })
    );
    return;
  }

  if (declaration.type === "ClassDeclaration") {
    extractFromClass(declaration, source, originReason, collected);
    return;
  }

  if (declaration.type === "VariableDeclaration") {
    extractFromVariableDeclaration(declaration, source, originReason, collected);
  }
}

function handleStatement(
  statement: Statement,
  source: string,
  originReason: OriginReason,
  collected: ExtractedSymbol[]
): void {
  if (statement.type === "ExportNamedDeclaration" && statement.declaration) {
    extractFromDeclaration(statement.declaration, source, originReason, collected);
    return;
  }

  if (statement.type === "ExportDefaultDeclaration") {
    const declared = statement.declaration;
    if (
      declared.type === "FunctionDeclaration" ||
      declared.type === "ClassDeclaration"
    ) {
      extractFromDeclaration(declared, source, originReason, collected, "default");
    }
    return;
  }

  if (
    statement.type === "FunctionDeclaration" ||
    statement.type === "ClassDeclaration" ||
    statement.type === "VariableDeclaration"
  ) {
    extractFromDeclaration(statement, source, originReason, collected);
  }
}

export function babelExtract(
  source: string,
  originReason: OriginReason
): ExtractedSymbol[] {
  const ast = parse(source, {
    sourceType: "unambiguous",
    allowReturnOutsideFunction: true,
    plugins: ["typescript", "jsx", "decorators-legacy"],
  });

  const collected: ExtractedSymbol[] = [];
  for (const statement of ast.program.body) {
    handleStatement(statement, source, originReason, collected);
  }

  return collected;
}
