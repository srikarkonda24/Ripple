// Client shell for /memory — toggles between timeline and topic-grouped views.
'use client';

import { useState } from 'react';
import type { Fact, Flag } from '@/data/memorySnapshot';
import { MemoryDashboard } from '@/components/memory/MemoryDashboard';
import { TimelineView } from '@/components/memory/TimelineView';

type MemoryView = 'timeline' | 'topic';

type MemoryPageClientProps = {
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

/**
 * Renders the memory preview with a toggle between timeline and topic views.
 */
export function MemoryPageClient({ stats, facts, flags }: MemoryPageClientProps) {
  const [view, setView] = useState<MemoryView>('timeline');

  return (
    <>
      <div className="memory-view-toggle">
        {view === 'timeline' ? (
          <button
            type="button"
            className="memory-view-toggle-link"
            onClick={() => setView('topic')}
          >
            View by topic instead
          </button>
        ) : (
          <button
            type="button"
            className="memory-view-toggle-link"
            onClick={() => setView('timeline')}
          >
            View timeline instead
          </button>
        )}
      </div>

      {view === 'timeline' ? (
        <TimelineView facts={facts} />
      ) : (
        <MemoryDashboard stats={stats} facts={facts} flags={flags} />
      )}
    </>
  );
}
