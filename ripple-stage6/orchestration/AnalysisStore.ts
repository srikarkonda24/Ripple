// Persists analysis records keyed by canonical AnalysisIdentity.
import { analysisIdentityKey } from "../core/AnalysisIdentity";
import type { AnalysisIdentity } from "../core/AnalysisIdentity";
import type { AnalysisRecord } from "../core/AnalysisRecord";
import { assertValidTransition } from "../core/Lifecycle";

export interface AnalysisStore {
  /** Returns an existing record or undefined when none exists. */
  find(identity: AnalysisIdentity): AnalysisRecord | undefined;

  /**
   * Inserts a new Queued analysis or returns the existing record for the identity.
   * Duplicate submissions must not create a second record.
   */
  getOrCreate(identity: AnalysisIdentity, now: number): AnalysisRecord;

  /** Applies a lifecycle transition and optional field updates atomically. */
  update(
    identity: AnalysisIdentity,
    update: AnalysisRecordUpdate,
    now: number,
  ): AnalysisRecord;
}

export type AnalysisRecordUpdate = {
  readonly nextStatus: AnalysisRecord["status"];
  readonly failureReason?: string;
  readonly report?: AnalysisRecord["report"];
};

/** In-memory AnalysisStore for Phase 1 tests and local orchestration. */
export class InMemoryAnalysisStore implements AnalysisStore {
  private readonly records = new Map<string, AnalysisRecord>();

  find(identity: AnalysisIdentity): AnalysisRecord | undefined {
    return this.records.get(analysisIdentityKey(identity));
  }

  getOrCreate(identity: AnalysisIdentity, now: number): AnalysisRecord {
    const key = analysisIdentityKey(identity);
    const existing = this.records.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const created: AnalysisRecord = {
      identity,
      status: "Queued",
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(key, created);
    return created;
  }

  update(
    identity: AnalysisIdentity,
    update: AnalysisRecordUpdate,
    now: number,
  ): AnalysisRecord {
    const key = analysisIdentityKey(identity);
    const current = this.records.get(key);
    if (current === undefined) {
      throw new Error(`Analysis not found for key "${key}"`);
    }
    assertValidTransition(current.status, update.nextStatus);
    const next: AnalysisRecord = {
      identity: current.identity,
      status: update.nextStatus,
      createdAt: current.createdAt,
      updatedAt: now,
      failureReason:
        update.failureReason !== undefined
          ? update.failureReason
          : current.failureReason,
      report: update.report !== undefined ? update.report : current.report,
    };
    this.records.set(key, next);
    return next;
  }

  /** Returns count of stored analyses (for tests). */
  size(): number {
    return this.records.size;
  }
}
