// Pure helpers for grouping and displaying memory snapshot data on /memory.
import type { Chunk, Fact, Flag } from '@/data/memorySnapshot';

export type FactTypeFilter = 'all' | 'Decision' | 'ArchitectureFact' | 'OpenQuestion';

export type ChunkFactCounts = {
  Decision: number;
  ArchitectureFact: number;
  OpenQuestion: number;
  total: number;
};

/** Returns the primary headline for a fact based on its type. */
export function getFactHeadline(fact: Fact): string {
  switch (fact.type) {
    case 'Decision':
      return fact.conclusion ?? '';
    case 'ArchitectureFact':
      return fact.fact ?? '';
    case 'OpenQuestion':
      return fact.question ?? '';
    default:
      return '';
  }
}

/** Returns Pass 3 flags referencing a chunk index. */
export function flagsForChunk(chunkIndex: number, flags: Flag[]): Flag[] {
  return flags.filter((flag) => flag.chunk_indices.includes(chunkIndex));
}

/** Returns all chunk indices that appear in any Pass 3 flag. */
export function flaggedChunkIndices(flags: Flag[]): Set<number> {
  const indices = new Set<number>();
  for (const flag of flags) {
    for (const chunkIndex of flag.chunk_indices) {
      indices.add(chunkIndex);
    }
  }
  return indices;
}

/** Counts facts per type for one chunk. */
export function countFactsForChunk(chunkIndex: number, facts: Fact[]): ChunkFactCounts {
  const chunkFacts = facts.filter((fact) => fact.chunk_index === chunkIndex);
  return {
    Decision: chunkFacts.filter((fact) => fact.type === 'Decision').length,
    ArchitectureFact: chunkFacts.filter((fact) => fact.type === 'ArchitectureFact').length,
    OpenQuestion: chunkFacts.filter((fact) => fact.type === 'OpenQuestion').length,
    total: chunkFacts.length,
  };
}

/** Returns facts for a chunk, optionally filtered by type. */
export function factsForChunk(
  chunkIndex: number,
  facts: Fact[],
  typeFilter: FactTypeFilter,
): Fact[] {
  return facts.filter((fact) => {
    if (fact.chunk_index !== chunkIndex) return false;
    if (typeFilter === 'all') return true;
    return fact.type === typeFilter;
  });
}

/** Whether a chunk has any facts matching the active type filter. */
export function chunkMatchesFilter(
  chunkIndex: number,
  facts: Fact[],
  typeFilter: FactTypeFilter,
): boolean {
  if (typeFilter === 'all') {
    return facts.some((fact) => fact.chunk_index === chunkIndex);
  }
  return facts.some(
    (fact) => fact.chunk_index === chunkIndex && fact.type === typeFilter,
  );
}

/** Maps chunk signal string to a display label. */
export function formatSignal(signal: Chunk['signal']): string {
  return signal.replace(/_/g, ' ');
}
