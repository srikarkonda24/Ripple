// Shared deterministic line scanner that turns definition patterns into extracted symbols.
import type {
  ExtractedSymbol,
  OriginReason,
  Stage2SymbolType,
} from "../types";
import { makeSymbol } from "./makeSymbol";

export interface DefinitionPattern {
  regex: RegExp;
  type: Stage2SymbolType;
  nameGroup: number;
}

export function regexScan(
  source: string,
  patterns: DefinitionPattern[],
  originReason: OriginReason
): ExtractedSymbol[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const collected: ExtractedSymbol[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (!match) {
        continue;
      }
      const name = match[pattern.nameGroup];
      if (!name) {
        continue;
      }
      const key = `${name}:${pattern.type}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      collected.push(
        makeSymbol({
          name,
          type: pattern.type,
          anchorSource: source,
          bodyText: line.trim(),
          originReason,
        })
      );
    }
  }

  return collected;
}
