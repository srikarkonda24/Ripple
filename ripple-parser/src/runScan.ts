// CLI entry point that prints FileNode[] JSON for a scanned repository path.
import { scanRepository } from "./scanRepository";

function main(): void {
  const repoPath = process.argv[2];
  if (!repoPath) {
    console.error("Usage: npx ts-node src/runScan.ts <repo-path>");
    process.exit(1);
  }

  const files = scanRepository(repoPath);
  console.log(JSON.stringify(files, null, 2));
}

main();
