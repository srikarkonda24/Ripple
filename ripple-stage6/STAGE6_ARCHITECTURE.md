# Stage 6 PR Intelligence — Architecture (MVP Phase 1)

**Authority:** Reniel — Stage 6 Technical Lead  
**Status:** Phase 1–6 contracts frozen — implementation-binding for orchestration layer

---

## 1. Stage 6 Identity

Stage 5 determines what relationships exist. Stage 6 exposes those relationships at the developer decision point.

Stage 6 is **orchestration and presentation only**. It is not a graph engine, prediction system, AI reviewer, or replacement for Stage 5.

---

## 2. Boundary Split

| System | Responsibility |
|--------|----------------|
| GitHub | Repository context, PR metadata, SHAs, diffs; Checks and comments (publish only) |
| Stage 6 | `PRChange`, symbol resolution (injected index), deterministic queries, report formatting |
| Stage 5 | Execution, `Evidence`, graph truth |

Stage 6 must **not** parse repositories or construct graph snapshots (no `ripple-parser` in MVP). Snapshot access is via an injected `SnapshotProvider` (Phase 5+).

---

## 3. AnalysisIdentity

Identity is the tuple:

**Repository + Pull Request Number + Head Commit SHA**

All three fields are required. Identity is immutable once created.

### Canonical key

```
repository#pullRequestNumber@headCommitSha
```

Example: `acme/checkout-web#2847@a1b2c3d4e5f6789012345678901234567890abcd`

### Normalization rules

| Field | Rule |
|-------|------|
| `repository` | Trim whitespace; remove trailing `.git`; must be exactly `owner/repo`; **owner and repo lowercased** |
| `pullRequestNumber` | Positive integer |
| `headCommitSha` | Trim; lowercase; hexadecimal characters only |

Duplicate webhook deliveries with the same normalized identity must resolve to the **same** stored analysis. No automatic rerun on duplicate (MVP).

---

## 4. Lifecycle state machine

Success path:

```
Queued → Running → Completed
```

Failure path:

```
Queued → Running → Failed
```

Terminal states: `Completed`, `Failed` (no outbound transitions in MVP).

**Invalid examples (must throw):**

- `Completed → Running`
- `Failed → Running` (no MVP retry policy)
- `Queued → Completed` (must pass through `Running`)

---

## 5. AnalysisRecord

Persisted fields:

- `identity`
- `status`
- `createdAt`
- `updatedAt`
- `failureReason` (optional)
- `report` (optional `ImpactReport`)

---

## 6. Frozen invariants (all phases)

### Repository immutability

Allowed: read repo/PR; publish Checks and comments.  
Forbidden: commits, branch writes, file edits, merges.

### Evidence monotonicity

Stage 6 output ⊆ Stage 5 `Evidence`. Stage 6 may organize, rank, summarize, and present only.

### Symbol resolution fail-closed

No resolved symbol ⇒ no impact analysis. No heuristics, fuzzy matching, or guessing.

### Query determinism

Identical GSID + `PRChange` + resolved symbols ⇒ identical query set and parameters (Phase 4+).

---

## 7. MVP query types (Phase 4+)

Closed set: `CALLERS`, `DEPENDENCIES`, `IMPACT`, `PATH`.  
Do not add `REFERENCES` or other types in MVP without architecture review.

---

## 8. Phase 1 scope

Phase 1 delivers package foundation, domain models, lifecycle validation, `AnalysisStore`, and `AnalysisRunner` skeleton **without** GitHub, Stage 5 execution, or parser integration.

---

## 9. Phase 2 — GitHub event boundary

Phase 2 adds read-only GitHub ingress only. No diff retrieval, `PRChange`, symbol resolution, Stage 5, Checks, or comments.

### MVP webhook events

| Allowed | Rejected (examples) |
|---------|---------------------|
| `pull_request` + `opened` | `pull_request` + `closed`, `merged`, `edited`, `reopened`, `review_requested` |
| `pull_request` + `synchronize` | Non-`pull_request` events (e.g. `issues`) |

### Webhook flow

```
Raw body + X-Hub-Signature-256
  → HMAC validation (GITHUB_WEBHOOK_SECRET)
  → X-GitHub-Event allowlist
  → pull_request action allowlist
  → AnalysisIdentity extraction
  → AnalysisRunner.receiveRequest (idempotent AnalysisStore)
```

### GitHub App authentication

Environment variables only:

- `GITHUB_APP_ID`
- `GITHUB_PRIVATE_KEY` (PEM; `\n` escaped in env allowed)
- `GITHUB_WEBHOOK_SECRET`

`appAuth.ts` creates RS256 App JWTs and exchanges them for installation access tokens via GitHub REST. Secrets and tokens must never be logged.

---

## 10. Phase 3 — PRChange normalization

Phase 3 transforms read-only GitHub diff material into deterministic `PRChange` objects. No symbol resolution, graph types, or Stage 5 imports.

### Components

| Module | Role |
|--------|------|
| `DiffRetriever` | Read-only `GET /repos/{owner}/{repo}/pulls/{n}/files` |
| `PRChangeBuilder` | Normalize paths, SHAs, file order, unified-diff line ranges |

### Normalization rules

| Field | Rule |
|-------|------|
| `baseSha` / `headSha` | Lowercase hex |
| File paths | Forward slashes; strip leading `./`; reject `..`; sort paths ascending (byte order) |
| Line ranges | Parsed from unified diff `+` hunk headers; merge adjacent/overlapping ranges |
| Empty diff | Valid `PRChange` with `files: []` |
| Malformed patch | Fail closed (`PRChangeValidationError`) |

Identical raw diff bytes must produce identical serialized `PRChange`.

---

## 11. Phase 4 — Symbol resolution and query generation

Phase 4 maps `PRChange` + injected `SymbolIndex` → `ResolvedSymbol[]` → deterministic `ImpactQuery[]`. Stage 6 asks questions; Stage 5 answers them.

### SymbolIndex (injected)

Spans bound to `GsidRef.id`. Missing GSID throws `SymbolIndexError` (fail closed).

### Resolution rule

Changed line range **overlaps** `SymbolSpan` on the same normalized file path ⇒ resolve `nodeId`. No name guessing, fuzzy match, parser, or graph traversal.

Zero resolved symbols ⇒ `emptyReason: NO_RESOLVED_SYMBOLS` and **no queries**.

### ImpactQueryBuilder (MVP closed set)

`CALLERS`, `DEPENDENCIES`, `IMPACT`, `PATH` only — not `REFERENCES`.

Ordering:

1. `nodeId` ascending  
2. Query type order: `CALLERS`, `DEPENDENCIES`, `IMPACT`, `PATH`  
3. PATH endpoints sorted by `targetId` ascending  

`WorkflowCatalog` supplies PATH targets; empty catalog ⇒ no PATH queries.

---

## 12. Phase 5 — Stage 5 integration and evidence consumption

Stage 6 executes Stage 5 through an adapter only. Graph truth remains in Stage 5.

| Component | Role |
|-----------|------|
| `SnapshotProvider` | Injected `SnapshotMaterial` by GSID (fixture-backed in MVP) |
| `GsidFactory` | Maps explicit snapshot binding inputs to `GsidRef` / Stage 5 `GSID` |
| `Stage5Gateway` | `ImpactQuery` → `runPipeline` → `Evidence` (no mutation) |
| `ImpactInterpreter` | `Evidence` → `ImpactClaim` (fail closed when unsupported) |

Evidence fields (`evidenceId`, `graphPath`, `executionSteps`, `gsid`) must pass through unchanged. No `ripple-parser`, no graph traversal in Stage 6.

---

## 13. Phase 6 — Reporting and GitHub publishing

| Component | Role |
|-----------|------|
| `ImpactReportBuilder` | Deterministic final report from verified claims |
| `formatCheckOutput` / `formatCommentBody` | Template-only developer-visible text |
| `GitHubCheckPublisher` | Checks API write with deterministic summary |
| `GitHubCommentPublisher` | Sticky PR comment keyed by `AnalysisIdentity` marker |
| `AnalysisPipeline` | Webhook-to-report chain for tests and orchestration |

Publishing remains limited to Checks and PR comments. No repository mutation.

---

## 14. Package layout

```
ripple-stage6/
  core/           Domain models and lifecycle rules
  github/         App auth and webhook ingress (Phase 2)
  prchange/       Diff retrieval and PRChange builder (Phase 3)
  resolution/     SymbolIndex and SymbolResolver (Phase 4)
  queries/        ImpactQueryBuilder (Phase 4)
  integration/    SnapshotProvider, Stage5Gateway, interpreter (Phase 5)
  reporting/      ImpactReport builder and formatters (Phase 6)
  orchestration/  Store and runner
  fixtures/       Test fixtures
  tests/          node:test suites
```

Sibling to `ripple-stage5`. Domain models remain package-local; `ripple-core` schema is unchanged for MVP.

Phase 5 integration maps `GsidRef` to Stage 5 `GSID` (same field layout as `ripple-stage5/core/GSID.ts`).
