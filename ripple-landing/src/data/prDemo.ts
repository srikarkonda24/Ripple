// Concrete Next.js App Router PR sample used across landing demos.

export type ImpactEdge = {
  from: string;
  to: string;
  kind: 'imports' | 'calls' | 'renders' | 'reads';
};

export type EvidenceLine = {
  path: string;
  detail: string;
};

export const DEMO_PR = {
  number: 2847,
  repo: 'acme/checkout-web',
  title: 'Move session gate from middleware into dashboard layout',
  branch: 'fix/session-layout-gate',
  base: 'main',
  author: 'ripple-bot',
  changedFiles: [
    'middleware.ts',
    'app/(dashboard)/layout.tsx',
    'lib/auth/session.ts',
  ],
  risk: 'HIGH',
  affectedFiles: 11,
  callerCount: 7,
  evidencePaths: 19,
} as const;

/** Hyper-specific impact chain for a Next.js App Router auth move. */
export const IMPACT_CHAIN = [
  'middleware.ts',
  'app/(dashboard)/layout.tsx',
  'app/(dashboard)/billing/page.tsx',
  'lib/stripe/createCheckoutSession.ts',
] as const;

export const EVIDENCE_LINES: EvidenceLine[] = [
  {
    path: 'app/(dashboard)/billing/page.tsx:14',
    detail: 'Server Component awaits getSession() from layout-provided auth',
  },
  {
    path: 'app/(dashboard)/settings/actions.ts:31',
    detail: 'Server Action imports requireUser() — previously middleware-only',
  },
  {
    path: 'lib/stripe/createCheckoutSession.ts:22',
    detail: 'Checkout session creation assumes authenticated request context',
  },
];

export const REVIEW_CHECKS = [
  'Confirm unauthenticated hits to /billing still redirect (matcher removed from middleware)',
  'Verify Server Actions under app/(dashboard) still call requireUser()',
  'Re-test Stripe checkout return URL with layout-gated session',
] as const;

export const EXTRACTION_STEPS = [
  {
    title: 'Parse',
    body: 'Tree-sitter / TypeScript AST over the repo snapshot — not embeddings of the diff.',
  },
  {
    title: 'Extract edges',
    body: 'Imports, call sites, Next.js route → layout → page edges, Server Action callers.',
  },
  {
    title: 'Diff overlay',
    body: 'Changed symbols are projected onto the graph; outbound and inbound paths are walked.',
  },
  {
    title: 'Emit evidence',
    body: 'Every risk claim links to file:line edges. No path, no claim.',
  },
] as const;

export const CLI_INSTALL = 'npm i -g @ripple/cli';
export const CLI_ANALYZE = 'ripple analyze --pr 2847 --repo .';
