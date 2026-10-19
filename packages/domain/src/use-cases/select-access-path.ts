import { AccessPathKind, SourceHealth, type AccessPath } from "../entities/access-path.js";
import type { AccessPathId } from "@grimoire/shared";

/**
 * Chooses a safe reading fallback without probing or opening any source.
 * A null result means the caller should ask the user to pick a source.
 */
export function selectFallbackAccessPath(
  paths: readonly AccessPath[],
  preferredAccessPathId: AccessPathId | null,
): AccessPath | null {
  const preferred = paths.find((path) => path.id === preferredAccessPathId);
  if (preferred?.health === SourceHealth.Healthy) return preferred;

  const healthyAlternate = paths.find(
    (path) => path.id !== preferredAccessPathId && path.health === SourceHealth.Healthy,
  );
  if (healthyAlternate) return healthyAlternate;

  return paths.find((path) => path.kind === AccessPathKind.LocalFile) ?? null;
}
