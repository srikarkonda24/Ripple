// Parses unified diff patches into deterministic new-file line ranges.
import type { LineRange } from "../core/PRChange";
import { PRChangeValidationError } from "./PRChangeErrors";

const HUNK_HEADER =
  /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?: .*)?$/;

/** Parses a unified diff patch into merged line ranges on the new (head) file side. */
export function lineRangesFromUnifiedPatch(patch: string): readonly LineRange[] {
  const lines = patch.replace(/\r\n/g, "\n").split("\n");
  const ranges: LineRange[] = [];

  for (const line of lines) {
    const match = line.match(HUNK_HEADER);
    if (match === null) {
      continue;
    }
    const newStart = Number.parseInt(match[3] ?? "", 10);
    const newCountRaw = match[4];
    const newCount =
      newCountRaw === undefined ? 1 : Number.parseInt(newCountRaw, 10);

    if (!Number.isFinite(newStart) || !Number.isFinite(newCount)) {
      throw new PRChangeValidationError("Malformed unified diff hunk header");
    }
    if (newStart <= 0 || newCount < 0) {
      throw new PRChangeValidationError("Invalid unified diff hunk line numbers");
    }
    if (newCount === 0) {
      continue;
    }

    ranges.push({
      startLine: newStart,
      endLine: newStart + newCount - 1,
    });
  }

  return mergeLineRanges(ranges);
}

/** Merges overlapping or adjacent line ranges in ascending start order. */
export function mergeLineRanges(ranges: readonly LineRange[]): readonly LineRange[] {
  if (ranges.length === 0) {
    return [];
  }

  const sorted = [...ranges].sort((left, right) => {
    if (left.startLine !== right.startLine) {
      return left.startLine - right.startLine;
    }
    return left.endLine - right.endLine;
  });

  const merged: LineRange[] = [];
  let current = { ...sorted[0]! };

  for (let index = 1; index < sorted.length; index += 1) {
    const next = sorted[index]!;
    if (next.startLine <= current.endLine + 1) {
      current = {
        startLine: current.startLine,
        endLine: Math.max(current.endLine, next.endLine),
      };
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

/** Validates patch structure enough to fail closed on obvious malformed input. */
export function assertValidUnifiedPatch(patch: string): void {
  if (patch.trim().length === 0) {
    throw new PRChangeValidationError("Unified diff patch must not be empty");
  }
  const lines = patch.replace(/\r\n/g, "\n").split("\n");
  const hasHunk = lines.some((line) => line.startsWith("@@"));
  if (!hasHunk) {
    throw new PRChangeValidationError("Unified diff patch missing hunk headers");
  }
  for (const line of lines) {
    if (line.startsWith("@@") && !HUNK_HEADER.test(line)) {
      throw new PRChangeValidationError("Malformed unified diff hunk header");
    }
  }
}
