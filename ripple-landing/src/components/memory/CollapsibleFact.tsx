// Expandable fact row with inline Pass 3 flag warnings when the chunk is flagged.
'use client';

import { useState } from 'react';
import type { Fact, Flag } from '@/data/memorySnapshot';
import { getFactHeadline } from '@/components/memory/memoryHelpers';

const BADGE_CLASS: Record<Fact['type'], string> = {
  Decision: 'memory-badge-decision',
  ArchitectureFact: 'memory-badge-architecture',
  OpenQuestion: 'memory-badge-openquestion',
  RejectedApproach: 'memory-badge-rejected',
  Assumption: 'memory-badge-assumption',
};

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

/** Formats a supporting field value for display. */
function formatValue(value: string | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (!value) return '(none)';
  return value;
}

/** Returns supporting field rows for an expanded fact. */
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

type CollapsibleFactProps = {
  fact: Fact;
  factKey: string;
  relatedFlags: Flag[];
};

/**
 * Renders one fact as a compact row; click to expand fields and inline flag details.
 */
export function CollapsibleFact({ fact, factKey, relatedFlags }: CollapsibleFactProps) {
  const [expanded, setExpanded] = useState(false);
  const [flagsExpanded, setFlagsExpanded] = useState(false);
  const headline = getFactHeadline(fact);
  const fields = getSupportingFields(fact);
  const hasFlags = relatedFlags.length > 0;

  return (
    <article className={`memory-fact-row${expanded ? ' is-expanded' : ''}${hasFlags ? ' has-flag' : ''}`}>
      <div className="memory-fact-row-header">
        <button
          type="button"
          className="memory-fact-row-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          <span className={`memory-badge memory-badge-sm ${BADGE_CLASS[fact.type]}`}>
            {fact.type === 'ArchitectureFact'
              ? 'Arch'
              : fact.type === 'OpenQuestion'
                ? 'Question'
                : fact.type}
          </span>
          <span className="memory-fact-row-headline">{headline}</span>
          <span className="memory-fact-row-meta">chunk {fact.chunk_index}</span>
          <span className="memory-fact-row-chevron" aria-hidden="true">
            {expanded ? '−' : '+'}
          </span>
        </button>
        {hasFlags && (
          <button
            type="button"
            className="memory-fact-flag-badge"
            aria-expanded={flagsExpanded}
            aria-label={`${relatedFlags.length} review flag${relatedFlags.length > 1 ? 's' : ''} on chunk ${fact.chunk_index}`}
            onClick={() => setFlagsExpanded((open) => !open)}
          >
            ⚠
          </button>
        )}
      </div>
      {flagsExpanded && hasFlags && (
        <div className="memory-fact-inline-flags">
          {relatedFlags.map((flag) => (
            <div
              key={`${flag.chunk_indices.join('-')}-${flag.issue.slice(0, 40)}`}
              className="memory-fact-inline-flag"
            >
              <p className="memory-detail-flag-issue">{flag.issue}</p>
              <p className="memory-field">
                <span className="memory-field-label">Recommendation:</span>{' '}
                {flag.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}
      {expanded && (
        <div className="memory-fact-row-details" id={factKey}>
          {fields.map((field) => (
            <p key={field.key} className="memory-field">
              <span className="memory-field-label">{field.label}:</span> {field.value}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
