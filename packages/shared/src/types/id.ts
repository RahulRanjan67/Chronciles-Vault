import { Brand } from './brand.js';

// ---------------------------------------------------------------------------
// Branded ID types
// ---------------------------------------------------------------------------

/** Unique identifier for a Work entity. */
export type WorkId = Brand<string, 'WorkId'>;

/** Unique identifier for a ReadingRelationship entity. */
export type ReadingRelationshipId = Brand<string, 'ReadingRelationshipId'>;

/** Unique identifier for an AccessPath entity. */
export type AccessPathId = Brand<string, 'AccessPathId'>;

/** Unique identifier for a ReadingAttempt. */
export type ReadingAttemptId = Brand<string, 'ReadingAttemptId'>;

/** Unique identifier for a ReadingSession. */
export type ReadingSessionId = Brand<string, 'ReadingSessionId'>;

/** Unique identifier for a Memory entity. */
export type MemoryId = Brand<string, 'MemoryId'>;

/** Unique identifier for a MemoryAsset (image, video clip, etc.). */
export type MemoryAssetId = Brand<string, 'MemoryAssetId'>;

/** Unique identifier for a Capture entity. */
export type CaptureId = Brand<string, 'CaptureId'>;

/** Unique identifier for a CaptureBatch. */
export type CaptureBatchId = Brand<string, 'CaptureBatchId'>;

/** Unique identifier for a LoreEntry entity. */
export type LoreEntryId = Brand<string, 'LoreEntryId'>;

/** Unique identifier for a Publication entity. */
export type PublicationId = Brand<string, 'PublicationId'>;

/** Unique identifier for a PublicationItem. */
export type PublicationItemId = Brand<string, 'PublicationItemId'>;

/** Unique identifier for a WorkRelation entity. */
export type WorkRelationId = Brand<string, 'WorkRelationId'>;

/** Unique identifier for an ArchiveRecord entity. */
export type ArchiveRecordId = Brand<string, 'ArchiveRecordId'>;

/** Unique identifier for a UserList entity. */
export type UserListId = Brand<string, 'UserListId'>;

/** Unique identifier for a ListItem entity. */
export type ListItemId = Brand<string, 'ListItemId'>;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Generate a new, universally unique ID string using the Web Crypto API.
 * Works in Node ≥ 19, browsers, and Capacitor WebView — no external dependencies.
 *
 * The return type is `string`, not a branded ID, because the caller is
 * responsible for casting to the appropriate branded type at the use site:
 *
 * @example
 *   const id = newId() as WorkId
 */
export function newId(): string {
  return crypto.randomUUID();
}
