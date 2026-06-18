// Universal best-effort extractor used as the cross-language fallback when a primary parser yields nothing.
import type { ExtractedSymbol, OriginReason } from "../types";
import { regexScan, type DefinitionPattern } from "./regexScan";

const HEURISTIC_PATTERNS: DefinitionPattern[] = [
  { regex: /^\s*export\s+(?:default\s+)?function\s+([A-Za-z0-9_$]+)/, type: "function", nameGroup: 1 },
  { regex: /^\s*function\s+([A-Za-z0-9_$]+)/, type: "function", nameGroup: 1 },
  { regex: /^\s*export\s+(?:default\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(?.*=>/, type: "function", nameGroup: 1 },
  { regex: /^\s*const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(?.*=>/, type: "function", nameGroup: 1 },
  { regex: /^\s*export\s+(?:default\s+)?class\s+([A-Za-z0-9_$]+)/, type: "class", nameGroup: 1 },
  { regex: /^\s*class\s+([A-Za-z0-9_$]+)/, type: "class", nameGroup: 1 },
  { regex: /^\s*def\s+([A-Za-z0-9_]+)\s*\(/, type: "function", nameGroup: 1 },
  { regex: /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z0-9_]+)\s*\(/, type: "function", nameGroup: 1 },
  { regex: /^\s*fn\s+([A-Za-z0-9_]+)\s*[(<]/, type: "function", nameGroup: 1 },
  { regex: /^\s*(?:pub\s+)?struct\s+([A-Za-z0-9_]+)/, type: "class", nameGroup: 1 },
  { regex: /^\s*type\s+([A-Za-z0-9_]+)\s+struct/, type: "class", nameGroup: 1 },
];

export function heuristicExtract(
  source: string,
  originReason: OriginReason = "heuristic"
): ExtractedSymbol[] {
  return regexScan(source, HEURISTIC_PATTERNS, originReason);
}
