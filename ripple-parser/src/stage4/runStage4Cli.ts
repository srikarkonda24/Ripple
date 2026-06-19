// CLI entry point that runs Stage 1 through Stage 4 and prints canonical JSON output.
import { createTypeScriptResolverAdapter } from "../../../adapters/typescript/resolver/index";
import { scanRepository } from "../scanRepository";
import { runStage2 } from "../stage2/runStage2";
import { runStage3 } from "../stage3/runStage3";
import { loadTsconfigAliases } from "./loadTsconfigAliases";
import { runStage4 } from "./runStage4";

function main(): void {
  const repoPath = process.argv[2];
  if (!repoPath) {
    console.error("Usage: npx ts-node src/stage4/runStage4Cli.ts <repo-path>");
    process.exit(1);
  }

  const files = scanRepository(repoPath);
  const stage2 = runStage2(repoPath, files);
  const stage3 = runStage3({ repoPath, files, stage2 });
  const tsconfigAliases = loadTsconfigAliases(repoPath);
  const stage4 = runStage4({
    repoPath,
    stage3,
    resolver: createTypeScriptResolverAdapter(),
    config: { tsconfigAliases },
  });

  console.log(JSON.stringify(stage4, null, 2));
}

main();
