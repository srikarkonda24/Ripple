// Copyable CLI install line to signal a real developer tool, not a waitlist concept.

'use client';

import { useState } from 'react';
import { CLI_INSTALL } from '@/data/prDemo';

/**
 * Renders a terminal-style install command with one-click copy.
 */
export function CliInstall() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(CLI_INSTALL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error('Failed to copy CLI install command:', error);
    }
  };

  return (
    <div className="cli-install">
      <code className="cli-install-command">{CLI_INSTALL}</code>
      <button type="button" className="cli-install-copy" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
