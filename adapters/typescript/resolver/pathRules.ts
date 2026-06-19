// Resolves relative import specifiers to in-repository file paths for the TS adapter.
import * as path from "path";

const RELATIVE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function firstExistingCandidate(
  candidates: string[],
  repoFilePaths: ReadonlySet<string>
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
  repoFilePaths: ReadonlySet<string>
): string | null {
  const prefix = `${joined}/`;
  const matches = Array.from(repoFilePaths)
    .filter((candidate) => candidate.startsWith(prefix))
    .sort((left, right) => left.localeCompare(right));
  return matches[0] ?? null;
}

/** Resolves a relative module specifier to a repository file path when one exists. */
export function resolveRelativeImportPath(
  fromFilePath: string,
  specifier: string,
  repoFilePaths: ReadonlySet<string>
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

/** Resolves a repository-root-relative module path to an existing file path. */
export function resolveRepoRootImportPath(
  repoRelativePath: string,
  repoFilePaths: ReadonlySet<string>
): string | null {
  const normalized = repoRelativePath.replace(/^\.\//, "").replace(/\\/g, "/");
  const exactCandidates = [
    normalized,
    ...RELATIVE_EXTENSIONS.map((extension) => `${normalized}${extension}`),
  ];
  const exact = firstExistingCandidate(exactCandidates, repoFilePaths);
  if (exact) {
    return exact;
  }

  const indexCandidates = [
    `${normalized}/index.ts`,
    `${normalized}/index.tsx`,
    `${normalized}/index.js`,
    `${normalized}/index.jsx`,
  ];
  return firstExistingCandidate(indexCandidates, repoFilePaths);
}
