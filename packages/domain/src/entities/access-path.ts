import { AccessPathId, WorkId, newId } from '@chronicles-vault/shared';
import type { HealthMonitorState } from '../use-cases/source-health-policy.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Kind of access path pointing to reading material.
 */
export enum AccessPathKind {
  Web = 'web',
  LocalFile = 'local_file',
  Feed = 'feed',
  ManualReference = 'manual',
  Manual = 'manual',
}

/**
 * Functional capabilities provided by this access path.
 */
export enum AccessCapability {
  Read = 'read',
  Watch = 'watch',
  Metadata = 'metadata',
  ChapterListing = 'chapter_listing',
  Updates = 'updates',
  DirectOpening = 'direct_opening',
  Tracking = 'tracking',
  LocalFile = 'local_file',
  Feed = 'feed',
}

/**
 * Operational health and availability status of the source.
 * Canonical enum name across domain, database, state, and UI.
 */
export enum SourceHealth {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Unavailable = 'unavailable',
  Stale = 'stale',
  Unknown = 'unknown',
  Local = 'local',
  Broken = 'broken',
}

/** @deprecated Use `SourceHealth` instead. Retained for backward compatibility. */
export type SourceHealthState = SourceHealth;
/** @deprecated Use `SourceHealth` instead. Retained for backward compatibility. */
export const SourceHealthState = SourceHealth;

/**
 * Normalizes an AccessPath-like record to its canonical `SourceHealth` value,
 * preferring `health` and falling back to legacy `healthState` or `SourceHealth.Unknown`.
 */
export function normalizeAccessPathHealth(
  path: { readonly health?: SourceHealth | null; readonly healthState?: SourceHealth | null } | null | undefined,
): SourceHealth {
  if (!path) return SourceHealth.Unknown;
  return path.health ?? path.healthState ?? SourceHealth.Unknown;
}

export enum SourceCapabilityStatus {
  Supported = 'supported',
  Unsupported = 'unsupported',
  Unknown = 'unknown',
}

// ---------------------------------------------------------------------------
// Discriminated Union Variants
// ---------------------------------------------------------------------------

interface BaseAccessPath {
  readonly id: AccessPathId;
  readonly workId: WorkId;
  readonly label: string | null;
  readonly isPreferred: boolean;
  /** Canonical operational health state of this access path. */
  readonly health: SourceHealth;
  /** @deprecated Mirror of `health` retained for legacy serialized records. Prefer `path.health`. */
  readonly healthState: SourceHealth;
  readonly capabilities: readonly AccessCapability[];
  readonly lastCheckedAt: string | null;
  readonly lastOpenedAt: string | null;
  readonly provenance: Record<string, unknown> | null;
  readonly healthMonitorState?: HealthMonitorState | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Online web source (website, reader portal, streaming page).
 */
export interface WebAccessPath extends BaseAccessPath {
  readonly kind: AccessPathKind.Web;
  readonly url: string;
  readonly provider: string | null;
  readonly fileId?: null;
}

/**
 * Local file on the user's filesystem (EPUB, PDF, CBZ/CBR, MP4, MKV, etc.).
 */
export interface LocalFileAccessPath extends BaseAccessPath {
  readonly kind: AccessPathKind.LocalFile;
  readonly filePath: string;
  readonly fileId: string | null;
  readonly format: string | null;
  readonly url?: null;
  readonly provider?: string | null;
  /** MIME type of the file, e.g. "video/mp4", "application/epub+zip". */
  readonly mimeType?: string | null;
  /** File size in bytes, if known. */
  readonly fileSizeBytes?: number | null;
}

/**
 * RSS/Atom/JSON feed providing automated update detection.
 */
export interface FeedAccessPath extends BaseAccessPath {
  readonly kind: AccessPathKind.Feed;
  readonly feedUrl: string;
  readonly feedType: string | null;
  readonly provider: string | null;
  readonly url?: string | null;
  readonly fileId?: null;
}

/**
 * Physical copy or manual non-digital reference (e.g. bookshelf, library loan).
 */
export interface ManualReferenceAccessPath extends BaseAccessPath {
  readonly kind: AccessPathKind.ManualReference | AccessPathKind.Manual;
  readonly description: string;
  readonly locationRef: string | null;
  readonly url?: null;
  readonly fileId?: null;
  readonly provider?: string | null;
}

/**
 * Discriminated union of all access paths to a Work's content.
 */
export type AccessPath =
  | WebAccessPath
  | LocalFileAccessPath
  | FeedAccessPath
  | ManualReferenceAccessPath;

// ---------------------------------------------------------------------------
// Additional Source Entities
// ---------------------------------------------------------------------------

export interface SourceCapability {
  readonly accessPathId: AccessPathId;
  readonly capability: string;
  readonly status: SourceCapabilityStatus;
}

export interface SourceHealthEvent {
  readonly id: string;
  readonly accessPathId: AccessPathId;
  readonly healthState: SourceHealth;
  readonly checkedAt: string;
  readonly errorMessage: string | null;
}

// ---------------------------------------------------------------------------
// AccessPathSummary
// ---------------------------------------------------------------------------

/**
 * Lightweight projection for selectors and summary cards.
 */
export interface AccessPathSummary {
  readonly id: AccessPathId;
  readonly workId: WorkId;
  readonly kind: AccessPathKind;
  readonly label: string | null;
  readonly isPreferred: boolean;
  readonly health: SourceHealth;
  readonly lastOpenedAt: string | null;
}

export function toAccessPathSummary(path: AccessPath): AccessPathSummary {
  return {
    id: path.id,
    workId: path.workId,
    kind: path.kind,
    label: path.label,
    isPreferred: path.isPreferred,
    health: path.health,
    lastOpenedAt: path.lastOpenedAt,
  };
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

/**
 * Assert domain invariants for any AccessPath.
 *
 * @throws {Error} If required paths or URLs are missing/malformed.
 */
export function validateAccessPathInvariant(path: AccessPath): void {
  if (!path.id || !path.id.trim()) {
    throw new Error('AccessPath invariant violated: id must not be empty');
  }
  if (!path.workId || !path.workId.trim()) {
    throw new Error('AccessPath invariant violated: workId must not be empty');
  }

  switch (path.kind) {
    case AccessPathKind.Web:
      if (!path.url || !path.url.trim()) {
        throw new Error('WebAccessPath invariant violated: url must not be empty');
      }
      break;
    case AccessPathKind.LocalFile:
      if (!path.filePath || !path.filePath.trim()) {
        throw new Error('LocalFileAccessPath invariant violated: filePath must not be empty');
      }
      break;
    case AccessPathKind.Feed:
      if (!path.feedUrl || !path.feedUrl.trim()) {
        throw new Error('FeedAccessPath invariant violated: feedUrl must not be empty');
      }
      break;
    case AccessPathKind.ManualReference:
      if (!path.description || !path.description.trim()) {
        throw new Error('ManualReferenceAccessPath invariant violated: description must not be empty');
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export type CreateWebAccessPathParams = Omit<
  WebAccessPath,
  'id' | 'kind' | 'createdAt' | 'updatedAt' | 'lastCheckedAt' | 'lastOpenedAt' | 'healthState'
> & {
  readonly id?: AccessPathId;
  readonly healthState?: SourceHealth;
  readonly lastCheckedAt?: string | null;
  readonly lastOpenedAt?: string | null;
  readonly provenance?: Record<string, unknown> | null;
};

export function createWebAccessPath(params: CreateWebAccessPathParams): WebAccessPath {
  const now = new Date().toISOString();
  const health = params.health ?? params.healthState ?? SourceHealth.Unknown;
  const path: WebAccessPath = {
    ...params,
    id: params.id ?? (newId() as AccessPathId),
    kind: AccessPathKind.Web,
    health,
    healthState: health,
    capabilities: params.capabilities ?? [AccessCapability.Read],
    provenance: params.provenance ?? null,
    lastCheckedAt: params.lastCheckedAt ?? null,
    lastOpenedAt: params.lastOpenedAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
  validateAccessPathInvariant(path);
  return path;
}

export type CreateLocalFileAccessPathParams = Omit<
  LocalFileAccessPath,
  'id' | 'kind' | 'createdAt' | 'updatedAt' | 'lastCheckedAt' | 'lastOpenedAt' | 'healthState'
> & {
  readonly id?: AccessPathId;
  readonly healthState?: SourceHealth;
  readonly lastCheckedAt?: string | null;
  readonly lastOpenedAt?: string | null;
  readonly provenance?: Record<string, unknown> | null;
};

export function createLocalFileAccessPath(
  params: CreateLocalFileAccessPathParams,
): LocalFileAccessPath {
  const now = new Date().toISOString();
  const health = params.health ?? params.healthState ?? SourceHealth.Local;
  const path: LocalFileAccessPath = {
    ...params,
    id: params.id ?? (newId() as AccessPathId),
    kind: AccessPathKind.LocalFile,
    health,
    healthState: health,
    capabilities: params.capabilities ?? [AccessCapability.Read, AccessCapability.LocalFile],
    provenance: params.provenance ?? null,
    lastCheckedAt: params.lastCheckedAt ?? null,
    lastOpenedAt: params.lastOpenedAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
  validateAccessPathInvariant(path);
  return path;
}

export type CreateFeedAccessPathParams = Omit<
  FeedAccessPath,
  'id' | 'kind' | 'createdAt' | 'updatedAt' | 'lastCheckedAt' | 'lastOpenedAt' | 'healthState'
> & {
  readonly id?: AccessPathId;
  readonly healthState?: SourceHealth;
  readonly lastCheckedAt?: string | null;
  readonly lastOpenedAt?: string | null;
  readonly provenance?: Record<string, unknown> | null;
};

export function createFeedAccessPath(params: CreateFeedAccessPathParams): FeedAccessPath {
  const now = new Date().toISOString();
  const health = params.health ?? params.healthState ?? SourceHealth.Unknown;
  const path: FeedAccessPath = {
    ...params,
    id: params.id ?? (newId() as AccessPathId),
    kind: AccessPathKind.Feed,
    health,
    healthState: health,
    capabilities: params.capabilities ?? [AccessCapability.Updates, AccessCapability.Feed],
    provenance: params.provenance ?? null,
    lastCheckedAt: params.lastCheckedAt ?? null,
    lastOpenedAt: params.lastOpenedAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
  validateAccessPathInvariant(path);
  return path;
}

export type CreateManualAccessPathParams = Omit<
  ManualReferenceAccessPath,
  'id' | 'kind' | 'createdAt' | 'updatedAt' | 'lastCheckedAt' | 'lastOpenedAt' | 'healthState'
> & {
  readonly id?: AccessPathId;
  readonly healthState?: SourceHealth;
  readonly lastCheckedAt?: string | null;
  readonly lastOpenedAt?: string | null;
  readonly provenance?: Record<string, unknown> | null;
};

export function createManualAccessPath(
  params: CreateManualAccessPathParams,
): ManualReferenceAccessPath {
  const now = new Date().toISOString();
  const health = params.health ?? params.healthState ?? SourceHealth.Local;
  const path: ManualReferenceAccessPath = {
    ...params,
    id: params.id ?? (newId() as AccessPathId),
    kind: AccessPathKind.ManualReference,
    health,
    healthState: health,
    capabilities: params.capabilities ?? [],
    provenance: params.provenance ?? null,
    lastCheckedAt: params.lastCheckedAt ?? null,
    lastOpenedAt: params.lastOpenedAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
  validateAccessPathInvariant(path);
  return path;
}

/**
 * Return a new AccessPath with partial changes applied.
 */
export function applyAccessPathPatch<T extends AccessPath>(
  accessPath: T,
  patch: Partial<Omit<T, 'id' | 'workId' | 'kind' | 'createdAt'>>,
): T {
  const updated = {
    ...accessPath,
    ...patch,
    healthState: patch.health ?? patch.healthState ?? accessPath.healthState,
    health: patch.health ?? patch.healthState ?? accessPath.health,
    updatedAt: new Date().toISOString(),
  } as T;
  validateAccessPathInvariant(updated);
  return updated;
}
