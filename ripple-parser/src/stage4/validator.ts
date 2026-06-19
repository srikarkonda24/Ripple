// Validates Stage 4 output invariants for topology preservation and pure rewrite semantics.
/// <reference path="../../../ripple-core/schema.ts" />

import type { Stage3Result } from "../stage3/types";
import type { Stage4Result } from "./types";

function edgeTopologyKey(edge: Edge): string {
  return `${edge.id}:${edge.fromId}:${edge.type}:${edge.context ?? ""}`;
}

/** Ensures Stage 4 preserved topology and only upgraded edge targets when allowed. */
export function validateStage4Output(stage3: Stage3Result, result: Stage4Result): void {
  if (result.edges.length !== stage3.edges.length) {
    throw new Error(
      `Stage 4 changed edge count: ${stage3.edges.length} -> ${result.edges.length}`
    );
  }

  const stage3ById = new Map(stage3.edges.map((edge) => [edge.id, edge]));

  for (const edge of result.edges) {
    const original = stage3ById.get(edge.id);
    if (!original) {
      throw new Error(`Stage 4 introduced unknown edge id: ${edge.id}`);
    }

    if (edgeTopologyKey(edge) !== edgeTopologyKey(original)) {
      throw new Error(`Stage 4 changed edge topology for id ${edge.id}`);
    }

    if (edge.id !== original.id) {
      throw new Error(`Stage 4 mutated edge.id for ${original.id}`);
    }

    if (edge.fromId !== original.fromId) {
      throw new Error(`Stage 4 mutated edge.fromId for ${edge.id}`);
    }

    if (edge.type !== original.type) {
      throw new Error(`Stage 4 mutated edge.type for ${edge.id}`);
    }

    if ((edge.context ?? "") !== (original.context ?? "")) {
      throw new Error(`Stage 4 mutated edge.context for ${edge.id}`);
    }
  }

  if (result.symbols.length !== stage3.symbols.length) {
    throw new Error("Stage 4 changed symbol count");
  }

  for (let index = 0; index < stage3.symbols.length; index += 1) {
    const original = stage3.symbols[index];
    const output = result.symbols[index];
    if (JSON.stringify(original) !== JSON.stringify(output)) {
      throw new Error(`Stage 4 mutated symbol object ${original.id}`);
    }
  }

  if (result.files.length !== stage3.files.length) {
    throw new Error("Stage 4 changed file count");
  }

  for (let index = 0; index < stage3.files.length; index += 1) {
    const original = stage3.files[index];
    const output = result.files[index];
    if (JSON.stringify(original) !== JSON.stringify(output)) {
      throw new Error(`Stage 4 mutated file object ${original.id}`);
    }
  }
}
