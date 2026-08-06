// Concrete three-step flow describing mechanism, not "merge confidence."

const STEPS = [
  {
    number: '01',
    title: 'Index the repo',
    body: 'Ripple maps the dependency graph: files, imports, call sites, App Router layouts, and Server Actions.',
  },
  {
    number: '02',
    title: 'Overlay the PR diff',
    body: 'Changed symbols are projected onto that graph. Outbound and inbound paths are walked automatically.',
  },
  {
    number: '03',
    title: 'Post the impact report',
    body: 'A GitHub PR comment lists risk, affected callers, dependency paths, and file:line evidence.',
  },
] as const;

/**
 * Explains the product loop in tool-agnostic engineering language.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="section section-text">
      <div className="section-inner">
        <h2 className="section-heading-title">What runs when you open a PR</h2>
        <ol className="steps-grid">
          {STEPS.map((step) => (
            <li key={step.number} className="step-card">
              <span className="step-number">{step.number}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
