# TypeScript Adapter

Language-specific parser and resolver for TypeScript and JavaScript.

## Status

**Resolver:** implemented for Stage 4 (`adapters/typescript/resolver/`).

**Parser:** deferred — existing logic still lives in `ripple-parser`.

## Layout

```
adapters/typescript/
  resolver/
    index.ts          # TypeScriptResolverAdapter
    pathRules.ts      # relative import paths
    symbolRules.ts    # export / re-export chains
    aliasRules.ts     # tsconfig paths + baseUrl
```

## ResolverAdapter

Implements two-pass resolution used by `runStage4`:

- `resolveImport()` — Pass A: specifier → file/module target
- `resolveSymbol()` — Pass B: binding → CodeSymbol.id

Stage 4 loads tsconfig alias settings via `loadTsconfigAliases()` and passes them in `ResolverContext.config.tsconfigAliases`.

## Parser (future)

Expected `ParserAdapter.parseFile` mapping documented in prior README sections — not yet extracted from ripple-parser.

## Contracts

Interfaces live in `ripple-core/interfaces/`:

- `ParserAdapter` — `parseFile` → `{ symbols, edges, moduleSurface }`
- `ResolverAdapter` — `resolveImport`, `resolveSymbol`
