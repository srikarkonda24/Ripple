// Handler for the get_concept_context MCP tool.

import type {
  GetConceptContextInput,
  GetConceptContextOutput,
  RippleData,
} from "../types.js";

/** Builds a lookup map from graph node id to its source file path. */
function buildNodeFileMap(data: RippleData): Map<string, string> {
  const fileByNodeId = new Map<string, string>();

  for (const node of data.graph.nodes) {
    fileByNodeId.set(node.id, node.file);
  }

  return fileByNodeId;
}

/** Resolves node ids to unique, sorted file paths (skips unknown ids). */
function resolveFiles(
  nodeIds: string[],
  fileByNodeId: Map<string, string>,
): string[] {
  const files = new Set<string>();

  for (const nodeId of nodeIds) {
    const file = fileByNodeId.get(nodeId);
    if (file !== undefined) {
      files.add(file);
    }
  }

  return [...files].sort();
}

/** Returns true when the concept name or description contains the search term. */
function conceptMatchesSearch(
  name: string,
  description: string,
  searchTerm: string,
): boolean {
  const needle = searchTerm.toLowerCase();
  return (
    name.toLowerCase().includes(needle) ||
    description.toLowerCase().includes(needle)
  );
}

/** Validates that the search term is a non-empty string. */
export function validateSearchTerm(value: unknown): GetConceptContextInput {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("searchTerm must be a non-empty string");
  }

  return { searchTerm: value.trim() };
}

/** Searches concepts by name or description and returns matching context. */
export function getConceptContext(
  data: RippleData,
  input: GetConceptContextInput,
): GetConceptContextOutput {
  const fileByNodeId = buildNodeFileMap(data);
  const matches = data.concepts.concepts
    .filter((concept) =>
      conceptMatchesSearch(
        concept.name,
        concept.description,
        input.searchTerm,
      ),
    )
    .map((concept) => ({
      name: concept.name,
      description: concept.description,
      files: resolveFiles(concept.nodeIds, fileByNodeId),
    }));

  if (matches.length === 0) {
    return {
      message: `No matches found for "${input.searchTerm}".`,
    };
  }

  return { matches };
}
