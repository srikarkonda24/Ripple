// Handler for the list_concepts MCP tool.
/** Returns every concept name and description from the loaded data. */
export function listConcepts(data) {
    const concepts = data.concepts.concepts.map((concept) => ({
        name: concept.name,
        description: concept.description,
    }));
    return { concepts };
}
//# sourceMappingURL=listConcepts.js.map