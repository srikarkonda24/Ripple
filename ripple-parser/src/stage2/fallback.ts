// Fallback chain: runs the primary parser, then language-aware retries, then signals module fallback.
import { babelExtract } from "./extractors/babelExtract";
import { heuristicExtract } from "./extractors/heuristicExtractor";
import { selectPrimaryExtractor } from "./router";
import type { ExtractedSymbol, FileExtractionResult, OriginReason } from "./types";

function runSafely(extractor: () => ExtractedSymbol[]): {
  symbols: ExtractedSymbol[];
  threw: boolean;
} {
  try {
    return { symbols: extractor(), threw: false };
  } catch (error) {
    console.warn(
      "Stage 2 extractor failure, continuing with fallback:",
      error instanceof Error ? error.message : error
    );
    return { symbols: [], threw: true };
  }
}

export function extractSymbols(
  language: string,
  source: string
): FileExtractionResult {
  const sourceIsEmpty = source.trim().length === 0;

  const primary = selectPrimaryExtractor(language);
  const primaryResult = runSafely(() => primary(source));
  if (primaryResult.symbols.length > 0) {
    return {
      symbols: primaryResult.symbols,
      fallbackLevelUsed: 1,
      originReason: primaryResult.symbols[0]?.originReason ?? "ast",
    };
  }

  if (language === "typescript") {
    const babelResult = runSafely(() => babelExtract(source, "ast"));
    if (babelResult.symbols.length > 0) {
      return {
        symbols: babelResult.symbols,
        fallbackLevelUsed: 2,
        originReason: "ast",
      };
    }
  }

  const heuristicResult = runSafely(() => heuristicExtract(source));
  if (heuristicResult.symbols.length > 0) {
    return {
      symbols: heuristicResult.symbols,
      fallbackLevelUsed: 2,
      originReason: "heuristic",
    };
  }

  const moduleReason: OriginReason = sourceIsEmpty
    ? "empty"
    : primaryResult.threw
      ? "parse_failed"
      : "module_fallback";

  return {
    symbols: [],
    fallbackLevelUsed: 3,
    originReason: moduleReason,
  };
}
