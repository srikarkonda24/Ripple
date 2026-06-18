// Primary TypeScript/TSX extractor using ts-morph for accurate symbol discovery.
import { Node, Project } from "ts-morph";
import type { ExtractedSymbol } from "../types";
import { looksLikeComponent, makeSymbol } from "./makeSymbol";

function classifyFunction(name: string, bodyText: string): "function" | "component" {
  return looksLikeComponent(name, bodyText) ? "component" : "function";
}

export function typescriptExtract(source: string): ExtractedSymbol[] {
  const project = new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
    compilerOptions: { allowJs: true, jsx: 2 },
  });

  const sourceFile = project.createSourceFile("__stage2__.tsx", source, {
    overwrite: true,
  });

  const collected: ExtractedSymbol[] = [];

  for (const fn of sourceFile.getFunctions()) {
    const name = fn.getName();
    if (!name) {
      continue;
    }
    const bodyText = fn.getText();
    collected.push(
      makeSymbol({
        name,
        type: classifyFunction(name, bodyText),
        anchorSource: source,
        bodyText,
      })
    );
  }

  for (const variable of sourceFile.getVariableDeclarations()) {
    const initializer = variable.getInitializer();
    if (
      !initializer ||
      (!Node.isArrowFunction(initializer) &&
        !Node.isFunctionExpression(initializer))
    ) {
      continue;
    }
    const name = variable.getName();
    const bodyText = variable.getText();
    collected.push(
      makeSymbol({
        name,
        type: classifyFunction(name, bodyText),
        anchorSource: source,
        bodyText,
      })
    );
  }

  for (const classDeclaration of sourceFile.getClasses()) {
    const className = classDeclaration.getName();
    if (!className) {
      continue;
    }
    collected.push(
      makeSymbol({
        name: className,
        type: "class",
        anchorSource: source,
        bodyText: classDeclaration.getText(),
      })
    );

    for (const method of classDeclaration.getMethods()) {
      collected.push(
        makeSymbol({
          name: method.getName(),
          type: "function",
          anchorSource: source,
          bodyText: method.getText(),
          parentClassName: className,
        })
      );
    }
  }

  return collected;
}
