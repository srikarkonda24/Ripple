// Landing page for Ripple PR impact analysis.

import { Hero } from '@/components/landing/Hero';
import { Problem } from '@/components/landing/Problem';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Mechanism } from '@/components/landing/Mechanism';
import { Demo } from '@/components/landing/Demo';
import { Pipeline } from '@/components/landing/Pipeline';
import { Waitlist } from '@/components/landing/Waitlist';
import { Nav } from '@/components/Nav';

/**
 * Renders the de-slopped Ripple landing page focused on PR blast radius.
 */
export default function Home() {
  return (
    <div className="landing-page">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Mechanism />
        <Demo />
        <Pipeline />
        <Waitlist />
      </main>
    </div>
  );
}
