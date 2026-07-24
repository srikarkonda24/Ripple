// Deterministic normalization rules for changed file paths in PRChange.
import { PRChangeValidationError } from "./PRChangeErrors";

/**
 * Normalizes a repository-relative path using POSIX-style forward slashes.
 * Rejects empty paths and parent-directory traversal segments.
 */
export function normalizeChangedFilePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed.length === 0) {
    throw new PRChangeValidationError("Changed file path must not be empty");
  }

  let normalized = trimmed.replace(/\\/g, "/");
  while (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }
  if (normalized.length === 0) {
    throw new PRChangeValidationError("Changed file path must not be empty");
  }
  if (normalized.includes("..")) {
    throw new PRChangeValidationError(
      `Changed file path must not contain parent segments: "${path}"`,
    );
  }

  return normalized;
}

/** Normalizes commit SHAs to lowercase hexadecimal (same rule as AnalysisIdentity). */
export function normalizeCommitSha(sha: string): string {
  const trimmed = sha.trim().toLowerCase();
  if (trimmed.length === 0) {
    throw new PRChangeValidationError("Commit SHA must not be empty");
  }
  if (!/^[0-9a-f]+$/.test(trimmed)) {
    throw new PRChangeValidationError("Commit SHA must be hexadecimal");
  }
  return trimmed;
}
