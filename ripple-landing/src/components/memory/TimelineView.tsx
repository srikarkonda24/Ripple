// Vertical product timeline with collapsible stage facts for the /memory dashboard.
'use client';

import { useState, type ReactNode } from 'react';
import type { Fact } from '@/data/memorySnapshot';
import { getEvolutionForStage, type EvolutionItem } from '@/data/projectEvolution';
import {
  getFactsForStage,
  STAGES,
  type TimelineStage,
} from '@/data/timelineStages';
import { getFactHeadline } from '@/components/memory/memoryHelpers';

const FIELD_LABELS: Record<string, string> = {
  trigger: 'Trigger',
  alternatives_considered: 'Alternatives considered',
  rejected_because: 'Rejected because',
  assumptions: 'Assumptions',
  confidence: 'Confidence',
  revisit: 'Revisit',
  context: 'Context',
  component: 'Component',
  rationale: 'Rationale',
  linked_code: 'Linked code',
  blocking: 'Blocking',
};

type TimelineViewProps = {
  facts: Fact[];
};

/** Formats a supporting field value for display. */
function formatValue(value: string | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (!value) return '(none)';
  return value;
}

/** Returns supporting field rows for a fully expanded fact. */
function getSupportingFields(fact: Fact): Array<{ key: string; label: string; value: string }> {
  const skip = new Set(['type', 'chunk_index', 'conclusion', 'fact', 'question']);
  return (Object.keys(fact) as Array<keyof Fact>)
    .filter((key) => !skip.has(key) && fact[key] !== undefined)
    .map((key) => ({
      key: String(key),
      label: FIELD_LABELS[String(key)] ?? String(key),
      value: formatValue(fact[key] as string | boolean | undefined),
    }));
}

/** Renders a checkmark icon for milestone items. */
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Renders an X icon for rejected approach items. */
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

/** Renders an arrow-right icon for focus and open decision items. */
function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type StageEvolutionSectionProps = {
  title: string;
  items: EvolutionItem[];
  tone: 'milestone' | 'rejected' | 'focus' | 'open';
  icon: ReactNode;
};

/** Renders one compact evolution subsection inside a timeline stage card. */
function StageEvolutionSection({ title, items, tone, icon }: StageEvolutionSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`memory-stage-evolution-section memory-stage-evolution-section--${tone}`}>
      <p className="memory-stage-evolution-label">{title}</p>
      <ul className="memory-stage-evolution-list">
        {items.map((item) => (
          <li key={item.id} className="memory-stage-evolution-item">
            <span className="memory-stage-evolution-icon">{icon}</span>
            <span className="memory-stage-evolution-text">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Renders per-stage evolution slices below the fact-count button. */
function StageEvolutionInline({ stage }: { stage: TimelineStage }) {
  const evolution = getEvolutionForStage(stage);
  const hasContent =
    evolution.milestones.length > 0 ||
    evolution.rejected.length > 0 ||
    evolution.currentFocus.length > 0 ||
    evolution.openDecisions.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="memory-stage-evolution">
      <StageEvolutionSection
        title="Milestones"
        items={evolution.milestones}
        tone="milestone"
        icon={<CheckIcon />}
      />
      <StageEvolutionSection
        title="Rejected approaches"
        items={evolution.rejected}
        tone="rejected"
        icon={<XIcon />}
      />
      <StageEvolutionSection
        title="Current focus"
        items={evolution.currentFocus}
        tone="focus"
        icon={<ArrowRightIcon />}
      />
      <StageEvolutionSection
        title="Open decisions"
        items={evolution.openDecisions}
        tone="open"
        icon={<ArrowRightIcon />}
      />
    </div>
  );
}

/** Renders one fact as a collapsed one-liner that expands to full detail. */
function TimelineFactItem({
  fact,
  itemKey,
}: {
  fact: Fact;
  itemKey: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const headline = getFactHeadline(fact);
  const fields = getSupportingFields(fact);

  return (
    <div className={`memory-timeline-fact${expanded ? ' is-expanded' : ''}`}>
      <button
        type="button"
        className="memory-timeline-fact-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        <span className={`memory-badge memory-badge-sm ${
          fact.type === 'Decision'
            ? 'memory-badge-decision'
            : fact.type === 'ArchitectureFact'
              ? 'memory-badge-architecture'
              : 'memory-badge-openquestion'
        }`}>
          {fact.type === 'ArchitectureFact' ? 'Arch' : fact.type === 'OpenQuestion' ? 'Q' : fact.type.slice(0, 3)}
        </span>
        <span className="memory-timeline-fact-line">{headline}</span>
        <span className="memory-timeline-fact-chunk">chunk {fact.chunk_index}</span>
      </button>
      {expanded && (
        <div className="memory-timeline-fact-detail" id={itemKey}>
          {fields.map((field) => (
            <p key={field.key} className="memory-field">
              <span className="memory-field-label">{field.label}:</span> {field.value}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Renders one timeline stage row with optional expandable facts panel. */
function TimelineStageRow({
  stage,
  facts,
  isFactsOpen,
  onToggleFacts,
}: {
  stage: TimelineStage;
  facts: Fact[];
  isFactsOpen: boolean;
  onToggleFacts: () => void;
}) {
  const statusClass = `memory-timeline-stage--${stage.status}`;

  return (
    <li className={`memory-timeline-stage ${statusClass}`}>
      <div className="memory-timeline-marker" aria-hidden="true" />
      <div className="memory-timeline-stage-content">
        <p className="memory-timeline-stage-label">{stage.label}</p>
        <h2 className="memory-timeline-stage-title">{stage.title}</h2>
        {stage.summary ? (
          <p className="memory-timeline-stage-summary">{stage.summary}</p>
        ) : null}

        {stage.status !== 'next' && (
          <button
            type="button"
            className="memory-timeline-facts-btn"
            aria-expanded={isFactsOpen}
            onClick={onToggleFacts}
          >
            {facts.length} fact{facts.length === 1 ? '' : 's'}
          </button>
        )}

        <StageEvolutionInline stage={stage} />

        {isFactsOpen && facts.length > 0 && (
          <div className="memory-timeline-facts-panel">
            {facts.map((fact, index) => (
              <TimelineFactItem
                key={`${stage.id}-${fact.type}-${fact.chunk_index}-${index}`}
                fact={fact}
                itemKey={`${stage.id}-fact-${index}`}
              />
            ))}
          </div>
        )}

        {isFactsOpen && facts.length === 0 && (
          <p className="memory-timeline-empty-facts">No facts in this stage range.</p>
        )}
      </div>
    </li>
  );
}

/**
 * Renders the vertical product timeline with collapsible fact lists per stage.
 */
export function TimelineView({ facts }: TimelineViewProps) {
  const [openStageId, setOpenStageId] = useState<string | null>(null);

  return (
    <div className="memory-timeline-view">
      <header className="memory-header">
        <p className="memory-eyebrow">Pipeline preview</p>
        <h1 className="memory-headline">Project timeline</h1>
        <p className="memory-subheadline">
          {facts.length} extracted facts mapped across {STAGES.length} build stages — expand
          any stage to browse its facts.
        </p>
      </header>

      <ol className="memory-timeline-track">
        {STAGES.map((stage) => {
          const stageFacts = getFactsForStage(stage, facts);
          return (
            <TimelineStageRow
              key={stage.id}
              stage={stage}
              facts={stageFacts}
              isFactsOpen={openStageId === stage.id}
              onToggleFacts={() =>
                setOpenStageId((current) => (current === stage.id ? null : stage.id))
              }
            />
          );
        })}
      </ol>
    </div>
  );
}
