// Validates duplicate analysis handling and store lifecycle updates.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InvalidLifecycleTransitionError } from "../core/Stage6Error";
import { InMemoryAnalysisStore } from "../orchestration/AnalysisStore";
import { AnalysisRunner } from "../orchestration/AnalysisRunner";
import { sampleIdentity } from "../fixtures/sampleIdentity";

describe("AnalysisStore duplicates", () => {
  it("returns one record when the same identity is submitted twice", () => {
    const store = new InMemoryAnalysisStore();
    let tick = 1000;
    const clock = () => {
      tick += 1;
      return tick;
    };
    const runner = new AnalysisRunner(store, clock);

    const first = runner.receiveRequest(sampleIdentity);
    const second = runner.receiveRequest(sampleIdentity);

    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(store.size(), 1);
    assert.equal(first.record.status, "Queued");
    assert.equal(second.record.status, "Queued");
    assert.equal(first.record.createdAt, second.record.createdAt);
  });

  it("does not create duplicate execution paths for duplicate receiveRequest", () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 1);

    runner.receiveRequest(sampleIdentity);
    runner.receiveRequest(sampleIdentity);
    runner.start(sampleIdentity);

    const record = store.find(sampleIdentity);
    assert.equal(record?.status, "Running");
    assert.equal(store.size(), 1);
  });

  it("rejects invalid store transitions", () => {
    const store = new InMemoryAnalysisStore();
    const record = store.getOrCreate(sampleIdentity, 1);
    assert.equal(record.status, "Queued");

    assert.throws(
      () =>
        store.update(sampleIdentity, { nextStatus: "Completed" }, 2),
      InvalidLifecycleTransitionError,
    );
  });
});

describe("AnalysisRunner lifecycle", () => {
  it("progresses Queued → Running → Completed", () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 10);

    runner.receiveRequest(sampleIdentity);
    runner.start(sampleIdentity);
    const completed = runner.complete(sampleIdentity);

    assert.equal(completed.status, "Completed");
  });
});
