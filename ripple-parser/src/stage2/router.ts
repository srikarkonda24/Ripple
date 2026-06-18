// Router selects the primary extractor for a language only; it performs no fallback logic.
import { babelExtract } from "./extractors/babelExtract";
import { heuristicExtract } from "./extractors/heuristicExtractor";
import { jsonExtract } from "./extractors/jsonExtractor";
import { markdownExtract } from "./extractors/markdownExtractor";
import { pythonExtract } from "./extractors/pythonExtractor";
import { regexLanguageExtract } from "./extractors/regexLanguageExtractor";
import { typescriptExtract } from "./extractors/typescriptExtractor";
import { yamlExtract } from "./extractors/yamlExtractor";
import type { ExtractedSymbol } from "./types";

export type PrimaryExtractor = (source: string) => ExtractedSymbol[];

export function selectPrimaryExtractor(language: string): PrimaryExtractor {
  switch (language) {
    case "typescript":
      return typescriptExtract;
    case "javascript":
      return (source) => babelExtract(source, "ast");
    case "python":
      return pythonExtract;
    case "go":
    case "rust":
    case "java":
    case "cpp":
      return regexLanguageExtract;
    case "json":
      return jsonExtract;
    case "yaml":
      return yamlExtract;
    case "markdown":
      return markdownExtract;
    default:
      return heuristicExtract;
  }
}
