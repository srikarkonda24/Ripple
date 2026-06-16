// Handler for the get_concept_context MCP tool.
/** Builds a lookup map from graph node id to its source file path. */
function buildNodeFileMap(data) {
    const fileByNodeId = new Map();
    for (const node of data.graph.nodes) {
        fileByNodeId.set(node.id, node.file);
    }
    return fileByNodeId;
}
/** Resolves node ids to unique, sorted file paths (skips unknown ids). */
function resolveFiles(nodeIds, fileByNodeId) {
    const files = new Set();
    for (const nodeId of nodeIds) {
        const file = fileByNodeId.get(nodeId);
        if (file !== undefined) {
            files.add(file);
        }
    }
    return [...files].sort();
}
/** Returns true when the concept name or description contains the search term. */
function conceptMatchesSearch(name, description, searchTerm) {
    const needle = searchTerm.toLowerCase();
    return (name.toLowerCase().includes(needle) ||
        description.toLowerCase().includes(needle));
}
/** Validates that the search term is a non-empty string. */
export function validateSearchTerm(value) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error("searchTerm must be a non-empty string");
    }
    return { searchTerm: value.trim() };
}
/** Searches concepts by name or description and returns matching context. */
export function getConceptContext(data, input) {
    const fileByNodeId = buildNodeFileMap(data);
    const matches = data.concepts.concepts
        .filter((concept) => conceptMatchesSearch(concept.name, concept.description, input.searchTerm))
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
//# sourceMappingURL=getConceptContext.js.map