// Line-range overlap helpers for deterministic symbol resolution.
import type { LineRange } from "../core/PRChange";

/** Returns true when two inclusive line ranges overlap on the same file. */
export function lineRangesOverlap(
  changed: LineRange,
  spanStart: number,
  spanEnd: number,
): boolean {
  return changed.startLine <= spanEnd && spanStart <= changed.endLine;
}
