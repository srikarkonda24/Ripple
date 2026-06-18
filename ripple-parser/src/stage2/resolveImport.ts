// Pure, deterministic import path resolution into in-repo / external / unresolved DEPENDS_ON targets.
import * as path from "path";
import {
  buildExternalTargetId,
  buildModuleSymbolId,
  buildUnresolvedTargetId,
} from "./symbolId";

const RELATIVE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

export interface ImportResolution {
  kind: "in-repo" | "external" | "unresolved";
  toId: string;
}

function firstExistingCandidate(
  candidates: string[],
  repoFilePaths: Set<string>
): string | null {
  for (const candidate of candidates) {
    if (repoFilePaths.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

function directoryFallback(
  joined: string,
  repoFilePaths: Set<string>
): string | null {
  const prefix = `${joined}/`;
  const matches = Array.from(repoFilePaths)
    .filter((candidate) => candidate.startsWith(prefix))
    .sort((left, right) => left.localeCompare(right));
  return matches[0] ?? null;
}

function resolveRelative(
  fromFilePath: string,
  specifier: string,
  repoFilePaths: Set<string>
): string | null {
  const baseDir = path.posix.dirname(fromFilePath);
  const joined = path.posix
    .normalize(path.posix.join(baseDir, specifier))
    .replace(/\\/g, "/");

  const exactCandidates = [joined, ...RELATIVE_EXTENSIONS.map((ext) => `${joined}${ext}`)];
  const exact = firstExistingCandidate(exactCandidates, repoFilePaths);
  if (exact) {
    return exact;
  }

  const tsIndex = firstExistingCandidate(
    [`${joined}/index.ts`, `${joined}/index.tsx`],
    repoFilePaths
  );
  if (tsIndex) {
    return tsIndex;
  }

  const jsIndex = firstExistingCandidate(
    [`${joined}/index.js`, `${joined}/index.jsx`],
    repoFilePaths
  );
  if (jsIndex) {
    return jsIndex;
  }

  return directoryFallback(joined, repoFilePaths);
}

export function resolveImportTarget(
  fromFilePath: string,
  normalizedSpecifier: string,
  repoFilePaths: Set<string>,
  contentHashByPath: Map<string, string>
): ImportResolution {
  if (normalizedSpecifier.startsWith(".")) {
    const resolvedPath = resolveRelative(
      fromFilePath,
      normalizedSpecifier,
      repoFilePaths
    );
    if (resolvedPath) {
      const contentHash = contentHashByPath.get(resolvedPath) ?? "";
      return {
        kind: "in-repo",
        toId: buildModuleSymbolId(resolvedPath, contentHash),
      };
    }
    return {
      kind: "unresolved",
      toId: buildUnresolvedTargetId(normalizedSpecifier),
    };
  }

  if (normalizedSpecifier.startsWith("@/")) {
    return {
      kind: "unresolved",
      toId: buildUnresolvedTargetId(normalizedSpecifier),
    };
  }

  return {
    kind: "external",
    toId: buildExternalTargetId(normalizedSpecifier),
  };
}
