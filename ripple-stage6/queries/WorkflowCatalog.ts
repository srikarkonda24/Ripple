// Defines injected workflow endpoints used for deterministic PATH query generation.
import type { GsidRef } from "../core/GsidRef";

export type WorkflowEndpoint = {
  readonly sourceId: string;
  readonly targetId: string;
  readonly label: string;
};

export interface WorkflowCatalog {
  listEndpoints(gsid: GsidRef): readonly WorkflowEndpoint[];
}

/** Empty workflow catalog — PATH queries are omitted deterministically. */
export class EmptyWorkflowCatalog implements WorkflowCatalog {
  listEndpoints(_gsid: GsidRef): readonly WorkflowEndpoint[] {
    return [];
  }
}

/** In-memory workflow catalog for tests. */
export class InMemoryWorkflowCatalog implements WorkflowCatalog {
  private readonly store: ReadonlyMap<string, readonly WorkflowEndpoint[]>;

  constructor(
    entries: ReadonlyMap<string, readonly WorkflowEndpoint[]> | Record<string, readonly WorkflowEndpoint[]>,
  ) {
    if (entries instanceof Map) {
      this.store = new Map(entries);
    } else {
      this.store = new Map(Object.entries(entries));
    }
  }

  listEndpoints(gsid: GsidRef): readonly WorkflowEndpoint[] {
    return this.store.get(gsid.id) ?? [];
  }
}
