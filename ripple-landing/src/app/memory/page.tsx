// Server page for the static ripple-memory pipeline preview dashboard.
import { Nav } from '@/components/Nav';
import { MemoryPageClient } from '@/components/memory/MemoryPageClient';
import { facts, flags, stats } from '@/data/memorySnapshot';

/**
 * Renders the /memory preview page with hardcoded pipeline snapshot data.
 */
export default function MemoryPage() {
  return (
    <>
      <Nav />
      <main className="memory-page">
        <MemoryPageClient stats={stats} facts={facts} flags={flags} />
      </main>
    </>
  );
}
