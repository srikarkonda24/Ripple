// Shared factory that attaches a deterministic anchor hash to every extracted symbol.
import { computeAnchor } from "../anchorLine";
import type {
  ExtractedSymbol,
  OriginReason,
  Stage2SymbolType,
  SymbolOrigin,
} from "../types";

export interface MakeSymbolInput {
  name: string;
  type: Stage2SymbolType;
  anchorSource: string;
  bodyText?: string;
  parentClassName?: string;
  synthetic?: boolean;
  origin?: SymbolOrigin;
  originReason?: OriginReason;
  endLine?: number;
}

export function makeSymbol(input: MakeSymbolInput): ExtractedSymbol {
  const { anchorSliceHash, startLine } = computeAnchor(
    input.anchorSource,
    input.name,
    input.type
  );

  return {
    name: input.name,
    type: input.type,
    startLine,
    endLine: input.endLine,
    bodyText: input.bodyText,
    parentClassName: input.parentClassName,
    synthetic: input.synthetic ?? false,
    origin: input.origin ?? "source",
    originReason: input.originReason ?? "ast",
    anchorSliceHash,
  };
}

function isPascalCase(name: string): boolean {
  const first = name.charAt(0);
  return first >= "A" && first <= "Z";
}

export function looksLikeComponent(name: string, bodyText: string): boolean {
  if (!isPascalCase(name)) {
    return false;
  }
  return /<[A-Za-z]/.test(bodyText);
}
