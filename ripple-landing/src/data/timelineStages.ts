// Hardcoded product timeline stages for the /memory dashboard — maps chunk ranges to narrative phases.
import type { Fact } from '@/data/memorySnapshot';

export interface TimelineStage {
  id: string;
  order: number;
  label: string;
  title: string;
  summary: string;
  status: 'done' | 'in_progress' | 'next';
  chunkRange: [number, number];
}

export const STAGES: TimelineStage[] = [
  {
    id: 'architecture-positioning',
    order: 1,
    label: 'stage 1',
    title: 'Architecture & positioning locked',
    summary:
      'Six fact types, storage mapping, no-framework decision, coding-specific scope vs. Exo.',
    status: 'done',
    chunkRange: [0, 3],
  },
  {
    id: 'chunking-pipeline',
    order: 2,
    label: 'stage 2',
    title: 'Three-pass chunking pipeline built',
    summary:
      'Segmentation, parallel classification, synthesis. Validated on 252 real messages.',
    status: 'done',
    chunkRange: [4, 8],
  },
  {
    id: 'extraction-pipeline',
    order: 3,
    label: 'stage 3',
    title: 'Extraction pipeline added',
    summary: '5 fact types via Zod schemas. 18 chunks → 148 facts, 0 failures.',
    status: 'done',
    chunkRange: [9, 13],
  },
  {
    id: 'dashboard-and-bug',
    order: 4,
    label: 'stage 4 — in progress',
    title: 'Memory dashboard, then a flag-matching bug',
    summary:
      '/memory page shipped, grouped by topic. Pass 3 flags wrongly attached to all facts in a flagged chunk.',
    status: 'in_progress',
    chunkRange: [14, 17],
  },
  {
    id: 'storage-retrieval-mcp',
    order: 5,
    label: 'next',
    title: 'Postgres/Neo4j storage, retrieval, MCP tools',
    summary: '',
    status: 'next',
    chunkRange: [18, 18],
  },
];

/** Returns facts whose chunk_index falls within the stage range (inclusive). */
export function getFactsForStage(stage: TimelineStage, facts: Fact[]): Fact[] {
  const [start, end] = stage.chunkRange;
  if (start > end) {
    return [];
  }
  return facts
    .filter((fact) => fact.chunk_index >= start && fact.chunk_index <= end)
    .sort((left, right) => left.chunk_index - right.chunk_index);
}
