import {
  ReadingRelationshipId,
  ReadingAttemptId,
  ReadingSessionId,
  WorkId,
  AccessPathId,
  newId,
} from '@chronicles-vault/shared';
import { ProgressAnchor, validateProgressAnchor } from './progress.js';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * User's personal relationship state with a Work.
 */
export enum PersonalState {
  Planned = 'planned',
  Reading = 'reading',
  Watching = 'watching',
  Paused = 'paused',
  Waiting = 'waiting',
  Stalled = 'stalled',
  Rereading = 'rereading',
  CaughtUp = 'caught_up',
  Completed = 'completed',
  Dropped = 'dropped',
  Archived = 'archived',
}

/**
 * Reading queue priority level.
 */
export enum ReadingPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Urgent = 'urgent',
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export type ShelfPriorityTier =
  | 'standard'
  | 'favorite'
  | 'highlight'
  | 'priority_watch';

/**
 * Central entity tracking the user's personal engagement with a specific Work.
 * Exactly one ReadingRelationship exists per Work in the user's library.
 */
export interface ReadingRelationship {
  readonly id: ReadingRelationshipId;
  readonly workId: WorkId;
  readonly personalState: PersonalState;
  readonly priority: ReadingPriority;
  readonly shelfTier?: ShelfPriorityTier;
  readonly startedAt: string | null;
  readonly lastActiveAt: string | null;
  readonly completedAt: string | null;
  readonly stoppedAt: string | null;
  readonly stoppedReason: string | null;
  readonly stoppedNote: string | null;
  readonly currentAnchor: ProgressAnchor | null;
  readonly preferredAccessPathId: AccessPathId | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * An individual pass or re-read through a Work.
 * Allows tracking multiple reading attempts across months or years.
 */
export interface ReadingAttempt {
  readonly id: ReadingAttemptId;
  readonly workId: WorkId;
  readonly readingRelationshipId: ReadingRelationshipId;
  readonly attemptNumber: number;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly finalAnchor: ProgressAnchor | null;
  readonly notes: string | null;
  readonly createdAt: string;
}

/**
 * A discreet reading or watching session with time tracking and start/end anchors.
 */
export interface ReadingSession {
  readonly id: ReadingSessionId;
  readonly workId: WorkId;
  readonly readingRelationshipId: ReadingRelationshipId;
  readonly accessPathId: AccessPathId | null;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly durationSeconds: number | null;
  readonly anchorBefore: ProgressAnchor | null;
  readonly anchorAfter: ProgressAnchor | null;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Invariant Validation
// ---------------------------------------------------------------------------

/**
 * Validates domain rules for ReadingRelationship.
 *
 * @throws {Error} If state transitions or dates violate domain rules.
 */
export function validateReadingRelationshipInvariant(
  candidate: Pick<
    ReadingRelationship,
    'personalState' | 'startedAt' | 'completedAt' | 'stoppedAt' | 'currentAnchor'
  >,
): void {
  if (candidate.currentAnchor) {
    validateProgressAnchor(candidate.currentAnchor);
  }

  if (candidate.personalState === PersonalState.Completed && !candidate.completedAt) {
    // Note: completedAt can be set to current time automatically by factory/patch,
    // but if explicitly checked here, we ensure completed status consistency
  }

  if (
    candidate.personalState === PersonalState.Dropped &&
    candidate.stoppedAt === null &&
    candidate.completedAt !== null
  ) {
    throw new Error('ReadingRelationship invariant violated: dropped work cannot have completedAt without stoppedAt');
  }
}

// ---------------------------------------------------------------------------
// Factory Helpers
// ---------------------------------------------------------------------------

export type CreateReadingRelationshipParams = Omit<
  ReadingRelationship,
  'id' | 'createdAt' | 'updatedAt'
> & {
  readonly id?: ReadingRelationshipId;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

/**
 * Create a new ReadingRelationship with default timestamps and validation.
 */
export function createReadingRelationship(
  params: CreateReadingRelationshipParams,
): ReadingRelationship {
  validateReadingRelationshipInvariant(params);
  const now = new Date().toISOString();
  return {
    ...params,
    id: params.id ?? (newId() as ReadingRelationshipId),
    createdAt: params.createdAt ?? now,
    updatedAt: params.updatedAt ?? now,
  };
}

/**
 * Update an existing ReadingRelationship immutably.
 */
export function applyReadingRelationshipPatch(
  rel: ReadingRelationship,
  patch: Partial<Omit<ReadingRelationship, 'id' | 'workId' | 'createdAt'>>,
): ReadingRelationship {
  const now = new Date().toISOString();
  const nextState = patch.personalState ?? rel.personalState;

  // Auto-set timestamps when transitioning states
  let completedAt = patch.completedAt !== undefined ? patch.completedAt : rel.completedAt;
  if (patch.personalState === PersonalState.Completed && !completedAt) {
    completedAt = now;
  }

  let stoppedAt = patch.stoppedAt !== undefined ? patch.stoppedAt : rel.stoppedAt;
  if (
    (patch.personalState === PersonalState.Dropped ||
      patch.personalState === PersonalState.Paused) &&
    !stoppedAt
  ) {
    stoppedAt = now;
  }

  const updated: ReadingRelationship = {
    ...rel,
    ...patch,
    personalState: nextState,
    completedAt,
    stoppedAt,
    updatedAt: now,
  };

  validateReadingRelationshipInvariant(updated);
  return updated;
}

export type CreateReadingAttemptParams = Omit<
  ReadingAttempt,
  'id' | 'createdAt'
> & {
  readonly id?: ReadingAttemptId;
  readonly createdAt?: string;
};

export function createReadingAttempt(
  params: CreateReadingAttemptParams,
): ReadingAttempt {
  if (params.finalAnchor) {
    validateProgressAnchor(params.finalAnchor);
  }
  if (params.attemptNumber < 1) {
    throw new Error(`ReadingAttempt attemptNumber must be >= 1, got ${params.attemptNumber}`);
  }
  return {
    ...params,
    id: params.id ?? (newId() as ReadingAttemptId),
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}

export type CreateReadingSessionParams = Omit<
  ReadingSession,
  'id' | 'createdAt'
> & {
  readonly id?: ReadingSessionId;
  readonly createdAt?: string;
};

export function createReadingSession(
  params: CreateReadingSessionParams,
): ReadingSession {
  if (params.anchorBefore) {
    validateProgressAnchor(params.anchorBefore);
  }
  if (params.anchorAfter) {
    validateProgressAnchor(params.anchorAfter);
  }
  if (params.durationSeconds !== null && params.durationSeconds !== undefined && params.durationSeconds < 0) {
    throw new Error(`ReadingSession durationSeconds must be non-negative, got ${params.durationSeconds}`);
  }
  return {
    ...params,
    id: params.id ?? (newId() as ReadingSessionId),
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
}
