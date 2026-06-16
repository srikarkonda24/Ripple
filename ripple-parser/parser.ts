import * as fs from "fs";
import * as path from "path";
import {
  Project,
  SyntaxKind,
  Node,
  VariableDeclarationKind,
  FunctionDeclaration,
  VariableDeclaration,
} from "ts-morph";

interface GraphNode {
  id: string;
  file: string;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface Output {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface FunctionInfo {
  name: string;
  file: string;
  bodyNode: FunctionDeclaration | VariableDeclaration;
}

function shouldSkipDir(dirName: string): boolean {
  return dirName === "node_modules" || dirName === ".next";
}

function collectSourceFiles(rootDir: string): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!shouldSkipDir(entry.name)) {
          walk(fullPath);
        }
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
        !entry.name.endsWith(".d.ts")
      ) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

function getFunctionBodyNode(
  fn: FunctionDeclaration | VariableDeclaration
): Node | undefined {
  if (Node.isFunctionDeclaration(fn)) {
    return fn;
  }

  const init = fn.getInitializer();
  if (
    init &&
    (Node.isArrowFunction(init) || Node.isFunctionExpression(init))
  ) {
    return init;
  }

  return undefined;
}

function getCalledFunctionName(
  callExpr: import("ts-morph").CallExpression
): string | undefined {
  const expr = callExpr.getExpression();
  if (Node.isIdentifier(expr)) {
    return expr.getText();
  }
  if (Node.isPropertyAccessExpression(expr)) {
    return expr.getName();
  }
  return undefined;
}

function getJsxComponentName(
  tagName: import("ts-morph").JsxTagNameExpression
): string | undefined {
  let name: string | undefined;

  if (Node.isIdentifier(tagName)) {
    name = tagName.getText();
  } else if (Node.isPropertyAccessExpression(tagName)) {
    name = tagName.getName();
  }

  if (!name || /^[a-z]/.test(name)) {
    return undefined;
  }

  return name;
}

function addEdge(
  edges: GraphEdge[],
  edgeSet: Set<string>,
  from: string,
  to: string
): void {
  const edgeKey = `${from}->${to}`;
  if (edgeSet.has(edgeKey)) return;
  edgeSet.add(edgeKey);
  edges.push({ from, to });
}

function collectFunctions(
  sourceFilePaths: string[],
  absoluteTargetDir: string,
  project: Project
): FunctionInfo[] {
  const functions: FunctionInfo[] = [];
  const seen = new Set<string>();

  for (const filePath of sourceFilePaths) {
    project.addSourceFileAtPath(filePath);
  }

  for (const sourceFile of project.getSourceFiles()) {
    const relativeFile = path
      .relative(absoluteTargetDir, sourceFile.getFilePath())
      .replace(/\\/g, "/");

    for (const fn of sourceFile.getDescendantsOfKind(
      SyntaxKind.FunctionDeclaration
    )) {
      const name = fn.getName();
      if (!name) continue;

      const key = `${relativeFile}:${name}:${fn.getStart()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      functions.push({ name, file: relativeFile, bodyNode: fn });
    }

    for (const decl of sourceFile.getVariableDeclarations()) {
      const list = decl.getParentIfKind(SyntaxKind.VariableDeclarationList);
      if (!list || list.getDeclarationKind() !== VariableDeclarationKind.Const) {
        continue;
      }

      const init = decl.getInitializer();
      if (
        !init ||
        (!Node.isArrowFunction(init) && !Node.isFunctionExpression(init))
      ) {
        continue;
      }

      const name = decl.getName();
      const key = `${relativeFile}:${name}:${decl.getStart()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      functions.push({ name, file: relativeFile, bodyNode: decl });
    }
  }

  return functions;
}

function buildGraph(
  functions: FunctionInfo[],
  knownNames: Set<string>
): Output {
  const nodes: GraphNode[] = functions.map(({ name, file }) => ({
    id: name,
    file,
  }));

  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const fn of functions) {
    const bodyNode = getFunctionBodyNode(fn.bodyNode);
    if (!bodyNode) continue;

    for (const callExpr of bodyNode.getDescendantsOfKind(
      SyntaxKind.CallExpression
    )) {
      const calledName = getCalledFunctionName(callExpr);
      if (!calledName || !knownNames.has(calledName)) continue;

      addEdge(edges, edgeSet, fn.name, calledName);
    }

    for (const jsxNode of bodyNode.getDescendantsOfKind(
      SyntaxKind.JsxSelfClosingElement
    )) {
      const componentName = getJsxComponentName(jsxNode.getTagNameNode());
      if (!componentName || !knownNames.has(componentName)) continue;

      addEdge(edges, edgeSet, fn.name, componentName);
    }

    for (const jsxNode of bodyNode.getDescendantsOfKind(
      SyntaxKind.JsxOpeningElement
    )) {
      const componentName = getJsxComponentName(jsxNode.getTagNameNode());
      if (!componentName || !knownNames.has(componentName)) continue;

      addEdge(edges, edgeSet, fn.name, componentName);
    }
  }

  return { nodes, edges };
}

function main(): void {
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error("Usage: npx ts-node parser.ts <folder-path>");
    process.exit(1);
  }

  const absoluteTargetDir = path.resolve(targetDir);
  if (!fs.existsSync(absoluteTargetDir)) {
    console.error(`Folder not found: ${absoluteTargetDir}`);
    process.exit(1);
  }

  const sourceFilePaths = collectSourceFiles(absoluteTargetDir);
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: true,
      jsx: 2,
    },
  });

  const functions = collectFunctions(
    sourceFilePaths,
    absoluteTargetDir,
    project
  );
  const knownNames = new Set(functions.map((fn) => fn.name));
  const output = buildGraph(functions, knownNames);

  const outputPath = path.join(process.cwd(), "output.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`Found ${output.nodes.length} nodes and ${output.edges.length} edges`);
  console.log(`Wrote ${outputPath}`);
}

main();
