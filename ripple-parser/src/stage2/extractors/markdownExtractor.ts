// Extracts fenced code blocks from Markdown and routes each block to a language extractor as synthetic symbols.
import { sha256Hex } from "../../hash";
import type { ExtractedSymbol } from "../types";
import { babelExtract } from "./babelExtract";
import { heuristicExtract } from "./heuristicExtractor";
import { pythonExtract } from "./pythonExtractor";
import { typescriptExtract } from "./typescriptExtractor";

interface FencedBlock {
  language: string;
  code: string;
  index: number;
}

function parseFencedBlocks(source: string): FencedBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: FencedBlock[] = [];
  let insideFence = false;
  let fenceLanguage = "";
  let buffer: string[] = [];
  let blockIndex = 0;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*```([A-Za-z0-9_+-]*)\s*$/);
    if (fenceMatch) {
      if (insideFence) {
        blocks.push({
          language: fenceLanguage.toLowerCase(),
          code: buffer.join("\n"),
          index: blockIndex,
        });
        blockIndex++;
        insideFence = false;
        fenceLanguage = "";
        buffer = [];
      } else {
        insideFence = true;
        fenceLanguage = fenceMatch[1] ?? "";
        buffer = [];
      }
      continue;
    }

    if (insideFence) {
      buffer.push(line);
    }
  }

  return blocks;
}

function extractBlock(block: FencedBlock): ExtractedSymbol[] {
  try {
    switch (block.language) {
      case "ts":
      case "tsx":
      case "typescript":
        return typescriptExtract(block.code);
      case "js":
      case "jsx":
      case "javascript":
        return babelExtract(block.code, "ast");
      case "py":
      case "python":
        return pythonExtract(block.code);
      default:
        return heuristicExtract(block.code);
    }
  } catch {
    return heuristicExtract(block.code);
  }
}

export function markdownExtract(source: string): ExtractedSymbol[] {
  const blocks = parseFencedBlocks(source);
  const collected: ExtractedSymbol[] = [];

  for (const block of blocks) {
    for (const symbol of extractBlock(block)) {
      collected.push({
        ...symbol,
        synthetic: true,
        origin: "markdown",
        anchorSliceHash: sha256Hex(`md:${block.index}:${symbol.anchorSliceHash}`),
      });
    }
  }

  return collected;
}
