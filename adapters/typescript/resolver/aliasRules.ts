// Resolves tsconfig/jsconfig path aliases into repository file paths for Stage 4.
/// <reference path="../../../ripple-core/interfaces/resolverTypes.ts" />
import * as path from "path";
import { resolveRepoRootImportPath } from "./pathRules";

interface TsconfigAliasConfig {
  baseUrl?: string;
  paths?: Record<string, string[]>;
}

export interface AliasResolutionDiagnostics {
  selected: string | null;
  rule: string | null;
  candidates: string[];
  rejected: ResolutionRejectedCandidate[];
  scoreBreakdown: ResolutionScoreBreakdown;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patternToRegExp(pattern: string): RegExp {
  const normalized = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
  return new RegExp(`^${escapeRegex(normalized)}(.*)$`);
}

function applyPatternMatch(specifier: string, aliasPattern: string, targetPattern: string): string | null {
  const match = specifier.match(patternToRegExp(aliasPattern));
  if (!match) {
    return null;
  }
  const captured = match[1] ?? "";
  if (aliasPattern.endsWith("*")) {
    return targetPattern.replace("*", captured);
  }
  return targetPattern;
}

/** Resolves an aliased import and returns candidate ranking diagnostics for observability. */
export function resolveAliasImportPathWithDiagnostics(
  fromFilePath: string,
  specifier: string,
  repoFilePaths: ReadonlySet<string>,
  config: TsconfigAliasConfig
): AliasResolutionDiagnostics {
  const candidates: string[] = [];
  const rejected: ResolutionRejectedCandidate[] = [];
  const paths = config.paths;
  if (!paths) {
    return {
      selected: null,
      rule: null,
      candidates,
      rejected,
      scoreBreakdown: {},
    };
  }

  const baseUrl = config.baseUrl ?? ".";
  const sortedPatterns = Object.keys(paths).sort((left, right) => right.length - left.length);

  for (const aliasPattern of sortedPatterns) {
    const targets = paths[aliasPattern] ?? [];
    for (const targetPattern of targets) {
      const mapped = applyPatternMatch(specifier, aliasPattern, targetPattern);
      if (!mapped) {
        continue;
      }

      const absoluteMapped = path.posix
        .normalize(path.posix.join(baseUrl, mapped))
        .replace(/\\/g, "/");
      candidates.push(absoluteMapped);

      const direct = resolveRepoRootImportPath(absoluteMapped, repoFilePaths);
      if (direct) {
        return {
          selected: direct,
          rule: "tsconfig.paths match",
          candidates,
          rejected,
          scoreBreakdown: {
            aliasMatch: 1,
            relativeMatch: aliasPattern.endsWith("*") ? 0.2 : 0.5,
          },
        };
      }

      rejected.push({
        candidate: absoluteMapped,
        reason: "mapped_path_not_in_repo",
      });
    }
  }

  return {
    selected: null,
    rule: null,
    candidates,
    rejected,
    scoreBreakdown: {},
  };
}

/** Resolves an aliased import specifier using tsconfig paths and baseUrl when configured. */
export function resolveAliasImportPath(
  fromFilePath: string,
  specifier: string,
  repoFilePaths: ReadonlySet<string>,
  config: TsconfigAliasConfig
): string | null {
  return resolveAliasImportPathWithDiagnostics(
    fromFilePath,
    specifier,
    repoFilePaths,
    config
  ).selected;
}

/** Reads tsconfig alias settings from resolver context config populated by Stage 4 orchestration. */
export function readAliasConfig(context: ResolverContext): TsconfigAliasConfig {
  const rawConfig = context.config.tsconfigAliases;
  if (!rawConfig || typeof rawConfig !== "object") {
    return {};
  }
  const config = rawConfig as Record<string, unknown>;
  const paths =
    config.paths && typeof config.paths === "object"
      ? (config.paths as Record<string, string[]>)
      : undefined;
  const baseUrl = typeof config.baseUrl === "string" ? config.baseUrl : undefined;
  return { baseUrl, paths };
}
