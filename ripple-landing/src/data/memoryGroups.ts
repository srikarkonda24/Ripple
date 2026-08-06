// Groups hardcoded memory snapshot facts by product area — no changes to memorySnapshot.ts.
import type { Fact } from '@/data/memorySnapshot';

export const GROUPS = [
  'Chrome Extension',
  'ripple-mcp',
  'ripple-memory Architecture',
  'Chunking Pipeline',
  'Product Positioning',
  'Project Setup',
] as const;

export type GroupName = (typeof GROUPS)[number];

const CHROME_EXTENSION_KEYWORDS = [
  'ripple-extension',
  'popup',
  'content.js',
  'messages.html',
  'paste import',
  'paste conversation',
  'paste',
  'chrome.storage',
  'mutationobserver',
  'option b',
  'manifest v3',
  'manifest.json',
  'view all messages',
  'copy all as json',
  'session_started',
  'claude.ai',
];

const RIPPLE_MCP_KEYWORDS = [
  'ripple-mcp',
  'list_concepts',
  'get_concept_context',
  'get_project_memory',
  'concepts.json',
  'mcp tool',
  'mcp server',
  'mcp integration',
];

const CHUNKING_PIPELINE_KEYWORDS = [
  'pass 1',
  'pass 2',
  'pass 3',
  'chunking pipeline',
  'chunking',
  'prefilter',
  'pre-filter',
  'pre filter',
  'overlap',
  'signalanalysis',
  'signal analysis',
  'segmentation',
  'pass1segmentation',
  'pass2classification',
  'pass3synthesis',
  'classifychunk',
  'rough chunk',
  'synthesis flag',
  'boundary detection',
  'detectboundaries',
  'addoverlap',
];

const PROJECT_SETUP_KEYWORDS = [
  'gitignore',
  'github',
  '.env',
  'api key',
  'anthropic_api_key',
  'node_modules',
  'initial commit',
  'committing',
  'git rm',
  'git push',
  'private github',
];

const PRODUCT_POSITIONING_KEYWORDS = [
  'exo',
  'architecture.md',
  'ripple_memory.md',
  'coding-specific',
  'coding specific',
  'persistent memory',
  'reasoning memory',
  'product niche',
  'positioning',
  'wedge',
  'compounding',
  'landing page redesign',
  'landing page cursor prompt',
];

const RIPPLE_MEMORY_ARCHITECTURE_KEYWORDS = [
  'ripple-memory',
  'postgres',
  'postgresql',
  'neo4j',
  'pgvector',
  'supabase',
  'embedding',
  'retrieval',
  'rerank',
  'cohere',
  'platform layer',
  'storage layer',
  'extraction pipeline',
  'knowledge graph',
  'langchain',
  'llamaindex',
  'zod validation',
  'openai text-embedding',
  'aura',
  'fact type',
  'dual-database',
  'review_queue',
  'pending_edges',
  'edge resolver',
  'get_memory_context',
  'get_reasoning_chain',
  'get_project_values',
];

/** Returns true if normalized text contains any keyword (case-insensitive). */
function textIncludesAny(text: string, keywords: readonly string[]): boolean {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

/** Builds searchable text from a fact based on its type. */
function getFactSearchText(fact: Fact): string {
  switch (fact.type) {
    case 'ArchitectureFact':
      return [fact.component, fact.fact, fact.rationale, fact.linked_code]
        .filter(Boolean)
        .join(' ');
    case 'Decision':
      return [
        fact.conclusion,
        fact.trigger,
        fact.alternatives_considered,
        fact.rejected_because,
        fact.assumptions,
      ]
        .filter(Boolean)
        .join(' ');
    case 'OpenQuestion':
      return [fact.question, fact.context, fact.blocking].filter(Boolean).join(' ');
    default:
      return '';
  }
}

/** Classifies a fact into one of the six product-area groups. */
export function assignGroup(fact: Fact): GroupName {
  const text = getFactSearchText(fact);

  if (textIncludesAny(text, PROJECT_SETUP_KEYWORDS)) {
    return 'Project Setup';
  }
  if (textIncludesAny(text, CHROME_EXTENSION_KEYWORDS)) {
    return 'Chrome Extension';
  }
  if (textIncludesAny(text, CHUNKING_PIPELINE_KEYWORDS)) {
    return 'Chunking Pipeline';
  }
  if (textIncludesAny(text, RIPPLE_MCP_KEYWORDS)) {
    return 'ripple-mcp';
  }
  if (textIncludesAny(text, PRODUCT_POSITIONING_KEYWORDS)) {
    return 'Product Positioning';
  }
  if (textIncludesAny(text, RIPPLE_MEMORY_ARCHITECTURE_KEYWORDS)) {
    return 'ripple-memory Architecture';
  }

  return 'ripple-memory Architecture';
}

/** Buckets all facts by group, each sorted by chunk_index ascending. */
export function groupFacts(facts: Fact[]): Record<GroupName, Fact[]> {
  const grouped = Object.fromEntries(
    GROUPS.map((group) => [group, [] as Fact[]]),
  ) as Record<GroupName, Fact[]>;

  for (const fact of facts) {
    grouped[assignGroup(fact)].push(fact);
  }

  for (const group of GROUPS) {
    grouped[group].sort((left, right) => left.chunk_index - right.chunk_index);
  }

  return grouped;
}
