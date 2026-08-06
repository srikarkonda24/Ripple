// Early-access CTA — functional, not visionary.

'use client';

import { Button } from '@/components/Button';
import { useWaitlistForm } from '@/hooks/useWaitlistForm';

/**
 * Captures interest for GitHub-connected PR impact analysis.
 */
export function Waitlist() {
  const { email, errorMessage, isSubmitted, isSubmitting, setEmail, handleSubmit } =
    useWaitlistForm();

  return (
    <section id="waitlist" className="section final-cta">
      <div className="final-cta-inner">
        <h2 className="final-cta-heading">Run impact graphs on your next PR.</h2>
        <p className="final-cta-body">
          Closed beta. Leave your email — we&apos;ll send install access when your slot opens.
        </p>

        {isSubmitted ? (
          <p className="final-cta-success">Got it. We&apos;ll email when CLI access is ready.</p>
        ) : (
          <form className="final-cta-form" onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              className="final-cta-input"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              aria-label="Email address"
              autoComplete="email"
            />
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Request CLI access
            </Button>
          </form>
        )}

        {!isSubmitted && (
          <p className="final-cta-disclaimer">No product pitch emails. Access only.</p>
        )}
        {errorMessage && <p className="final-cta-error">{errorMessage}</p>}
      </div>
    </section>
  );
}
