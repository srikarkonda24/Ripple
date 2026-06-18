// Single source of truth for deterministic symbol anchor slices, independent of any parser's line numbers.
import { sha256Hex } from "../hash";
import type { Stage2SymbolType } from "./types";

const MAX_SLICE_LINES = 10;

function isCommentOrEmptyLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*")
  );
}

function isDecoratorLine(line: string): boolean {
  return line.trim().startsWith("@");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPatterns(name: string, type: Stage2SymbolType): RegExp[] {
  const escaped = escapeRegex(name);

  if (type === "class") {
    return [
      new RegExp(`^\\s*export\\s+(?:default\\s+)?class\\s+${escaped}\\b`),
      new RegExp(`^\\s*class\\s+${escaped}\\b`),
    ];
  }

  return [
    new RegExp(`^\\s*export\\s+(?:default\\s+)?function\\s+${escaped}\\s*[\\(<]`),
    new RegExp(`^\\s*function\\s+${escaped}\\s*[\\(<]`),
    new RegExp(`^\\s*export\\s+(?:default\\s+)?const\\s+${escaped}\\s*=`),
    new RegExp(`^\\s*const\\s+${escaped}\\s*=`),
    new RegExp(`\\b${escaped}\\b.*=>`),
    new RegExp(`\\bdef\\s+${escaped}\\s*\\(`),
  ];
}

function findAnchorLineIndex(
  lines: string[],
  name: string,
  type: Stage2SymbolType
): number {
  const patterns = buildPatterns(name, type);

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    if (isCommentOrEmptyLine(line) || isDecoratorLine(line)) {
      continue;
    }
    if (patterns.some((pattern) => pattern.test(line))) {
      return index;
    }
  }

  return 0;
}

function buildAnchorSlice(lines: string[], anchorIndex: number): string {
  const sliceLines: string[] = [];
  let index = anchorIndex;

  while (index < lines.length && sliceLines.length < MAX_SLICE_LINES) {
    const normalized = (lines[index] ?? "").replace(/\r/g, "").trim();
    sliceLines.push(normalized);
    if (normalized.includes("{")) {
      break;
    }
    index++;
  }

  return sliceLines.join("\n").trim();
}

export function computeAnchor(
  sourceText: string,
  name: string,
  type: Stage2SymbolType
): { anchorSliceHash: string; startLine: number } {
  const lines = sourceText.replace(/\r\n/g, "\n").split("\n");
  const anchorIndex = findAnchorLineIndex(lines, name, type);
  const slice = buildAnchorSlice(lines, anchorIndex);

  return {
    anchorSliceHash: sha256Hex(slice),
    startLine: anchorIndex + 1,
  };
}
