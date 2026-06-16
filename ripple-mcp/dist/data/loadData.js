// Loads and validates output.json and concepts.json at server startup.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../data");
const OUTPUT_JSON_PATH = join(DATA_DIR, "output.json");
const CONCEPTS_JSON_PATH = join(DATA_DIR, "concepts.json");
/** Logs a clear startup error and exits with a non-zero code. */
function failStartup(message) {
    console.error(`[ripple-mcp] Startup failed: ${message}`);
    process.exit(1);
}
/** Returns true when value is a plain object (not null or an array). */
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Returns true when value is a non-empty string. */
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
/** Returns true when value is an array of strings. */
function isStringArray(value) {
    return (Array.isArray(value) &&
        value.every((item) => typeof item === "string"));
}
/** Validates one graph node from output.json. */
function parseGraphNode(value, index) {
    if (!isRecord(value)) {
        throw new Error(`nodes[${index}] must be an object`);
    }
    if (!isNonEmptyString(value.id)) {
        throw new Error(`nodes[${index}].id must be a non-empty string`);
    }
    if (!isNonEmptyString(value.file)) {
        throw new Error(`nodes[${index}].file must be a non-empty string`);
    }
    return { id: value.id, file: value.file };
}
/** Validates one graph edge from output.json. */
function parseGraphEdge(value, index) {
    if (!isRecord(value)) {
        throw new Error(`edges[${index}] must be an object`);
    }
    if (!isNonEmptyString(value.from)) {
        throw new Error(`edges[${index}].from must be a non-empty string`);
    }
    if (!isNonEmptyString(value.to)) {
        throw new Error(`edges[${index}].to must be a non-empty string`);
    }
    return { from: value.from, to: value.to };
}
/** Validates the full output.json shape. */
function parseGraphData(value) {
    if (!isRecord(value)) {
        throw new Error("output.json root must be an object");
    }
    if (!Array.isArray(value.nodes)) {
        throw new Error("output.json must contain a nodes array");
    }
    if (!Array.isArray(value.edges)) {
        throw new Error("output.json must contain an edges array");
    }
    return {
        nodes: value.nodes.map(parseGraphNode),
        edges: value.edges.map(parseGraphEdge),
    };
}
/** Validates one concept from concepts.json. */
function parseConcept(value, index) {
    if (!isRecord(value)) {
        throw new Error(`concepts[${index}] must be an object`);
    }
    if (!isNonEmptyString(value.id)) {
        throw new Error(`concepts[${index}].id must be a non-empty string`);
    }
    if (!isNonEmptyString(value.name)) {
        throw new Error(`concepts[${index}].name must be a non-empty string`);
    }
    if (!isNonEmptyString(value.description)) {
        throw new Error(`concepts[${index}].description must be a non-empty string`);
    }
    if (!isStringArray(value.nodeIds)) {
        throw new Error(`concepts[${index}].nodeIds must be an array of strings`);
    }
    return {
        id: value.id,
        name: value.name,
        description: value.description,
        nodeIds: value.nodeIds,
    };
}
/** Validates one concept edge from concepts.json. */
function parseConceptEdge(value, index) {
    if (!isRecord(value)) {
        throw new Error(`conceptEdges[${index}] must be an object`);
    }
    if (!isNonEmptyString(value.from)) {
        throw new Error(`conceptEdges[${index}].from must be a non-empty string`);
    }
    if (!isNonEmptyString(value.to)) {
        throw new Error(`conceptEdges[${index}].to must be a non-empty string`);
    }
    return { from: value.from, to: value.to };
}
/** Validates the full concepts.json shape. */
function parseConceptData(value) {
    if (!isRecord(value)) {
        throw new Error("concepts.json root must be an object");
    }
    if (!Array.isArray(value.concepts)) {
        throw new Error("concepts.json must contain a concepts array");
    }
    if (!Array.isArray(value.conceptEdges)) {
        throw new Error("concepts.json must contain a conceptEdges array");
    }
    return {
        concepts: value.concepts.map(parseConcept),
        conceptEdges: value.conceptEdges.map(parseConceptEdge),
    };
}
/** Reads one JSON file and parses it with the given validator. */
function readJsonFile(filePath, label, parse) {
    if (!existsSync(filePath)) {
        failStartup(`${label} not found at ${filePath}`);
    }
    let rawText;
    try {
        rawText = readFileSync(filePath, "utf8");
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        failStartup(`Could not read ${label}: ${detail}`);
    }
    let parsed;
    try {
        parsed = JSON.parse(rawText);
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        failStartup(`${label} contains invalid JSON: ${detail}`);
    }
    try {
        return parse(parsed);
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        failStartup(`${label} has an invalid shape: ${detail}`);
    }
}
/** Loads and validates both data files; exits the process if anything is wrong. */
export function loadData() {
    const graph = readJsonFile(OUTPUT_JSON_PATH, "output.json", parseGraphData);
    const concepts = readJsonFile(CONCEPTS_JSON_PATH, "concepts.json", parseConceptData);
    return { graph, concepts };
}
//# sourceMappingURL=loadData.js.map