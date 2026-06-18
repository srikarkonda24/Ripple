// Recursively discovers source file paths under a repository root with exclusions applied.
import * as fs from "fs";
import * as path from "path";

const EXCLUDED_DIRECTORY_NAMES = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".git",
]);

const INCLUDED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

function isIncludedSourceFile(fileName: string): boolean {
  if (fileName.endsWith(".d.ts")) {
    return false;
  }

  const extension = path.extname(fileName);
  return INCLUDED_EXTENSIONS.has(extension);
}

function shouldExcludeDirectory(directoryName: string): boolean {
  return EXCLUDED_DIRECTORY_NAMES.has(directoryName);
}

function collectSourcePathsInDirectory(
  absoluteDirectoryPath: string,
  absoluteRepoRoot: string,
  collectedPaths: string[]
): void {
  const entries = fs.readdirSync(absoluteDirectoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absoluteEntryPath = path.join(absoluteDirectoryPath, entry.name);

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      if (!shouldExcludeDirectory(entry.name)) {
        collectSourcePathsInDirectory(
          absoluteEntryPath,
          absoluteRepoRoot,
          collectedPaths
        );
      }
      continue;
    }

    if (entry.isFile() && isIncludedSourceFile(entry.name)) {
      collectedPaths.push(absoluteEntryPath);
    }
  }
}

export function collectSourcePaths(absoluteRepoRoot: string): string[] {
  const collectedPaths: string[] = [];
  collectSourcePathsInDirectory(absoluteRepoRoot, absoluteRepoRoot, collectedPaths);
  return collectedPaths.sort((leftPath, rightPath) =>
    leftPath.localeCompare(rightPath)
  );
}
