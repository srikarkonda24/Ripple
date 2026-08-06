// Hardcoded project evolution summary for the /memory dashboard — not pipeline output.
import type { TimelineStage } from './timelineStages';

export interface EvolutionItem {
  id: string;
  label: string;
  sourceChunk?: number;
}

export interface ProjectEvolution {
  startedLabel: string;
  majorMilestones: EvolutionItem[];
  rejectedApproaches: EvolutionItem[];
  currentFocus: EvolutionItem[];
  openDecisions: EvolutionItem[];
}

// rejectedApproaches is hand-extracted from Decision facts as a stopgap until
// RejectedApproach extraction produces results from the real pipeline.
export const PROJECT_EVOLUTION: ProjectEvolution = {
  startedLabel: 'Jun 2026',
  majorMilestones: [
    {
      id: 'm1',
      label: 'Chrome extension capture (real-time accumulation)',
      sourceChunk: 0,
    },
    { id: 'm2', label: 'Full-page message viewer', sourceChunk: 1 },
    {
      id: 'm3',
      label: 'Paste import + cross-session capture',
      sourceChunk: 5,
    },
    {
      id: 'm4',
      label: 'Memory platform architecture locked (ARCHITECTURE.md)',
      sourceChunk: 8,
    },
    {
      id: 'm5',
      label: 'Three-pass chunking pipeline (validated, 18 chunks, 0 failures)',
      sourceChunk: 16,
    },
    {
      id: 'm6',
      label: 'Extraction pipeline (5 fact types, 148 facts, 0 failures)',
      sourceChunk: 16,
    },
  ],
  rejectedApproaches: [
    {
      id: 'r1',
      label: 'Programmatic scroll capture (Option A)',
      sourceChunk: 0,
    },
    {
      id: 'r2',
      label: 'LangChain / LlamaIndex frameworks',
      sourceChunk: 8,
    },
    {
      id: 'r3',
      label: 'Keyword pre-filtering before LLM boundary detection',
      sourceChunk: 16,
    },
    {
      id: 'r4',
      label: 'Single-pass extraction (one Claude call for everything)',
      sourceChunk: 8,
    },
  ],
  currentFocus: [
    {
      id: 'c1',
      label:
        'Fixing Pass 3 flag-to-fact matching (currently over-attaching flags to whole chunks)',
    },
    { id: 'c2', label: 'Designing the /memory timeline view' },
  ],
  openDecisions: [
    {
      id: 'o1',
      label: 'Cursor prompt to rebuild the landing page for full Ripple vision',
      sourceChunk: 9,
    },
    {
      id: 'o2',
      label: 'Graph edge creation: manual CONTRADICTS vs. future ML detection',
      sourceChunk: 8,
    },
    {
      id: 'o3',
      label: 'Off-the-shelf vs. custom/fine-tuned embedding models',
      sourceChunk: 8,
    },
  ],
};

/** Returns evolution items whose sourceChunk falls within a timeline stage range. */
export function getEvolutionForStage(stage: TimelineStage) {
  const inRange = (item: EvolutionItem) =>
    item.sourceChunk !== undefined &&
    item.sourceChunk >= stage.chunkRange[0] &&
    item.sourceChunk <= stage.chunkRange[1];

  return {
    milestones: PROJECT_EVOLUTION.majorMilestones.filter(inRange),
    rejected: PROJECT_EVOLUTION.rejectedApproaches.filter(inRange),
    openDecisions: PROJECT_EVOLUTION.openDecisions.filter(inRange),
    currentFocus:
      stage.status === 'in_progress' ? PROJECT_EVOLUTION.currentFocus : [],
  };
}
