// Validates Stage 5 gateway integration and evidence-preserving interpretation.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GSIDValidationFailure } from "../../ripple-stage5/core/Stage5ExecutionError";
import { REGISTERED_EVID_REF } from "../queries/ImpactQuery";
import {
  changedSymbolB,
  integrationGsid,
  integrationSnapshot,
} from "../fixtures/stage5SnapshotFixtures";
import {
  assertEvidenceIdentical,
  snapshotEvidence,
} from "../integration/EvidencePreservation";
import { interpretImpactClaim } from "../integration/ImpactInterpreter";
import { SnapshotProviderError } from "../integration/IntegrationErrors";
import {
  InMemorySnapshotProvider,
  snapshotProviderAsResolver,
} from "../integration/SnapshotProvider";
import { stage5Gateway } from "../integration/Stage5Gateway";
import { runPipeline } from "../../ripple-stage5/cli/index";

describe("SnapshotProvider", () => {
  it("resolves fixture SnapshotMaterial by GSID id", () => {
    const provider = new InMemorySnapshotProvider({
      [integrationGsid.id]: integrationSnapshot,
    });
    const material = provider.resolve({
      id: integrationGsid.id,
      commitHash: integrationGsid.commitHash,
      schemaVersion: integrationGsid.schemaVersion,
      timestamp: integrationGsid.timestamp,
    });
    assert.equal(material.nodes.length, integrationSnapshot.nodes.length);
  });

  it("fails closed when snapshot material is missing", () => {
    const provider = new InMemorySnapshotProvider({});
    assert.throws(
      () =>
        provider.resolve({
          id: "missing",
          commitHash: "a",
          schemaVersion: "v",
          timestamp: 0,
        }),
      SnapshotProviderError,
    );
  });
});

describe("Stage5Gateway", () => {
  it("executes Stage 5 pipeline and preserves evidence identity", () => {
    const provider = new InMemorySnapshotProvider({
      [integrationGsid.id]: integrationSnapshot,
    });
    const query = {
      type: "CALLERS" as const,
      target: "B",
      gsid: integrationGsid,
      evid: REGISTERED_EVID_REF,
    };

    const evidence = stage5Gateway.execute(query, provider);
    const captured = snapshotEvidence(evidence);
    assertEvidenceIdentical(evidence, captured);
    assert.ok(evidence.graphPath.includes("B"));
    assert.ok(evidence.graphPath.includes("X-caller"));
    assert.equal(evidence.evidenceId.length > 0, true);
  });

  it("surfaces GSID mismatch when snapshot binding is wrong at execution", () => {
    const provider = new InMemorySnapshotProvider({
      [integrationGsid.id]: integrationSnapshot,
    });
    const resolver = snapshotProviderAsResolver(provider);
    assert.throws(
      () =>
        runPipeline(
          {
            type: "CALLERS",
            target: "B",
            gsid: { ...integrationGsid, id: "other-id" },
            evid: REGISTERED_EVID_REF,
          },
          resolver,
        ),
      GSIDValidationFailure,
    );
  });
});

describe("ImpactInterpreter", () => {
  it("creates claims only when evidence supports graphPath and evidenceId", () => {
    const provider = new InMemorySnapshotProvider({
      [integrationGsid.id]: integrationSnapshot,
    });
    const query = {
      type: "CALLERS" as const,
      target: "B",
      gsid: integrationGsid,
      evid: REGISTERED_EVID_REF,
    };
    const evidence = stage5Gateway.execute(query, provider);
    const claim = interpretImpactClaim({
      changedSymbol: changedSymbolB,
      query,
      evidence,
    });
    assert.notEqual(claim, null);
    assert.equal(claim?.evidenceId, evidence.evidenceId);
    assert.deepEqual(claim?.graphPath, evidence.graphPath);
    assert.ok(claim?.affectedNodeIds.includes("X-caller"));
  });

  it("refuses unsupported claims when evidence graphPath is empty", () => {
    const claim = interpretImpactClaim({
      changedSymbol: changedSymbolB,
      query: {
        type: "CALLERS",
        target: "B",
        gsid: integrationGsid,
        evid: REGISTERED_EVID_REF,
      },
      evidence: {
        evidenceId: "test",
        gsid: integrationGsid,
        commitId: integrationGsid.commitHash,
        schemaVersion: integrationGsid.schemaVersion,
        graphPath: [],
        executionSteps: [],
      },
    });
    assert.equal(claim, null);
  });

  it("refuses claims when evidence GSID does not match query GSID", () => {
    const provider = new InMemorySnapshotProvider({
      [integrationGsid.id]: integrationSnapshot,
    });
    const evidence = stage5Gateway.execute(
      {
        type: "CALLERS",
        target: "B",
        gsid: integrationGsid,
        evid: REGISTERED_EVID_REF,
      },
      provider,
    );
    const claim = interpretImpactClaim({
      changedSymbol: changedSymbolB,
      query: {
        type: "CALLERS",
        target: "B",
        gsid: { ...integrationGsid, id: "different" },
        evid: REGISTERED_EVID_REF,
      },
      evidence,
    });
    assert.equal(claim, null);
  });
});
