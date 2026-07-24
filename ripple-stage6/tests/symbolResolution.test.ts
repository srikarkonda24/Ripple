// Validates symbol resolution and deterministic impact query generation.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PRChange } from "../core/PRChange";
import { sampleIdentity } from "../fixtures/sampleIdentity";
import {
  authSessionSpans,
  testGsid,
  workflowEndpoints,
} from "../fixtures/symbolIndexFixtures";
import { buildPRChange } from "../prchange/PRChangeBuilder";
import {
  buildImpactQueries,
  serializeImpactQueriesForTest,
  usesOnlyMvpQueryTypes,
} from "../queries/ImpactQueryBuilder";
import { MVP_QUERY_TYPE_ORDER } from "../queries/ImpactQuery";
import {
  EmptyWorkflowCatalog,
  InMemoryWorkflowCatalog,
} from "../queries/WorkflowCatalog";
import { SymbolIndexError } from "../resolution/ResolutionErrors";
import { resolveSymbols } from "../resolution/SymbolResolver";
import { InMemorySymbolIndex } from "../resolution/SymbolIndex";

const baseSha = "1111111111111111111111111111111111111111";
const headSha = "a1b2c3d4e5f6789012345678901234567890abcd";

function prChangeWithRanges(
  files: readonly {
    path: string;
    ranges: readonly { startLine: number; endLine: number }[];
  }[],
): PRChange {
  return buildPRChange({
    identity: sampleIdentity,
    rawDiff: {
      baseSha,
      headSha,
      files: files.map((file) => ({
        path: file.path,
        patch:
          file.ranges.length === 0
            ? null
            : file.ranges
                .map(
                  (range) =>
                    `@@ -1,1 +${range.startLine},${range.endLine - range.startLine + 1} @@\n`,
                )
                .join(""),
      })),
    },
  });
}

describe("SymbolResolver", () => {
  it("resolves a symbol when changed lines overlap a SymbolSpan", () => {
    const index = new InMemorySymbolIndex({
      [testGsid.id]: [...authSessionSpans],
    });
    const prChange = prChangeWithRanges([
      { path: "lib/auth/session.ts", ranges: [{ startLine: 12, endLine: 12 }] },
    ]);
    const result = resolveSymbols({ prChange, gsid: testGsid, symbolIndex: index });
    assert.equal(result.emptyReason, undefined);
    assert.deepEqual(result.symbols, [
      {
        nodeId: "node-auth-session",
        filePath: "lib/auth/session.ts",
        displayName: "getSession",
      },
    ]);
  });

  it("does not resolve when changed lines do not overlap any span", () => {
    const index = new InMemorySymbolIndex({
      [testGsid.id]: [...authSessionSpans],
    });
    const prChange = prChangeWithRanges([
      { path: "lib/auth/session.ts", ranges: [{ startLine: 99, endLine: 99 }] },
    ]);
    const result = resolveSymbols({ prChange, gsid: testGsid, symbolIndex: index });
    assert.deepEqual(result.symbols, []);
    assert.equal(result.emptyReason, "NO_RESOLVED_SYMBOLS");
  });

  it("does not resolve spans from an unknown changed file path", () => {
    const index = new InMemorySymbolIndex({
      [testGsid.id]: [...authSessionSpans],
    });
    const prChange = prChangeWithRanges([
      { path: "unknown/file.ts", ranges: [{ startLine: 1, endLine: 1 }] },
    ]);
    const result = resolveSymbols({ prChange, gsid: testGsid, symbolIndex: index });
    assert.equal(result.emptyReason, "NO_RESOLVED_SYMBOLS");
  });

  it("fails closed when SymbolIndex has no entry for the GSID", () => {
    const index = new InMemorySymbolIndex({});
    const prChange = prChangeWithRanges([
      { path: "lib/auth/session.ts", ranges: [{ startLine: 12, endLine: 12 }] },
    ]);
    assert.throws(
      () => resolveSymbols({ prChange, gsid: testGsid, symbolIndex: index }),
      SymbolIndexError,
    );
  });
});

describe("ImpactQueryBuilder", () => {
  it("returns no queries when no symbols are resolved", () => {
    const queries = buildImpactQueries({
      gsid: testGsid,
      symbols: [],
      workflowCatalog: new EmptyWorkflowCatalog(),
    });
    assert.deepEqual(queries, []);
  });

  it("produces identical Query[] for identical inputs", () => {
    const symbols = [
      {
        nodeId: "node-b",
        filePath: "b.ts",
        displayName: "b",
      },
      {
        nodeId: "node-a",
        filePath: "a.ts",
        displayName: "a",
      },
    ];
    const catalog = new InMemoryWorkflowCatalog({
      [testGsid.id]: [...workflowEndpoints],
    });
    const input = { gsid: testGsid, symbols, workflowCatalog: catalog };
    const first = buildImpactQueries(input);
    const second = buildImpactQueries(input);
    assert.equal(serializeImpactQueriesForTest(first), serializeImpactQueriesForTest(second));
  });

  it("orders queries by nodeId then query type then PATH targetId", () => {
    const symbols = [
      { nodeId: "node-z", filePath: "z.ts", displayName: "z" },
      { nodeId: "node-a", filePath: "a.ts", displayName: "a" },
    ];
    const catalog = new InMemoryWorkflowCatalog({
      [testGsid.id]: [
        { sourceId: "x", targetId: "target-z", label: "z" },
        { sourceId: "x", targetId: "target-a", label: "a" },
      ],
    });
    const queries = buildImpactQueries({
      gsid: testGsid,
      symbols,
      workflowCatalog: catalog,
    });

    const nodeOrder = queries.map((query) => query.target ?? query.source);
    assert.ok(nodeOrder.indexOf("node-a") < nodeOrder.indexOf("node-z"));

    const pathTargets = queries
      .filter((query) => query.type === "PATH")
      .map((query) => query.target);
    assert.deepEqual(pathTargets, ["target-a", "target-z", "target-a", "target-z"]);

    const firstSymbolBlock = queries.filter((query) => query.target === "node-a" || query.source === "node-a");
    const typesForA = firstSymbolBlock.map((query) => query.type);
    assert.deepEqual(typesForA.slice(0, 3), ["CALLERS", "DEPENDENCIES", "IMPACT"]);
  });

  it("emits only MVP query types", () => {
    const queries = buildImpactQueries({
      gsid: testGsid,
      symbols: [
        { nodeId: "node-a", filePath: "a.ts", displayName: "a" },
      ],
      workflowCatalog: new InMemoryWorkflowCatalog({
        [testGsid.id]: [...workflowEndpoints],
      }),
    });
    assert.equal(usesOnlyMvpQueryTypes(queries), true);
    assert.equal(
      queries.every((query) => MVP_QUERY_TYPE_ORDER.includes(query.type)),
      true,
    );
    assert.equal(queries.some((query) => (query.type as string) === "REFERENCES"), false);
  });

  it("binds GSID and registered EVID on every query", () => {
    const queries = buildImpactQueries({
      gsid: testGsid,
      symbols: [{ nodeId: "node-a", filePath: "a.ts", displayName: "a" }],
      workflowCatalog: new EmptyWorkflowCatalog(),
    });
    assert.equal(queries.length, 3);
    for (const query of queries) {
      assert.deepEqual(query.gsid, testGsid);
      assert.equal(query.evid.version, "stage5-phase2-v1");
    }
  });
});
