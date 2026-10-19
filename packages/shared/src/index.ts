/**
 * @grimoire/shared
 *
 * Zero-dependency shared primitives used by every package in the monorepo.
 * Import from here instead of reaching into sub-paths.
 */

// Types
export type { Brand } from './types/brand.js';
export type { Result } from './types/result.js';
export { ok, err, mapResult, flatMapResult, unwrapResult } from './types/result.js';

export type {
  WorkId,
  ReadingRelationshipId,
  AccessPathId,
  ReadingAttemptId,
  ReadingSessionId,
  MemoryId,
  MemoryAssetId,
  CaptureId,
  CaptureBatchId,
  LoreEntryId,
  PublicationId,
  PublicationItemId,
  WorkRelationId,
  ArchiveRecordId,
  UserListId,
  ListItemId,
} from './types/id.js';
export { newId } from './types/id.js';

// Utils
export type { ISODateString } from './utils/date.js';
export {
  nowISO,
  toISO,
  fromISO,
  daysBetweenISO,
  daysAgoISO,
  compareISO,
  isPastISO,
  toDatePart,
} from './utils/date.js';

export {
  normalizeUrl,
  parseUrl,
  extractOrigin,
  isHttpUrl,
  isLocalPath,
  joinUrl,
} from './utils/url.js';
