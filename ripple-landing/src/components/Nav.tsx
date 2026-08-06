// Top navigation for the Ripple landing page.

import Link from 'next/link';
import { LINKS } from '@/config/links';
import { Button } from '@/components/Button';

/**
 * Renders sticky navigation with mechanism, demo, and access links.
 */
export function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          Ripple
        </Link>
        <div className="nav-actions">
          <a href="#mechanism" className="nav-link">
            How it works
          </a>
          <a href="#demo" className="nav-link">
            Example
          </a>
          <Button variant="primary" href={LINKS.connectGitHub}>
            Request access
          </Button>
        </div>
      </div>
    </header>
  );
}
