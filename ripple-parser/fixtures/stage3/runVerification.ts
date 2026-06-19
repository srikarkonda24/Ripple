// Runs Stage 3 fixture verification and writes deterministic pass/fail reports.
import * as fs from "fs";
import * as path from "path";
import { scanRepository } from "../../src/scanRepository";
import { runStage2 } from "../../src/stage2/runStage2";
import { buildExternalTargetId, buildModuleSymbolId } from "../../src/stage2/symbolId";
import { runStage3 } from "../../src/stage3/runStage3";

const fixtureRoot = path.join(__dirname);
const reportPath = path.join(fixtureRoot, "verification-report.json");

interface FixtureSpec {
  name: string;
  expected: string[];
  includeStage2SameFileCalls?: boolean;
}

const fixtures: FixtureSpec[] = [
  {
    name: "simple-import",
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[named:login]--> symbol:auth.ts#login:function",
      "file:auth.ts --EXPORTS[export-named:login]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --CALLS[]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --REFERENCES[call]--> symbol:auth.ts#login:function",
    ],
  },
  {
    name: "default-export",
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[default]--> symbol:auth.ts#login:function",
      "file:auth.ts --EXPORTS[default]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --CALLS[]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --REFERENCES[call]--> symbol:auth.ts#login:function",
    ],
  },
  {
    name: "barrel",
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[named:login]--> symbol:auth.ts#login:function",
      "file:auth.ts --EXPORTS[export-named:login]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --CALLS[]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --REFERENCES[call]--> symbol:auth.ts#login:function",
      "symbol:index.ts#index:module --RE_EXPORTS[reexport-named:login]--> symbol:auth.ts#login:function",
    ],
  },
  {
    name: "reexport-named",
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[named:signIn]--> symbol:auth.ts#login:function",
      "file:auth.ts --EXPORTS[export-named:login]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --CALLS[]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --REFERENCES[call]--> symbol:auth.ts#login:function",
      "symbol:public.ts#public:module --RE_EXPORTS[reexport-named:signIn]--> symbol:auth.ts#login:function",
    ],
  },
  {
    name: "reexport-star",
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[named:login]--> symbol:auth.ts#login:function",
      "file:auth.ts --EXPORTS[export-named:login]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --CALLS[]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --REFERENCES[call]--> symbol:auth.ts#login:function",
      "symbol:index.ts#index:module --RE_EXPORTS[reexport-all:./auth]--> symbol:auth.ts#login:function",
    ],
  },
  {
    name: "circular",
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[named:missing]--> virtual:unresolved",
      "symbol:a.ts#a:module --RE_EXPORTS[reexport-all:./b]--> symbol:b.ts#b:module",
      "symbol:app.ts#main:function --REFERENCES[call]--> virtual:unresolved",
      "symbol:b.ts#b:module --RE_EXPORTS[reexport-all:./a]--> symbol:a.ts#a:module",
    ],
  },
  {
    name: "external",
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[default]--> external:react",
      "symbol:app.ts#main:function --REFERENCES[value]--> external:react",
    ],
  },
  {
    name: "unresolved-path",
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[named:missing]--> virtual:unresolved",
      "symbol:app.ts#main:function --REFERENCES[call]--> virtual:unresolved",
    ],
  },
  {
    name: "react-components",
    expected: [
      "file:App.tsx --EXPORTS[export-named:App]--> symbol:App.tsx#App:component",
      "file:App.tsx --IMPORTS[named:Button]--> symbol:Button.tsx#Button:component",
      "file:Button.tsx --EXPORTS[export-named:Button]--> symbol:Button.tsx#Button:component",
      "symbol:App.tsx#App:component --CALLS[]--> symbol:Button.tsx#Button:component",
      "symbol:App.tsx#App:component --REFERENCES[jsx]--> symbol:Button.tsx#Button:component",
    ],
  },
  {
    name: "namespace",
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[namespace:Auth]--> module:auth.ts",
      "file:auth.ts --EXPORTS[export-named:login]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --CALLS[]--> symbol:auth.ts#login:function",
      "symbol:app.ts#main:function --REFERENCES[call]--> symbol:auth.ts#login:function",
    ],
  },
  {
    name: "mixed-stage2",
    includeStage2SameFileCalls: true,
    expected: [
      "file:app.ts --EXPORTS[export-named:main]--> symbol:app.ts#main:function",
      "file:app.ts --IMPORTS[named:helper]--> symbol:util.ts#helper:function",
      "file:util.ts --EXPORTS[export-named:helper]--> symbol:util.ts#helper:function",
      "symbol:app.ts#local:function --CALLS[]--> symbol:util.ts#helper:function",
      "symbol:app.ts#local:function --REFERENCES[call]--> symbol:util.ts#helper:function",
      "symbol:app.ts#main:function --CALLS[]--> symbol:app.ts#local:function",
      "symbol:app.ts#main:function --CALLS[]--> symbol:util.ts#helper:function",
      "symbol:app.ts#main:function --REFERENCES[call]--> symbol:util.ts#helper:function",
    ],
  },
];

function buildLabels(result: ReturnType<typeof runStage3>): Map<string, string> {
  const labels = new Map<string, string>();
  for (const file of result.files) {
    labels.set(file.id, `file:${file.path}`);
    labels.set(buildModuleSymbolId(file.path, file.contentHash), `module:${file.path}`);
  }
  for (const symbol of result.symbols) {
    labels.set(symbol.id, `symbol:${symbol.filePath}#${symbol.name}:${symbol.type}`);
  }
  labels.set(buildExternalTargetId("react"), "external:react");
  return labels;
}

function labelFor(id: string, labels: Map<string, string>): string {
  return labels.get(id) ?? "virtual:unresolved";
}

function semanticEdges(
  result: ReturnType<typeof runStage3>,
  includeStage2SameFileCalls: boolean
): string[] {
  const labels = buildLabels(result);
  const symbolById = new Map(result.symbols.map((symbol) => [symbol.id, symbol]));
  const edgeTypes = new Set(["IMPORTS", "EXPORTS", "RE_EXPORTS", "REFERENCES"]);
  const rows: string[] = [];

  for (const edge of result.edges) {
    const fromSymbol = symbolById.get(edge.fromId);
    const toSymbol = symbolById.get(edge.toId);
    const isCrossFileCall =
      edge.type === "CALLS" &&
      fromSymbol &&
      toSymbol &&
      fromSymbol.filePath !== toSymbol.filePath;
    const isSameFileCall =
      includeStage2SameFileCalls &&
      edge.type === "CALLS" &&
      fromSymbol &&
      toSymbol &&
      fromSymbol.filePath === toSymbol.filePath;

    if (!edgeTypes.has(edge.type) && !isCrossFileCall && !isSameFileCall) {
      continue;
    }

    rows.push(
      `${labelFor(edge.fromId, labels)} --${edge.type}[${edge.context ?? ""}]--> ${labelFor(edge.toId, labels)}`
    );
  }

  return rows.sort((left, right) => left.localeCompare(right));
}

function compare(expected: string[], actual: string[]): { missing: string[]; unexpected: string[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  return {
    missing: expected.filter((edge) => !actualSet.has(edge)),
    unexpected: actual.filter((edge) => !expectedSet.has(edge)),
  };
}

function runFixture(fixture: FixtureSpec) {
  const root = path.join(fixtureRoot, fixture.name);
  const files = scanRepository(root);
  const stage2 = runStage2(root, files);
  const first = runStage3({ repoPath: root, files, stage2 });
  const second = runStage3({ repoPath: root, files, stage2 });
  const firstJson = JSON.stringify(first, null, 2);
  const secondJson = JSON.stringify(second, null, 2);
  const expected = [...fixture.expected].sort((left, right) => left.localeCompare(right));
  const actual = semanticEdges(first, fixture.includeStage2SameFileCalls === true);
  const mismatches = compare(expected, actual);

  return {
    fixture: fixture.name,
    passed: mismatches.missing.length === 0 && mismatches.unexpected.length === 0,
    expectedEdges: expected,
    actualEdges: actual,
    mismatches,
    determinism: {
      runTwiceByteIdentical: firstJson === secondJson,
      firstLength: firstJson.length,
      secondLength: secondJson.length,
    },
    buildReport: first.report.summary,
    diagnostics: {
      unresolvedExports: first.report.unresolvedExports,
      unresolvedPaths: first.report.unresolvedPaths,
      unresolvedAliases: first.report.unresolvedAliases,
      circularChains: first.report.circularChains,
      surfaceParseFallback: first.report.surfaceParseFallback,
      orphanExports: first.report.orphanExports,
    },
  };
}

function main(): void {
  const fixtureReports = fixtures.map(runFixture);
  const passedCount = fixtureReports.filter((report) => report.passed).length;
  const report = {
    fixtureRoot,
    generatedFixtureCount: fixtures.length,
    passedCount,
    allPassed: passedCount === fixtures.length,
    allDeterministic: fixtureReports.every((item) => item.determinism.runTwiceByteIdentical),
    fixtures: fixtureReports,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));

  if (!report.allPassed || !report.allDeterministic) {
    process.exit(1);
  }
}

main();
