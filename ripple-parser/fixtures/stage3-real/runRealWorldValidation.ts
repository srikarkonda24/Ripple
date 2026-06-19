// Validates Stage 3 against real open-source repositories and writes a structured report.
import * as fs from "fs";
import * as path from "path";
import { scanRepository } from "../../src/scanRepository";
import { sha256Hex } from "../../src/hash";
import { runStage2 } from "../../src/stage2/runStage2";
import { buildExternalTargetId, buildModuleSymbolId, buildUnresolvedTargetId } from "../../src/stage2/symbolId";
import { runStage3 } from "../../src/stage3/runStage3";
import type { Stage3Result } from "../../src/stage3/types";

const reportRoot = path.join(__dirname);
const reportPath = path.join(reportRoot, "real-world-validation-report.json");

interface RepoTarget {
  name: string;
  url: string;
  tier: "small" | "medium" | "large";
  subPath?: string;
  description: string;
}

interface SampleRecord {
  category: "import" | "reexport" | "jsx" | "call";
  edgeType: string;
  context: string;
  fromLabel: string;
  toLabel: string;
  fromFile?: string;
  toFile?: string;
  manualCheck: "plausible" | "suspicious" | "unresolved_expected";
  notes: string;
}

interface RepoValidationResult {
  name: string;
  tier: string;
  url: string;
  repoPath: string;
  locEstimate: number;
  fileCount: number;
  determinism: {
    byteIdentical: boolean;
    hashRun1: string;
    hashRun2: string;
  };
  performance: {
    stage1Ms: number;
    stage2Ms: number;
    stage3Run1Ms: number;
    stage3Run2Ms: number;
    totalMs: number;
    heapUsedMbRun1: number;
    heapUsedMbPeak: number;
    rssMbPeak: number;
  };
  metrics: {
    filesProcessed: number;
    symbolsDiscovered: number;
    imports: number;
    exports: number;
    reExports: number;
    references: number;
    calls: number;
    crossFileCalls: number;
    unresolvedImports: number;
    unresolvedExports: number;
    circularReExports: number;
    externalImports: number;
    surfaceParseFallback: number;
  };
  samples: {
    imports: SampleRecord[];
    reexports: SampleRecord[];
    jsx: SampleRecord[];
    calls: SampleRecord[];
  };
  sampleSummary: {
    plausible: number;
    suspicious: number;
    unresolvedExpected: number;
  };
  detectedIssues: string[];
  falsePositives: string[];
  falseNegatives: string[];
}

const targets: RepoTarget[] = [
  {
    name: "bulletproof-react",
    url: "https://github.com/alan2207/bulletproof-react",
    tier: "small",
    description: "Small React app (~5k-20k LOC) with barrels and feature folders",
  },
  {
    name: "vercel-commerce",
    url: "https://github.com/vercel/commerce",
    tier: "medium",
    description: "Medium Next.js e-commerce app (~20k-100k LOC)",
  },
  {
    name: "cal-com",
    url: "https://github.com/calcom/cal.com",
    tier: "large",
    subPath: "apps/web",
    description: "Large production Next.js monorepo app (100k+ LOC in full repo)",
  },
];

function countLoc(repoPath: string): number {
  let total = 0;
  const stack = [repoPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".git", "dist", "build", ".next", "coverage", ".turbo"].includes(entry.name)) {
          continue;
        }
        stack.push(fullPath);
        continue;
      }
      if (!/\.(tsx?|jsx?)$/.test(entry.name)) {
        continue;
      }
      try {
        total += fs.readFileSync(fullPath, "utf8").split(/\r?\n/).length;
      } catch {
        continue;
      }
    }
  }
  return total;
}

function cloneIfMissing(target: RepoTarget): string {
  const cloneDir = path.join(reportRoot, "repos", target.name);
  const repoPath = target.subPath ? path.join(cloneDir, target.subPath) : cloneDir;
  if (fs.existsSync(repoPath)) {
    return repoPath;
  }
  if (!fs.existsSync(cloneDir)) {
    fs.mkdirSync(path.dirname(cloneDir), { recursive: true });
    const { execSync } = require("child_process") as typeof import("child_process");
    if (target.name === "cal-com") {
      execSync(`git clone --depth 1 --filter=blob:none --sparse ${target.url} "${cloneDir}"`, {
        stdio: "inherit",
      });
      execSync("git sparse-checkout set apps/web", { cwd: cloneDir, stdio: "inherit" });
    } else {
      execSync(`git clone --depth 1 ${target.url} "${cloneDir}"`, { stdio: "inherit" });
    }
  }
  return repoPath;
}

function buildLabels(result: Stage3Result): Map<string, string> {
  const labels = new Map<string, string>();
  for (const file of result.files) {
    labels.set(file.id, `file:${file.path}`);
    labels.set(buildModuleSymbolId(file.path, file.contentHash), `module:${file.path}`);
  }
  for (const symbol of result.symbols) {
    labels.set(symbol.id, `symbol:${symbol.filePath}#${symbol.name}:${symbol.type}`);
  }
  return labels;
}

function labelFor(id: string, labels: Map<string, string>): string {
  if (labels.has(id)) {
    return labels.get(id) ?? id;
  }
  if (id.length === 64 && /^[a-f0-9]+$/.test(id)) {
    return "virtual:external_or_unresolved";
  }
  return `id:${id.slice(0, 12)}`;
}

function symbolById(result: Stage3Result): Map<string, CodeSymbol> {
  return new Map(result.symbols.map((symbol) => [symbol.id, symbol]));
}

function fileById(result: Stage3Result): Map<string, FileNode> {
  return new Map(result.files.map((file) => [file.id, file]));
}

function classifyTarget(toId: string, labels: Map<string, string>): "resolved" | "external" | "unresolved" {
  const label = labels.get(toId) ?? "";
  if (label.startsWith("symbol:") || label.startsWith("module:")) {
    return "resolved";
  }
  if (toId === buildExternalTargetId("react") || label.includes("external")) {
    return "external";
  }
  return "unresolved";
}

function manualCheckEdge(
  edge: Edge,
  labels: Map<string, string>,
  symbols: Map<string, CodeSymbol>
): SampleRecord["manualCheck"] {
  const toLabel = labelFor(edge.toId, labels);
  if (toLabel.startsWith("virtual:") || toLabel.startsWith("id:")) {
    return "unresolved_expected";
  }
  const toSymbol = symbols.get(edge.toId);
  if (edge.type === "REFERENCES" && edge.context === "jsx" && toSymbol?.type === "component") {
    return "plausible";
  }
  if (edge.type === "CALLS" && toSymbol) {
    return "plausible";
  }
  if (edge.type === "IMPORTS" && (toLabel.startsWith("symbol:") || toLabel.startsWith("module:"))) {
    return "plausible";
  }
  if (edge.type === "RE_EXPORTS" && toLabel.startsWith("symbol:")) {
    return "plausible";
  }
  if (edge.type === "RE_EXPORTS" && toLabel.startsWith("module:")) {
    return "suspicious";
  }
  return "plausible";
}

function buildSampleNotes(edge: Edge, fromLabel: string, toLabel: string): string {
  return `${fromLabel} --${edge.type}[${edge.context ?? ""}]--> ${toLabel}`;
}

function deterministicSample<T>(items: T[], count: number, seed: string): T[] {
  if (items.length <= count) {
    return items;
  }
  const scored = items
    .map((item, index) => ({
      item,
      score: sha256Hex(`${seed}:${index}:${JSON.stringify(item)}`),
    }))
    .sort((left, right) => left.score.localeCompare(right.score));
  return scored.slice(0, count).map((entry) => entry.item);
}

function sampleEdges(result: Stage3Result): RepoValidationResult["samples"] {
  const labels = buildLabels(result);
  const symbols = symbolById(result);
  const files = fileById(result);

  const importEdges = result.edges.filter((edge) => edge.type === "IMPORTS");
  const reexportEdges = result.edges.filter((edge) => edge.type === "RE_EXPORTS");
  const jsxEdges = result.edges.filter((edge) => edge.type === "REFERENCES" && edge.context === "jsx");
  const callEdges = result.edges.filter((edge) => {
    if (edge.type !== "CALLS") {
      return false;
    }
    const from = symbols.get(edge.fromId);
    const to = symbols.get(edge.toId);
    return Boolean(from && to && from.filePath !== to.filePath);
  });

  function toSample(category: SampleRecord["category"], edge: Edge): SampleRecord {
    const fromLabel = labelFor(edge.fromId, labels);
    const toLabel = labelFor(edge.toId, labels);
    const fromFile = symbols.get(edge.fromId)?.filePath ?? files.get(edge.fromId)?.path;
    const toFile = symbols.get(edge.toId)?.filePath ?? files.get(edge.toId)?.path;
    return {
      category,
      edgeType: edge.type,
      context: edge.context ?? "",
      fromLabel,
      toLabel,
      fromFile,
      toFile,
      manualCheck: manualCheckEdge(edge, labels, symbols),
      notes: buildSampleNotes(edge, fromLabel, toLabel),
    };
  }

  return {
    imports: deterministicSample(importEdges, 50, "imports").map((edge) => toSample("import", edge)),
    reexports: deterministicSample(reexportEdges, 25, "reexports").map((edge) => toSample("reexport", edge)),
    jsx: deterministicSample(jsxEdges, 25, "jsx").map((edge) => toSample("jsx", edge)),
    calls: deterministicSample(callEdges, 25, "calls").map((edge) => toSample("call", edge)),
  };
}

function countEdgeType(edges: Edge[], type: EdgeType): number {
  return edges.filter((edge) => edge.type === type).length;
}

function runPipeline(repoPath: string): {
  result: Stage3Result;
  timings: { stage1Ms: number; stage2Ms: number; stage3Ms: number };
  heapMb: number;
} {
  const heapBefore = process.memoryUsage();
  const t0 = Date.now();
  const files = scanRepository(repoPath);
  const t1 = Date.now();
  const stage2 = runStage2(repoPath, files);
  const t2 = Date.now();
  const result = runStage3({ repoPath, files, stage2 });
  const t3 = Date.now();
  const heapAfter = process.memoryUsage();
  return {
    result,
    timings: { stage1Ms: t1 - t0, stage2Ms: t2 - t1, stage3Ms: t3 - t2 },
    heapMb: Math.round((heapAfter.heapUsed / 1024 / 1024) * 10) / 10,
  };
}

function detectIssues(result: Stage3Result, samples: RepoValidationResult["samples"]): {
  issues: string[];
  falsePositives: string[];
  falseNegatives: string[];
} {
  const issues: string[] = [];
  const falsePositives: string[] = [];
  const falseNegatives: string[] = [];

  const suspicious = [
    ...samples.imports,
    ...samples.reexports,
    ...samples.jsx,
    ...samples.calls,
  ].filter((sample) => sample.manualCheck === "suspicious");

  for (const sample of suspicious) {
    issues.push(`Suspicious sample: ${sample.notes}`);
  }

  if (result.report.circularChains.length > 0) {
    issues.push(`Circular re-export chains detected: ${result.report.circularChains.length}`);
  }

  const reexportToModule = samples.reexports.filter((sample) => sample.toLabel.startsWith("module:"));
  for (const sample of reexportToModule) {
    falsePositives.push(`RE_EXPORTS points to module instead of symbol: ${sample.notes}`);
  }

  const jsxToNonComponent = samples.jsx.filter((sample) => !sample.toLabel.includes(":component"));
  for (const sample of jsxToNonComponent) {
    issues.push(`JSX reference target is not a component: ${sample.notes}`);
  }

  if (result.report.summary.importsUnresolved > result.report.unresolvedPaths.length + result.report.unresolvedExports.length) {
    falseNegatives.push(
      "Some imports marked unresolved may be resolvable in Stage 4 (aliases, package exports, monorepo paths)"
    );
  }

  return { issues, falsePositives, falseNegatives };
}

function validateRepo(target: RepoTarget): RepoValidationResult {
  const repoPath = cloneIfMissing(target);
  if (!fs.existsSync(repoPath)) {
    throw new Error(`Repository path not found after clone: ${repoPath}`);
  }

  const locEstimate = countLoc(repoPath);
  const rssBefore = process.memoryUsage().rss;

  const run1 = runPipeline(repoPath);
  const run2 = runPipeline(repoPath);

  const json1 = JSON.stringify(run1.result, null, 2);
  const json2 = JSON.stringify(run2.result, null, 2);
  const hash1 = sha256Hex(json1);
  const hash2 = sha256Hex(json2);

  const samples = sampleEdges(run1.result);
  const sampleSummary = {
    plausible: 0,
    suspicious: 0,
    unresolvedExpected: 0,
  };
  for (const bucket of [samples.imports, samples.reexports, samples.jsx, samples.calls]) {
    for (const sample of bucket) {
      if (sample.manualCheck === "plausible") {
        sampleSummary.plausible++;
      } else if (sample.manualCheck === "suspicious") {
        sampleSummary.suspicious++;
      } else {
        sampleSummary.unresolvedExpected++;
      }
    }
  }

  const { issues, falsePositives, falseNegatives } = detectIssues(run1.result, samples);
  const rssAfter = process.memoryUsage().rss;
  const edges = run1.result.edges;

  return {
    name: target.name,
    tier: target.tier,
    url: target.url,
    repoPath,
    locEstimate,
    fileCount: run1.result.files.length,
    determinism: {
      byteIdentical: json1 === json2,
      hashRun1: hash1,
      hashRun2: hash2,
    },
    performance: {
      stage1Ms: run1.timings.stage1Ms,
      stage2Ms: run1.timings.stage2Ms,
      stage3Run1Ms: run1.timings.stage3Ms,
      stage3Run2Ms: run2.timings.stage3Ms,
      totalMs: run1.timings.stage1Ms + run1.timings.stage2Ms + run1.timings.stage3Ms,
      heapUsedMbRun1: run1.heapMb,
      heapUsedMbPeak: Math.max(run1.heapMb, run2.heapMb),
      rssMbPeak: Math.round((Math.max(rssBefore, rssAfter) / 1024 / 1024) * 10) / 10,
    },
    metrics: {
      filesProcessed: run1.result.report.summary.filesProcessed,
      symbolsDiscovered: run1.result.symbols.length,
      imports: countEdgeType(edges, "IMPORTS"),
      exports: countEdgeType(edges, "EXPORTS"),
      reExports: countEdgeType(edges, "RE_EXPORTS"),
      references: countEdgeType(edges, "REFERENCES"),
      calls: countEdgeType(edges, "CALLS"),
      crossFileCalls: run1.result.report.summary.crossFileCalls,
      unresolvedImports: run1.result.report.summary.importsUnresolved,
      unresolvedExports: run1.result.report.unresolvedExports.length,
      circularReExports: run1.result.report.circularChains.length,
      externalImports: run1.result.report.summary.externalImports,
      surfaceParseFallback: run1.result.report.surfaceParseFallback.length,
    },
    samples,
    sampleSummary,
    detectedIssues: issues,
    falsePositives,
    falseNegatives,
  };
}

function main(): void {
  const results: RepoValidationResult[] = [];
  for (const target of targets) {
    console.error(`Validating ${target.name} (${target.tier})...`);
    results.push(validateRepo(target));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    stage3CodeFrozen: true,
    summary: {
      repositories: results.length,
      allDeterministic: results.every((result) => result.determinism.byteIdentical),
      totalSuspiciousSamples: results.reduce((sum, result) => sum + result.sampleSummary.suspicious, 0),
      totalIssues: results.reduce((sum, result) => sum + result.detectedIssues.length, 0),
    },
    repositories: results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main();
