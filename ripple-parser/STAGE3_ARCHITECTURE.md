# Stage 3 Architecture

Stage 3 is the **cross-file reference layer** of the Ripple parser. It takes the per-file symbol graph from Stage 2 and links symbols across files using deterministic static analysis.

Stage 3 does not use LLMs, embeddings, or semantic reasoning. It produces structural graph facts only.

---

## Pipeline Position

```
Stage 1 (scanRepository)     → FileNode[]
Stage 2 (runStage2)          → CodeSymbol[] + CONTAINS, DEPENDS_ON, same-file CALLS
Stage 3 (runStage3)          → enriched graph + IMPORTS, EXPORTS, RE_EXPORTS, REFERENCES, cross-file CALLS
Stage 4+ (future)            → path aliases, package resolution, workspace indexing
ripple-core merger (future)  → ProjectState
```

Entry points:

- API: `runStage3(input)` in [`src/stage3/runStage3.ts`](src/stage3/runStage3.ts)
- CLI: `npx ts-node src/stage3/runStage3Cli.ts <repo-path>` (runs Stage 1 → 2 → 3)

---

## What Stage 3 Does

Stage 3 answers: **when file A uses something defined in file B, which exact symbol in B is it?**

It performs five jobs:

1. **Parse module surfaces** — For each TypeScript/JavaScript file, extract imports, exports, and re-exports (Babel AST with regex fallback).
2. **Build export and import indexes** — Catalog what each file exposes and what each file imports.
3. **Resolve import bindings** — Map import names to concrete `CodeSymbol` IDs, or to stable virtual targets for external/unresolved imports.
4. **Construct the reference graph** — Emit typed edges for imports, exports, re-exports, references, and cross-file calls.
5. **Finalize and validate** — Populate `FileNode.symbols[]`, enrich symbol adjacency arrays, sort output, and validate invariants.

### Edge types added by Stage 3

| Edge type | Meaning |
|-----------|---------|
| `IMPORTS` | File imports a resolved symbol, module, or virtual target |
| `EXPORTS` | File exports a local symbol |
| `RE_EXPORTS` | Barrel/re-export file forwards an export from another module |
| `REFERENCES` | Symbol uses an imported binding (value, call, jsx, or type) |
| `CALLS` | Cross-file function/component invocation (same-file CALLS remain from Stage 2) |

Stage 2 edges (`CONTAINS`, `DEPENDS_ON`, same-file `CALLS`) are preserved unchanged.

### Resolution targets

Stage 3 uses only canonical node types from [`ripple-core/schema.ts`](../ripple-core/schema.ts):

- `FileNode`
- `CodeSymbol` (types: `function`, `class`, `component`, `module`)

External and unresolved imports do **not** create new node types. They use stable virtual IDs:

- External: `sha256("external:" + normalizedSpecifier)`
- Unresolved: `sha256("unresolved:" + reason + …)`

---

## Inputs

### Public contract

```typescript
interface Stage3Input {
  repoPath: string;           // absolute or resolvable repository root
  files: FileNode[];          // Stage 1 output
  stage2: Stage2Result;       // { symbols, edges } from Stage 2
}
```

Defined in [`src/stage3/types.ts`](src/stage3/types.ts).

### Required upstream invariants

| Field | Requirement |
|-------|-------------|
| `files[].path` | POSIX relative paths (`/` separators) |
| `files[].contentHash` | SHA-256 hex of file contents |
| `files[].id` | `sha256(path)` |
| `stage2.symbols` | Sorted: path → startLine → name → type |
| `stage2.edges` | Sorted: fromId → toId → type → context |
| Symbol IDs | Anchor-based (from Stage 2 `symbolId.ts`) |
| Stage 2 edges | Must include all `CONTAINS`, `DEPENDS_ON`, same-file `CALLS` |

### What Stage 3 reads from disk

Stage 3 re-reads source files for **module-surface parsing only** (imports/exports/re-exports). It does not re-run Stage 2 symbol extractors.

Languages parsed in Stage 3:

- `typescript`
- `javascript`

All other languages pass through unchanged (no cross-file edges added).

### Internal boundary: FileAnalysis

Each file is converted into a `FileAnalysis` artifact before graph construction:

```typescript
interface FileAnalysis {
  file: FileNode;
  symbols: CodeSymbol[];              // from Stage 2
  surface: ModuleSurface;             // imports, exports, re-exports
  bodyTextBySymbolId: Record<string, string>;
}
```

Built by [`src/stage3/fileAnalysis.ts`](src/stage3/fileAnalysis.ts).

This boundary is designed so a future version can cache `FileAnalysis` by `contentHash` without changing resolution or edge-building logic.

---

## Outputs

### Public contract

```typescript
interface Stage3Result {
  files: FileNode[];      // same files, symbols[] populated
  symbols: CodeSymbol[];  // enriched calls[] and referencedBy[]
  edges: Edge[];          // Stage 2 edges + Stage 3 edges, deduped, sorted
  report: BuildReport;    // diagnostics and summary counts
  resolutionSnapshot: ResolutionSnapshot;  // stable input for Stage 4
}
```

### Output invariants

| Property | Guarantee |
|----------|-----------|
| `symbols` | Same IDs as Stage 2; only `calls[]` and `referencedBy[]` may grow |
| `edges` | Superset of Stage 2 edges; no Stage 2 edge removed or mutated |
| `files[].symbols[]` | Sorted list of symbol IDs defined in that file |
| Edge dedup key | `${fromId}:${toId}:${type}:${context}` |
| Edge IDs | `sha256(fromId + toId + type + context)` |
| `createdAt` | `0` on all parser edges |
| Sort order | Files, symbols, and edges sorted deterministically |

### BUILD_REPORT

Every run produces a `BuildReport` (`version: "stage3-v1"`) with:

- Summary counts (files, symbols, edges, resolved/unresolved imports, cross-file calls, references)
- Unresolved paths, exports, and aliases
- Circular re-export chain detections
- Surface parse fallback files
- Export ambiguities and orphan exports

`generatedAt` is fixed at `0` for determinism.

### Example cross-file graph

```typescript
// auth.ts
export function login() {}

// app.ts
import { login } from "./auth";
login();
```

Stage 3 produces:

```
app.ts          --IMPORTS[named:login]-->     login (auth.ts)
auth.ts         --EXPORTS[export-named:login]--> login
app.main()      --REFERENCES[call]-->          login
app.main()      --CALLS[]-->                   login
```

---

## Guarantees

### Determinism

Stage 3 is designed for byte-identical output across runs on the same input:

- No randomness, no timestamps (except fixed `createdAt: 0`)
- Files processed in path-sorted order
- Bindings, exports, and edges collected in deterministic order
- Anchor-based symbol IDs inherited from Stage 2
- POSIX path normalization before hashing

Verified by:

- 11/11 fixture tests: `npm run verify:stage3`
- Real-world repos: `npm run validate:stage3-real`

### Graph completeness

Unresolved and external imports produce explicit edges to virtual targets. Stage 3 never silently drops a broken link.

### Cycle safety

Circular re-export chains terminate via visited-set guards. Cycles are recorded in `BuildReport.circularChains` and emit unresolved targets — the pipeline does not hang or stack-overflow.

### Stage 2 preservation

Stage 3 extends the Stage 2 graph. It never removes or rewrites Stage 2 edges or symbol IDs. Validated by [`src/stage3/validator.ts`](src/stage3/validator.ts).

### AI-free operation

No LLMs, embeddings, vector databases, or semantic inference. All output is repository-local and reproducible.

---

## Known Limitations

These are intentional Stage 3 boundaries. They are deferred to Stage 4 or later unless a validation sprint reveals a true bug.

### Resolution

| Limitation | Behavior |
|------------|----------|
| tsconfig/jsconfig path aliases (`@/`, `~/*`) | Emits unresolved virtual target |
| `node_modules` package entry resolution | Emits external virtual target (specifier hash only) |
| Monorepo workspace packages (`@org/pkg`) | Emits external/unresolved; no package boundary expansion |
| TypeScript typechecker | Not used; no type-aware resolution |
| Type-only import erasure | `REFERENCES[type]` emitted when detected; no full TS type graph |
| Dynamic `import()` with non-literal paths | Not resolved |
| CommonJS `module.exports` interop | Partial; ES module syntax is primary |
| Non-TS/JS languages | No cross-file edges added |

### Reference detection

| Limitation | Behavior |
|------------|----------|
| Namespace member access | Single level only (`Auth.login()`); nested chains (`Auth.user.getName()`) not resolved |
| JSX vs call classification | JSX checked before call; external JSX targets remain virtual |
| Body text derivation | Inferred from line ranges, not full AST bodies |
| Re-export `export *` to external packages | One edge to external target; symbols not expanded |

### Scale

| Status | Detail |
|--------|--------|
| Verified | Up to ~127k LOC / ~1,400 files (cal.com apps/web) in ~8s, ~540 MB heap |
| Not yet verified | 5k–50k file synthetic stress benchmarks |
| Future | Incremental re-run via cached `FileAnalysis` (architecture ready, not implemented) |

### Diagnostics that look like errors but are expected

When validating against real React/Next.js repos, many `REFERENCES[jsx]` edges point to external virtual targets (e.g. `next/link`, `react-router-dom`). This is correct Stage 3 behavior — the graph records the reference even when the target symbol is outside the repository.

---

## Module Layout

```
src/stage3/
  runStage3.ts              Orchestrator
  runStage3Cli.ts           CLI entry (Stage 1 + 2 + 3)
  types.ts                  Public and internal contracts
  fileAnalysis.ts           FileAnalysis artifact builder
  parseModuleSurface.ts     Babel import/export/re-export parser
  indexes.ts                Export and import indexes
  exportCatalog.ts          export* expansion (listResolvedExports)
  symbolResolver.ts         Import/export binding resolution
  referenceGraph.ts         Edge construction orchestration
  namespaceReferences.ts    Namespace import member references
  edgeUtils.ts              Deterministic edge deduplication
  finalizeGraph.ts          Symbol/file enrichment and sorting
  buildReport.ts            BUILD_REPORT assembly
  validator.ts              Output invariant checks
```

Shared utilities reused from Stage 2: `resolveImport.ts`, `symbolId.ts`, `callsMatcher.ts`, `sorter.ts`, `stripCommentsAndStrings.ts`, `readFile.ts`.

---

## Verification

| Suite | Command | Purpose |
|-------|---------|---------|
| Fixture tests (11 scenarios) | `npm run verify:stage3` | Semantic edge correctness + determinism |
| Real-world OSS repos | `npm run validate:stage3-real` | React/Next.js stress on bulletproof-react, vercel-commerce, cal.com |

Reports:

- [`fixtures/stage3/verification-report.json`](fixtures/stage3/verification-report.json)
- [`fixtures/stage3-real/real-world-validation-report.json`](fixtures/stage3-real/real-world-validation-report.json)

---

## Status

Stage 3 is **spec-complete** and **fixture-verified** (11/11 pass, determinism confirmed).

Real-world validation on three open-source repositories found no architecture-breaking bugs. Remaining confidence gaps are scale testing (multi-thousand-file repos) and Stage 4 resolution features — not fundamental Stage 3 design flaws.

Stage 3 code should remain frozen until a validation sprint or Stage 4 requirement identifies a confirmed defect.
