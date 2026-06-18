// Failure-safe file reader for Stage 2; never throws, returns null on any read error.
import * as fs from "fs";
import * as path from "path";

export function readRepoFile(repoPath: string, relativePath: string): string | null {
  const absolutePath = path.join(repoPath, relativePath);
  try {
    return fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    console.warn(
      `Stage 2 skipping unreadable file: ${relativePath}`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
