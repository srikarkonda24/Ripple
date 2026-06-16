// MCP server entry point: loads Ripple data and exposes concept tools over stdio.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import { loadData } from "./data/loadData.js";
import { getConceptContext, validateSearchTerm, } from "./tools/getConceptContext.js";
import { listConcepts } from "./tools/listConcepts.js";
const rippleData = loadData();
const server = new McpServer({
    name: "ripple-mcp",
    version: "1.0.0",
});
/** Converts an unknown error into a safe message for tool responses. */
function errorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
/** Returns a structured MCP error response instead of throwing. */
function toolError(message) {
    const payload = { error: message };
    return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    };
}
/** Serializes a successful tool result as JSON text content. */
function toolSuccess(payload) {
    return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    };
}
server.registerTool("list_concepts", {
    description: "Returns all product concepts with their name and description.",
    inputSchema: {},
}, async () => {
    try {
        return toolSuccess(listConcepts(rippleData));
    }
    catch (error) {
        console.error("[ripple-mcp] list_concepts failed:", error);
        return toolError(errorMessage(error));
    }
});
server.registerTool("get_concept_context", {
    description: "Searches concepts by name or description and returns matching concepts with related source files.",
    inputSchema: {
        searchTerm: z
            .string()
            .min(1, "searchTerm must be a non-empty string")
            .describe("Case-insensitive substring to match against concept names or descriptions"),
    },
}, async ({ searchTerm }) => {
    try {
        const input = validateSearchTerm(searchTerm);
        return toolSuccess(getConceptContext(rippleData, input));
    }
    catch (error) {
        console.error("[ripple-mcp] get_concept_context failed:", error);
        return toolError(errorMessage(error));
    }
});
/** Starts the MCP server on stdio transport. */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("[ripple-mcp] Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map