// Converts a local repository into canonical FileNode objects from filesystem metadata only.
/// <reference path="../../ripple-core/schema.ts" />

import * as fs from "fs";
import * as path from "path";
import { collectSourcePaths } from "./collectSourcePaths";
import { sha256Hex } from "./hash";

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "tsx",
  ".js": "javascript",
  ".jsx": "jsx",
};

function normalizeRepoRoot(repoPath: string): string {
  const resolvedPath = path.resolve(repoPath);
  return process.platform === "win32"
    ? resolvedPath.toLowerCase()
    : resolvedPath;
}

function toRelativePosixPath(
  absoluteFilePath: string,
  absoluteRepoRoot: string
): string {
  return path.relative(absoluteRepoRoot, absoluteFilePath).replace(/\\/g, "/");
}

function getLanguageFromFilePath(relativeFilePath: string): string {
  const extension = path.posix.extname(relativeFilePath);
  const language = EXTENSION_TO_LANGUAGE[extension];
  if (!language) {
    throw new Error(`Unsupported file extension for path: ${relativeFilePath}`);
  }
  return language;
}

function buildFileNode(
  absoluteFilePath: string,
  absoluteRepoRoot: string,
  projectId: string
): FileNode {
  const relativePath = toRelativePosixPath(absoluteFilePath, absoluteRepoRoot);
  const folderPath = path.posix.dirname(relativePath);
  const normalizedFolderPath = folderPath === "." ? "" : folderPath;
  const fileContents = fs.readFileSync(absoluteFilePath);

  return {
    id: sha256Hex(relativePath),
    projectId,
    path: relativePath,
    folderPath: normalizedFolderPath,
    language: getLanguageFromFilePath(relativePath),
    contentHash: sha256Hex(fileContents),
    symbols: [],
  };
}

export function scanRepository(repoPath: string): FileNode[] {
  const absoluteRepoRoot = path.resolve(repoPath);

  if (!fs.existsSync(absoluteRepoRoot)) {
    throw new Error(`Repository path not found: ${absoluteRepoRoot}`);
  }

  if (!fs.statSync(absoluteRepoRoot).isDirectory()) {
    throw new Error(`Repository path is not a directory: ${absoluteRepoRoot}`);
  }

  const projectId = sha256Hex(normalizeRepoRoot(absoluteRepoRoot));
  const absoluteSourcePaths = collectSourcePaths(absoluteRepoRoot);

  return absoluteSourcePaths.map((absoluteFilePath) =>
    buildFileNode(absoluteFilePath, absoluteRepoRoot, projectId)
  );
}
