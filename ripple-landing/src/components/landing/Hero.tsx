// Hero with concrete engineering copy, CLI install, and GitHub PR comment visual.

import { Button } from '@/components/Button';
import { LINKS } from '@/config/links';
import { CliInstall } from '@/components/landing/CliInstall';
import { GithubPrComment } from '@/components/landing/GithubPrComment';

/**
 * Renders the PR impact hero without AI-vision marketing language.
 */
export function Hero() {
  return (
    <section className="section hero">
      <div className="hero-shell">
        <div className="hero-copy">
          <p className="hero-brand">Ripple</p>
          <h1 className="hero-headline">See exactly what breaks before you merge.</h1>
          <p className="hero-subheadline">
            Automated impact graphs for complex pull requests. Ripple maps your codebase&apos;s
            dependency graph—tracking files, imports, and cross-route callers—then overlays the
            diff.
          </p>
          <CliInstall />
          <div className="hero-actions">
            <Button variant="primary" href={LINKS.connectGitHub}>
              Connect GitHub Repository
            </Button>
            <Button variant="secondary" href={LINKS.seeDemo}>
              See PR comment output
            </Button>
          </div>
        </div>

        <GithubPrComment compact />
      </div>
    </section>
  );
}
