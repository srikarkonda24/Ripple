// Quiet pipeline strip — outcomes and constraints, not vision slogans.

const STAGES = [
  'Repository snapshot',
  'AST + import graph',
  'Diff → impact walk',
  'file:line evidence',
] as const;

/**
 * Renders the processing pipeline without Stage 5 or "understanding layer" language.
 */
export function Pipeline() {
  return (
    <section className="section section-text pipeline">
      <div className="section-inner pipeline-inner">
        <h2 className="section-heading-title">Deterministic path from repo to PR comment</h2>
        <p className="pipeline-lead">
          Same inputs produce the same impact set. The report is only as strong as the edges
          extracted from your tree.
        </p>
        <ol className="pipeline-row">
          {STAGES.map((stage, index) => (
            <li key={stage} className="pipeline-stage">
              <span>{stage}</span>
              {index < STAGES.length - 1 ? (
                <span className="pipeline-arrow" aria-hidden="true">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
