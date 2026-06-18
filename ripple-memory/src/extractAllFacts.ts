// Runs fact extraction for all classified chunks in parallel and logs a summary.
import { extractChunk } from "./extractor";
import type { ClassifiedChunk } from "./types";
import type { ExtractionResult, Fact, Message } from "./types";

const FACT_TYPES: Fact["type"][] = [
  "Decision",
  "RejectedApproach",
  "ArchitectureFact",
  "Assumption",
  "OpenQuestion",
];

/** Counts extracted facts by their discriminated type tag. */
function countFactsByType(facts: Fact[]): Record<Fact["type"], number> {
  const counts: Record<Fact["type"], number> = {
    Decision: 0,
    RejectedApproach: 0,
    ArchitectureFact: 0,
    Assumption: 0,
    OpenQuestion: 0,
  };

  for (const fact of facts) {
    counts[fact.type] += 1;
  }

  return counts;
}

/**
 * Extracts facts from every classified chunk in parallel.
 * Logs a summary of totals, per-type breakdown, and failures when all calls resolve.
 */
export async function extractAllFacts(
  chunks: ClassifiedChunk[],
  messages: Message[],
): Promise<ExtractionResult[]> {
  const results = await Promise.all(
    chunks.map((chunk) => extractChunk(chunk, messages)),
  );

  const successfulResults = results.filter(
    (result) => result.status === "success",
  );
  const failedResults = results.filter((result) => result.status === "failed");
  const allFacts = successfulResults.flatMap((result) => result.facts);
  const typeCounts = countFactsByType(allFacts);

  const typeBreakdown = FACT_TYPES.map(
    (factType) => `${factType}: ${typeCounts[factType]}`,
  ).join(", ");

  console.log(
    `Extraction: processed ${results.length} chunks, extracted ${allFacts.length} facts (${typeBreakdown}), ${failedResults.length} failed`,
  );

  return results;
}
