// Right panel showing all facts in a selected topic group.
'use client';

import type { GroupName } from '@/data/memoryGroups';
import type { Fact, Flag } from '@/data/memorySnapshot';
import { CollapsibleFact } from '@/components/memory/CollapsibleFact';
import { flagsForChunk, type FactTypeFilter } from '@/components/memory/memoryHelpers';

type GroupDetailPanelProps = {
  group: GroupName;
  facts: Fact[];
  flags: Flag[];
  typeFilter: FactTypeFilter;
};

/** Filters group facts by the active type filter. */
function filterFactsByType(facts: Fact[], typeFilter: FactTypeFilter): Fact[] {
  if (typeFilter === 'all') {
    return facts;
  }
  return facts.filter((fact) => fact.type === typeFilter);
}

/**
 * Renders a continuous fact list for one topic group, sorted by chunk_index.
 */
export function GroupDetailPanel({
  group,
  facts,
  flags,
  typeFilter,
}: GroupDetailPanelProps) {
  const visibleFacts = filterFactsByType(facts, typeFilter);

  return (
    <section className="memory-detail" aria-label={`${group} facts`}>
      <header className="memory-detail-header">
        <h2 className="memory-detail-topic">{group}</h2>
        <p className="memory-detail-meta">
          {visibleFacts.length} fact{visibleFacts.length === 1 ? '' : 's'}
          {typeFilter !== 'all' ? ` (${typeFilter})` : ''} · sorted chronologically by
          conversation chunk
        </p>
      </header>

      <div className="memory-detail-facts">
        {visibleFacts.length === 0 ? (
          <p className="memory-empty">No facts match the current filter in this area.</p>
        ) : (
          visibleFacts.map((fact, index) => (
            <CollapsibleFact
              key={`${fact.type}-${fact.chunk_index}-${index}`}
              fact={fact}
              factKey={`${group}-fact-${index}`}
              relatedFlags={flagsForChunk(fact.chunk_index, flags)}
            />
          ))
        )}
      </div>
    </section>
  );
}
