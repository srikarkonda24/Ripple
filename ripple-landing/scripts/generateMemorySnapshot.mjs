// One-off script — parses ripple-memory/output.log into memorySnapshot.ts.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, "../../ripple-memory/output.log");
const outPath = path.join(__dirname, "../src/data/memorySnapshot.ts");

/** Reads output.log whether it was saved as UTF-8 or UTF-16 (PowerShell redirect). */
function readLogFile(filePath) {
  const buffer = readFileSync(filePath);
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  }
  return buffer.toString("utf8").replace(/\r\n/g, "\n");
}

/** Fixes common UTF-8-as-Latin1 mojibake from PowerShell log captures. */
function fixMojibake(text) {
  if (!text) return text;
  return text
    .replace(/ΓÇö/g, "—")
    .replace(/ΓÇô/g, "–")
    .replace(/ΓåÆ/g, "→")
    .replace(/┬╖/g, "·")
    .replace(/ΓÇÖ/g, "'")
    .replace(/ΓÇ£/g, '"')
    .replace(/ΓÇ¥/g, '"');
}

const log = readLogFile(logPath);

/** Parses kept chunk metadata from the test output log. */
function parseChunks(text) {
  const section =
    text.split("=== Kept Chunks")[1]?.split("=== Failed Classifications")[0] ?? "";
  const chunks = [];
  const blocks = section.split(/\nChunk (\d+): /).slice(1);

  for (let index = 0; index < blocks.length; index += 2) {
    const chunk_index = Number(blocks[index]);
    const body = blocks[index + 1] ?? "";
    const topic = fixMojibake(body.split("\n")[0]?.trim() ?? "");
    const signal = body.match(/Signal:\s+(\w+)/)?.[1] ?? "noise";
    const confidence = body.match(/Confidence:\s+(\w+)/)?.[1] ?? "low";
    const reasoning = fixMojibake(body.match(/Reasoning:\s+(.+)/)?.[1]?.trim() ?? "");
    const messageCount = Number(body.match(/Messages:\s+(\d+)/)?.[1] ?? 0);
    const indexMatch = body.match(/indices (\d+).+?(\d+)/);

    chunks.push({
      chunk_index,
      topic,
      signal,
      confidence,
      reasoning,
      start_index: indexMatch ? Number(indexMatch[1]) : 0,
      end_index: indexMatch ? Number(indexMatch[2]) : 0,
      message_count: messageCount,
    });
  }

  return chunks;
}

/** Parses Pass 3 flags from the test output log. */
function parseFlags(text) {
  const flags = [];
  const flagSection = text.split("=== All Pass 3 Flags ===")[1]?.split("Extraction:")[0] ?? "";
  const lines = flagSection.split("\n").filter((line) => line.trim());

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const chunksMatch = line.match(/^Chunks ([\d, ]+): (.+)$/);
    if (!chunksMatch) continue;

    const chunk_indices = chunksMatch[1].split(",").map((part) => Number(part.trim()));
    const issue = fixMojibake(chunksMatch[2].trim());
    const nextLine = lines[index + 1]?.trim() ?? "";
    const recommendation = fixMojibake(
      nextLine.replace(/^(\u2192|ΓåÆ|→)\s*/, "").trim(),
    );

    flags.push({ chunk_indices, issue, recommendation });
  }

  return flags;
}

/** Parses extracted facts grouped by type from the test output log. */
function parseFacts(text) {
  const facts = [];
  const sections = {
    Decision: text.split("--- Decision")[1]?.split("--- RejectedApproach")[0] ?? "",
    ArchitectureFact:
      text.split("--- ArchitectureFact")[1]?.split("--- Assumption")[0] ?? "",
    OpenQuestion:
      text.split("--- OpenQuestion")[1]?.split("=== Failed Extractions")[0] ?? "",
  };

  for (const [type, section] of Object.entries(sections)) {
    const blocks = section.split(/\n  Chunk (\d+):\n/).slice(1);
    for (let index = 0; index < blocks.length; index += 2) {
      const chunk_index = Number(blocks[index]);
      const body = blocks[index + 1] ?? "";
      const fact = { type, chunk_index };

      for (const line of body.split("\n")) {
        const match = line.match(/^\s{4}([^:]+):\s{2,}(.*)$/);
        if (!match) continue;
        const key = match[1].trim();
        let value = fixMojibake(match[2].trim());
        if (value === "(none)") value = "";
        if (key === "revisit") {
          fact[key] = value === "true";
        } else if (key === "confidence") {
          fact[key] = value;
        } else {
          fact[key] = value;
        }
      }

      facts.push(fact);
    }
  }

  return facts;
}

function escapeString(value) {
  return JSON.stringify(value);
}

function serializeFact(fact) {
  const entries = Object.entries(fact)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (typeof value === "boolean") {
        return `    ${key}: ${value}`;
      }
      return `    ${key}: ${escapeString(value)}`;
    });

  return `  {\n    type: ${escapeString(fact.type)},\n${entries
    .filter((entry) => !entry.includes("type:"))
    .join(",\n")}\n  }`;
}

function serializeChunk(chunk) {
  return `  {
    chunk_index: ${chunk.chunk_index},
    topic: ${escapeString(chunk.topic)},
    signal: ${escapeString(chunk.signal)},
    confidence: ${escapeString(chunk.confidence)},
    reasoning: ${escapeString(chunk.reasoning)},
    start_index: ${chunk.start_index},
    end_index: ${chunk.end_index},
    message_count: ${chunk.message_count},
  }`;
}

const chunks = parseChunks(log);
const flags = parseFlags(log);
const facts = parseFacts(log);

const decisionCount = facts.filter((f) => f.type === "Decision").length;
const architectureCount = facts.filter((f) => f.type === "ArchitectureFact").length;
const openQuestionCount = facts.filter((f) => f.type === "OpenQuestion").length;

const fileContent = `// Hardcoded snapshot of one ripple-memory pipeline run for the /memory preview page.
export type Fact = {
  type: "Decision" | "ArchitectureFact" | "OpenQuestion" | "RejectedApproach" | "Assumption";
  chunk_index: number;
  conclusion?: string;
  trigger?: string;
  alternatives_considered?: string;
  rejected_because?: string;
  assumptions?: string;
  confidence?: "high" | "medium" | "low";
  revisit?: boolean;
  component?: string;
  fact?: string;
  rationale?: string;
  linked_code?: string;
  question?: string;
  context?: string;
  blocking?: string;
};

export type Flag = {
  chunk_indices: number[];
  issue: string;
  recommendation: string;
};

export type Chunk = {
  chunk_index: number;
  topic: string;
  signal: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  start_index: number;
  end_index: number;
  message_count: number;
};

export const stats = {
  totalMessages: 252,
  totalChunks: ${chunks.length},
  noiseChunks: 0,
  failedChunks: 0,
  factsByType: {
    Decision: ${decisionCount},
    RejectedApproach: 0,
    ArchitectureFact: ${architectureCount},
    Assumption: 0,
    OpenQuestion: ${openQuestionCount},
  },
};

export const chunks: Chunk[] = [
${chunks.map(serializeChunk).join(",\n")}
];

export const flags: Flag[] = [
${flags
  .map(
    (flag) =>
      `  {\n    chunk_indices: [${flag.chunk_indices.join(", ")}],\n    issue: ${escapeString(flag.issue)},\n    recommendation: ${escapeString(flag.recommendation)},\n  }`,
  )
  .join(",\n")}
];

export const facts: Fact[] = [
${facts.map(serializeFact).join(",\n")}
];
`;

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, fileContent, "utf8");
console.log(
  `Wrote ${chunks.length} chunks, ${facts.length} facts, ${flags.length} flags to ${outPath}`,
);
