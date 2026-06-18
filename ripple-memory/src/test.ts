// Manual test runner — loads sample conversation data and prints chunking + extraction reports.
import dotenv from "dotenv";

dotenv.config();

import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractAllFacts } from "./extractAllFacts";
import { runChunkingPipeline, type PipelineRunResult } from "./pipeline";
import type { ExtractionResult, Fact, Message } from "./types";

type RawConversationMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  index?: number;
};

/** Ensures ANTHROPIC_API_KEY is present before any API call is attempted. */
function requireApiKey(): void {
  if (!process.env["ANTHROPIC_API_KEY"]) {
    throw new Error(
      "ANTHROPIC_API_KEY is missing. Create a .env file in ripple-memory with your Anthropic API key.",
    );
  }
}

/** Assigns stable index numbers to messages when the source file omits them. */
function normalizeMessages(rawMessages: RawConversationMessage[]): Message[] {
  return rawMessages.map((message, index) => ({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
    index: message.index ?? index,
  }));
}

/** Finds Pass 3 flags that reference a given chunk index. */
function flagsForChunk(
  chunkIndex: number,
  flags: PipelineRunResult["flags"],
): string[] {
  return flags
    .filter((flag) => flag.chunk_indices.includes(chunkIndex))
    .map(
      (flag) =>
        `- ${flag.issue} → ${flag.recommendation} (chunks: ${flag.chunk_indices.join(", ")})`,
    );
}

/** Prints a readable report for each chunk kept after noise filtering. */
function printKeptChunksReport(result: PipelineRunResult): void {
  console.log("\n=== Kept Chunks (non-noise, successful) ===\n");

  if (result.chunks.length === 0) {
    console.log("(none)\n");
    return;
  }

  for (const chunk of result.chunks) {
    const messageCount = chunk.end_index - chunk.start_index + 1;
    const relatedFlags = flagsForChunk(chunk.chunk_index, result.flags);

    console.log(`Chunk ${chunk.chunk_index}: ${chunk.topic}`);
    console.log(`  Signal:     ${chunk.signal}`);
    console.log(`  Confidence: ${chunk.confidence}`);
    console.log(`  Reasoning:  ${chunk.reasoning}`);
    console.log(
      `  Messages:   ${messageCount} (indices ${chunk.start_index}–${chunk.end_index})`,
    );

    if (relatedFlags.length > 0) {
      console.log("  Pass 3 flags:");
      for (const flagLine of relatedFlags) {
        console.log(`    ${flagLine}`);
      }
    } else {
      console.log("  Pass 3 flags: (none)");
    }

    console.log("");
  }
}

/** Prints failed classifications separately so they are not buried in the report. */
function printFailedChunksReport(
  failedChunks: PipelineRunResult["failedChunks"],
): void {
  console.log("=== Failed Classifications ===\n");

  if (failedChunks.length === 0) {
    console.log("(none)\n");
    return;
  }

  for (const chunk of failedChunks) {
    console.log(`Chunk ${chunk.chunk_index}: ${chunk.topic}`);
    console.log(`  Indices:   ${chunk.start_index}–${chunk.end_index}`);
    console.log(`  Reason:    ${chunk.reasoning}`);
    console.log("");
  }
}

/** Prints final pipeline statistics. */
function printStats(stats: PipelineRunResult["stats"]): void {
  console.log("=== Pipeline Stats ===\n");
  console.log(`Total messages:  ${stats.totalMessages}`);
  console.log(`Total chunks:    ${stats.totalChunks}`);
  console.log(`Noise chunks:    ${stats.noiseChunks}`);
  console.log(`Failed chunks:   ${stats.failedChunks}`);
  console.log("");
}

const FACT_TYPES: Fact["type"][] = [
  "Decision",
  "RejectedApproach",
  "ArchitectureFact",
  "Assumption",
  "OpenQuestion",
];

/** Prints one extracted fact with chunk index and every field value. */
function printFact(fact: Fact, chunkIndex: number): void {
  console.log(`  Chunk ${chunkIndex}:`);

  switch (fact.type) {
    case "Decision":
      console.log(`    conclusion:               ${fact.conclusion}`);
      console.log(`    trigger:                    ${fact.trigger}`);
      console.log(
        `    alternatives_considered:    ${fact.alternatives_considered.join("; ") || "(none)"}`,
      );
      console.log(`    rejected_because:           ${fact.rejected_because || "(none)"}`);
      console.log(`    assumptions:                ${fact.assumptions.join("; ") || "(none)"}`);
      console.log(`    confidence:                 ${fact.confidence}`);
      console.log(`    revisit:                    ${fact.revisit}`);
      break;
    case "RejectedApproach":
      console.log(`    approach:                   ${fact.approach}`);
      console.log(`    context:                    ${fact.context}`);
      console.log(`    outcome:                    ${fact.outcome}`);
      console.log(`    rejected_because:           ${fact.rejected_because}`);
      console.log(`    lessons:                    ${fact.lessons || "(none)"}`);
      break;
    case "ArchitectureFact":
      console.log(`    component:                  ${fact.component}`);
      console.log(`    fact:                       ${fact.fact}`);
      console.log(`    rationale:                  ${fact.rationale}`);
      console.log(
        `    linked_code:                ${fact.linked_code.join("; ") || "(none)"}`,
      );
      break;
    case "Assumption":
      console.log(`    statement:                  ${fact.statement}`);
      console.log(
        `    decisions_that_depend_on_it: ${fact.decisions_that_depend_on_it.join("; ") || "(none)"}`,
      );
      console.log(`    risk:                       ${fact.risk}`);
      break;
    case "OpenQuestion":
      console.log(`    question:                   ${fact.question}`);
      console.log(`    context:                    ${fact.context}`);
      console.log(
        `    blocking:                   ${fact.blocking.join("; ") || "(none)"}`,
      );
      break;
  }

  console.log("");
}

/** Prints all extracted facts grouped by fact type. */
function printExtractedFactsReport(results: ExtractionResult[]): void {
  console.log("=== Extracted Facts (grouped by type) ===\n");

  const successfulResults = results.filter((result) => result.status === "success");
  const factsWithChunk = successfulResults.flatMap((result) =>
    result.facts.map((fact) => ({ fact, chunkIndex: result.chunk_index })),
  );

  if (factsWithChunk.length === 0) {
    console.log("(none)\n");
    return;
  }

  for (const factType of FACT_TYPES) {
    const factsOfType = factsWithChunk.filter(
      ({ fact }) => fact.type === factType,
    );

    console.log(`--- ${factType} (${factsOfType.length}) ---\n`);

    if (factsOfType.length === 0) {
      console.log("(none)\n");
      continue;
    }

    for (const { fact, chunkIndex } of factsOfType) {
      printFact(fact, chunkIndex);
    }
  }
}

/** Prints extraction failures separately so they are easy to spot. */
function printFailedExtractionsReport(results: ExtractionResult[]): void {
  console.log("=== Failed Extractions ===\n");

  const failedResults = results.filter((result) => result.status === "failed");

  if (failedResults.length === 0) {
    console.log("(none)\n");
    return;
  }

  for (const result of failedResults) {
    console.log(`Chunk ${result.chunk_index}:`);
    console.log(`  Reason: ${result.error_reason}`);
    console.log("");
  }
}

/** Entry point — load sample data, run pipeline, print report. */
async function main(): Promise<void> {
  requireApiKey();

  const samplePath = path.join(
    process.cwd(),
    "test-data",
    "sample-conversation.json",
  );
  const rawFile = await readFile(samplePath, "utf8");
  const parsed = JSON.parse(rawFile) as { messages: RawConversationMessage[] };

  if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
    throw new Error(
      "sample-conversation.json must contain a non-empty messages array.",
    );
  }

  const messages = normalizeMessages(parsed.messages);
  console.log(`Loaded ${messages.length} messages from ${samplePath}\n`);

  const result = await runChunkingPipeline(messages);

  printKeptChunksReport(result);
  printFailedChunksReport(result.failedChunks);
  printStats(result.stats);

  if (result.flags.length > 0) {
    console.log("=== All Pass 3 Flags ===\n");
    for (const flag of result.flags) {
      console.log(`Chunks ${flag.chunk_indices.join(", ")}: ${flag.issue}`);
      console.log(`  → ${flag.recommendation}\n`);
    }
  }

  const extractionResults = await extractAllFacts(result.chunks, messages);

  printExtractedFactsReport(extractionResults);
  printFailedExtractionsReport(extractionResults);
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  console.error("Test run failed:", detail);
  process.exitCode = 1;
});
