// Defines injected symbol span metadata used for deterministic line-overlap resolution.
import type { GsidRef } from "../core/GsidRef";
import { SymbolIndexError } from "./ResolutionErrors";

export type SymbolSpan = {
  readonly nodeId: string;
  readonly filePath: string;
  readonly displayName: string;
  readonly startLine: number;
  readonly endLine: number;
};

export interface SymbolIndex {
  /** Returns symbol spans bound to a GSID snapshot; throws when GSID is unknown. */
  getSpans(gsid: GsidRef): readonly SymbolSpan[];
}

/** In-memory SymbolIndex for tests and fixture-driven analysis. */
export class InMemorySymbolIndex implements SymbolIndex {
  private readonly store: ReadonlyMap<string, readonly SymbolSpan[]>;

  constructor(entries: ReadonlyMap<string, readonly SymbolSpan[]> | Record<string, readonly SymbolSpan[]>) {
    if (entries instanceof Map) {
      this.store = new Map(entries);
    } else {
      this.store = new Map(Object.entries(entries));
    }
  }

  getSpans(gsid: GsidRef): readonly SymbolSpan[] {
    const spans = this.store.get(gsid.id);
    if (spans === undefined) {
      throw new SymbolIndexError(`SymbolIndex has no spans for GSID id "${gsid.id}"`);
    }
    return spans;
  }
}
