// Deterministic ID builders for Stage 2 symbols and edges.
/// <reference path="../../../ripple-core/schema.ts" />

import { sha256Hex } from "../hash";
import type { Stage2SymbolType } from "./types";

export function buildModuleSymbolId(filePath: string, contentHash: string): string {
  return sha256Hex(`${filePath}:module:anchor:${contentHash}`);
}

export function buildSymbolId(
  filePath: string,
  name: string,
  type: Stage2SymbolType,
  anchorSliceHash: string
): string {
  return sha256Hex(`${filePath}:${name}:${type}:anchor:${anchorSliceHash}`);
}

export function buildEdgeId(
  fromId: string,
  toId: string,
  type: EdgeType,
  context: string
): string {
  return sha256Hex(`${fromId}:${toId}:${type}:${context}`);
}

export function buildExternalTargetId(normalizedSpecifier: string): string {
  return sha256Hex(`external:${normalizedSpecifier}`);
}

export function buildUnresolvedTargetId(normalizedSpecifier: string): string {
  return sha256Hex(`unresolved:${normalizedSpecifier}`);
}
