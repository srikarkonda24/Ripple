// GitHub-style PR comment showing Ripple impact output as reviewers would see it.

import {
  DEMO_PR,
  EVIDENCE_LINES,
  IMPACT_CHAIN,
  REVIEW_CHECKS,
} from '@/data/prDemo';

type GithubPrCommentProps = {
  compact?: boolean;
};

/**
 * Renders a GitHub PR thread comment with concrete Next.js impact output.
 */
export function GithubPrComment({ compact = false }: GithubPrCommentProps) {
  return (
    <article className={`gh-thread ${compact ? 'gh-thread-compact' : ''}`} aria-hidden="true">
      <header className="gh-thread-header">
        <span className="gh-avatar" />
        <div className="gh-thread-meta">
          <strong>{DEMO_PR.author}</strong>
          <span>commented on pull request #{DEMO_PR.number}</span>
        </div>
      </header>

      <div className="gh-comment">
        <p className="gh-comment-title">
          <span className="gh-badge gh-badge-risk">risk: {DEMO_PR.risk}</span>
          Impact report for <code>{DEMO_PR.changedFiles[0]}</code>
        </p>

        <p className="gh-comment-body">
          Diff moves the session gate out of <code>middleware.ts</code> into{' '}
          <code>app/(dashboard)/layout.tsx</code>. Downstream App Router routes and Stripe
          checkout still assume an authenticated request context.
        </p>

        <pre className="gh-codeblock">{`Impact path
${IMPACT_CHAIN.map((step, index) => `${'  '.repeat(index)}${index === 0 ? '' : '↳ '}${step}`).join('\n')}

Affected: ${DEMO_PR.affectedFiles} files · ${DEMO_PR.callerCount} callers
Evidence: ${DEMO_PR.evidencePaths} dependency paths`}</pre>

        {!compact ? (
          <>
            <p className="gh-section-label">Evidence</p>
            <ul className="gh-evidence">
              {EVIDENCE_LINES.map((line) => (
                <li key={line.path}>
                  <code>{line.path}</code>
                  <span>{line.detail}</span>
                </li>
              ))}
            </ul>

            <p className="gh-section-label">Review before merge</p>
            <ul className="gh-checklist">
              {REVIEW_CHECKS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </article>
  );
}
