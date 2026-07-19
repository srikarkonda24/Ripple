# Stage 5 Phase 2 — Compiler Contract (Frozen)

**Authority:** Reniel — Stage 5 Lead  
**Approvals:** Srikar (Compiler), Josh (Graph), RK (Verification)  
**Status:** FROZEN — implementation-binding

---

## 1. Semantic vs Computational Split

| Authority | Owner | Owns |
|-----------|-------|------|
| **Semantic** | Compiler | Query interpretation, operator selection, ExecutionDAG construction, dependency constraints, ordering constraints, EVID binding |
| **Computational** | Executor | Operator realization, deterministic traversal, graph computation, state transitions, ExecutionTrace |

- `ExecutionDAG` is the **complete semantic program**.
- Executor is computational, **not semantic**. No semantic authority at runtime.
- Compiler answers: "What computation must exist?"
- Executor answers: "How do we faithfully realize the already-defined computation?"

---

## 2. Layer Responsibilities (G6)

| Layer | Owns | Forbidden |
|-------|------|-----------|
| Compiler | Semantic program emission | Graph traversal, path selection, visit lists |
| ExecutionDAG | Immutable canonical semantic program | Runtime mutation, added semantics |
| Executor | Faithful realization | New semantics, invented dependencies |
| Graph / Snapshot | Immutable domain, node/edge identity | Execution |
| Evidence | Trace → evidence derivation only | Graph access, inference, replay logic |

---

## 3. Graph Invariants G1–G6

| ID | Invariant |
|----|-----------|
| G1 | Snapshot Immutability — topology never changes during execution |
| G2 | Stable Identity — every DAG-referenced node/edge resolves uniquely within GSID snapshot |
| G3 | Explicit Dependency Encoding — no execution dependency discovered during execution |
| G4 | Deterministic Reachability — identical ExecutionDAG + identical GSID → identical operator visitation |
| G5 | Execution Isolation — execution observes exactly one immutable snapshot |
| G6 | Separation — Graph = domain; Compiler = program; Executor = realization |

---

## 4. Operator Closed Set

| Operator | Declarative params only |
|----------|-------------------------|
| `RESOLVE_TARGET` | `{ targetId: string }` |
| `FILTER_EDGES` | `{ queryType: string }` |
| `TRAVERSE` | `{ startNodeId: string, maxDepth: 15 }` |
| `SELECT_PATH` | `{ sourceId: string, targetId: string }` |
| `EMIT` | `{ queryType: string }` |

**Forbidden in params:** visitedNodeIds, visitedEdgeIds, path arrays, any execution-derived artifacts.

---

## 5. Query → Edge Filter Table (Executor-Owned)

| Query type | Direction | Edge types |
|------------|-----------|------------|
| `CALLERS` | Incoming to target | `CALLS` |
| `DEPENDENCIES` | Outgoing from target | `IMPORTS`, `CALLS`, `DEPENDS_ON` |
| `REFERENCES` | Both on target | `REFERENCES` |
| `IMPACT` | Downstream from target | `CALLS`, `DEPENDS_ON`, `REFERENCES` |
| `PATH` | source → target | All edges, canonical order |

Canonical edge order: `type` ASC, then `id` ASC.

---

## 6. Structural DAG Template (Constraint Graph)

Dependency constraints only (not a staged pipeline):

```
RESOLVE_TARGET → FILTER_EDGES → (TRAVERSE | SELECT_PATH) → EMIT
```

| Query type | Graph operator |
|------------|----------------|
| CALLERS, DEPENDENCIES, REFERENCES, IMPACT | TRAVERSE |
| PATH | SELECT_PATH |

---

## 7. PATH Semantics (4B — Executor Only)

- DFS-based
- maxDepth = 15
- First valid path in canonical traversal order
- Ordering derived ONLY from snapshot adjacency + executor edge sort
- No compiler ordering hints

---

## 8. EVID Validation (5A — Compiler)

```
query.evid.version === REGISTERED_EVID.version
AND query.evid.compilerHash === REGISTERED_EVID.compilerHash
```

Mismatch → `CompilerContractViolation`.

---

## 9. GSID Consistency (Executor)

First instruction in `execute()`:

```
dag.gsid === execute gsid (all fields)
```

Mismatch → `GSIDValidationFailure`.

---

## 10. Canonical Serialization Algorithm

1. Sort nodes by `id` using deterministic string compare (`a < b ? -1 : a > b ? 1 : 0`)
2. Sort edges by `id`, then `from`, then `to` (same comparator)
3. Sort each node's `params` keys lexicographically ASC
4. Emit JSON with fixed key order: `gsid` → `edges` → `nodes`
5. Within `gsid`: `commitHash`, `id`, `schemaVersion`, `timestamp`
6. Within node: `id`, `operation`, `params`
7. Within edge: `from`, `id`, `to`

### Encoding Rules

| Rule | Specification |
|------|---------------|
| Character encoding | UTF-8 |
| Booleans | `true` / `false` lowercase JSON literals |
| Numbers | JSON numbers; integers without `.0`; no NaN/Infinity |
| Null | Forbidden — throw `CompilerContractViolation` |
| Output | UTF-8 bytes for identity comparison |

---

## 11. Error Taxonomy

### Kernel runtime failures (engine / compiler / evidence)

| Class | When |
|-------|------|
| `CompilerContractViolation` | EVID mismatch, invalid query, missing PATH source |
| `GSIDValidationFailure` | GSID mismatch; unresolved identity (G2) |
| `ExecutorFidelityFailure` | Cycle, PATH not found, traversal contract break |
| `EvidenceIntegrityFailure` | Evidence not derivable from trace |

All extend `Stage5ExecutionError`.

### Verification infrastructure only (not kernel)

| Class | Location | When |
|-------|----------|------|
| `ReplayViolation` | `verification/ReplayViolation.ts` | Independent executions diverge under identical inputs |

Replay comparison is **external certification**. The kernel must not:
- expose `ExecutionEngine.replay()`
- host `ReplayValidator` inside `engine/`
- retain historical execution awareness

---

## 12. Determinism / Certification Pipeline

```
(Query, GSID, EVID, Snapshot)
        |
        v
Canonical ExecutionDAG
        |
        v
ExecutionTrace
        |
        v
Evidence Package
        |
        v
Result Set
```

**Result Set** is the final observable result derived from `ExecutionTrace`
(`nodes` = visitedNodes, `edges` = visitedEdges). It is a verification view,
not a separate kernel computation.

### Kernel responsibility

- Produce deterministic artifacts: DAG, ExecutionTrace, Evidence
- No replay logic inside the kernel

### Verification responsibility

- Compare artifacts from **independent** executions (including restart / fresh engine init)
- Require identity of: canonical DAG bytes, ExecutionTrace, Evidence package, Result Set
- Classify divergence as `ReplayViolation`

---

## 13. Snapshot Material

- Immutable during compile and execute (G1)
- SnapshotResolver is compile-time loading only
- Same SnapshotMaterial passed to execute via CLI — not via SnapshotResolver at runtime (G5)
