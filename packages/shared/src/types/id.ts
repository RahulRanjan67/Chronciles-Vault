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
 * Generate a new, universally unique ID string using the Web Crypto API,
 * with RFC4122 v4 fallbacks when running on insecure origins (e.g. HTTP LAN dev)
 * or legacy webviews where crypto.randomUUID is not defined.
 *
 * @example
 *   const id = newId() as WorkId
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Safe RFC4122 v4 UUID fallback when crypto.randomUUID is unavailable
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8]! & 0x3f) | 0x80; // Variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  // Ultimate PRNG fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
