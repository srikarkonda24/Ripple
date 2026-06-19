// CLI entry point that runs Stage 1, Stage 2, and Stage 3 and prints canonical JSON.
import { scanRepository } from "../scanRepository";
import { runStage2 } from "../stage2/runStage2";
import { runStage3 } from "./runStage3";

function main(): void {
  const repoPath = process.argv[2];
  if (!repoPath) {
    console.error("Usage: npx ts-node src/stage3/runStage3Cli.ts <repo-path>");
    process.exit(1);
  }

  const files = scanRepository(repoPath);
  const stage2 = runStage2(repoPath, files);
  const result = runStage3({ repoPath, files, stage2 });
  console.log(JSON.stringify(result, null, 2));
}

main();
