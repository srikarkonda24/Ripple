// Shared Anthropic API client and JSON response helper for all chunking passes.
import Anthropic from "@anthropic-ai/sdk";

const CHUNKING_MODEL = "claude-sonnet-4-6";

/** Returns a configured Anthropic client using ANTHROPIC_API_KEY from the environment. */
export function createAnthropicClient(): Anthropic {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file before running the pipeline.",
    );
  }
  return new Anthropic({ apiKey });
}

/** Strips optional markdown code fences so JSON.parse can handle Claude's reply. */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

/** Extracts the first text block from a Claude messages response. */
function extractTextContent(content: Anthropic.Message["content"]): string {
  for (const block of content) {
    if (block.type === "text") {
      return block.text;
    }
  }
  throw new Error("Claude response contained no text content block.");
}

/**
 * Calls Claude and parses the reply as JSON.
 * Throws on API errors, missing text, or invalid JSON — callers handle recovery per pass.
 */
export async function callClaudeForJson(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 8192,
): Promise<unknown> {
  const client = createAnthropicClient();
  const response = await client.messages.create({
    model: CHUNKING_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = extractTextContent(response.content);
  const jsonText = stripCodeFences(rawText);
  const trimmedJsonText = jsonText.trim();

  if (!trimmedJsonText.startsWith("{") && !trimmedJsonText.startsWith("[")) {
    throw new Error(
      `Claude did not return JSON — response appears to be conversational text, not structured output. First 200 chars: ${rawText.slice(0, 200)}`,
    );
  }

  try {
    return JSON.parse(trimmedJsonText) as unknown;
  } catch (parseError) {
    const detail =
      parseError instanceof Error ? parseError.message : String(parseError);
    console.error("Failed to parse Claude JSON response:", detail);
    console.error("Raw response text:", rawText);
    throw new Error(`Claude returned invalid JSON: ${detail}`);
  }
}
