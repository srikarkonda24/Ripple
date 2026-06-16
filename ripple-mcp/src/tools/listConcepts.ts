// Handler for the list_concepts MCP tool.

import type { ListConceptsOutput, RippleData } from "../types.js";

/** Returns every concept name and description from the loaded data. */
export function listConcepts(data: RippleData): ListConceptsOutput {
  const concepts = data.concepts.concepts.map((concept) => ({
    name: concept.name,
    description: concept.description,
  }));

  return { concepts };
}
