// Left panel listing topic groups and fact counts for the memory dashboard.
'use client';

import { GROUPS, type GroupName } from '@/data/memoryGroups';
import type { Fact } from '@/data/memorySnapshot';
import type { FactTypeFilter } from '@/components/memory/memoryHelpers';

type GroupSidebarProps = {
  groupedFacts: Record<GroupName, Fact[]>;
  selectedGroup: GroupName;
  typeFilter: FactTypeFilter;
  onSelectGroup: (group: GroupName) => void;
};

/** Counts facts in a group that match the active type filter. */
function countVisibleFacts(groupFacts: Fact[], typeFilter: FactTypeFilter): number {
  if (typeFilter === 'all') {
    return groupFacts.length;
  }
  return groupFacts.filter((fact) => fact.type === typeFilter).length;
}

/**
 * Renders the six topic groups with fact counts for dashboard navigation.
 */
export function GroupSidebar({
  groupedFacts,
  selectedGroup,
  typeFilter,
  onSelectGroup,
}: GroupSidebarProps) {
  return (
    <nav className="memory-timeline" aria-label="Memory topic groups">
      <p className="memory-timeline-label">Topic areas</p>
      <ol className="memory-timeline-list">
        {GROUPS.map((group) => {
          const groupFacts = groupedFacts[group];
          const visibleCount = countVisibleFacts(groupFacts, typeFilter);
          const isSelected = group === selectedGroup;
          const isDimmed = visibleCount === 0;

          return (
            <li key={group}>
              <button
                type="button"
                className={`memory-timeline-item memory-group-item${isSelected ? ' is-selected' : ''}${isDimmed ? ' is-dimmed' : ''}`}
                onClick={() => onSelectGroup(group)}
                aria-current={isSelected ? 'true' : undefined}
              >
                <span className="memory-group-name">{group}</span>
                <span className="memory-group-count">
                  {visibleCount}/{groupFacts.length}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
