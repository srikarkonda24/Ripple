// Consumes GSID-bound snapshot material through an injected provider (Stage 6 does not build graphs).
import type { SnapshotMaterial } from "../../ripple-stage5/core/CompilerInput";
import type { GSID } from "../../ripple-stage5/core/GSID";
import { GSIDValidationFailure } from "../../ripple-stage5/core/Stage5ExecutionError";
import { SnapshotProviderError } from "./IntegrationErrors";

export interface SnapshotProvider {
  resolve(gsid: GSID): SnapshotMaterial;
}

/** In-memory snapshot provider for tests and fixture-driven MVP analysis. */
export class InMemorySnapshotProvider implements SnapshotProvider {
  private readonly store: ReadonlyMap<string, SnapshotMaterial>;

  constructor(
    entries: ReadonlyMap<string, SnapshotMaterial> | Record<string, SnapshotMaterial>,
  ) {
    if (entries instanceof Map) {
      this.store = new Map(entries);
    } else {
      this.store = new Map(Object.entries(entries));
    }
  }

  resolve(gsid: GSID): SnapshotMaterial {
    const material = this.store.get(gsid.id);
    if (material === undefined) {
      throw new SnapshotProviderError(
        `Snapshot not found for GSID id "${gsid.id}"`,
      );
    }
    return material;
  }
}

/** Adapts SnapshotProvider to Stage 5 SnapshotResolver for runPipeline. */
export function snapshotProviderAsResolver(
  provider: SnapshotProvider,
): { resolve(gsid: GSID): SnapshotMaterial } {
  return {
    resolve(gsid: GSID): SnapshotMaterial {
      try {
        return provider.resolve(gsid);
      } catch (error) {
        if (error instanceof SnapshotProviderError) {
          throw new GSIDValidationFailure(error.message);
        }
        throw error;
      }
    },
  };
}
