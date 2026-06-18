// Computes SHA256 hex digests for deterministic IDs and content hashes.
import { createHash } from "crypto";

export function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
