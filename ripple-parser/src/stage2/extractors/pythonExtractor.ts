// Lightweight regex extractor for Python def and class definitions.
import type { ExtractedSymbol } from "../types";
import { regexScan, type DefinitionPattern } from "./regexScan";

const PYTHON_PATTERNS: DefinitionPattern[] = [
  { regex: /^\s*def\s+([A-Za-z0-9_]+)\s*\(/, type: "function", nameGroup: 1 },
  { regex: /^\s*class\s+([A-Za-z0-9_]+)\s*[:\(]/, type: "class", nameGroup: 1 },
];

export function pythonExtract(source: string): ExtractedSymbol[] {
  return regexScan(source, PYTHON_PATTERNS, "ast");
}
