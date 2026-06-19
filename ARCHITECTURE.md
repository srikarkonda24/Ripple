# Ripple — Architecture

## What Ripple Is
A persistent memory and context layer for software projects 
built with AI. Ripple captures the reasoning, decisions, and 
evolution of a project across Claude chats, Cursor sessions, 
and GitHub commits — then exposes that memory to AI tools 
via MCP so every session starts with full context instead 
of zero.

## The Problem We Solve
AI coding tools (Claude, Cursor, Codex) are stateless. Every 
session starts from scratch. Developers re-explain architecture, 
re-debate settled decisions, watch AI repeat approaches already 
tried and rejected. As projects grow and AI does more of the 
building, this gets worse not better.

## Positioning
Ripple is coding-specific persistent memory. Not general 
cognition (Exo), not code visualization (CodeViz) — the 
reasoning memory layer specifically for software projects 
built with AI agents.

## Core Components
## ripple-parser Architecture

The parser builds a repository graph in layers.

Stage 1 → Stage 2 → Stage 3 → Stage 4+

### Stage 1 — Repository Discovery

Answers:

"What files exist?"

Outputs:
- FileNode records
- Content hashes
- Stable file IDs

### Stage 2 — Symbol Extraction

Answers:

"What symbols exist inside each file?"

Outputs:
- CodeSymbol nodes
- CONTAINS edges
- Same-file CALLS edges

### Stage 3 — Cross-File Resolution

Answers:

"When file A uses something from file B,
which exact symbol is being referenced?"

Outputs:
- IMPORTS
- EXPORTS
- RE_EXPORTS
- REFERENCES
- Cross-file CALLS

Stage 3 is deterministic, repository-local,
and contains no LLM reasoning.
### Parser Validation

Stage 3 has been validated against:

- Bulletproof React
- Vercel Commerce
- Cal.com

Results:

- Deterministic output across repeated runs
- No crashes
- No circular re-export hangs
- Successful barrel resolution
- Successful cross-file call resolution

Current limitations are primarily Stage 4 concerns:
- tsconfig aliases
- workspace packages
- npm package exports resolution
### Stage 4 — Resolution Overlay

Stage 4 is a pure rewrite pass over Stage 3 edge targets. It does not parse, extract symbols, or construct graphs.

```
Stage3Result → buildSymbolIndex → ResolverAdapter → EdgeRewriteMap → applyEdgeRewrites
```

Responsibilities:

- tsconfig/jsconfig path alias resolution (implemented)
- npm package / workspace resolution (planned)
- Cross-file target upgrades via language-specific `ResolverAdapter`

See [`ripple-parser/STAGE4_ARCHITECTURE.md`](ripple-parser/STAGE4_ARCHITECTURE.md).

### Stage 5+

Parser enhancements only if required by memory retrieval quality.
### ripple-parser

Deterministic static code intelligence engine.

Ripple Parser converts a repository into a canonical graph of files,
symbols, imports, exports, references, and call relationships.

The parser is intentionally AI-free.

Its job is to establish structural truth about a codebase before any
memory, retrieval, reasoning, or LLM processing occurs.

Current pipeline:

Stage 1 — Repository Discovery
- File scanning
- Content hashing
- FileNode creation

Stage 2 — Symbol Extraction
- Functions
- Classes
- Components
- Modules
- Same-file call relationships
- Deterministic symbol IDs

Stage 3 — Cross-File Resolution
- Import resolution
- Export indexing
- Barrel file resolution
- Re-export chains
- REFERENCES edges
- IMPORTS edges
- EXPORTS edges
- RE_EXPORTS edges
- Cross-file CALLS

The parser produces a canonical graph consumed by ripple-memory.

### ripple-mcp
MCP server exposing Ripple's memory to Cursor and Claude Code.
Currently has two tools: list_concepts, get_concept_context.
Will be extended to expose the full memory system once 
ripple-memory is built.

### ripple-extension
Chrome extension (Manifest V3) running on claude.ai only.
Captures conversations in real time via MutationObserver.
Stores messages in chrome.storage with role, content, 
timestamp. Has paste import for filling historical gaps.
This is the first ingestion source — Cursor and GitHub 
commits come later.

### ripple-landing
Next.js marketing site. Pitch: persistent memory for 
AI-assisted software development.

### ripple-memory
The core of the product. The brain. TypeScript pipeline 
package at the workspace root. Three memory types working 
together:
- Episodic: what happened and when (timeline of the project)
- Semantic: what things mean and how they connect (knowledge graph)
- Reasoning: why decisions were made (causal chains, alternatives 
  considered, what was rejected and why)

## ripple-memory Architecture

### Storage — two databases working together

**PostgreSQL + pgvector (via Supabase)**
Primary structured store. Every extracted fact lives here 
as a typed record. pgvector extension adds semantic search 
directly inside Postgres — no separate vector database needed.

**Neo4j (via AuraDB free tier)**
Knowledge graph. Stores nodes and relationships:
- Decision nodes
- Problem nodes  
- Component nodes (linked to actual code via ripple-parser)
- Assumption nodes
- RejectedApproach nodes
Relationships: CAUSED_BY, SUPERSEDES, CONTRADICTS, 
AFFECTS, DEPENDS_ON, IMPLEMENTED_BY

### Pipeline
Raw conversation → chunking (three-pass sub-pipeline, see 
below) → extraction → Zod validation → dual storage 
(Postgres + Neo4j) + embeddings (pgvector)

**No LangChain. No LlamaIndex.**
Pipeline written directly in TypeScript. Every step owned 
and understood. Abstraction frameworks hide exactly the 
parts that need to be controlled for quality.

**Chunking and extraction use Claude API.**
Chunking groups messages by semantic topic/decision thread, 
via three focused passes (see Chunking Strategy below).
Extraction uses structured JSON schemas — one per fact type.
Zod validates every LLM response before it touches storage.

**Every record includes project_id from day one.**
All facts, chunks, and graph nodes are scoped to a project.

**Embeddings: OpenAI text-embedding-3-small**
Called after extraction, before storage. Each fact gets 
embedded and stored in pgvector alongside the structured 
record in Postgres.

**Reranking: Cohere Rerank API**
Called at retrieval time. After vector search returns 
top candidates, Cohere reranks by actual relevance to 
the query. Improves retrieval quality significantly.

### Fact Types and Schemas

**Decision**
- conclusion: what was decided
- trigger: what prompted this decision
- alternatives_considered: what else was evaluated
- rejected_because: why alternatives were ruled out
- assumptions: what this decision depends on being true
- confidence: high | medium | low
- revisit: whether this should be reconsidered later
- linked_components: code components this affects (from ripple-parser)

**RejectedApproach**
- approach: what was tried or considered
- context: why it was tried
- outcome: what happened or was concluded
- rejected_because: specific reason it didn't work
- lessons: what this taught us

**ArchitectureFact**
- component: what system/module this describes
- fact: the architectural truth
- rationale: why it's built this way
- linked_code: actual files/functions from ripple-parser output

**Assumption**
- statement: what is being assumed to be true
- decisions_that_depend_on_it: linked decision nodes
- risk: what happens if this assumption turns out to be wrong

**OpenQuestion**
- question: what is unresolved
- context: why this matters
- blocking: what decisions or work this blocks

**ProjectValue**
- pattern: a principle this project consistently applies
- evidence: decisions that demonstrate this pattern
- strength: how consistently this appears

### Chunking Strategy — Three-Pass Pipeline

Chunking is not a single LLM call. It's three distinct 
passes, each with one focused job. This sub-pipeline runs 
before extraction and produces the chunks extraction operates on.

**Pass 1 — Segmentation**
Input: full raw conversation, one call.
Job: find topic boundaries only. No classification yet.
Output: rough chunks (start_index, end_index, topic label).

**Pass 2 — Classification (parallel)**
Input: each rough chunk, processed independently and 
simultaneously via Promise.all, with the previous chunk's 
topic as minimal context.
Job: classify signal type (decision | assumption | 
architecture | rejected | open_question | noise), 
confidence, and reasoning — one focused judgment per chunk.
Output: every chunk tagged with signal, confidence, reasoning.

Parallel execution is chosen for fault isolation, not 
primarily speed — latency does not matter since extraction 
runs in the background, not in a live user-facing flow. 
A single failed classification call must never throw or 
block the others; it resolves to a "failed" status and 
gets queued for review while the rest complete normally.

**Pass 3 — Synthesis**
Input: all classified chunks together (labels only, not 
raw text).
Job: catch cross-chunk issues invisible at the single-chunk 
level — contradictions, supersessions, misclassified "noise" 
chunks that actually connect two real decisions.
Output: a list of flags, each pointing at specific chunk 
indices with the issue and a recommendation. Failure here 
is non-fatal — the pipeline still produces usable output 
without Pass 3's flags.

**Why three passes instead of one call:** research into 
existing chunking/extraction pipelines (CDTA, LumberChunker, 
Hindsight) supports narrowly-scoped sequential LLM calls 
over one large call trying to segment, classify, and reason 
simultaneously. A model asked one focused question per call 
is more reliable than one asked to do everything at once. 
Hindsight specifically favors coarse, narrative-preserving 
chunks over many small fragmented ones — chunking should 
not over-fragment via aggressive rule-based splitting.

**What was explicitly rejected:** a standalone 
signalAnalysis.ts module computing word frequency, hedging 
language, and contradiction phrases as a pre-filter before 
the LLM ever sees the conversation. Risk: silently excluding 
a real decision before extraction has a chance to find it. 
Cost savings from pre-filtering are negligible at this scale 
(cents either way), so the risk isn't worth the marginal 
savings. The full conversation is always sent to Claude 
for Pass 1 — nothing is excluded based on keyword heuristics.

A single decision can still span multiple messages and 
risk being split across a Pass 1 boundary. Overlap injection 
(a few messages of context carried across adjacent chunk 
boundaries) remains part of the design to mitigate this.

Model choice for testing: Claude Sonnet, not Haiku, for 
initial validation of this approach — using the strongest 
model first isolates whether the *method* works, before 
optimizing for cost with a cheaper model later.

### Retrieval
Not just vector search. Three things combined:

1. Semantic search (pgvector) — find facts similar to the query
2. Graph traversal (Neo4j) — follow reasoning chains from 
   matched nodes to related decisions, assumptions, components
3. Pattern awareness — apply known project values to filter 
   and rank results

Output: relevant facts + the reasoning chains behind them + 
applicable project values. This is what gets injected into 
a new session via ripple-mcp.

## Key Decisions Made

| Decision | Why | What Was Rejected |
|----------|-----|-------------------|
| No LangChain/LlamaIndex | Own every step of the pipeline | LangChain (abstracts too much) |
| pgvector inside Postgres | One database not two | Pinecone, Weaviate (separate DBs) |
| Neo4j for graph | Purpose-built graph DB, best traversal | Graph layer on top of Postgres |
| Coding-specific only | Deeper value, clearer wedge | General cognition like Exo |
| Local-first initially | Privacy, faster to test | Hosted-first |
| OpenAI for embeddings | Best quality, well supported | Local models (quality tradeoff) |
| Write pipeline ourselves | Control and quality | LangChain orchestration |
| Cohere for reranking | Best reranking API, free tier | No reranking (lower quality) |
| Supabase for Postgres | Free tier, pgvector built in | Self-hosted Postgres |
| Neo4j AuraDB | Free tier, no setup | Self-hosted Neo4j |
| Three-pass chunking | Narrow LLM calls more reliable than one large call | Single-call chunking, rule-based pre-filtering |
| Parallel Pass 2 | Fault isolation — one failure doesn't block others | Sequential per-chunk calls |
| No pre-filter before Pass 1 | Risk of silently excluding real decisions outweighs small cost savings | signalAnalysis.ts keyword pre-filtering |

## What NOT to Suggest to Cursor
- LangChain or LlamaIndex for orchestration
- Pinecone, Weaviate, or any separate vector database
- Flat files or markdown for memory storage
- SQLite instead of Postgres (won't scale, no pgvector)
- Generic memory approaches not specific to software
- Visualization dashboards (tested June 14, rejected)
- Enterprise sales motion (unreachable at current stage)
- Full-stack cloud integrations before core memory works
- Rule-based keyword pre-filtering before chunking's Pass 1
- Single-call chunking that skips classification/synthesis passes

## Build Principles

This document is a living document. Decisions are recorded 
here as each layer is built — not as hypothetical choices 
made in advance.

Decisions are made at the layer they affect, not before.

### Locked
- The six fact types and their schemas (see Fact Types above)
- No LangChain, no LlamaIndex, no separate vector database
- Claude API for chunking and extraction
- OpenAI for embeddings, Cohere for reranking
- Supabase + Neo4j AuraDB for storage
- TypeScript pipeline written directly, no orchestration frameworks
- project_id on every record from day one
- Three-pass chunking pipeline (segmentation, parallel 
  classification, synthesis) — see Chunking Strategy
- No pre-filtering of messages before Pass 1

### Deferred until the relevant layer
- Postgres/Neo4j sync strategy → storage layer
- Embedding field selection per fact type → embedding layer
- Graph edge creation mechanics → storage layer
- ProjectValue retrieval boost mechanics → retrieval layer
- Fate of existing MCP tools → ripple-mcp extension layer
- Two-pass extraction (explicit vs implicit) cost optimization 
  (Haiku first pass, Sonnet for flagged chunks) → extraction layer, 
  after chunking quality is validated

## Build Order
1. Schema design (done — see Fact Types above)
2. Chunking pipeline (three-pass: segmentation, classification, 
   synthesis) — in progress
3. Extraction pipeline (Claude API + Zod schemas)
4. Storage layer (Supabase + Neo4j setup)
5. Embedding pipeline (OpenAI + pgvector)
6. Retrieval layer (vector search + graph traversal + reranking)
7. ripple-mcp extension (new tools exposing memory system)
8. Additional ingestion sources (Cursor, GitHub commits)

Decisions are made at the layer they affect, not before.

## APIs Required
- Anthropic API key — chunking and extraction (Claude)
- OpenAI API key — embeddings (text-embedding-3-small)
- Cohere API key — reranking (free tier)
- Supabase project — Postgres + pgvector
- Neo4j AuraDB instance — knowledge graph

## Future ML Layer
Once enough data exists:
- Fine-tune extraction model on software-specific decisions
- Fine-tune embeddings on developer conversations
- Graph neural network for pattern detection across Neo4j graph
- Contradiction detection across the knowledge graph

## Language Strategy

Ripple stores language-neutral graph primitives. Parsers and resolvers are
language-specific adapters. The graph model does not change when a new
language is added.

### Core graph concepts

All adapters emit the same canonical types defined in `ripple-core/schema.ts`:

- **FileNode** — one source file (`language: string` only; no file-level metadata yet)
- **CodeSymbol** — named code entity; optional `languageKind` and `metadata` for language-specific detail
- **Edge** — directed relationship between graph IDs

Edge types used today: `CONTAINS`, `DEPENDS_ON`, `CALLS`, `IMPORTS`, `EXPORTS`,
`RE_EXPORTS`, `REFERENCES`.

Graph traversal uses `type`, `calls`, `referencedBy`, and `Edge.type` only.
Language-specific constructs (TS interfaces, Rust traits, Go structs, React
components) are stored on `CodeSymbol.languageKind` and `CodeSymbol.metadata`,
not as new core types.

### Adapter model

Contracts live in `ripple-core/interfaces/`:

- **ParserAdapter** — `parseFile(input)` → `{ symbols, edges, moduleSurface }`
- **ResolverAdapter** — `resolveImport(...)`, `resolveSymbol(...)` (Stage 4 entry point)

`moduleSurface` is typed as `AdapterModuleSurface` (`{ language: string }`).
Each adapter extends it internally; core never imports language-specific shapes.

### Folder layout

```
ripple-core/
  schema.ts              # canonical graph + memory model
  interfaces/            # ParserAdapter, ResolverAdapter contracts

adapters/
  typescript/            # TypeScript/JavaScript adapter (scaffold only today)
    parser/
    resolver/
```

Future languages (Python, Go, Rust, Java) are documented here and added as
`adapters/<lang>/` when work begins — not as empty placeholder folders.

### Stage mapping

| Stage | Responsibility | Location |
|-------|----------------|----------|
| 1 | Repository discovery → `FileNode[]` | ripple-parser (neutral) |
| 2–3 | Parse + cross-file resolution | ripple-parser orchestration calling adapters |
| 4 | Edge-target resolution overlay | `runStage4` + `ResolverAdapter` implementations |

Stage 1–3 orchestration stays in ripple-parser. Stage 4 resolution rules
extend adapter `config` — not ripple-core schema, not neutral graph assembly.

### Adding a language

1. Create `adapters/<lang>/parser` implementing `ParserAdapter`
2. Create `adapters/<lang>/resolver` implementing `ResolverAdapter`
3. Do not modify `FileNode`, `EdgeType`, or `SymbolType` unless a schema change in ripple-core is justified