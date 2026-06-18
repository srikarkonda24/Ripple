// Regex extractor for Go, Rust, Java, and C++ where no AST parser is bundled in v1.
import type { ExtractedSymbol } from "../types";
import { regexScan, type DefinitionPattern } from "./regexScan";

const LANGUAGE_PATTERNS: DefinitionPattern[] = [
  { regex: /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z0-9_]+)\s*\(/, type: "function", nameGroup: 1 },
  { regex: /^\s*type\s+([A-Za-z0-9_]+)\s+struct/, type: "class", nameGroup: 1 },
  { regex: /^\s*(?:pub\s+)?fn\s+([A-Za-z0-9_]+)\s*[(<]/, type: "function", nameGroup: 1 },
  { regex: /^\s*(?:pub\s+)?struct\s+([A-Za-z0-9_]+)/, type: "class", nameGroup: 1 },
  { regex: /^\s*(?:pub\s+)?(?:abstract\s+|final\s+)?class\s+([A-Za-z0-9_]+)/, type: "class", nameGroup: 1 },
];

export function regexLanguageExtract(source: string): ExtractedSymbol[] {
  return regexScan(source, LANGUAGE_PATTERNS, "ast");
}
