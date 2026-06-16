// Shared types for Ripple concept data, graph nodes, and MCP tool shapes.

/** A high-level product concept grouping related code nodes. */
export interface Concept {
  id: string;
  name: string;
  description: string;
  nodeIds: string[];
}

/** A directed relationship between two product concepts. */
export interface ConceptEdge {
  from: string;
  to: string;
}

/** Raw concept map loaded from concepts.json. */
export interface ConceptData {
  concepts: Concept[];
  conceptEdges: ConceptEdge[];
}

/** One function or component node parsed from the codebase. */
export interface GraphNode {
  id: string;
  file: string;
}

/** A directed call relationship between two graph nodes. */
export interface GraphEdge {
  from: string;
  to: string;
}

/** Raw graph data loaded from output.json. */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Both data files loaded together at server startup. */
export interface RippleData {
  concepts: ConceptData;
  graph: GraphData;
}

/** One concept returned by list_concepts. */
export interface ConceptSummary {
  name: string;
  description: string;
}

/** Output shape for the list_concepts tool. */
export interface ListConceptsOutput {
  concepts: ConceptSummary[];
}

/** Input shape for the get_concept_context tool. */
export interface GetConceptContextInput {
  searchTerm: string;
}

/** One matching concept with its related source files. */
export interface ConceptContextMatch {
  name: string;
  description: string;
  files: string[];
}

/** Output shape when get_concept_context finds matches. */
export interface GetConceptContextMatchesOutput {
  matches: ConceptContextMatch[];
}

/** Output shape when get_concept_context finds no matches. */
export interface GetConceptContextNoMatchesOutput {
  message: string;
}

/** Union of possible get_concept_context results. */
export type GetConceptContextOutput =
  | GetConceptContextMatchesOutput
  | GetConceptContextNoMatchesOutput;

/** Structured error returned by tool handlers instead of throwing. */
export interface ToolErrorOutput {
  error: string;
}
