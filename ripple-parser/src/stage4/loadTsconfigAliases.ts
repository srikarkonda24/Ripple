// Loads tsconfig/jsconfig path alias settings for Stage 4 resolver configuration.
import * as fs from "fs";
import * as path from "path";

interface TsconfigAliasSettings {
  baseUrl?: string;
  paths?: Record<string, string[]>;
}

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractAliasSettings(config: Record<string, unknown>): TsconfigAliasSettings {
  const compilerOptions =
    config.compilerOptions && typeof config.compilerOptions === "object"
      ? (config.compilerOptions as Record<string, unknown>)
      : {};
  const paths =
    compilerOptions.paths && typeof compilerOptions.paths === "object"
      ? (compilerOptions.paths as Record<string, string[]>)
      : undefined;
  const baseUrl =
    typeof compilerOptions.baseUrl === "string" ? compilerOptions.baseUrl : undefined;
  return { baseUrl, paths };
}

/** Loads alias settings from tsconfig.json or jsconfig.json at the repository root. */
export function loadTsconfigAliases(repoPath: string): TsconfigAliasSettings {
  const candidates = ["tsconfig.json", "jsconfig.json"];
  for (const candidate of candidates) {
    const absolutePath = path.join(repoPath, candidate);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }
    const config = readJsonFile(absolutePath);
    if (config) {
      return extractAliasSettings(config);
    }
  }
  return {};
}
