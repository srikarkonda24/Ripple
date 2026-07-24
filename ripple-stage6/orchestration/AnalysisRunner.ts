// Orchestrates analysis lifecycle without GitHub, Stage 5, or parser dependencies (Phase 1).
import type { AnalysisIdentity } from "../core/AnalysisIdentity";
import type { AnalysisRecord } from "../core/AnalysisRecord";
import type { ImpactReport } from "../core/ImpactReport";
import type { AnalysisStore } from "./AnalysisStore";

export type AnalysisRequestResult = {
  readonly record: AnalysisRecord;
  readonly created: boolean;
};

export type Clock = () => number;

const defaultClock: Clock = () => Date.now();

/**
 * Phase 1 analysis runner: identity registration and lifecycle transitions only.
 */
export class AnalysisRunner {
  constructor(
    private readonly store: AnalysisStore,
    private readonly clock: Clock = defaultClock,
  ) {}

  /**
   * Registers an analysis request. Duplicate identities reuse the stored record.
   */
  receiveRequest(identity: AnalysisIdentity): AnalysisRequestResult {
    const before = this.store.find(identity);
    const record = this.store.getOrCreate(identity, this.clock());
    return {
      record,
      created: before === undefined,
    };
  }

  /** Moves Queued → Running when a worker picks up the analysis. */
  start(identity: AnalysisIdentity): AnalysisRecord {
    return this.store.update(
      identity,
      { nextStatus: "Running" },
      this.clock(),
    );
  }

  /** Moves Running → Completed and optionally attaches a report. */
  complete(identity: AnalysisIdentity, report?: ImpactReport): AnalysisRecord {
    return this.store.update(
      identity,
      { nextStatus: "Completed", report },
      this.clock(),
    );
  }

  /** Moves Running → Failed with a safe failure reason string. */
  fail(identity: AnalysisIdentity, failureReason: string): AnalysisRecord {
    return this.store.update(
      identity,
      { nextStatus: "Failed", failureReason },
      this.clock(),
    );
  }
}
