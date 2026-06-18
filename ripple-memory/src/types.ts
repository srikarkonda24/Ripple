// Shared TypeScript types and Zod schemas for the chunking and extraction pipelines.
import { z } from "zod";

/** A single message from a captured conversation, with a stable index for chunk boundaries. */
export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  index: number;
};

/** Pass 1 output: a topic-bounded slice of the conversation (no classification yet). */
export type RoughChunk = {
  start_index: number;
  end_index: number;
  topic: string;
};

/** Zod schema for Pass 1 — Claude returns an array of rough chunks. */
export const RoughChunkSchema = z.object({
  start_index: z.number().int().nonnegative(),
  end_index: z.number().int().nonnegative(),
  topic: z.string().min(1),
});

export const RoughChunkResponseSchema = z.object({
  chunks: z.array(RoughChunkSchema).min(1),
});

/** Pass 2 output: signal classification for one rough chunk. */
export type ChunkClassification = {
  chunk_index: number;
  signal:
    | "decision"
    | "assumption"
    | "architecture"
    | "rejected"
    | "open_question"
    | "noise";
  confidence: "high" | "medium" | "low";
  reasoning: string;
  status: "success" | "failed";
};

/** Zod schema for Pass 2 — one classification per API call (not wrapped in an array). */
export const ClassificationResponseSchema = z.object({
  signal: z.enum([
    "decision",
    "assumption",
    "architecture",
    "rejected",
    "open_question",
    "noise",
  ]),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string().min(1),
});

/** Pass 3 output: a cross-chunk issue flagged during synthesis. */
export type SynthesisFlag = {
  chunk_indices: number[];
  issue: string;
  recommendation: string;
};

export const SynthesisFlagSchema = z.object({
  chunk_indices: z.array(z.number().int().nonnegative()).min(1),
  issue: z.string().min(1),
  recommendation: z.string().min(1),
});

export const SynthesisResponseSchema = z.object({
  flags: z.array(SynthesisFlagSchema),
});

/** Final pipeline output after all three passes complete. */
export type PipelineResult = {
  chunks: Array<RoughChunk & ChunkClassification>;
  flags: SynthesisFlag[];
  stats: {
    totalMessages: number;
    totalChunks: number;
    noiseChunks: number;
    failedChunks: number;
  };
};

/** A rough chunk merged with its Pass 2 classification — input to extraction. */
export type ClassifiedChunk = RoughChunk & ChunkClassification;

const confidenceSchema = z.enum(["high", "medium", "low"]);

/** Extraction — a decision recorded in the conversation. */
export const DecisionSchema = z.object({
  conclusion: z.string().min(1),
  trigger: z.string().min(1),
  alternatives_considered: z.array(z.string()),
  rejected_because: z.string(),
  assumptions: z.array(z.string()),
  confidence: confidenceSchema,
  revisit: z.boolean(),
});

/** Extraction — an approach that was tried or considered and ruled out. */
export const RejectedApproachSchema = z.object({
  approach: z.string().min(1),
  context: z.string().min(1),
  outcome: z.string().min(1),
  rejected_because: z.string().min(1),
  lessons: z.string(),
});

/** Extraction — an architectural truth about how the system is built. */
export const ArchitectureFactSchema = z.object({
  component: z.string().min(1),
  fact: z.string().min(1),
  rationale: z.string().min(1),
  linked_code: z.array(z.string()),
});

/** Extraction — an assumption the project depends on. */
export const AssumptionSchema = z.object({
  statement: z.string().min(1),
  decisions_that_depend_on_it: z.array(z.string()),
  risk: z.string().min(1),
});

/** Extraction — an unresolved question that matters to the project. */
export const OpenQuestionSchema = z.object({
  question: z.string().min(1),
  context: z.string().min(1),
  blocking: z.array(z.string()),
});

export const DecisionFactSchema = DecisionSchema.extend({
  type: z.literal("Decision"),
});

export const RejectedApproachFactSchema = RejectedApproachSchema.extend({
  type: z.literal("RejectedApproach"),
});

export const ArchitectureFactFactSchema = ArchitectureFactSchema.extend({
  type: z.literal("ArchitectureFact"),
});

export const AssumptionFactSchema = AssumptionSchema.extend({
  type: z.literal("Assumption"),
});

export const OpenQuestionFactSchema = OpenQuestionSchema.extend({
  type: z.literal("OpenQuestion"),
});

/** A single extracted fact, tagged by type for storage and retrieval routing. */
export const FactSchema = z.discriminatedUnion("type", [
  DecisionFactSchema,
  RejectedApproachFactSchema,
  ArchitectureFactFactSchema,
  AssumptionFactSchema,
  OpenQuestionFactSchema,
]);

export type Decision = z.infer<typeof DecisionSchema>;
export type RejectedApproach = z.infer<typeof RejectedApproachSchema>;
export type ArchitectureFact = z.infer<typeof ArchitectureFactSchema>;
export type Assumption = z.infer<typeof AssumptionSchema>;
export type OpenQuestion = z.infer<typeof OpenQuestionSchema>;
export type Fact = z.infer<typeof FactSchema>;

export const DecisionFactsResponseSchema = z.object({
  facts: z.array(DecisionSchema),
});

export const RejectedApproachFactsResponseSchema = z.object({
  facts: z.array(RejectedApproachSchema),
});

export const ArchitectureFactsResponseSchema = z.object({
  facts: z.array(ArchitectureFactSchema),
});

export const AssumptionFactsResponseSchema = z.object({
  facts: z.array(AssumptionSchema),
});

export const OpenQuestionFactsResponseSchema = z.object({
  facts: z.array(OpenQuestionSchema),
});

/** Outcome of extracting facts from one classified chunk. */
export type ExtractionResult =
  | {
      chunk_index: number;
      facts: Fact[];
      status: "success";
    }
  | {
      chunk_index: number;
      facts: Fact[];
      status: "failed";
      error_reason: string;
    };
