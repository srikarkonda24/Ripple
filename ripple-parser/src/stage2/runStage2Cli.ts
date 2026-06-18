// CLI entry point that runs Stage 1 scanning then Stage 2 symbol-graph generation and prints JSON.
import { scanRepository } from "../scanRepository";
import { runStage2 } from "./runStage2";

function main(): void {
  const repoPath = process.argv[2];
  if (!repoPath) {
    console.error("Usage: npx ts-node src/stage2/runStage2Cli.ts <repo-path>");
    process.exit(1);
  }

  const files = scanRepository(repoPath);
  const result = runStage2(repoPath, files);
  console.log(JSON.stringify(result, null, 2));
}

main();
