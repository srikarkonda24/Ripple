// Symbol span fixtures for Phase 4 resolution tests.
import type { GsidRef } from "../core/GsidRef";

export const testGsid: GsidRef = {
  id: "gsid-fixture-001",
  commitHash: "a1b2c3d4e5f6789012345678901234567890abcd",
  schemaVersion: "stage5-v1",
  timestamp: 0,
};

export const authSessionSpans = [
  {
    nodeId: "node-auth-session",
    filePath: "lib/auth/session.ts",
    displayName: "getSession",
    startLine: 10,
    endLine: 25,
  },
  {
    nodeId: "node-layout-gate",
    filePath: "app/(dashboard)/layout.tsx",
    displayName: "DashboardLayout",
    startLine: 1,
    endLine: 40,
  },
] as const;

export const workflowEndpoints = [
  {
    sourceId: "node-entry",
    targetId: "node-billing-page",
    label: "checkout-flow",
  },
  {
    sourceId: "node-entry",
    targetId: "node-settings",
    label: "settings-flow",
  },
] as const;
