# Stage 4 Architecture

Stage 4 is a **pure rewrite pass** over Stage 3 edge targets. It resolves cross-file semantics without parsing, symbol extraction, or graph construction.

Stage 3 defines **what exists**. Stage 4 defines **what edges point to**.

---

## Pipeline Position

```
Stage 1 (scanRepository)     → FileNode[]
Stage 2 (runStage2)          → CodeSymbol[] + intra-file edges
Stage 3 (runStage3)          → cross-file graph + resolutionSnapshot
Stage 4 (runStage4)          → upgraded edge.toId targets via ResolverAdapter
```

Entry points:

- API: `runStage4(input)` in [`src/stage4/runStage4.ts`](src/stage4/runStage4.ts)
- CLI: `npx ts-node src/stage4/runStage4Cli.ts <repo-path>` (runs Stage 1 → 2 → 3 → 4)

---

## Formal Model

```
E4 = f(E3, resolver)

where:
  topology(E4) === topology(E3)
  structuralIR(E4) === structuralIR(E3)   // pass-through copies, no field writes
  only edge.toId may differ                 // semantic reachability can change
```

Stage 4 is a **PURE REWRITE PASS** — no structural mutation, no semantic expansion.

---

## Allowed Mutation

Only one field may change:

```
edge.toId: unresolved:* | external:*  →  CodeSymbol.id | FileNode.id
```

Forbidden: changing `edge.id`, `fromId`, `type`, `context`; adding/removing edges; mutating symbols or files; recomputing `calls[]` / `referencedBy[]`.

After Stage 4, traverse the **edge list** for resolved targets. Derived adjacency arrays remain Stage 3 artifacts.

---

## Pipeline

```
Stage3Result
   ↓
buildSymbolIndex()
   ↓
resolveGraph() → EdgeRewriteMap
   ↓
applyEdgeRewrites()   // edge.toId only; edge.id immutable
   ↓
validateStage4Output()
```

---

## Input / Output

### Stage4Input

```typescript
interface Stage4Input {
  repoPath: string;
  stage3: Stage3Result;           // includes resolutionSnapshot
  resolver: ResolverAdapter;
  config?: Record<string, unknown>;
}
```

### resolutionSnapshot (from Stage 3)

Single stable object owned by Stage 3:

```typescript
interface ResolutionSnapshot {
  imports: { filePath, bindings }[];
  exports: { filePath, entries }[];
  reExports: { filePath, bindings }[];
  moduleSymbolIds: { filePath, symbolId }[];
}
```

### Stage4Result

Same structural shape as Stage 3 graph output plus Stage 4 report and rewrite map.

---

## ResolverAdapter (Two-Pass)

Contracts in [`ripple-core/interfaces/ResolverAdapter.ts`](../ripple-core/interfaces/ResolverAdapter.ts):

- **Pass A:** `resolveImport()` — specifier → file target
- **Pass B:** `resolveSymbol()` — binding → CodeSymbol.id

TypeScript implementation: [`adapters/typescript/resolver/`](../../adapters/typescript/resolver/)

| Module | Role |
|--------|------|
| `pathRules.ts` | Relative path resolution |
| `symbolRules.ts` | Export chain + re-export traversal |
| `aliasRules.ts` | tsconfig/jsconfig `paths` / `baseUrl` |
| `index.ts` | `TypeScriptResolverAdapter` |

---

## Module Layout

```
ripple-core/
  interfaces/resolverTypes.ts
  resolution/buildSymbolIndex.ts

ripple-parser/src/stage4/
  runStage4.ts
  runStage4Cli.ts
  resolveGraph.ts
  applyEdgeRewrites.ts
  buildReport.ts
  validator.ts
  loadTsconfigAliases.ts

adapters/typescript/resolver/
```

---

## Verification

| Suite | Command | Expectation |
|-------|---------|-------------|
| Stage 3 frozen | `npm run verify:stage3` | 11/11 unchanged |
| Stage 4 parity | `npm run verify:stage4:parity` | Stage 4 edges match Stage 3; empty rewrite map |
| Stage 4 features | `npm run verify:stage4` | Parity + alias-path fixture |

---

## Status

Stage 4 implements tsconfig alias resolution as the first feature beyond Stage 3 parity. Package/workspace resolution is deferred to a later slice.
