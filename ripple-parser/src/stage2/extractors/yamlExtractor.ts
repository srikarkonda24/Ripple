// YAML files carry no executable symbols in Stage 2, so they always fall back to a module node.
import type { ExtractedSymbol } from "../types";

export function yamlExtract(): ExtractedSymbol[] {
  return [];
}
