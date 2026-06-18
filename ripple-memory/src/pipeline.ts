// Orchestrates the three-pass chunking pipeline from raw messages to a PipelineResult.
import { segmentConversation } from "./pass1Segmentation";
import { classifyAllChunks } from "./pass2Classification";
import { synthesizeChunks } from "./pass3Synthesis";
import type {
  ChunkClassification,
  ClassifiedChunk,
  Message,
  PipelineResult,
  RoughChunk,
} from "./types";

export type { ClassifiedChunk };

/** Full pipeline output including failed chunks for review (extends the core PipelineResult). */
export type PipelineRunResult = PipelineResult & {
  failedChunks: ClassifiedChunk[];
};

/** Merges rough chunks with their parallel classification results by array index. */
function mergeChunksWithClassifications(
  chunks: RoughChunk[],
  classifications: ChunkClassification[],
): ClassifiedChunk[] {
  return chunks.map((chunk, index) => ({
    ...chunk,
    ...classifications[index]!,
    chunk_index: index,
  }));
}

/**
 * Runs the full three-pass chunking pipeline: segment → classify (parallel) → synthesize.
 * Noise chunks are excluded from output chunks and Pass 3 input but counted in stats.
 */
export async function runChunkingPipeline(
  messages: Message[],
): Promise<PipelineRunResult> {
  const roughChunks = await segmentConversation(messages);
  const classifications = await classifyAllChunks(roughChunks, messages);
  const allClassified = mergeChunksWithClassifications(
    roughChunks,
    classifications,
  );

  const failedChunks = allClassified.filter(
    (chunk) => chunk.status === "failed",
  );
  const noiseChunks = allClassified.filter(
    (chunk) => chunk.signal === "noise" && chunk.status === "success",
  );
  const keptChunks = allClassified.filter(
    (chunk) => chunk.signal !== "noise" && chunk.status === "success",
  );

  const flags = await synthesizeChunks(keptChunks);

  const stats = {
    totalMessages: messages.length,
    totalChunks: roughChunks.length,
    noiseChunks: noiseChunks.length,
    failedChunks: failedChunks.length,
  };

  if (failedChunks.length > 0) {
    console.log("\nFailed classifications (queued for review):");
    for (const chunk of failedChunks) {
      console.log(
        `  Chunk ${chunk.chunk_index} [${chunk.start_index}–${chunk.end_index}] "${chunk.topic}": ${chunk.reasoning}`,
      );
    }
  }

  return {
    chunks: keptChunks,
    flags,
    stats,
    failedChunks,
  };
}
