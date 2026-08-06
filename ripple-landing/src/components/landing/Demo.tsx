// Full GitHub PR comment demo for a Next.js App Router session-gate refactor.

import { CLI_ANALYZE, DEMO_PR } from '@/data/prDemo';
import { GithubPrComment } from '@/components/landing/GithubPrComment';

/**
 * Shows the exact artifact reviewers see: a GitHub PR comment plus CLI invocation.
 */
export function Demo() {
  return (
    <section id="demo" className="section section-text">
      <div className="section-inner">
        <h2 className="section-heading-title">Example: Next.js App Router PR #{DEMO_PR.number}</h2>
        <p className="demo-lead">
          <code>{DEMO_PR.repo}</code> · <code>{DEMO_PR.branch}</code> → <code>{DEMO_PR.base}</code>
          {' · '}
          moves auth from <code>middleware.ts</code> into the dashboard layout.
        </p>

        <pre className="cli-run">
          <span className="cli-run-prompt">$</span> {CLI_ANALYZE}
        </pre>

        <GithubPrComment />
      </div>
    </section>
  );
}
