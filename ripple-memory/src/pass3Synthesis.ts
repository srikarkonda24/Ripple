// Pass 3 — synthesizes cross-chunk flags from classified chunk metadata (labels only, no raw text).
import { callClaudeForJson } from "./claudeClient";
import {
  SynthesisResponseSchema,
  type ChunkClassification,
  type ClassifiedChunk,
  type RoughChunk,
  type SynthesisFlag,
} from "./types";

const SYSTEM_PROMPT = `You review classified conversation chunks for cross-chunk issues.

You receive ONLY metadata per chunk (index, topic, signal, confidence, reasoning) — not the raw messages.

Flag issues such as:
- contradictions between chunks
- later chunks that supersede earlier decisions without acknowledging it
- chunks classified as "noise" that actually bridge two real decision threads
- misclassifications visible only when reading chunks in sequence

If no issues are found, return an empty flags array.

Respond with JSON only, matching this shape:
{
  "flags": [
    {
      "chunk_indices": [2, 5],
      "issue": "What the cross-chunk problem is",
      "recommendation": "What to do about it"
    }
  ]
}`;

/** Formats classified chunks as a compact ordered list for the synthesis prompt. */
function formatClassifiedChunks(classified: ClassifiedChunk[]): string {
  return classified
    .map(
      (chunk) =>
        `Chunk ${chunk.chunk_index}: topic="${chunk.topic}", signal=${chunk.signal}, confidence=${chunk.confidence}, reasoning="${chunk.reasoning}"`,
    )
    .join("\n");
}

/**
 * Pass 3: reviews all non-noise classified chunks and returns synthesis flags.
 * On failure, logs the error and returns an empty array — synthesis is not load-bearing.
 */
export async function synthesizeChunks(
  classified: ClassifiedChunk[],
): Promise<SynthesisFlag[]> {
  if (classified.length === 0) {
    console.log("Pass 3: skipped (no chunks to synthesize)");
    return [];
  }

  try {
    const userPrompt = `Review these ${classified.length} classified chunks in order and flag any cross-chunk issues.

${formatClassifiedChunks(classified)}`;

    const rawResponse = await callClaudeForJson(SYSTEM_PROMPT, userPrompt, 4096);
    const parsed = SynthesisResponseSchema.safeParse(rawResponse);

    if (!parsed.success) {
      console.error("Pass 3 Zod validation failed:", parsed.error.format());
      console.log("Pass 3: found 0 flags (validation failure)");
      return [];
    }

    const flags = parsed.data.flags;
    console.log(`Pass 3: found ${flags.length} flag${flags.length === 1 ? "" : "s"}`);
    return flags;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Pass 3 synthesis failed:", detail);
    console.log("Pass 3: found 0 flags (error)");
    return [];
  }
}
