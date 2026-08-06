// Client dashboard — topic-group navigation with scoped fact list.
'use client';

import { useMemo, useState } from 'react';
import { GROUPS, groupFacts, type GroupName } from '@/data/memoryGroups';
import type { Fact, Flag } from '@/data/memorySnapshot';
import { GroupDetailPanel } from '@/components/memory/GroupDetailPanel';
import { GroupSidebar } from '@/components/memory/GroupSidebar';
import { flaggedChunkIndices, type FactTypeFilter } from '@/components/memory/memoryHelpers';

type MemoryDashboardProps = {
  stats: {
    totalMessages: number;
    totalChunks: number;
    noiseChunks: number;
    failedChunks: number;
    factsByType: {
      Decision: number;
      RejectedApproach: number;
      ArchitectureFact: number;
      Assumption: number;
      OpenQuestion: number;
    };
  };
  facts: Fact[];
  flags: Flag[];
};

const TYPE_FILTERS: Array<{ id: FactTypeFilter; label: string }> = [
  { id: 'all', label: 'All types' },
  { id: 'Decision', label: 'Decisions' },
  { id: 'ArchitectureFact', label: 'Architecture' },
  { id: 'OpenQuestion', label: 'Open questions' },
];

/** Counts distinct facts whose chunk_index appears in any Pass 3 flag. */
function countFlaggedFacts(facts: Fact[], flags: Flag[]): number {
  const flaggedIndices = flaggedChunkIndices(flags);
  return facts.filter((fact) => flaggedIndices.has(fact.chunk_index)).length;
}

/**
 * Renders the static memory pipeline preview grouped by product area.
 */
export function MemoryDashboard({ stats, facts, flags }: MemoryDashboardProps) {
  const [selectedGroup, setSelectedGroup] = useState<GroupName>(GROUPS[0]);
  const [typeFilter, setTypeFilter] = useState<FactTypeFilter>('all');

  const groupedFacts = useMemo(() => groupFacts(facts), [facts]);
  const flaggedFactCount = useMemo(() => countFlaggedFacts(facts, flags), [facts, flags]);

  const selectedGroupFacts = groupedFacts[selectedGroup];

  return (
    <div className="memory-dashboard">
      <header className="memory-header">
        <p className="memory-eyebrow">Pipeline preview</p>
        <h1 className="memory-headline">Project memory map</h1>
        <p className="memory-subheadline">
          {stats.totalMessages} messages → {facts.length} facts organized into {GROUPS.length}{' '}
          areas. Select a topic to explore related decisions and architecture.
        </p>
      </header>

      <section className="memory-stats" aria-label="Summary statistics">
        <button
          type="button"
          className="memory-stat-card memory-stat-card-btn"
          onClick={() => setTypeFilter('Decision')}
        >
          <p className="memory-stat-label">Decisions</p>
          <p className="memory-stat-value">{stats.factsByType.Decision}</p>
        </button>
        <button
          type="button"
          className="memory-stat-card memory-stat-card-btn"
          onClick={() => setTypeFilter('ArchitectureFact')}
        >
          <p className="memory-stat-label">Architecture facts</p>
          <p className="memory-stat-value">{stats.factsByType.ArchitectureFact}</p>
        </button>
        <button
          type="button"
          className="memory-stat-card memory-stat-card-btn"
          onClick={() => setTypeFilter('OpenQuestion')}
        >
          <p className="memory-stat-label">Open questions</p>
          <p className="memory-stat-value">{stats.factsByType.OpenQuestion}</p>
        </button>
        <div className="memory-stat-card">
          <p className="memory-stat-label">Flagged facts</p>
          <p className="memory-stat-value">{flaggedFactCount}</p>
        </div>
      </section>

      <nav className="memory-filters" aria-label="Filter facts by type within selected group">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`memory-filter-btn${typeFilter === filter.id ? ' is-active' : ''}`}
            onClick={() => setTypeFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </nav>

      <div className="memory-layout">
        <GroupSidebar
          groupedFacts={groupedFacts}
          selectedGroup={selectedGroup}
          typeFilter={typeFilter}
          onSelectGroup={setSelectedGroup}
        />

        <div className="memory-panel" aria-live="polite">
          <GroupDetailPanel
            group={selectedGroup}
            facts={selectedGroupFacts}
            flags={flags}
            typeFilter={typeFilter}
          />
        </div>
      </div>
    </div>
  );
}
