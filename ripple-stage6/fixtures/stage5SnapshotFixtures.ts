// Stage 5 snapshot fixtures shared by integration tests.
import type { GsidRef } from "../core/GsidRef";
import { createSnapshotMaterial } from "../../ripple-stage5/snapshot/SnapshotResolver";

export const integrationGsid: GsidRef = {
  id: "gsid-integration-001",
  commitHash: "commit-integration",
  schemaVersion: "stage5-v1",
  timestamp: 0,
};

export const integrationSnapshot = createSnapshotMaterial(
  [{ id: "A" }, { id: "B" }, { id: "X-caller" }],
  [
    { id: "e1", from: "A", to: "B", type: "CALLS", direction: "OUT" },
    { id: "e2", from: "X-caller", to: "B", type: "CALLS", direction: "OUT" },
  ],
);

export const changedSymbolB = {
  nodeId: "B",
  filePath: "src/b.ts",
  displayName: "functionB",
} as const;
