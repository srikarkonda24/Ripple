// Hardcoded snapshot of one ripple-memory pipeline run for the /memory preview page.
export type Fact = {
  type: "Decision" | "ArchitectureFact" | "OpenQuestion" | "RejectedApproach" | "Assumption";
  chunk_index: number;
  conclusion?: string;
  trigger?: string;
  alternatives_considered?: string;
  rejected_because?: string;
  assumptions?: string;
  confidence?: "high" | "medium" | "low";
  revisit?: boolean;
  component?: string;
  fact?: string;
  rationale?: string;
  linked_code?: string;
  question?: string;
  context?: string;
  blocking?: string;
};

export type Flag = {
  chunk_indices: number[];
  issue: string;
  recommendation: string;
};

export type Chunk = {
  chunk_index: number;
  topic: string;
  signal: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  start_index: number;
  end_index: number;
  message_count: number;
};

export const stats = {
  totalMessages: 252,
  totalChunks: 18,
  noiseChunks: 0,
  failedChunks: 0,
  factsByType: {
    Decision: 34,
    RejectedApproach: 0,
    ArchitectureFact: 113,
    Assumption: 0,
    OpenQuestion: 1,
  },
};

export const chunks: Chunk[] = [
  {
    chunk_index: 0,
    topic: "Chrome extension message accumulation (Option B)",
    signal: "decision",
    confidence: "high",
    reasoning: "The user explicitly chose Option B (real-time message accumulation) and the conversation moved into implementation and testing of that chosen approach.",
    start_index: 0,
    end_index: 13,
    message_count: 14,
  },
  {
    chunk_index: 1,
    topic: "Viewing all captured messages and full-page viewer",
    signal: "decision",
    confidence: "high",
    reasoning: "The team decided to implement a full-page viewer (messages.html) opened via chrome.tabs.create to display all captured messages with timestamps, colored role badges, and formatted content, rather than expanding the popup.",
    start_index: 14,
    end_index: 20,
    message_count: 7,
  },
  {
    chunk_index: 2,
    topic: "Testing accumulation and verifying capture works",
    signal: "decision",
    confidence: "high",
    reasoning: "The user confirms the capture and storage functionality is working correctly, marking a milestone that the full capture layer is operational.",
    start_index: 21,
    end_index: 28,
    message_count: 8,
  },
  {
    chunk_index: 3,
    topic: "Exporting conversation and paste import feature",
    signal: "architecture",
    confidence: "high",
    reasoning: "The chunk defines the design and implementation approach for a paste-import feature within the extension, including parsing logic, deduplication strategy, and UI placement decisions.",
    start_index: 29,
    end_index: 50,
    message_count: 22,
  },
  {
    chunk_index: 4,
    topic: "Paste import parser format and fixing gaps",
    signal: "architecture",
    confidence: "high",
    reasoning: "The chunk defines the technical architecture of the paste import feature for the Chrome extension, specifying how the parser should handle different conversation formats from claude.ai and how it integrates with the existing deduplication and storage logic.",
    start_index: 51,
    end_index: 65,
    message_count: 15,
  },
  {
    chunk_index: 5,
    topic: "Fixing paste parser and cross-session capture",
    signal: "architecture",
    confidence: "high",
    reasoning: "The chunk describes how the extension handles cross-session capture via MutationObserver on claude.ai/* URLs, appending to shared storage with session markers, establishing the system's structural behavior for multi-session continuity.",
    start_index: 66,
    end_index: 77,
    message_count: 12,
  },
  {
    chunk_index: 6,
    topic: "Continuing chat and current build status summary",
    signal: "decision",
    confidence: "high",
    reasoning: "The user confirms current capture is working and explicitly decides the next priority is building the memory/context platform, identifying it as the core product moat.",
    start_index: 78,
    end_index: 82,
    message_count: 5,
  },
  {
    chunk_index: 7,
    topic: "Memory platform architecture discussion (RAG, vector DB, knowledge graphs)",
    signal: "architecture",
    confidence: "high",
    reasoning: "The conversation defines the full technical architecture of the memory platform, including the technology stack (PostgreSQL/pgvector, Neo4j, embedding models, reranking, structured extraction) and how all components connect in a pipeline.",
    start_index: 83,
    end_index: 100,
    message_count: 18,
  },
  {
    chunk_index: 8,
    topic: "Vision refinement - coding-specific memory vs Exo, ARCHITECTURE.md creation",
    signal: "decision",
    confidence: "high",
    reasoning: "The conversation results in concrete decisions to create ARCHITECTURE.md, lock in the full system design including storage mappings, sync strategy, chunking approach, and embedding strategy, and establishes the document as the authoritative build spec going forward.",
    start_index: 101,
    end_index: 115,
    message_count: 15,
  },
  {
    chunk_index: 9,
    topic: "Deferring design decisions and landing page redesign brainstorm",
    signal: "open_question",
    confidence: "high",
    reasoning: "The chunk ends with an unresolved request for the Cursor prompt to rebuild the landing page, and the broader landing page redesign direction is being brainstormed but not yet finalized or decided.",
    start_index: 116,
    end_index: 125,
    message_count: 10,
  },
  {
    chunk_index: 10,
    topic: "Landing page Cursor prompt and platform vision (compounding memory)",
    signal: "architecture",
    confidence: "high",
    reasoning: "The conversation establishes a detailed layered architecture roadmap for Ripple, describing the foundation components and eight progressive capability layers built on top, with explicit dependencies and build ordering.",
    start_index: 126,
    end_index: 138,
    message_count: 13,
  },
  {
    chunk_index: 11,
    topic: "Technical deep dive - decisions/assumptions/patterns detection and cost",
    signal: "architecture",
    confidence: "high",
    reasoning: "The conversation details the technical architecture for detecting decisions, assumptions, and patterns using Claude API, Neo4j graph traversal, pgvector clustering, and a multi-stage cost optimization pipeline with rule-based pre-filtering and model tiering.",
    start_index: 139,
    end_index: 148,
    message_count: 10,
  },
  {
    chunk_index: 12,
    topic: "Brain architecture explained and full build outline",
    signal: "architecture",
    confidence: "high",
    reasoning: "The chunk provides a detailed mechanical breakdown of the brain's architecture including all seven layers, data schemas, database structures, pipeline stages, and a full build sequence — this is a comprehensive architectural specification.",
    start_index: 149,
    end_index: 165,
    message_count: 17,
  },
  {
    chunk_index: 13,
    topic: "GitHub setup, gitignore, and initial commit",
    signal: "decision",
    confidence: "high",
    reasoning: "The conversation results in concrete decisions: creating a .gitignore at the project root, committing the codebase to GitHub, and cleaning up node_modules from git tracking.",
    start_index: 166,
    end_index: 184,
    message_count: 19,
  },
  {
    chunk_index: 14,
    topic: "Building the chunking pipeline - design decisions and signal filtering",
    signal: "architecture",
    confidence: "high",
    reasoning: "The conversation is actively designing the chunking pipeline's structure, including decisions about whether pre-filtering should happen before or after Claude's boundary detection, signal word lists, overlap logic, and the overall layer sequence.",
    start_index: 185,
    end_index: 203,
    message_count: 19,
  },
  {
    chunk_index: 15,
    topic: "Multi-pass chunking approach and pattern analysis brainstorm",
    signal: "architecture",
    confidence: "high",
    reasoning: "The conversation establishes a concrete three-pass multi-stage LLM pipeline architecture (segmentation, per-chunk classification, synthesis) with specific inputs, prompts, and outputs defined for each pass.",
    start_index: 204,
    end_index: 215,
    message_count: 12,
  },
  {
    chunk_index: 16,
    topic: "Three-pass chunking pipeline design, parallel classification, and Cursor build prompt",
    signal: "architecture",
    confidence: "high",
    reasoning: "This chunk finalizes and documents the three-pass chunking pipeline architecture (segmentation, parallel classification, synthesis) with explicit data types, error handling contracts, file structure, and a complete Cursor build prompt specifying how the system should be structured.",
    start_index: 216,
    end_index: 236,
    message_count: 21,
  },
  {
    chunk_index: 17,
    topic: "Building and configuring ripple-memory, API key setup, and next steps",
    signal: "decision",
    confidence: "high",
    reasoning: "Concrete decisions are confirmed and acted upon: .env file location (inside ripple-memory, not project root), API key setup, model selection (claude-sonnet-4-6 hardcoded in code), and the next step of adding sample conversation data before running npm test.",
    start_index: 237,
    end_index: 251,
    message_count: 15,
  }
];

export const flags: Flag[] = [
  {
    chunk_indices: [8, 9],
    issue: "Chunk 8 establishes ARCHITECTURE.md as the authoritative build spec with locked-in system design, but Chunk 9 shifts into landing page redesign brainstorming with an open/unresolved signal. This is not inherently contradictory, but Chunk 9 is classified as 'open_question' when it likely serves as a context-bridging chunk between the architecture lock-in and the landing page work that follows in Chunk 10. The abrupt pivot without acknowledgment of the architecture decision may cause the open_question signal to obscure that the architecture thread was resolved.",
    recommendation: "Review whether Chunk 9 should be reclassified as 'noise' or 'transition' rather than 'open_question', and flag that the landing page work in Chunk 9 is a parallel track, not a supersession of the architecture decisions in Chunk 8.",
  },
  {
    chunk_indices: [9, 10],
    issue: "Chunk 9 ends with an unresolved request for a Cursor prompt to rebuild the landing page, classified as open_question. Chunk 10 then delivers a detailed layered architecture roadmap for the platform (compounding memory), but its topic mixes the landing page Cursor prompt with a broader platform vision architecture. It is unclear whether Chunk 10 resolves the landing page open question from Chunk 9 or pivots to platform architecture — the combined topic in Chunk 10 suggests both, which may mask the fact that the landing page decision thread from Chunk 9 is being closed here.",
    recommendation: "Verify that Chunk 10 actually resolves the landing page Cursor prompt left open in Chunk 9 and, if so, reclassify Chunk 9 as 'transition' and annotate Chunk 10 as closing that open question in addition to establishing platform architecture.",
  },
  {
    chunk_indices: [7, 11, 12],
    issue: "Chunk 7 defines the full technical architecture of the memory platform (PostgreSQL/pgvector, Neo4j, embedding models, reranking, structured extraction). Chunk 11 then details a more specific technical architecture for decision/assumption/pattern detection using Claude API, Neo4j, and pgvector with a multi-stage cost optimization pipeline. Chunk 12 provides yet another comprehensive architectural specification with seven layers, data schemas, and a full build sequence. It is not clear whether Chunks 11 and 12 are refinements that supersede Chunk 7's architecture or additive layers on top of it. If any component choices changed between these chunks (e.g., model selection, graph structure, pipeline ordering), that would be an unacknowledged contradiction.",
    recommendation: "Cross-check the specific technology choices and pipeline structures across Chunks 7, 11, and 12 to confirm they are consistently additive rather than contradictory. If any decisions in Chunk 7 were revised in Chunks 11 or 12, flag those as supersessions requiring explicit acknowledgment.",
  },
  {
    chunk_indices: [14, 15, 16],
    issue: "Chunks 14, 15, and 16 all describe the chunking pipeline architecture, with Chunk 14 as design/open decisions, Chunk 15 establishing a three-pass architecture, and Chunk 16 finalizing and documenting it. This is a clean progressive refinement, but Chunk 14 includes unresolved decisions (pre-filtering before or after Claude's boundary detection, overlap logic, layer sequence) that should have been resolved in Chunk 15 or 16. If those specific open questions from Chunk 14 were not explicitly closed in Chunk 15, they may have been silently dropped rather than decided.",
    recommendation: "Verify that the open architectural questions in Chunk 14 (pre-filter ordering, overlap logic, layer sequence) are explicitly resolved in Chunk 15 or 16. If any were silently dropped, flag them as unresolved decisions that need to be surfaced.",
  },
  {
    chunk_indices: [16, 17],
    issue: "Chunk 16 finalizes the three-pass chunking pipeline with a complete Cursor build prompt specifying the system structure. Chunk 17 then describes building and configuring 'ripple-memory' with specific decisions about .env file location and hardcoding 'claude-sonnet-4-6' as the model. The model selection in Chunk 17 (hardcoded claude-sonnet-4-6) may contradict or supersede model specifications established in earlier architecture chunks (Chunk 7 mentions embedding models and reranking; Chunk 11 mentions Claude API and model tiering). Hardcoding a specific model at implementation time without referencing the tiered model strategy from Chunk 11 is a potential unacknowledged supersession.",
    recommendation: "Check whether the hardcoded model choice in Chunk 17 (claude-sonnet-4-6) conflicts with the multi-tier model strategy defined in Chunk 11. If the tiering strategy was intentionally collapsed to a single model, this should be explicitly acknowledged rather than silently changed at implementation time.",
  },
  {
    chunk_indices: [6, 13],
    issue: "Chunk 6 confirms that the current capture is working and explicitly decides the next priority is building the memory/context platform. Chunk 13 describes GitHub setup, gitignore, and initial commit — a logistical/tooling task. This chunk appears between the architecture design chunks (7–12) and the chunking pipeline build (14–16), which is a reasonable placement, but its 'decision' signal and topic suggest it may be interrupting the architecture thread rather than belonging to it. It could also be misplaced if the GitHub commit happened before the architecture was finalized (i.e., committing an incomplete spec).",
    recommendation: "Verify the sequencing: if Chunk 13's GitHub commit occurred before the architecture was finalized in Chunks 14–16, note that the committed codebase may not reflect the final architecture. Consider flagging Chunk 13 as a potential premature commit relative to the architecture decisions that followed.",
  }
];

export const facts: Fact[] = [
  {
    type: "Decision",
    chunk_index: 0,
    conclusion: "Option B (real-time message accumulation) was chosen as the approach for capturing conversation messages in the Chrome extension",
    trigger: "User explicitly selected Option B after being presented with three approaches (scroll capture, real-time accumulation, and export-based) to solve the virtual scrolling problem that limited capture to only visible DOM messages",
    alternatives_considered: "Option A — programmatic scroll capture (scroll to top, capture rendered messages, scroll down, repeat); Option C — use Claude.ai's built-in conversation export feature",
    rejected_because: "Option A was described as slow and fragile; Option C was not explicitly rejected but Option B was preferred for automatic going-forward capture",
    assumptions: "The extension can only capture messages from the point of installation/activation onward, not past messages; The existing MutationObserver in content.js is already partially doing this; chrome.storage.local is available and sufficient for persisting accumulated messages",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 0,
    conclusion: "Messages must be accumulated in storage by appending new entries and never overwriting existing ones, with deduplication using a key of role + first 100 chars of content",
    trigger: "Need to implement Option B correctly so messages persist across page refreshes and don't get duplicated",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "role + first 100 chars of content is a stable enough key to identify duplicate messages; chrome.storage.local persists across page refreshes; Existing DOM selectors and fallback chains in content.js remain unchanged",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 0,
    conclusion: "A 'session_started' system entry is added at the beginning of each new page load to mark session boundaries, but only if the last stored entry is not already a 'session_started' from within the last 60 seconds",
    trigger: "Need to track session boundaries in the accumulated history while avoiding duplicate markers on quick refreshes",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "60 seconds is a sufficient threshold to distinguish genuine new sessions from quick refreshes",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 0,
    conclusion: "The stored message structure remains { messages: [{ role, content, timestamp }] }",
    trigger: "Continuity requirement when changing storage logic from replacement to accumulation",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "Existing consumers of the storage data expect this structure",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 1,
    conclusion: "A full-page viewer (messages.html) opened via chrome.tabs.create will be used to display all captured messages, rather than expanding the popup",
    trigger: "User requested a button to view all messages in an easy-to-read way with date and time, and the popup was limited to showing only the last 3 messages",
    alternatives_considered: "Expanding the popup with a scrollable toggle (max height 400px) to show all messages inline",
    rejected_because: "The popup is a small, constrained space; a full-page experience is more readable and accommodates all messages comfortably",
    assumptions: "chrome.tabs.create is available in the extension context; messages.html can be registered as a web accessible resource in manifest.json; chrome.storage.local holds all captured messages with timestamps",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 1,
    conclusion: "Each message in the full-page viewer will display a colored role badge (User = purple, Assistant = green, System = gray), formatted date/time, full untruncated content, and a divider between messages",
    trigger: "User asked for messages to be displayed in an easy-to-read way with date and time",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "Messages in chrome.storage.local include a timestamp field; Dark theme (#0a0a0a background, white text) is the preferred style",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 1,
    conclusion: "A 'Copy All as JSON' button will be fixed at the top right of the full-page viewer",
    trigger: "Existing popup already had a 'Copy to clipboard' feature; the full-page viewer needed an equivalent",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "Users still need the raw JSON export capability",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 1,
    conclusion: "messages.html will be added as a web accessible resource in manifest.json so it can be opened as a tab",
    trigger: "chrome.tabs.create requires the target page to be accessible as a web accessible resource in the extension",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "The extension uses Manifest V3 or a version that supports web_accessible_resources",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 2,
    conclusion: "The full capture layer of the Ripple Memory extension is confirmed working — messages are captured in real time, stored persistently, and viewable in a full-page format with timestamps, role badges, session markers, and JSON export",
    trigger: "User confirmed 'storing nicely and i can see all messages clearly' after testing the extension",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "The extension has been reloaded in Chrome after the latest changes; The 'View All Messages' UI is rendering correctly",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 6,
    conclusion: "The next priority is building the memory/context platform (extraction layer that turns captured conversations into structured memory)",
    trigger: "Current message capture is confirmed working, so the team moves to the harder next phase",
    alternatives_considered: "Fix the paste import for pre-7:24 PM messages; Add get_project_memory tool to ripple-mcp; Continue on the landing page diagram/icons",
    rejected_because: "Memory/context platform is identified as the core product moat and the main hard part of the system",
    assumptions: "Current real-time message capture via ripple-extension is working reliably; The extraction/structuring layer is not yet built; Cursor chat integration and GitHub commits will be connected later as additional data sources",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 6,
    conclusion: "Claude.ai chat captured by ripple-extension will be the initial data source fed into the memory platform, with Cursor chats and GitHub commits connected later",
    trigger: "User outlining the roadmap for data sources to feed into the memory/context platform",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "ripple-extension is successfully capturing claude.ai messages in real time; Cursor chat and GitHub commit integrations are feasible to add later",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Create ARCHITECTURE.md at the workspace root as a living build specification document",
    trigger: "Need to give Cursor persistent context about what is being built and why, beyond what .cursorrules provides",
    alternatives_considered: ".cursorrules only",
    rejected_because: ".cursorrules only covers code style conventions, not architectural reasoning and decisions",
    assumptions: "ARCHITECTURE.md will be read at the start of every Cursor session; Document will be updated as new decisions are made",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "ARCHITECTURE.md supersedes RIPPLE_MEMORY.md as the authoritative build spec; RIPPLE_MEMORY.md becomes historical context only",
    trigger: "Cursor flagged ambiguity between ARCHITECTURE.md and RIPPLE_MEMORY.md",
    alternatives_considered: "Continuing to use RIPPLE_MEMORY.md",
    rejected_because: "RIPPLE_MEMORY.md was a manual prototype, now superseded by the real system design",
    assumptions: "The new system will handle what RIPPLE_MEMORY.md was doing manually",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Use Supabase (PostgreSQL + pgvector) and Neo4j AuraDB as hosted storage; raw conversations stay on device via chrome.storage",
    trigger: "Cursor flagged ambiguity about what 'local-first' meant for database placement",
    alternatives_considered: "Fully local databases",
    rejected_because: "Local-first means no separate UI to check, not that databases must be local",
    assumptions: "Users have or will set up Supabase and Neo4j AuraDB accounts",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Explicit fact-type-to-storage mapping: Decision and RejectedApproach go to both Postgres and Neo4j (Reasoning layer); ArchitectureFact, Assumption, and Problem go to both Postgres and Neo4j (Semantic layer); OpenQuestion, ProjectValue, and Event go to Postgres only",
    trigger: "Cursor flagged missing explicit mapping of fact types to storage targets",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "This mapping covers all fact types needed for initial implementation",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Cross-DB sync strategy: shared UUID generated before either write; Postgres written first, then Neo4j; Postgres is source of truth; Neo4j failures are logged with UUID and retried",
    trigger: "Cursor flagged lack of a defined sync strategy between Postgres and Neo4j",
    alternatives_considered: "Neo4j first; Simultaneous writes",
    rejected_because: "Not explicitly stated, but Postgres chosen as source of truth for reliability",
    assumptions: "A retry queue mechanism will be implemented for failed Neo4j writes; Shared UUID enables cross-DB resolution",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Episodic layer implemented as timestamps and provenance columns on every Postgres record plus a dedicated events table; not as a Neo4j node type",
    trigger: "Cursor flagged ambiguity about how the episodic memory layer would be implemented",
    alternatives_considered: "Neo4j nodes for episodic events",
    rejected_because: "Not explicitly stated; Postgres-only chosen for simplicity",
    assumptions: "Timestamps and provenance columns are sufficient for episodic retrieval needs",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Two-pass chunking using two separate Claude API calls: first for boundary/topic detection, second for structured fact extraction per chunk",
    trigger: "Cursor flagged the chunking model as undefined",
    alternatives_considered: "Single-pass extraction; Message-by-message chunking",
    rejected_because: "Message-by-message chunking was previously identified as insufficient; single-pass conflates two distinct tasks",
    assumptions: "Two separate Claude API calls per document is acceptable cost and latency",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Only a canonical summary string per fact type gets embedded into pgvector, not all fields; full structured data stays in Postgres",
    trigger: "Cursor flagged the embedding strategy as undefined",
    alternatives_considered: "Embedding all fields; Embedding raw text chunks",
    rejected_because: "Not explicitly stated",
    assumptions: "Canonical summary strings are defined for each fact type; pgvector stores the summary embedding alongside the Postgres UUID",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "ProjectValue facts are queried separately from pgvector and applied as a boost/filter during Cohere reranking; ProjectValue has no Neo4j representation",
    trigger: "Cursor flagged how ProjectValue would participate in retrieval",
    alternatives_considered: "Including ProjectValue as a Neo4j node",
    rejected_because: "Not explicitly stated; Postgres-only chosen",
    assumptions: "Cohere reranking supports boosting based on separate signals",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Graph edges created in a two-pass process: extractor returns string references, then a resolver maps strings to UUIDs and writes Neo4j edges; CONTRADICTS edge is manual for now with ML detection planned later",
    trigger: "Cursor flagged graph edge creation as undefined",
    alternatives_considered: "Single-pass edge creation; Immediate ML contradiction detection",
    rejected_because: "Single-pass would require UUID resolution at extraction time; ML detection requires a populated graph first",
    assumptions: "String-to-UUID resolver can reliably match references to existing records",
    confidence: "high",
    revisit: true
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "project_id added to every Postgres table and Neo4j node property from day one, even though only a single project (Ripple itself) is targeted initially",
    trigger: "Cursor flagged multi-project scoping as unresolved",
    alternatives_considered: "Adding project_id later when multi-project support is needed",
    rejected_because: "Adding project_id later would require a painful migration",
    assumptions: "Multi-project support will be needed eventually",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Existing MCP tools (list_concepts, get_concept_context) are retained; new tools (get_memory_context, get_reasoning_chain, get_project_values) are added alongside them; concepts.json remains the code-grounding layer",
    trigger: "Cursor flagged ambiguity about whether existing MCP tools would be replaced or extended",
    alternatives_considered: "Replacing existing tools with new memory-aware tools",
    rejected_because: "Existing tools serve code structure from ripple-parser and remain useful independently",
    assumptions: "ripple-parser output and ripple-memory output serve complementary purposes",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Build the database schema in Supabase and Neo4j AuraDB as the first implementation step, since all other components depend on it",
    trigger: "Architecture fully locked after resolving Cursor's flags; need to identify first build step",
    alternatives_considered: "Starting with extraction pipeline; Starting with MCP server",
    rejected_because: "Schema is a prerequisite dependency for all other components",
    assumptions: "Supabase and Neo4j AuraDB accounts are or will be set up",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Ripple is positioned as coding-specific persistent memory, not general cognition, explicitly differentiating from Exo",
    trigger: "Discussion about Exo's broad positioning being a weakness and Ripple needing a sharp wedge",
    alternatives_considered: "General cognition memory like Exo; Code visualization tool",
    rejected_because: "General positioning forces abstract schemas that cannot go deep on coding-specific needs; visualization was tested and rejected",
    assumptions: "Developers using AI coding tools are a large and growing addressable market; Coding-specific depth is more valuable than breadth",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Do not use LangChain or LlamaIndex; own the extraction pipeline directly using Claude API with structured JSON schemas and Zod validation",
    trigger: "Architecture design for ripple-memory extraction pipeline",
    alternatives_considered: "LangChain; LlamaIndex",
    rejected_because: "Owning the pipeline directly gives more control; these frameworks were explicitly decided against",
    assumptions: "Direct Claude API calls are sufficient for the extraction use case",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 8,
    conclusion: "Use OpenAI for embeddings and Cohere for reranking with off-the-shelf models initially; custom/fine-tuned models deferred until training data exists",
    trigger: "Question about whether machine learning would improve the system",
    alternatives_considered: "Custom fine-tuned embedding models from the start; Graph neural networks for pattern detection from the start",
    rejected_because: "Custom models require training data that does not yet exist; off-the-shelf models get to a working system faster",
    assumptions: "Off-the-shelf models are sufficient for initial quality; Training data will accumulate from real user usage",
    confidence: "high",
    revisit: true
  },
  {
    type: "Decision",
    chunk_index: 13,
    conclusion: "Create a .gitignore file at the Ripple project root before committing to GitHub",
    trigger: "User was about to push the codebase to GitHub without a .gitignore, risking committing node_modules and .env files",
    alternatives_considered: "placing .gitignore in individual subfolders",
    rejected_because: "A single root-level .gitignore with node_modules/ applies recursively to all subfolders, making per-subfolder files unnecessary",
    assumptions: "The .gitignore is placed at the same level as ARCHITECTURE.md and .cursorrules; A single node_modules/ line catches all nested node_modules folders",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 13,
    conclusion: "Remove node_modules from git tracking by running git rm -r --cached and recommitting with .gitignore in place",
    trigger: "User committed and pushed the codebase without a .gitignore, causing node_modules to be included in the repository",
    alternatives_considered: "leaving node_modules tracked; scrubbing git history",
    rejected_because: "Tracked node_modules makes the repo bloated and slow; since no API keys or .env files were committed, no history scrubbing was needed",
    assumptions: "No .env files or API keys were committed; The repo is private on GitHub",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 13,
    conclusion: "Commit the entire Ripple codebase to the existing private GitHub repository using an initial git commit",
    trigger: "User had not yet committed the local codebase to GitHub and asked how to do it",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "Git is installed locally; User has access to the GitHub repo at https://github.com/srikarkonda24/Ripple.git; No sensitive API keys or .env files exist in the project yet",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 17,
    conclusion: "The .env file should be placed inside ripple-memory/, not at the Ripple project root",
    trigger: "User asked whether the .env file should be in ripple-memory or in the Ripple project root",
    alternatives_considered: "Ripple project root",
    rejected_because: "dotenv loads .env relative to wherever the script is actually run from, which is inside ripple-memory when running npm test there; each subproject manages its own environment variables independently",
    assumptions: "Each subproject is a separate Node project with its own package.json and runtime context; The root .gitignore uses a plain .env line without path prefix, covering .env files at any depth",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 17,
    conclusion: "The .env file should contain only the ANTHROPIC_API_KEY, no other keys",
    trigger: "User asked what should be in the .env file",
    alternatives_considered: "",
    rejected_because: "No Supabase, Neo4j, OpenAI, or Cohere keys are needed yet for the chunker test",
    assumptions: "The pipeline only calls the Anthropic API at this stage",
    confidence: "high",
    revisit: true
  },
  {
    type: "Decision",
    chunk_index: 17,
    conclusion: "Model selection (claude-sonnet-4-6) is hardcoded in the source code, not chosen when creating the API key",
    trigger: "User asked which model to choose for the Anthropic API key and how to choose it",
    alternatives_considered: "",
    rejected_because: "API keys grant general API access; model specification is a code-level concern already handled in pass1Segmentation.ts, pass2Classification.ts, and pass3Synthesis.ts",
    assumptions: "Cursor already hardcoded claude-sonnet-4-6 in all three pass files per the spec",
    confidence: "high",
    revisit: false
  },
  {
    type: "Decision",
    chunk_index: 17,
    conclusion: "The next step after adding the .env file is to add sample conversation data to ripple-memory/test-data/sample-conversation.json before running npm test",
    trigger: "User confirmed the .env file and API key were added",
    alternatives_considered: "",
    rejected_because: "",
    assumptions: "The pipeline expects JSON with shape { \"messages\": [{ \"role\", \"content\", \"timestamp\" }] }; The Ripple Memory extension can export conversation data in approximately this format",
    confidence: "high",
    revisit: false
  },
  {
    type: "ArchitectureFact",
    chunk_index: 3,
    component: "ripple-extension / popup",
    fact: "The 'Paste Conversation' feature is implemented as a collapsible section directly inside popup.html and popup.js, not as a separate full-screen page.",
    rationale: "User preference: a small inline text box inside the existing popup is sufficient and simpler than opening a new extension page.",
    linked_code: "popup.html; popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 3,
    component: "ripple-extension / popup",
    fact: "The collapsible paste section contains a textarea (100% width, 120px height) and an 'Import' button, toggled by a 'Paste Conversation' toggle button below existing popup buttons.",
    rationale: "Keeps the import UI minimal and non-intrusive while still accessible from the main popup.",
    linked_code: "popup.html; popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 3,
    component: "ripple-extension / paste import parser",
    fact: "The paste import parser must handle two distinct input formats: (1) the raw claude.ai copy-paste format using 'You said:' and 'Claude responded:' labels, and (2) the extension's messages.html export format using 'User\\nJun 15...' and 'Assistant\\nJun 15...' labels with timestamps.",
    rationale: "Users may paste from either source; the parser falls back to the messages.html format if the claude.ai format yields no results.",
    linked_code: "popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 3,
    component: "ripple-extension / paste import parser",
    fact: "Deduplication is performed by generating a key of role + first 100 characters of content for each parsed message, matching the same dedupe key used in content.js.",
    rationale: "Ensures consistency with the existing capture mechanism so messages captured live and messages imported via paste are deduplicated using the same logic.",
    linked_code: "popup.js; content.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 3,
    component: "ripple-extension / paste import",
    fact: "After parsing pasted text, only messages whose dedupe key does not already exist in chrome.storage.local are added; the merged array is saved back to chrome.storage.local.",
    rationale: "Prevents duplicates when the extension has already captured some messages that also appear in the pasted conversation.",
    linked_code: "popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 3,
    component: "ripple-extension / paste import",
    fact: "After a successful import, the UI displays an inline status message in the format 'Added X new, skipped Y duplicates' and clears the textarea.",
    rationale: "Gives the user immediate feedback on how many new messages were recovered versus how many were already present.",
    linked_code: "popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-extension",
    fact: "The Chrome extension is built as a Manifest V3 extension with no build step, no npm dependencies — plain HTML/CSS/JS files loaded as an unpublished developer extension.",
    rationale: "Simplicity and local-only use; no need to publish to the Chrome store, just loaded via 'Load unpacked' in developer mode for personal use during development.",
    linked_code: "ripple-extension/manifest.json; ripple-extension/content.js; ripple-extension/popup.html; ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-extension/content.js",
    fact: "The content script runs exclusively on claude.ai pages and uses a MutationObserver to capture messages in real time as they appear, accumulating them in chrome.storage.local rather than overwriting on each scan.",
    rationale: "Claude.ai uses virtual scrolling that removes old messages from the DOM; real-time accumulation via MutationObserver ensures messages are captured as they appear rather than trying to read the full history at once.",
    linked_code: "ripple-extension/content.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-extension/content.js",
    fact: "Messages are deduplicated using a stable key derived from role + first 100 characters of content before being appended to chrome.storage.local.",
    rationale: "Prevents duplicate entries when the MutationObserver fires multiple times for the same message or when a re-scan is triggered manually.",
    linked_code: "ripple-extension/content.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-extension/content.js",
    fact: "A 'session_started' system marker is written to storage at page load, but only if the last stored entry is not already a 'session_started' from within the last 60 seconds.",
    rationale: "Provides session boundary markers for later analysis while avoiding duplicate markers on quick page refreshes.",
    linked_code: "ripple-extension/content.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-extension",
    fact: "The extension captures raw conversation text (all messages, no filtering), and a separate extraction layer (LLM API call) is responsible for identifying relevant structured information such as decisions, rejected approaches, and open questions.",
    rationale: "Separates concerns so the capture layer remains simple and reliable; the intelligence about what is relevant is handled downstream by the LLM, making each layer independently replaceable.",
    linked_code: "ripple-extension/content.js; ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-extension/popup.js",
    fact: "The popup includes a 'Paste Conversation' toggle that reveals an inline textarea and 'Import' button, allowing the user to paste full conversation text to fill gaps from before the extension was installed.",
    rationale: "The extension can only capture messages from the point of installation forward; the paste import merges historical conversation text into chrome.storage, deduplicating against already-captured messages.",
    linked_code: "ripple-extension/popup.html; ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-extension paste import parser",
    fact: "The paste import parser must handle two distinct conversation formats: the raw claude.ai copy-paste format using role labels, and the extension's own messages.html export format with timestamps.",
    rationale: "Users may paste text copied directly from claude.ai or from the extension's 'View All Messages' page; both formats must be parsed to correctly identify user vs. assistant messages and avoid treating code snippets or UI text as messages.",
    linked_code: "ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-extension/messages.html",
    fact: "A full-screen extension page (messages.html + messages.js) displays all captured messages in chronological order with role-colored badges, formatted timestamps, and full untruncated content, opened via chrome.tabs.create from the popup.",
    rationale: "The popup has limited display space and only shows the last 3 messages; the full-page view provides readable access to the entire accumulated conversation history.",
    linked_code: "ripple-extension/messages.html; ripple-extension/popup.js; ripple-extension/manifest.json"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-mcp",
    fact: "ripple-mcp exposes two MCP tools — list_concepts and get_concept_context — that are served by reading two local JSON files (data/output.json and data/concepts.json) loaded into memory at startup.",
    rationale: "The parsing and concept-labeling steps are performed offline in advance; the live MCP server only needs to perform string matching against pre-built data, keeping the runtime simple and fast.",
    linked_code: "ripple-mcp/src/index.ts; ripple-mcp/src/tools/getConceptContext.ts; ripple-mcp/src/tools/listConcepts.ts; ripple-mcp/data/output.json; ripple-mcp/data/concepts.json"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-mcp",
    fact: "A planned third MCP tool, get_project_memory, will read RIPPLE_MEMORY.md from the workspace root and return its full contents, exposing project history and decisions to Cursor/Claude automatically.",
    rationale: "Connects the project memory file into the same MCP interface used for code concepts, so AI tools can automatically access both codebase structure and decision history without manual context pasting.",
    linked_code: "ripple-mcp/src/index.ts; RIPPLE_MEMORY.md"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-mcp data pipeline",
    fact: "data/output.json is produced by ripple-parser using ts-morph static analysis and contains function/file nodes and call-graph edges; data/concepts.json contains AI-labeled concept groupings with names, descriptions, and member node IDs.",
    rationale: "Separating the deterministic static-analysis output (output.json) from the AI-labeled groupings (concepts.json) allows each to be regenerated independently when the codebase or labeling logic changes.",
    linked_code: "ripple-parser/parser.ts; ripple-mcp/data/output.json; ripple-mcp/data/concepts.json"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple-mcp/src/data/loadData.ts",
    fact: "The data loading layer uses type-guard helper functions (isRecord, isNonEmptyString, isStringArray) to validate JSON shapes before trusting them, and calls failStartup to exit cleanly if either data file is missing or malformed.",
    rationale: "Prevents the MCP server from running with corrupt or unexpected data structures, making startup failures explicit and diagnosable.",
    linked_code: "ripple-mcp/src/data/loadData.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 4,
    component: "ripple system architecture",
    fact: "The planned automated memory update pipeline is: Chrome extension captures raw claude.ai conversation → sends to a local HTTP /sync endpoint on ripple-mcp → ripple-mcp calls LLM API with extraction prompt → receives structured memory (decisions, built, rejected, open questions) → updates RIPPLE_MEMORY.md.",
    rationale: "Keeps all data local (private, no third-party server), reuses the existing ripple-mcp infrastructure with one new HTTP endpoint, and separates dumb capture (extension) from intelligent extraction (LLM via ripple-mcp).",
    linked_code: "ripple-extension/popup.js; ripple-mcp/src/index.ts; RIPPLE_MEMORY.md"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 5,
    component: "ripple-extension",
    fact: "The extension uses a MutationObserver that fires on any claude.ai/* URL to capture messages, not just a specific conversation URL",
    rationale: "This allows the extension to automatically begin capturing messages from any new claude.ai conversation without requiring additional configuration",
    linked_code: "ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 5,
    component: "ripple-extension",
    fact: "All captured messages from multiple claude.ai sessions are appended to a single shared chrome.storage.local store",
    rationale: "This enables cross-session continuity so that 'View All Messages' shows all captured conversations chronologically across sessions",
    linked_code: "ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 5,
    component: "ripple-extension",
    fact: "Session boundaries are marked in storage with 'Session started' markers (e.g., 'SESSION STARTED · JUN 15, 2026 7:36 PM') each time a new page is loaded",
    rationale: "Session markers allow users to identify the boundary between different conversation sessions when viewing the unified message history",
    linked_code: "ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 5,
    component: "ripple-extension paste import parser",
    fact: "The paste import parser in popup.js handles the messages.html format where role appears on a standalone line ('User' or 'Assistant'), followed by a date line, followed by message content until the next role line",
    rationale: "The messages.html format is the clean, structured output of the extension's own View All Messages page, making it the most reliable source for paste-importing historical messages",
    linked_code: "ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 5,
    component: "ripple-extension paste import parser",
    fact: "The paste import parser uses a dedupe key composed of role + first 100 characters of content to avoid importing duplicate messages",
    rationale: "Deduplication prevents double-storing messages when the same content is imported multiple times",
    linked_code: "ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 5,
    component: "ripple-extension paste import parser",
    fact: "On import, the parser loads existing messages from chrome.storage.local, merges only new (non-duplicate) messages, and saves the merged array back to storage",
    rationale: "This append-only merge pattern preserves previously captured messages while adding new historical data",
    linked_code: "ripple-extension/popup.js"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "The memory platform uses a dual-database architecture: PostgreSQL + pgvector for structured facts and semantic search, and Neo4j for the knowledge graph storing nodes and relationships.",
    rationale: "pgvector inside PostgreSQL eliminates the need for a separate vector database, reducing operational complexity. Neo4j captures how entities connect (decisions, problems, components) rather than just storing flat facts, enabling reasoning about relationships.",
    linked_code: "ripple-memory"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "The system uses OpenAI text-embedding-3-small as the embedding model to convert text into vectors before storing in pgvector.",
    rationale: "Anthropic does not have a public embedding model, so OpenAI's text-embedding-3-small is used as it offers the best quality-to-cost ratio for this use case. An alternative is nomic-embed via Ollama for zero-cost, fully private embeddings.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "The Anthropic Claude API is used exclusively for the structured extraction step, where raw conversation chunks are sent and structured JSON (decisions, facts, open questions) is returned.",
    rationale: "Structured/JSON mode extraction is critical so that parsed output is typed and schema-validated rather than freeform text, which breaks downstream processing.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "Zod is used for schema validation of all LLM extraction output before any data is written to the databases.",
    rationale: "When Claude returns JSON from an extraction call, Zod validates it matches the expected shape, preventing malformed data from reaching PostgreSQL or Neo4j.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "The Cohere Rerank API is used as a reranking step after vector search retrieves top candidates, re-scoring them by actual relevance to the query.",
    rationale: "Vector search alone returns the top N semantically similar facts but does not rank them precisely for the specific query context. Reranking improves final retrieval quality significantly.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "The extraction and retrieval pipeline is written as custom TypeScript without LangChain or LlamaIndex frameworks.",
    rationale: "LangChain and LlamaIndex abstract away exactly the parts that need deep control and understanding for a quality-focused system. Owning every step of the pipeline directly in TypeScript gives full control over chunking, extraction, storage, and retrieval behavior.",
    linked_code: "ripple-memory"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "The full ingestion pipeline stages are: capture → chunking → structured LLM extraction → Zod validation → parallel storage in PostgreSQL+pgvector (facts + vectors) and Neo4j (graph relationships) → retrieval via vector search + graph traversal → Cohere reranking → MCP server exposure.",
    rationale: "Each stage is a discrete responsibility. Splitting storage into vector (semantic search) and graph (relational reasoning) allows both similarity-based retrieval and reasoning about how decisions, problems, and components connect.",
    linked_code: "ripple-memory; ripple-mcp"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "Neo4j is used as the knowledge graph database, storing typed nodes (Decision, Component, Problem) and typed relationships (CAUSED_BY, SUPERSEDES, AFFECTS, RELATED_TO), queryable via Cypher.",
    rationale: "A knowledge graph captures how things connect rather than just retrieving similar text. This enables the system to reason about the provenance and relationships of decisions, which is the core long-term moat of the platform.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "The ripple-memory module is a separate folder/package from ripple-mcp and ripple-extension within the Ripple monorepo.",
    rationale: "Separation of concerns: ripple-extension handles capture, ripple-memory handles the core pipeline and storage layer, and ripple-mcp serves the memory to AI tools. Each has a distinct responsibility.",
    linked_code: "ripple-memory; ripple-mcp; ripple-extension"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "Supabase (hosted PostgreSQL + pgvector) and Neo4j AuraDB (hosted graph database) are the chosen hosting solutions for the two databases.",
    rationale: "Both services offer free tiers sufficient for building and testing, require no local setup, and provide connection strings immediately, reducing infrastructure overhead during initial development.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "The system is built in Node.js + TypeScript, consistent with the existing ripple-mcp and ripple-parser codebases.",
    rationale: "Consistency across the entire Ripple codebase — no reason to introduce a new runtime or language when Node.js + TypeScript already serves the project.",
    linked_code: "ripple-mcp; ripple-memory"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-memory",
    fact: "Chunking is implemented as pure custom code logic (a TypeScript function), with no special tool or library, and operates at the semantic topic level rather than the individual message level.",
    rationale: "For conversation memory, a single decision or topic may span many messages, so splitting by message boundary loses context. Semantic chunking groups related messages into coherent units before embedding, which directly affects retrieval quality.",
    linked_code: "ripple-memory"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 7,
    component: "ripple-mcp",
    fact: "The existing ripple-mcp MCP server is extended with new tools that query the ripple-memory system, replacing or supplementing the original behavior of reading static JSON files.",
    rationale: "ripple-mcp is the interface layer that exposes memory to AI tools (Cursor, Claude). By extending it rather than replacing it, the retrieval system becomes accessible to all MCP-compatible clients without changing the client-side integration.",
    linked_code: "ripple-mcp"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple",
    fact: "Ripple is a persistent reasoning memory layer for software projects that captures decisions, rejected approaches, assumptions, and their rationale, connected to the actual codebase via static analysis.",
    rationale: "Standard AI tools lose context between sessions; Ripple is designed so the accumulated memory compounds in value the longer it is used, making it increasingly irreplaceable over time.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Foundation",
    fact: "The foundation consists of four required components: reliable capture, structured extraction (conversations → typed facts via Claude + Zod validation), basic storage (PostgreSQL + Neo4j), and simple semantic retrieval (pgvector).",
    rationale: "These four components are the minimum viable base that is useful from day one and compounds automatically as more data accumulates without requiring additional feature development.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Extraction Pipeline",
    fact: "Raw captured messages are chunked into semantic topic threads, then each chunk is passed to Claude with structured JSON schemas, validated with Zod, and stored as typed facts (Decision, RejectedApproach, Assumption, etc.).",
    rationale: "Structured extraction transforms unstructured conversation into queryable, typed data that can be stored in both relational and graph databases and semantically searched.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Storage Layer",
    fact: "Facts are persisted in both PostgreSQL and Neo4j using a consistent schema, with embeddings stored in pgvector for semantic search.",
    rationale: "PostgreSQL handles relational/structured querying, Neo4j enables graph traversal of reasoning chains and dependency relationships, and pgvector enables semantic similarity search over facts.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Retrieval Layer",
    fact: "Retrieval combines semantic search results from pgvector with graph traversal starting from those results in Neo4j, returning full reasoning chains rather than isolated facts.",
    rationale: "Combining vector similarity with graph traversal allows returning not just the matching decision but all connected decisions, assumptions, and dependencies it links to.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "ripple-mcp",
    fact: "The MCP integration exposes at least two tools to Cursor/Claude: get_memory_context and get_reasoning_chain.",
    rationale: "These MCP tools allow AI assistants operating in the developer's environment to query Ripple's accumulated memory directly during coding sessions.",
    linked_code: "ripple-mcp"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Platform — Layer 1: Proactive Intelligence",
    fact: "Proactive Intelligence watches what the developer is about to do and surfaces relevant memory before being asked, including conflict warnings and previously-tried approaches.",
    rationale: "Reactive querying requires the developer to know what to ask; proactive surfacing makes Ripple a reasoning partner rather than just a memory store. Unlocked once enough decisions exist in the graph to detect conflicts.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Platform — Layer 2: Assumption Tracker",
    fact: "The Assumption Tracker surfaces unvalidated assumptions that decisions depend on, and flags when an assumption has been invalidated but downstream decisions have not been updated.",
    rationale: "Decisions accumulate dependencies on assumptions that are never tracked or validated; graph traversal over assumption nodes reveals hidden project risk. Unlocked once sufficient assumption nodes exist in the graph.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Platform — Layer 3: New Developer Onboarding",
    fact: "After 1–2 months of accumulated memory, Ripple enables new developers to query the full reasoning history of architectural decisions, previously-tried approaches, and unresolved issues.",
    rationale: "Onboarding knowledge transfer is typically incomplete and slow; accumulated graph memory makes this queryable and thorough, and represents the primary enterprise wedge.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Platform — Layer 4: Pattern Detection",
    fact: "After 3–6 months of decisions, the graph becomes dense enough for automatic emergence of cross-decision patterns such as consistent architectural preferences, recurring deferrals, and decision timing correlations.",
    rationale: "Patterns that no individual decision reveals become visible at scale through graph density, enabling retrieval that understands implicit project values.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Platform — Layer 5: Contradiction Detection",
    fact: "Contradiction Detection automatically flags pairs of decisions made at different times that contradict each other, requiring both graph traversal and semantic understanding of contradiction.",
    rationale: "Contradictory decisions accumulate silently across time and contributors; automatic detection surfaces them before they cause failures. Requires pattern detection to already be running and a dense graph.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Platform — Layer 6: Agent Governance",
    fact: "Agent Governance integrates with AI agents via MCP so that before making changes, agents query Ripple for affected downstream components and unvalidated assumptions, flagging high-risk actions for human review without blocking execution.",
    rationale: "As AI agents become more autonomous, they need reasoning context about the project to avoid violating established decisions or depending on unvalidated assumptions. Requires solid MCP integration and proactive intelligence.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Platform — Layer 7: Cross-Project Intelligence",
    fact: "Once multiple projects use Ripple, patterns emerge across projects — recurring architectural problems, team-level tendencies, and solutions that transferred from one project to another.",
    rationale: "Institutional memory across projects (not just within one) is the enterprise product offering, providing value to CTOs and engineering leadership tracking organizational patterns.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Platform — Layer 8: Fine-tuned Models",
    fact: "With sufficient accumulated data, Ripple fine-tunes a custom extraction model, custom embeddings for developer conversations, and a graph neural network trained on Neo4j data to detect patterns and contradictions.",
    rationale: "Proprietary training data from real project decisions creates models that are more accurate and cheaper than off-the-shelf Claude, and cannot be replicated without the same data — creating a defensible moat.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 10,
    component: "Ripple Platform",
    fact: "The eight capability layers are built in strict dependency order: Foundation → Proactive Intelligence → Assumption Tracker → Onboarding UX → Pattern Detection → Contradiction Detection → Agent Governance → Cross-Project Intelligence → Fine-tuned Models.",
    rationale: "Each layer is only technically possible because the prior layer exists and provides the data density or infrastructure it depends on.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 11,
    component: "Decision Extraction Pipeline",
    fact: "Decisions are extracted using Claude API with structured JSON schema, validated by Zod before storage, and stored both as structured records in Postgres and as Decision nodes in Neo4j with edges to connected entities",
    rationale: "Structured extraction ensures data integrity (Zod validation prevents silent corruption) and enables graph traversal by representing decisions as nodes with relationships in Neo4j",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 11,
    component: "Assumption Detection Pipeline",
    fact: "Assumptions are detected through two mechanisms: explicit extraction via Claude API scanning for conditional language signals, and implicit detection via Neo4j graph traversal that identifies gaps between what a decision assumes and what has been confirmed",
    rationale: "Assumptions are rarely stated explicitly, so combining linguistic signal detection with graph-based gap analysis surfaces both stated and unstated assumptions",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 11,
    component: "Assumption Risk Scoring",
    fact: "Neo4j tracks which assumptions are load-bearing (connected to many decisions) versus isolated, and flags load-bearing assumptions as high risk",
    rationale: "Assumptions connected to many decisions represent systemic risks; if they prove false, many downstream decisions are invalidated",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 11,
    component: "Pattern Detection Pipeline",
    fact: "Pattern detection operates in four layers: (1) frequency counting via Neo4j Cypher queries, (2) semantic clustering of embedded node summaries via pgvector using k-means, (3) temporal pattern detection via Neo4j timestamp edge traversal, and (4) a future graph neural network layer for structural pattern detection",
    rationale: "Layered approach captures patterns that are frequency-based, semantically similar but textually different, time-correlated, and structurally shaped in the graph — no single technique covers all pattern types",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 11,
    component: "Extraction Pipeline",
    fact: "Extraction is a batch job that runs once per session on semantic chunks, not in real-time per message; a 200-message conversation produces approximately 12-15 chunks resulting in 12-15 API calls rather than 200",
    rationale: "Chunking before extraction dramatically reduces API call volume and cost while maintaining extraction quality",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 11,
    component: "Extraction Pipeline - Cost Optimization",
    fact: "The extraction pipeline uses a multi-stage model tiering architecture: rule-based pre-filtering first, then Claude Haiku for a first-pass triage, then Claude Sonnet only for chunks flagged as likely containing decisions or assumptions",
    rationale: "Reduces cost by 60-80% versus calling Sonnet on all chunks while preserving quality on high-value chunks; rule-based filtering costs nothing and runs in milliseconds",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 11,
    component: "Extraction Pipeline - Rule-Based Pre-Filter",
    fact: "A rule-based pre-filter runs before any LLM call, checking chunks for decision signal words ('decided', 'going with', 'rejected', 'chose', 'won't', 'instead of') and assumption signal words ('assuming', 'since we're', 'as long as', 'depends on', 'given that'); chunks matching neither are skipped for structured extraction and only embedded for semantic search",
    rationale: "Zero-cost filtering eliminates 40-50% of chunks that contain no structured facts worth extracting, reducing LLM call volume",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 11,
    component: "Extraction Pipeline - Deterministic vs LLM Extraction",
    fact: "The system uses deterministic extraction for structured data sources (GitHub commits, ripple-parser output) and reserves LLM extraction only for conversation chunks where reasoning and decisions require semantic understanding",
    rationale: "Structured data sources already contain facts in machine-readable form; LLM extraction adds cost and latency without quality benefit for deterministic data",
    linked_code: "ripple-parser"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 11,
    component: "Extraction Pipeline - Long-term Cost Strategy",
    fact: "The long-term extraction cost strategy is to fine-tune a smaller open-source model (Llama 3 or Mistral) on accumulated extraction examples, replacing Claude API calls for the extraction task at scale",
    rationale: "At scale (100,000+ developers) API costs become significant; a fine-tuned model trained on proprietary extraction data provides competitive quality at negligible marginal cost and creates a defensible moat",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory",
    fact: "ripple-memory is a new module that does not yet exist and must be built as a separate folder with seven distinct layers: project setup, type system/schemas, database setup, chunking pipeline, extraction pipeline, storage layer, and retrieval layer",
    rationale: "The existing ripple-parser, ripple-mcp, ripple-extension, and ripple-landing components are already built; ripple-memory is the missing piece that processes raw conversations into structured memory",
    linked_code: "ripple-memory/; ripple-memory/src/"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory/src/types",
    fact: "All fact types are defined as Zod schemas: DecisionSchema, RejectedApproachSchema, ArchitectureFactSchema, AssumptionSchema, OpenQuestionSchema, ProjectValueSchema, EventSchema, FactRecordSchema, NodeTypeEnum, EdgeTypeEnum, ExtractionResponseSchema, ChunkSchema, BoundaryResponseSchema",
    rationale: "The type system is the foundation everything else is built on; incorrect schemas propagate errors through the entire pipeline",
    linked_code: "ripple-memory/src/types/"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory pipeline",
    fact: "The processing pipeline has four sequential stages: boundary detection (chunking), rule-based pre-filter, explicit extraction (Claude Haiku), and implicit extraction (Claude Sonnet for high-signal chunks only)",
    rationale: "Separating cheap rule-based filtering before expensive API calls reduces cost; using Haiku for obvious facts and Sonnet only for high-signal chunks optimizes cost vs. accuracy",
    linked_code: "ripple-memory/src/pipeline/chunker.ts; ripple-memory/src/pipeline/extractor.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory chunking pipeline",
    fact: "Chunking operates in three steps: (1) rule-based pre-filter with zero API cost using signal word lists, (2) one Claude API call for boundary detection returning chunk boundaries with topic and signal type, (3) overlap injection adding 3-message overlap between adjacent chunks",
    rationale: "Noise chunks (40-50% of messages) are dropped cheaply before any API calls; overlap prevents decisions split across boundaries from being missed",
    linked_code: "ripple-memory/src/pipeline/chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory extraction pipeline",
    fact: "Extraction uses two passes per chunk: Pass 1 uses Claude Haiku for explicit facts (clearly stated decisions, named assumptions, explicit rejections); Pass 2 uses Claude Sonnet only for high-signal chunks to find implicit facts (casual agreement after debate, unstated premises, implicit rejections)",
    rationale: "Two-pass extraction with different models balances cost and completeness; Zod validates every response and malformed data goes to a review queue rather than storage",
    linked_code: "ripple-memory/src/pipeline/extractor.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory extraction pipeline",
    fact: "Each fact type has its own dedicated extraction prompt rather than one shared prompt; six separate prompts exist, one per fact type",
    rationale: "Dedicated prompts per fact type produce more accurate extraction than a single generic prompt",
    linked_code: "ripple-memory/src/pipeline/extractor.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory storage layer",
    fact: "Facts are stored in two databases simultaneously: Supabase (PostgreSQL + pgvector) as the primary source of truth, and Neo4j AuraDB as the knowledge graph; both records share the same UUID",
    rationale: "Postgres holds full structured facts and vector embeddings for semantic search; Neo4j holds the relational graph for reasoning chain traversal; they are linked by shared UUID",
    linked_code: "ripple-memory/src/storage/writer.ts; ripple-memory/src/storage/postgres.ts; ripple-memory/src/storage/neo4j.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory storage layer",
    fact: "Failure handling is asymmetric: if Postgres fails, the entire write stops and Neo4j is not written; if Neo4j fails, the UUID is logged to a retry queue but the Postgres record is kept; if embedding fails, the fact is stored but flagged as not yet searchable for later retry",
    rationale: "Postgres is the source of truth; Neo4j and embeddings are derived/secondary and can be recovered from the Postgres record",
    linked_code: "ripple-memory/src/storage/writer.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory Supabase schema",
    fact: "Supabase contains five tables: facts (core structured facts as JSONB), fact_embeddings (pgvector embeddings of dimension 1536 using OpenAI text-embedding-3-small), project_values (inferred patterns with evidence and strength), events (episodic timeline), and pending_edges (string references awaiting Neo4j resolution)",
    rationale: "Separating embeddings into their own table allows pgvector indexing; pending_edges table enables deferred graph wiring after sessions complete",
    linked_code: "ripple-memory/src/storage/postgres.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory Neo4j schema",
    fact: "Neo4j node types are: Decision, RejectedApproach, Component, Assumption, Problem. Edge types are: CAUSED_BY, SUPERSEDES, CONTRADICTS, AFFECTS, DEPENDS_ON, IMPLEMENTED_BY. Each node type has a unique constraint on uuid.",
    rationale: "Typed nodes and edges enable directed graph traversal for reasoning chains; unique constraints on uuid ensure referential integrity between Postgres and Neo4j",
    linked_code: "ripple-memory/src/storage/neo4j.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory edge resolver",
    fact: "Edge resolution is a deferred process that runs after each session: it reads the pending_edges table, finds matching nodes in Neo4j by semantic similarity, creates the edges, and marks pending_edges records as resolved",
    rationale: "At extraction time, relationships are expressed as string references before matching nodes exist; deferred resolution decouples extraction from graph wiring",
    linked_code: "ripple-memory/src/storage/edgeResolver.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory retrieval layer",
    fact: "Retrieval uses a seven-step pipeline: (1) embed the query, (2) pgvector semantic search for top 20 candidates, (3) Neo4j graph traversal up to 2 hops from candidate UUIDs, (4) fetch project values for boosting, (5) merge candidates with graph context, (6) Cohere rerank to top 8 results, (7) format as context block for MCP",
    rationale: "Combining vector similarity search with graph traversal and reranking provides both semantic relevance and relational context (reasoning chains) that vector search alone cannot provide",
    linked_code: "ripple-memory/src/retrieval/retrieve.ts; ripple-memory/src/retrieval/vectorSearch.ts; ripple-memory/src/retrieval/graphTraversal.ts; ripple-memory/src/retrieval/reranker.ts; ripple-memory/src/retrieval/formatter.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-mcp",
    fact: "Three new MCP tools are added to the existing ripple-mcp alongside list_concepts and get_concept_context: get_memory_context (query + project_id → full retrieval pipeline result), get_reasoning_chain (fact UUID or topic → Neo4j causal chain), and get_project_values (project_id → inferred patterns with evidence)",
    rationale: "New tools extend ripple-mcp to query live ripple-memory rather than static JSON files, enabling dynamic memory retrieval within Cursor",
    linked_code: "ripple-memory/src/mcp/"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory ingestion trigger",
    fact: "The ingestion trigger is a manual HTTP POST endpoint on ripple-memory; the Chrome extension sends all captured messages to this endpoint at the end of a session, the full pipeline runs, and a summary is returned",
    rationale: "Manual triggering avoids the complexity of always-on processing and allows quality validation before committing extracted facts",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory embedder",
    fact: "Each fact type has a canonical summary string template used for embedding generation; summaries are constructed differently per fact type (e.g., Decision includes conclusion, trigger, alternatives, and rejection reason; RejectedApproach includes approach, context, and rejection reason)",
    rationale: "Canonical per-type summary strings produce more consistent and meaningful embeddings than embedding raw JSON content",
    linked_code: "ripple-memory/src/storage/embedder.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory",
    fact: "The external service dependencies are: Supabase (PostgreSQL + pgvector), Neo4j AuraDB, Anthropic API (Claude for extraction), OpenAI API (text-embedding-3-small for embeddings), and Cohere API (rerank-english-v3.0 for reranking)",
    rationale: "Each service is chosen for a specific capability: Supabase for structured storage and vector search, Neo4j for graph traversal, Claude for structured extraction, OpenAI for embeddings, Cohere for reranking",
    linked_code: "ripple-memory/src/config/"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory facts schema",
    fact: "The facts schema includes a contributor_id field (or equivalent) to support multiple developers contributing to the same project graph",
    rationale: "When multiple developers work on a project and both interact with AI tools, their decisions should go into one shared project graph; contributor_id is cheapest to add at schema definition time",
    linked_code: "ripple-memory/src/types/"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 12,
    component: "ripple-memory",
    fact: "The product niche is coding-specific reasoning memory scoped to the project as the unit of memory, not per-person cognition modeling",
    rationale: "Modeling a person's general cognition is unfalsifiable and hard to validate early; project-scoped reasoning (why is this codebase built this way, what was decided, what was rejected, what assumptions everything depends on) is more defensible and directly useful for coding workflows",
    linked_code: "ARCHITECTURE.md"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 14,
    component: "ripple-memory/src/types.ts",
    fact: "Defines the Message type as { role: 'user' | 'assistant' | 'system', content: string, timestamp: number }, the ChunkBoundary Zod schema with start_index, end_index, topic, signal (decision|assumption|architecture|rejected|noise), and confidence (high|medium|low), and ChunkBoundaryResponseSchema wrapping an array of ChunkBoundary.",
    rationale: "Provides the shared data contract that all pipeline modules depend on; Zod validation ensures Claude API responses conform to the expected shape before being used downstream.",
    linked_code: "src/types.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 14,
    component: "ripple-memory/src/preFilter.ts",
    fact: "Implements a pure string-matching pre-filter that tags each Message with a hasSignal boolean flag using constant signal word lists (DECISION_SIGNALS, ASSUMPTION_SIGNALS, ARCHITECTURE_SIGNALS, REJECTION_SIGNALS) with no API calls.",
    rationale: "Provides a cheap, free first pass over messages before any paid API interaction; pure logic with no external dependencies.",
    linked_code: "src/preFilter.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 14,
    component: "ripple-memory/src/preFilter.ts",
    fact: "The preFilter's hasSignal flag is not used to exclude messages before sending to the Claude boundary-detection API call; the full conversation is sent to the chunker regardless of pre-filter results.",
    rationale: "Excluding messages flagged false risks silently dropping implicit decisions (e.g., 'yeah let's do that') that keyword matching cannot detect; Claude needs full conversational context for accurate boundary detection. The pre-filter's correct role is later in Layer 5 (extraction), not in Layer 4 (chunking).",
    linked_code: "src/preFilter.ts; src/chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 14,
    component: "ripple-memory/src/chunker.ts",
    fact: "Implements detectBoundaries(messages: Message[]): Promise<ChunkBoundary[]> by sending the full message array with index numbers to the Claude API (claude-sonnet-4-6), requesting only valid JSON matching the ChunkBoundaryResponseSchema, validating with Zod, logging errors and returning an empty array on failure, and filtering out noise-signal chunks before returning.",
    rationale: "Claude performs boundary detection on the complete conversation to avoid missing implicit decisions; Zod validation guards against malformed API responses; graceful degradation (empty array vs crash) keeps the pipeline running on API failure.",
    linked_code: "src/chunker.ts; src/types.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 14,
    component: "ripple-memory/src/overlap.ts",
    fact: "Implements addOverlap(chunks: ChunkBoundary[], overlapSize: number = 3): ChunkBoundary[] which adjusts each chunk's start_index to include up to 3 messages from the end of the previous chunk, clamped to not go below 0 or before the previous chunk's start.",
    rationale: "Prevents decisions or context that span a chunk boundary from being lost; ensures no content falls through the cracks at transition points between chunks.",
    linked_code: "src/overlap.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 14,
    component: "ripple-memory/src/test.ts",
    fact: "Orchestrates the full chunking pipeline in sequence: load conversation from test-data/sample-conversation.json → preFilter → detectBoundaries → addOverlap → print chunks (topic, signal, confidence, message count) and summary stats (total messages in, total chunks out, messages dropped as noise).",
    rationale: "Provides an end-to-end runnable test that validates the approach on real data without requiring production deployment.",
    linked_code: "src/test.ts; test-data/sample-conversation.json"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 14,
    component: "ripple-memory chunking pipeline",
    fact: "The chunking pipeline is structured as four sequential layers: preFilter (free string matching) → detectBoundaries via Claude API (Layer 4) → addOverlap → output chunks with noise filtered out.",
    rationale: "Separating concerns into discrete layers allows each step to be tested, replaced, or optimized independently; noise is filtered at the Claude layer, not pre-emptively, to preserve full context for boundary detection.",
    linked_code: "src/preFilter.ts; src/chunker.ts; src/overlap.ts; src/test.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 14,
    component: "ripple-memory chunking pipeline",
    fact: "The pre-filter's signal-word filtering role belongs in Layer 5 (extraction), not in Layer 4 (chunking/boundary detection).",
    rationale: "Using the hasSignal flag to exclude messages before boundary detection risks dropping implicit decisions that keyword matching cannot identify; filtering is appropriate at the extraction stage where already-identified chunks are evaluated for a more expensive extraction pass.",
    linked_code: "src/preFilter.ts; src/chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 14,
    component: "ripple-memory chunking pipeline",
    fact: "The boundary detection step uses Claude Sonnet (claude-sonnet-4-6) rather than a cheaper model for the initial validation phase.",
    rationale: "Using the strongest model for validation ensures that failures indicate a genuine problem with the chunking approach rather than insufficient model capability, avoiding the dual-unknown debugging problem.",
    linked_code: "src/chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 15,
    component: "chunking pipeline",
    fact: "The chunking pipeline uses a three-pass multi-stage LLM architecture: Pass 1 performs rough segmentation (finding topic boundaries), Pass 2 performs per-chunk classification (one Claude call per chunk), and Pass 3 performs final synthesis and contradiction checking across all classified chunks.",
    rationale: "Multi-pass, narrowly-scoped LLM calls is a validated pattern (evidenced by CDTA pipeline and LumberChunker research) that outperforms asking one Claude call to do everything at once. Each pass has one focused job, keeping individual calls small and accurate.",
    linked_code: "chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 15,
    component: "chunking pipeline - Pass 1",
    fact: "Pass 1 takes the entire raw conversation with index numbers as input and outputs only boundary positions with short topic labels (start_index, end_index, topic), performing no signal classification or fact extraction.",
    rationale: "Separating boundary detection from classification keeps each LLM call focused on a single task, improving accuracy and reducing cost.",
    linked_code: "chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 15,
    component: "chunking pipeline - Pass 2",
    fact: "Pass 2 runs one separate Claude call per chunk identified in Pass 1, receiving only that chunk's messages plus a one-line summary of the previous chunk's topic, and outputs a signal type (decision, assumption, architecture, rejected, open_question, or noise), confidence level, and one-sentence reasoning.",
    rationale: "Processing one chunk at a time with a narrow classification question keeps each call small and focused, which the research evidence supports as producing better results than one large classification call.",
    linked_code: "chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 15,
    component: "chunking pipeline - Pass 3",
    fact: "Pass 3 takes all classified chunk summaries (topic, signal, confidence, reasoning — not the full raw text) as input and identifies contradictions, supersessions, and noise chunks that connect real decisions, outputting flags with chunk indices, issue descriptions, and recommendations.",
    rationale: "Cross-chunk relationships like supersessions and contradictions are only visible at the full-conversation level, so a dedicated synthesis pass after per-chunk classification is required. Omitting the raw text keeps this pass cheap and focused.",
    linked_code: "chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 15,
    component: "signalAnalysis module",
    fact: "A signalAnalysis.ts module was planned to compute frequency, recency, structural, and linguistic pattern signals before Claude calls and include them as additional context in prompts — but this approach was superseded by the multi-pass chunking architecture.",
    rationale: "Research indicated that multi-pass focused LLM calls is a better-validated approach than elaborate pre-analysis signal stacking fed into a single Claude call.",
    linked_code: "signalAnalysis.ts; chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 15,
    component: "chunking pipeline - output",
    fact: "The output of the three-pass chunking pipeline is a clean list of chunks each tagged with signal type, confidence, and supersession flags, which is then passed forward to the fact extraction layer (Layer 5).",
    rationale: "Separating chunking and classification from fact extraction allows each stage to have a single responsibility and produces structured, enriched metadata for downstream processing.",
    linked_code: "chunker.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 15,
    component: "human review queue",
    fact: "A review_queue table in Postgres stores flagged chunks with the raw messages, Claude's extraction output, the reason for flagging (disagreement between runs, low confidence score, failed Zod validation), and a status field (pending, approved, rejected, edited).",
    rationale: "Human review targets only disagreements and low-confidence cases (~10-15% of chunks), keeping review time manageable while ensuring corrections become training signal for future model fine-tuning.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory chunking pipeline",
    fact: "The chunking pipeline is a three-pass system: Pass 1 (segmentation), Pass 2 (parallel classification), and Pass 3 (synthesis), each with a single focused job.",
    rationale: "Research into existing chunking/extraction pipelines supports narrowly-scoped sequential LLM calls over one large call trying to segment, classify, and reason simultaneously. A model asked one focused question per call is more reliable than one asked to do everything at once.",
    linked_code: "src/pass1Segmentation.ts; src/pass2Classification.ts; src/pass3Synthesis.ts; src/pipeline.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory Pass 1 — segmentation",
    fact: "Pass 1 makes a single API call with the full raw conversation and finds topic boundaries only, outputting a list of rough chunks with start_index, end_index, and topic label. No classification occurs in this pass.",
    rationale: "Segmentation is separated from classification so each pass has one focused job, improving reliability.",
    linked_code: "src/pass1Segmentation.ts; src/types.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory Pass 1 — segmentation",
    fact: "If Pass 1 parsing or Zod validation fails, the pipeline logs clearly and throws — Pass 1 failure is unrecoverable because it is the foundation the whole pipeline depends on.",
    rationale: "Without valid chunk boundaries from Pass 1, Pass 2 and Pass 3 cannot proceed at all.",
    linked_code: "src/pass1Segmentation.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory Pass 2 — classification",
    fact: "Pass 2 fires all chunk classification calls simultaneously via Promise.all (parallel execution), with each call processing only its own chunk's messages plus the previous chunk's topic label as one line of context.",
    rationale: "Parallel execution provides fault isolation — a single failed classification call does not block or corrupt the other calls. One throw must never break Promise.all, so classifyChunk never throws; it always resolves to a ChunkClassification with status 'success' or 'failed'.",
    linked_code: "src/pass2Classification.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory Pass 2 — classification",
    fact: "On any failure (API error, parse failure, validation failure), classifyChunk returns a classification with status: 'failed', signal: 'noise', confidence: 'low', and a reasoning string explaining the failure — it never throws.",
    rationale: "Since Pass 2 runs in parallel via Promise.all, a thrown exception from one call would break the entire batch. Every call must resolve to a usable value.",
    linked_code: "src/pass2Classification.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory Pass 2 — classification",
    fact: "The signal types for chunk classification are: 'decision', 'assumption', 'architecture', 'rejected', 'open_question', or 'noise', with confidence levels of 'high', 'medium', or 'low'.",
    rationale: "These categories represent the distinct types of meaningful content that can be extracted from a development conversation.",
    linked_code: "src/types.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory Pass 3 — synthesis",
    fact: "Pass 3 makes a single API call with only the topic, signal, confidence, and reasoning labels for all classified chunks (not raw message text) and flags contradictions, supersessions, or misclassified 'noise' chunks that connect real decisions.",
    rationale: "Pass 3 catches cross-chunk issues invisible at the single-chunk level. Using only labels rather than full text keeps the input small.",
    linked_code: "src/pass3Synthesis.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory Pass 3 — synthesis",
    fact: "On failure, Pass 3 logs and returns an empty array rather than throwing, so the pipeline still produces usable output without synthesis.",
    rationale: "Synthesis is valuable but not load-bearing — the pipeline should complete with partial output rather than fail entirely if Pass 3 errors.",
    linked_code: "src/pass3Synthesis.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory pipeline orchestration",
    fact: "The pipeline orchestration order is: Pass 1 → Pass 2 (parallel) → filter out 'noise' chunks (kept in stats but not passed forward) → Pass 3 on remaining classified chunks → assemble PipelineResult.",
    rationale: "Noise chunks are excluded from Pass 3 to avoid processing irrelevant content, but counted in stats for visibility.",
    linked_code: "src/pipeline.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory pipeline orchestration",
    fact: "The final PipelineResult type includes the merged chunk array (RoughChunk & ChunkClassification), synthesis flags, and stats: totalMessages, totalChunks, noiseChunks, failedChunks.",
    rationale: "Stats make failed and noise chunks explicitly visible rather than silently buried.",
    linked_code: "src/pipeline.ts; src/types.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory",
    fact: "The extraction pipeline runs as a background job, not in a live user-facing flow, so latency is not a design constraint.",
    rationale: "Developers use the platform throughout the week and refer back to it, not in real-time interactive sessions. This allows the design to optimize entirely for accuracy and reliability.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory chunking pipeline",
    fact: "Keyword-based pre-filtering (a standalone signalAnalysis.ts computing word frequency, hedging language, and contradiction phrases before the LLM sees the conversation) was explicitly rejected.",
    rationale: "Pre-filtering risks silently excluding a real decision before extraction has a chance to find it. Cost savings are negligible at this scale (cents), so the risk is not worth the marginal savings. The full conversation is always sent to Claude for Pass 1.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory chunking pipeline",
    fact: "Overlap injection — carrying a few messages of context across adjacent chunk boundaries — is part of the design to handle decisions that span multiple messages and risk being split across a Pass 1 boundary.",
    rationale: "A single decision can span multiple messages and be incorrectly split at a chunk boundary without overlap context.",
    linked_code: ""
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory",
    fact: "ripple-memory is a backend service (TypeScript files, terminal execution, API calls to Claude) with no frontend, no browser, and no user-facing screen.",
    rationale: "It is the same category as ripple-mcp and ripple-parser — a backend service whose interface is terminal output.",
    linked_code: "src/test.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory",
    fact: "The Claude model used for all pipeline calls is claude-sonnet-4-6.",
    rationale: "Sonnet is chosen for testing rather than Haiku based on accuracy requirements; cost is not a binding constraint at this scale.",
    linked_code: "src/pass1Segmentation.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory type definitions",
    fact: "All types are defined in src/types.ts with Zod schemas for runtime validation: RoughChunkResponseSchema, ClassificationResponseSchema (per-chunk, not array-wrapped), and SynthesisResponseSchema.",
    rationale: "Typed definitions with Zod validation ensure parse failures are caught explicitly at each pass rather than propagating silently.",
    linked_code: "src/types.ts"
  },
  {
    type: "ArchitectureFact",
    chunk_index: 16,
    component: "ripple-memory",
    fact: "The ANTHROPIC_API_KEY is loaded from a .env file via dotenv at the top of test.ts, and the process throws a clear error immediately if the key is missing.",
    rationale: "Failing fast with a clear message prevents mysterious deep failures during API calls.",
    linked_code: "src/test.ts"
  },
  {
    type: "OpenQuestion",
    chunk_index: 9,
    question: "What is the exact Cursor prompt to rebuild the landing page to capture the full Ripple vision (compounding intelligence, reasoning chains, proactive AI, knowledge graph differentiation)?",
    context: "The landing page redesign direction has been brainstormed in detail — new hero framing, proactive intelligence demo visual, compounding value section, knowledge graph section, reframed three-layer memory model, honest social proof — but the actual Cursor prompt to implement these changes has not yet been written or provided.",
    blocking: "Landing page redesign implementation in Cursor"
  }
];
