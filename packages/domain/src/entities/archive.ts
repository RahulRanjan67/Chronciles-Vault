import {
  ArchiveRecordId,
  WorkId,
  newId,
} from '@chronicles-vault/shared';
import { PersonalState } from './reading-relationship.js';
import { ProgressAnchor, validateProgressAnchor } from './progress.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Domain reasons for archiving a Work out of the active library.
 */
export enum ArchiveReason {
  Completed = 'completed',
  Dropped = 'dropped',
  Abandoned = 'abandoned',
  LostInterest = 'lost_interest',
  SourceDead = 'source_dead',
  SourceUnavailable = 'source_unavailable',
  WaitingIndefinitely = 'waiting_indefinitely',
  Duplicate = 'duplicate',
  Merged = 'merged',
  Migrated = 'migrated',
}

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

/**
 * Historical snapshot preserved when a Work is archived from the active collection.
 */
export interface ArchiveRecord {
  readonly id: ArchiveRecordId;
  readonly workId: WorkId;
  readonly reason: ArchiveReason;
  readonly note: string | null;
  /** Optional personal reflection explaining why reading stopped or was archived. */
  readonly whyStopped?: string | null;
  readonly previousState: PersonalState | null;
  readonly previousProgress: ProgressAnchor | null;
  readonly archivedAt: string;
  /** If archived as part of a deduplication merge, references the target work. */
  readonly mergedIntoWorkId?: WorkId | null;
  /** Additional structured archive metadata. */
  readonly metadata?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

export function validateArchiveRecordInvariant(
  candidate: Pick<ArchiveRecord, 'workId' | 'reason' | 'previousProgress'>,
): void {
  if (!candidate.workId) {
    throw new Error('ArchiveRecord invariant violated: workId must be specified');
  }
  if (!candidate.reason) {
    throw new Error('ArchiveRecord invariant violated: reason must be specified');
  }
  if (candidate.previousProgress) {
    validateProgressAnchor(candidate.previousProgress);
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export type CreateArchiveRecordParams = Omit<
  ArchiveRecord,
  'id' | 'archivedAt'
> & {
  readonly id?: ArchiveRecordId;
  readonly archivedAt?: string;
};

export function createArchiveRecord(params: CreateArchiveRecordParams): ArchiveRecord {
  validateArchiveRecordInvariant(params);
  return {
    ...params,
    id: params.id ?? (newId() as ArchiveRecordId),
    archivedAt: params.archivedAt ?? new Date().toISOString(),
  };
}
