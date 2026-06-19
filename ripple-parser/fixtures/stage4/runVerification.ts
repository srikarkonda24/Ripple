// Stage 4 oracle-based verification: IR freeze + rewrite correctness + adversarial + determinism.
import * as fs from "fs";
import * as path from "path";
import {
  assertNoInvalidInternalResolution,
  assertParityNoRewrite,
  assertRewriteExpected,
} from "./lib/adversarial";
import { assertDeterministic, runCoreOracles } from "./lib/invariants";
import { runPipelineTwice } from "./lib/runPipeline";

const fixtureRoot = path.join(__dirname);
const stage3FixtureRoot = path.join(fixtureRoot, "..", "stage3");
const reportPath = path.join(fixtureRoot, "verification-report.json");

interface FixtureSpec {
  name: string;
  repoPath: string;
  layer: "parity" | "rewrite" | "adversarial";
  minRewrites?: number;
  expectParity?: boolean;
}

const fixtures: FixtureSpec[] = [
  ...[
    "simple-import",
    "default-export",
    "barrel",
    "reexport-named",
    "reexport-star",
    "circular",
    "external",
    "unresolved-path",
    "react-components",
    "namespace",
    "mixed-stage2",
  ].map((name) => ({
    name,
    repoPath: path.join(stage3FixtureRoot, name),
    layer: "parity" as const,
    expectParity: true,
  })),
  {
    name: "alias-path",
    repoPath: path.join(fixtureRoot, "alias-path"),
    layer: "rewrite",
    minRewrites: 1,
  },
  {
    name: "broken-alias",
    repoPath: path.join(fixtureRoot, "broken-imports", "broken-alias"),
    layer: "adversarial",
    expectParity: true,
  },
  {
    name: "missing-export",
    repoPath: path.join(fixtureRoot, "broken-imports", "missing-export"),
    layer: "adversarial",
    expectParity: true,
  },
];

function aggregateMetrics(results: FixtureReport[]): Stage4GraphMetrics {
  const totals = results.reduce(
    (accumulator, result) => ({
      resolvedEdges: accumulator.resolvedEdges + result.metrics.resolvedEdges,
      unresolvedEdges: accumulator.unresolvedEdges + result.metrics.unresolvedEdges,
      externalEdges: accumulator.externalEdges + result.metrics.externalEdges,
      aliasBindings: accumulator.aliasBindings + result.metrics.aliasBindings,
      aliasUpgraded: accumulator.aliasUpgraded + result.metrics.aliasUpgraded,
    }),
    {
      resolvedEdges: 0,
      unresolvedEdges: 0,
      externalEdges: 0,
      aliasBindings: 0,
      aliasUpgraded: 0,
    }
  );

  return {
    ...totals,
    aliasSuccessRate:
      totals.aliasBindings === 0 ? 1 : totals.aliasUpgraded / totals.aliasBindings,
  };
}

interface FixtureReport {
  fixture: string;
  layer: string;
  passed: boolean;
  rewriteCount: number;
  violations: Array<{ oracle: string; message: string }>;
  determinism: boolean;
  rewriteTrace: Array<EdgeRewriteTrace & { fixture: string }>;
  resolutionTrace: ResolutionDecisionTrace[];
  metrics: Stage4GraphMetrics;
}

function runFixture(spec: FixtureSpec): FixtureReport {
  const { first, second } = runPipelineTwice(spec.repoPath);
  const violations = [
    ...runCoreOracles(first.stage3, first.stage4, first.snapshotBeforeStage4),
    ...assertNoInvalidInternalResolution(first.stage3, first.stage4),
    ...assertDeterministic(first.stage4, second),
  ];

  if (spec.expectParity) {
    violations.push(...assertParityNoRewrite(first.stage4));
  }

  if (spec.minRewrites !== undefined) {
    violations.push(...assertRewriteExpected(first.stage4, spec.minRewrites));
  }

  return {
    fixture: spec.name,
    layer: spec.layer,
    passed: violations.length === 0,
    rewriteCount: first.stage4.rewriteMap.size,
    violations,
    determinism: !violations.some((violation) => violation.oracle === "Deterministic"),
    rewriteTrace: first.stage4.report.rewriteTrace.map((entry) => ({
      ...entry,
      fixture: spec.name,
    })),
    resolutionTrace: first.stage4.report.resolutionTrace,
    metrics: first.stage4.report.metrics,
  };
}

function main(): void {
  const results = fixtures.map(runFixture);
  const passedCount = results.filter((result) => result.passed).length;

  const layerSummary = {
    parity: results.filter((result) => result.layer === "parity"),
    rewrite: results.filter((result) => result.layer === "rewrite"),
    adversarial: results.filter((result) => result.layer === "adversarial"),
  };

  const report = {
    fixtureRoot,
    oracle: "IRFrozen + RewriteCorrect + Deterministic + Adversarial",
    generatedFixtureCount: results.length,
    passedCount,
    allPassed: passedCount === results.length,
    totalRewrites: results.reduce((sum, result) => sum + result.rewriteCount, 0),
    invariantViolations: results.reduce((sum, result) => sum + result.violations.length, 0),
    observability: {
      rewriteTrace: results.flatMap((result) => result.rewriteTrace),
      resolutionTrace: results.flatMap((result) =>
        result.resolutionTrace.map((entry) => ({
          ...entry,
          fixture: result.fixture,
        }))
      ),
      metrics: aggregateMetrics(results),
    },
    layers: {
      parity: {
        passed: layerSummary.parity.filter((result) => result.passed).length,
        total: layerSummary.parity.length,
      },
      rewrite: {
        passed: layerSummary.rewrite.filter((result) => result.passed).length,
        total: layerSummary.rewrite.length,
      },
      adversarial: {
        passed: layerSummary.adversarial.filter((result) => result.passed).length,
        total: layerSummary.adversarial.length,
      },
    },
    summary: passedCount === results.length
      ? `parity ✔ | rewrite ✔ | invariants 0 violations | determinism ✔`
      : `${passedCount}/${results.length} passed`,
    fixtures: results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));

  if (!report.allPassed) {
    process.exit(1);
  }
}

main();
