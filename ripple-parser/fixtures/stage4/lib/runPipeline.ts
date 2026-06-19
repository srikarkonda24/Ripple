// Runs Stage 1 through Stage 4 for a fixture repository and returns both stage outputs.
import { createTypeScriptResolverAdapter } from "../../../../adapters/typescript/resolver/index";
import { scanRepository } from "../../../src/scanRepository";
import { runStage2 } from "../../../src/stage2/runStage2";
import { runStage3 } from "../../../src/stage3/runStage3";
import type { Stage3Result } from "../../../src/stage3/types";
import { loadTsconfigAliases } from "../../../src/stage4/loadTsconfigAliases";
import { runStage4 } from "../../../src/stage4/runStage4";
import type { Stage4Result } from "../../../src/stage4/types";

export interface PipelineResult {
  repoPath: string;
  stage3: Stage3Result;
  stage4: Stage4Result;
  snapshotBeforeStage4: string;
}

/** Executes the full parser pipeline through Stage 4 for one repository root. */
export function runPipeline(repoPath: string): PipelineResult {
  const files = scanRepository(repoPath);
  const stage2 = runStage2(repoPath, files);
  const stage3 = runStage3({ repoPath, files, stage2 });
  const snapshotBeforeStage4 = JSON.stringify(stage3.resolutionSnapshot);
  const stage4 = runStage4({
    repoPath,
    stage3,
    resolver: createTypeScriptResolverAdapter(),
    config: { tsconfigAliases: loadTsconfigAliases(repoPath) },
  });

  return {
    repoPath,
    stage3,
    stage4,
    snapshotBeforeStage4,
  };
}

/** Runs Stage 4 twice on the same Stage 3 input to verify deterministic output. */
export function runPipelineTwice(repoPath: string): {
  first: PipelineResult;
  second: Stage4Result;
} {
  const files = scanRepository(repoPath);
  const stage2 = runStage2(repoPath, files);
  const stage3 = runStage3({ repoPath, files, stage2 });
  const config = { tsconfigAliases: loadTsconfigAliases(repoPath) };
  const resolver = createTypeScriptResolverAdapter();

  const snapshotBeforeStage4 = JSON.stringify(stage3.resolutionSnapshot);
  const stage4First = runStage4({ repoPath, stage3, resolver, config });
  const stage4Second = runStage4({ repoPath, stage3, resolver, config });

  return {
    first: {
      repoPath,
      stage3,
      stage4: stage4First,
      snapshotBeforeStage4,
    },
    second: stage4Second,
  };
}
