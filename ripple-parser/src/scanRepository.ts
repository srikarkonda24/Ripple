// Converts a local repository into canonical FileNode objects from filesystem metadata only.
/// <reference path="../../ripple-core/schema.ts" />

import * as fs from "fs";
import * as path from "path";
import { collectFilePaths } from "./collectFilePaths";
import { detectLanguage } from "./detectLanguage";
import { sha256Hex } from "./hash";
import { isLikelyBinaryFile } from "./isLikelyBinaryFile";

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

function readFileContents(absoluteFilePath: string): Buffer | null {
  try {
    return fs.readFileSync(absoluteFilePath);
  } catch (error) {
    console.warn(
      `Skipping unreadable file: ${absoluteFilePath}`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

function buildFileNode(
  absoluteFilePath: string,
  absoluteRepoRoot: string,
  projectId: string
): FileNode | null {
  const relativePath = toRelativePosixPath(absoluteFilePath, absoluteRepoRoot);
  const folderPath = path.posix.dirname(relativePath);
  const normalizedFolderPath = folderPath === "." ? "" : folderPath;
  const fileContents = readFileContents(absoluteFilePath);

  if (fileContents === null) {
    return null;
  }

  if (isLikelyBinaryFile(fileContents)) {
    console.warn(`Skipping likely binary file: ${relativePath}`);
    return null;
  }

  return {
    id: sha256Hex(relativePath),
    projectId,
    path: relativePath,
    folderPath: normalizedFolderPath,
    language: detectLanguage(relativePath),
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
  const absoluteFilePaths = collectFilePaths(absoluteRepoRoot);
  const fileNodes: FileNode[] = [];

  for (const absoluteFilePath of absoluteFilePaths) {
    const fileNode = buildFileNode(absoluteFilePath, absoluteRepoRoot, projectId);
    if (fileNode !== null) {
      fileNodes.push(fileNode);
    }
  }

  return fileNodes;
}
