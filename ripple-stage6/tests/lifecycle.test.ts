// Validates MVP analysis lifecycle transition rules.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertValidTransition,
  canTransition,
} from "../core/Lifecycle";
import { InvalidLifecycleTransitionError } from "../core/Stage6Error";

describe("Lifecycle", () => {
  it("allows Queued → Running → Completed", () => {
    assert.equal(canTransition("Queued", "Running"), true);
    assert.equal(canTransition("Running", "Completed"), true);
    assert.doesNotThrow(() => assertValidTransition("Queued", "Running"));
    assert.doesNotThrow(() => assertValidTransition("Running", "Completed"));
  });

  it("allows Queued → Running → Failed", () => {
    assert.equal(canTransition("Running", "Failed"), true);
    assert.doesNotThrow(() => assertValidTransition("Running", "Failed"));
  });

  it("rejects Completed → Running", () => {
    assert.equal(canTransition("Completed", "Running"), false);
    assert.throws(
      () => assertValidTransition("Completed", "Running"),
      InvalidLifecycleTransitionError,
    );
  });

  it("rejects Failed → Running in MVP", () => {
    assert.equal(canTransition("Failed", "Running"), false);
    assert.throws(
      () => assertValidTransition("Failed", "Running"),
      InvalidLifecycleTransitionError,
    );
  });

  it("rejects skipping Running from Queued", () => {
    assert.equal(canTransition("Queued", "Completed"), false);
    assert.throws(
      () => assertValidTransition("Queued", "Completed"),
      InvalidLifecycleTransitionError,
    );
  });

  it("rejects transitions from terminal Completed", () => {
    assert.equal(canTransition("Completed", "Failed"), false);
  });
});
