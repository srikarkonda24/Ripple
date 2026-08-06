// Problem section grounded in reviewer frustration, not corporate AI framing.

/**
 * States the real failure mode: rubber-stamping PRs you cannot fully trace.
 */
export function Problem() {
  return (
    <section className="section section-text problem">
      <div className="section-inner problem-inner">
        <h2 className="section-heading-title">
          Rubber-stamping PRs you can&apos;t fully trace is a production outage waiting to happen.
        </h2>
        <p className="problem-lead">
          Diffs got bigger. Reviewers still click through imports by hand. Hidden callers in
          layouts, Server Actions, and shared libs do not show up in a three-paragraph summary.
        </p>
        <p className="problem-lead problem-lead-emphasis">
          Ripple prints the blast radius—with file:line evidence—before you approve.
        </p>
      </div>
    </section>
  );
}
