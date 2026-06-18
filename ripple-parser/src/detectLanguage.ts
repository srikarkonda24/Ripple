// Maps file paths to best-effort language labels without filtering files.
import * as path from "path";

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".md": "markdown",
  ".json": "json",
  ".yml": "yaml",
  ".yaml": "yaml",
};

export function detectLanguage(relativeFilePath: string): string {
  const baseName = path.posix.basename(relativeFilePath);
  if (baseName === "Dockerfile") {
    return "docker";
  }

  const extension = path.posix.extname(relativeFilePath).toLowerCase();
  return EXTENSION_TO_LANGUAGE[extension] ?? "unknown";
}
