/**
 * Non-Destructive Merge Engine
 *
 * Implements the Cycle 9 pure domain use case for merging two Works.
 *
 * Requirements:
 * 1. Retains target work identity.
 * 2. Combines aliases, alternative titles, tags, and genres without duplicates.
 * 3. Re-points all access paths, memories, and reading history to target work.
 * 4. Resolves progress conflicts according to user resolution policy:
 *    ('keep_target', 'keep_secondary', 'highest_progress', 'most_recent').
 * 5. Soft-archives secondary work with `mergedIntoWorkId: targetWorkId`.
 * 6. Emits `work.merged` domain event.
 */

import { WorkId, ArchiveRecordId, newId } from '@grimoire/shared';
import {
  Work,
  ContentOrigin,
  PublicationState,
  PrivacyState,
} from '../entities/work.js';
import {
  ArchiveReason,
  ArchiveRecord,
  createArchiveRecord,
} from '../entities/archive.js';
import {
  ReadingRelationship,
  PersonalState,
  ReadingPriority,
  ReadingAttempt,
  ReadingSession,
  applyReadingRelationshipPatch,
} from '../entities/reading-relationship.js';
import { AccessPath } from '../entities/access-path.js';
import { Memory } from '../entities/memory.js';
import {
  ProgressEvent,
  ProgressAnchor,
  extractNumericProgress,
} from '../entities/progress.js';
import { ExternalIdentifier } from '../value-objects/external-identifier.js';
import { WorkMergedEvent, createDomainEvent } from '../events/domain-events.js';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type ProgressResolutionPolicy =
  | 'keep_target'
  | 'keep_secondary'
  | 'highest_progress'
  | 'most_recent';

export interface MergeWorksParams {
  /** The primary work that retains its identity and receives merged assets. */
  readonly targetWork: Work;

  /** The secondary work that is merged and soft-archived. */
  readonly secondaryWork: Work;

  /** Resolution policy for conflicting reading progress anchors. */
  readonly progressPolicy: ProgressResolutionPolicy;

  /** Target work reading relationship (if one exists). */
  readonly targetRelationship?: ReadingRelationship | null;

  /** Secondary work reading relationship (if one exists). */
  readonly secondaryRelationship?: ReadingRelationship | null;

  /** Access paths belonging to either or both works to re-point. */
  readonly accessPaths?: readonly AccessPath[];

  /** Memories belonging to either or both works to re-point. */
  readonly memories?: readonly Memory[];

  /** Progress events (reading history audit trail) to re-point. */
  readonly progressHistory?: readonly ProgressEvent[];

  /** Reading attempts to re-point. */
  readonly readingAttempts?: readonly ReadingAttempt[];

  /** Reading sessions to re-point. */
  readonly readingSessions?: readonly ReadingSession[];

  /** Optional preferred cover asset reference. */
  readonly preferredCoverRef?: string | null;

  /** Custom archive note for the secondary work. */
  readonly archiveNote?: string | null;

  /** Merge execution timestamp (ISO). Defaults to current time. */
  readonly mergedAt?: string;
}

export interface MergeWorksResult {
  /** The target work with merged metadata (retains target identity). */
  readonly mergedWork: Work;

  /** The secondary work, now soft-archived with `mergedIntoWorkId` set. */
  readonly archivedSecondaryWork: Work;

  /** The archive record generated for the secondary work. */
  readonly archiveRecord: ArchiveRecord;

  /** The unified reading relationship for the target work. */
  readonly resolvedRelationship: ReadingRelationship | null;

  /** The archived reading relationship for the secondary work (if one existed). */
  readonly archivedSecondaryRelationship: ReadingRelationship | null;

  /** All access paths, now pointing to the target workId. */
  readonly rePointedAccessPaths: readonly AccessPath[];

  /** All memories, now pointing to the target workId. */
  readonly rePointedMemories: readonly Memory[];

  /** All progress events, now pointing to the target workId and resolved relationship. */
  readonly rePointedProgressEvents: readonly ProgressEvent[];

  /** All reading attempts, now pointing to target workId and resolved relationship. */
  readonly rePointedReadingAttempts: readonly ReadingAttempt[];

  /** All reading sessions, now pointing to target workId and resolved relationship. */
  readonly rePointedReadingSessions: readonly ReadingSession[];

  /** Emitted domain event. */
  readonly event: WorkMergedEvent;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Combines two string arrays, removing case-insensitive duplicates while preserving
 * the casing of first occurrence.
 */
function combineStringArrays(
  primary: readonly string[],
  secondary: readonly string[],
): readonly string[] {
  const seen = new Set<string>();
  const combined: string[] = [];

  for (const item of [...primary, ...secondary]) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(trimmed);
    }
  }

  return combined;
}

/**
 * Priority rank comparator for ReadingPriority (Urgent > High > Normal > Low).
 */
const PRIORITY_RANKS: Record<ReadingPriority, number> = {
  [ReadingPriority.Urgent]: 4,
  [ReadingPriority.High]: 3,
  [ReadingPriority.Normal]: 2,
  [ReadingPriority.Low]: 1,
};

function pickHigherPriority(a: ReadingPriority, b: ReadingPriority): ReadingPriority {
  return (PRIORITY_RANKS[a] ?? 0) >= (PRIORITY_RANKS[b] ?? 0) ? a : b;
}

// ---------------------------------------------------------------------------
// Main Use Case: mergeWorksNonDestructive
// ---------------------------------------------------------------------------

/**
 * Non-destructively merges a secondary Work into a target Work.
 */
export function mergeWorksNonDestructive(params: MergeWorksParams): MergeWorksResult {
  const { targetWork, secondaryWork, progressPolicy } = params;
  const now = params.mergedAt ?? new Date().toISOString();

  // Invariant 1: Cannot merge a work into itself
  if (targetWork.id === secondaryWork.id) {
    throw new Error('Merge invariant violated: cannot merge a work into itself');
  }

  // 1. Combine metadata without duplicates (retaining target identity)
  const combinedAliases = combineStringArrays(targetWork.aliases, secondaryWork.aliases);

  // If secondary title differs from target title, include secondary title in alternative titles
  const secondaryTitleToAdd =
    secondaryWork.title.trim().toLowerCase() !== targetWork.title.trim().toLowerCase()
      ? [secondaryWork.title.trim()]
      : [];

  const combinedAltTitles = combineStringArrays(
    targetWork.alternativeTitles,
    [...secondaryTitleToAdd, ...secondaryWork.alternativeTitles],
  );

  const combinedTags = combineStringArrays(targetWork.tags, secondaryWork.tags);
  const combinedGenres = combineStringArrays(targetWork.genres, secondaryWork.genres);

  // Combine external identifiers without duplicates (by provider and ID)
  const seenExtIds = new Set<string>();
  const combinedExternalIds: ExternalIdentifier[] = [];
  for (const ext of [...targetWork.externalIds, ...secondaryWork.externalIds]) {
    const key = `${ext.provider.toLowerCase().trim()}:${ext.externalId.toLowerCase().trim()}`;
    if (!seenExtIds.has(key)) {
      seenExtIds.add(key);
      combinedExternalIds.push(ext);
    }
  }

  // Privacy: most restrictive state wins (Vault > Private > Public)
  let resolvedPrivacy = targetWork.privacyState;
  if (targetWork.privacyState === PrivacyState.Vault || secondaryWork.privacyState === PrivacyState.Vault) {
    resolvedPrivacy = PrivacyState.Vault;
  } else if (targetWork.privacyState === PrivacyState.Private || secondaryWork.privacyState === PrivacyState.Private) {
    resolvedPrivacy = PrivacyState.Private;
  }

  // Cover reference resolution
  const resolvedCoverRef =
    params.preferredCoverRef !== undefined
      ? params.preferredCoverRef
      : (targetWork.coverRef ?? secondaryWork.coverRef);

  // Build the merged target work (identity strictly retained)
  const mergedWork: Work = {
    id: targetWork.id,
    title: targetWork.title,
    alternativeTitles: combinedAltTitles,
    aliases: combinedAliases,
    description: targetWork.description ?? secondaryWork.description,
    contentType: targetWork.contentType,
    origin: targetWork.origin !== ContentOrigin.Unknown ? targetWork.origin : secondaryWork.origin,
    publicationState:
      targetWork.publicationState !== PublicationState.Unknown
        ? targetWork.publicationState
        : secondaryWork.publicationState,
    privacyState: resolvedPrivacy,
    coverRef: resolvedCoverRef,
    externalIds: combinedExternalIds,
    genres: combinedGenres,
    tags: combinedTags,
    createdAt: targetWork.createdAt,
    updatedAt: now,
    deletedAt: null, // Target work remains active in vault
    mergedIntoWorkId: null,
  };

  // 2. Resolve reading progress conflicts according to user policy
  const targetRel = params.targetRelationship ?? null;
  const secondaryRel = params.secondaryRelationship ?? null;

  let resolvedRelationship: ReadingRelationship | null = null;
  let archivedSecondaryRelationship: ReadingRelationship | null = null;

  if (targetRel && secondaryRel) {
    // Determine winner based on policy
    let winner: 'target' | 'secondary' = 'target';

    switch (progressPolicy) {
      case 'keep_target':
        winner = 'target';
        break;

      case 'keep_secondary':
        winner = 'secondary';
        break;

      case 'highest_progress': {
        const anchorA = targetRel.currentAnchor;
        const anchorB = secondaryRel.currentAnchor;

        if (!anchorA && anchorB) {
          winner = 'secondary';
        } else if (anchorA && !anchorB) {
          winner = 'target';
        } else if (anchorA && anchorB) {
          const numA = extractNumericProgress(anchorA);
          const numB = extractNumericProgress(anchorB);
          if (numA !== null && numB !== null) {
            winner = numB > numA ? 'secondary' : 'target';
          } else {
            // Not directly numerically comparable: fall back to most recently active
            const tA = Date.parse(targetRel.lastActiveAt ?? targetRel.updatedAt) || 0;
            const tB = Date.parse(secondaryRel.lastActiveAt ?? secondaryRel.updatedAt) || 0;
            winner = tB > tA ? 'secondary' : 'target';
          }
        } else {
          winner = 'target';
        }
        break;
      }

      case 'most_recent': {
        const timeA = Date.parse(targetRel.lastActiveAt ?? targetRel.updatedAt) || 0;
        const timeB = Date.parse(secondaryRel.lastActiveAt ?? secondaryRel.updatedAt) || 0;
        winner = timeB > timeA ? 'secondary' : 'target';
        break;
      }
    }

    const winningRel = winner === 'target' ? targetRel : secondaryRel;
    const losingRel = winner === 'target' ? secondaryRel : targetRel;

    // Harmonize timestamps: earliest startedAt, latest lastActiveAt, latest completedAt
    const validDates = [targetRel.startedAt, secondaryRel.startedAt].filter((d): d is string => Boolean(d));
    const earliestStartedAt =
      validDates.length > 0
        ? validDates.reduce((min, cur) => (Date.parse(cur) < Date.parse(min) ? cur : min))
        : null;

    const activeDates = [targetRel.lastActiveAt, secondaryRel.lastActiveAt].filter((d): d is string => Boolean(d));
    const latestActiveAt =
      activeDates.length > 0
        ? activeDates.reduce((max, cur) => (Date.parse(cur) > Date.parse(max) ? cur : max))
        : null;

    const completedDates = [targetRel.completedAt, secondaryRel.completedAt].filter((d): d is string => Boolean(d));
    const latestCompletedAt =
      completedDates.length > 0
        ? completedDates.reduce((max, cur) => (Date.parse(cur) > Date.parse(max) ? cur : max))
        : null;

    // Pick highest priority
    const resolvedPriority = pickHigherPriority(targetRel.priority, secondaryRel.priority);

    // Pick personal state: if winner has meaningful state, use winner; if winner is Planned but losing is Reading, promote
    let resolvedState = winningRel.personalState;
    if (resolvedState === PersonalState.Planned && losingRel.personalState !== PersonalState.Planned) {
      resolvedState = losingRel.personalState;
    }

    resolvedRelationship = {
      ...targetRel,
      personalState: resolvedState,
      priority: resolvedPriority,
      startedAt: earliestStartedAt,
      lastActiveAt: latestActiveAt,
      completedAt: resolvedState === PersonalState.Completed ? (latestCompletedAt ?? now) : null,
      currentAnchor: winningRel.currentAnchor,
      preferredAccessPathId: targetRel.preferredAccessPathId ?? secondaryRel.preferredAccessPathId,
      updatedAt: now,
    };

    // Soft-archive secondary relationship
    archivedSecondaryRelationship = applyReadingRelationshipPatch(secondaryRel, {
      personalState: PersonalState.Archived,
      stoppedAt: secondaryRel.stoppedAt ?? now,
      stoppedReason: 'merged',
      stoppedNote: `Merged into work ${targetWork.id}`,
    });
  } else if (targetRel) {
    resolvedRelationship = targetRel;
  } else if (secondaryRel) {
    // Transfer secondary relationship to target work
    resolvedRelationship = {
      ...secondaryRel,
      workId: targetWork.id,
      updatedAt: now,
    };
  }

  // 3. Re-point Access Paths to targetWork
  const allAccessPaths = params.accessPaths ?? [];
  const targetHasPreferred = allAccessPaths.some(
    (p) => p.workId === targetWork.id && p.isPreferred,
  );

  const rePointedAccessPaths: AccessPath[] = allAccessPaths.map((path) => {
    if (path.workId === secondaryWork.id) {
      return {
        ...path,
        workId: targetWork.id,
        // If target already had a preferred path, secondary's preferred flag is downgraded
        isPreferred: targetHasPreferred ? false : path.isPreferred,
        updatedAt: now,
      } as AccessPath;
    }
    return path;
  });

  // 4. Re-point Memories to targetWork
  const allMemories = params.memories ?? [];
  const rePointedMemories: Memory[] = allMemories.map((mem) => {
    if (mem.workId === secondaryWork.id) {
      return {
        ...mem,
        workId: targetWork.id,
        updatedAt: now,
      };
    }
    return mem;
  });

  // 5. Re-point Progress History (ProgressEvents), Attempts, Sessions
  const allProgressEvents = params.progressHistory ?? [];
  const rePointedProgressEvents: ProgressEvent[] = allProgressEvents.map((event) => {
    if (event.workId === secondaryWork.id) {
      return {
        ...event,
        workId: targetWork.id,
        readingRelationshipId: resolvedRelationship?.id ?? event.readingRelationshipId,
      };
    }
    return event;
  });

  const allAttempts = params.readingAttempts ?? [];
  const rePointedReadingAttempts: ReadingAttempt[] = allAttempts.map((attempt) => {
    if (attempt.workId === secondaryWork.id) {
      return {
        ...attempt,
        workId: targetWork.id,
        readingRelationshipId: resolvedRelationship?.id ?? attempt.readingRelationshipId,
      };
    }
    return attempt;
  });

  const allSessions = params.readingSessions ?? [];
  const rePointedReadingSessions: ReadingSession[] = allSessions.map((session) => {
    if (session.workId === secondaryWork.id) {
      return {
        ...session,
        workId: targetWork.id,
        readingRelationshipId: resolvedRelationship?.id ?? session.readingRelationshipId,
      };
    }
    return session;
  });

  // 6. Soft-archive secondary work with mergedIntoWorkId: targetWorkId
  const archivedSecondaryWork: Work = {
    ...secondaryWork,
    deletedAt: now,
    mergedIntoWorkId: targetWork.id,
    updatedAt: now,
  };

  // 7. Create ArchiveRecord snapshot for secondary work
  const archiveRecord = createArchiveRecord({
    id: newId() as ArchiveRecordId,
    workId: secondaryWork.id,
    reason: ArchiveReason.Merged,
    note: params.archiveNote ?? `Merged into "${targetWork.title}" (${targetWork.id})`,
    whyStopped: null,
    previousState: secondaryRel?.personalState ?? null,
    previousProgress: secondaryRel?.currentAnchor ?? null,
    archivedAt: now,
    mergedIntoWorkId: targetWork.id,
    metadata: {
      targetWorkId: targetWork.id,
      targetWorkTitle: targetWork.title,
      progressPolicy,
    },
  });

  // 8. Emit Domain Event
  const event = createDomainEvent('work.merged', {
    sourceId: secondaryWork.id,
    targetId: targetWork.id,
    resolution: progressPolicy,
  }, undefined, now);

  return {
    mergedWork,
    archivedSecondaryWork,
    archiveRecord,
    resolvedRelationship,
    archivedSecondaryRelationship,
    rePointedAccessPaths,
    rePointedMemories,
    rePointedProgressEvents,
    rePointedReadingAttempts,
    rePointedReadingSessions,
    event,
  };
}
