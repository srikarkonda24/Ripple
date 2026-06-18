// Recursively discovers all file paths under a repository root, excluding noise directories.
import * as fs from "fs";
import * as path from "path";

const EXCLUDED_DIRECTORY_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
]);

function shouldExcludeDirectory(directoryName: string): boolean {
  return EXCLUDED_DIRECTORY_NAMES.has(directoryName);
}

function collectFilePathsInDirectory(
  absoluteDirectoryPath: string,
  collectedPaths: string[]
): void {
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(absoluteDirectoryPath, { withFileTypes: true });
  } catch (error) {
    console.warn(
      `Skipping unreadable directory: ${absoluteDirectoryPath}`,
      error instanceof Error ? error.message : error
    );
    return;
  }

  for (const entry of entries) {
    const absoluteEntryPath = path.join(absoluteDirectoryPath, entry.name);

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      if (!shouldExcludeDirectory(entry.name)) {
        collectFilePathsInDirectory(absoluteEntryPath, collectedPaths);
      }
      continue;
    }

    if (entry.isFile()) {
      collectedPaths.push(absoluteEntryPath);
    }
  }
}

export function collectFilePaths(absoluteRepoRoot: string): string[] {
  const collectedPaths: string[] = [];
  collectFilePathsInDirectory(absoluteRepoRoot, collectedPaths);
  return collectedPaths.sort((leftPath, rightPath) =>
    leftPath.localeCompare(rightPath)
  );
}
