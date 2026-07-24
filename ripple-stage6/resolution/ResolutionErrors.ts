// Defines resolution-layer errors for symbol index and resolver fail-closed behavior.
import { Stage6Error } from "../core/Stage6Error";

/** Thrown when SymbolIndex cannot provide spans for the requested GSID. */
export class SymbolIndexError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "SymbolIndexError";
  }
}
