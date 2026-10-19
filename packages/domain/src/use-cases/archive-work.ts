/**
 * Archive Work Use Case
 *
 * Implements the Cycle 9 Archive System logic for Grimoire.
 *
 * Invariants:
 * 1. Archiving NEVER destroys reading progress (`currentAnchor`), access paths, or memories.
 * 2. Supports capturing optional 'Why Stopped' reflection and structured archive metadata.
 * 3. Preserves a complete historical snapshot in an immutable `ArchiveRecord`.
 */

import { WorkId, newId, ArchiveRecordId } from '@grimoire/shared';
import { Work, applyWorkPatch } from '../entities/work.js';
import {
  ArchiveReason,
  ArchiveRecord,
  createArchiveRecord,
} from '../entities/archive.js';
import {
  ReadingRelationship,
  PersonalState,
  applyReadingRelationshipPatch,
} from '../entities/reading-relationship.js';
import { AccessPath } from '../entities/access-path.js';
import {
  Memory,
  MemoryType,
  SpoilerLevel,
  createMemory,
} from '../entities/memory.js';
import { WorkArchivedEvent, createDomainEvent } from '../events/domain-events.js';

// ---------------------------------------------------------------------------
// Parameters & Result Interfaces
// ---------------------------------------------------------------------------

export interface ArchiveWorkParams {
  /** The work to archive. */
  readonly work: Work;

  /** Domain reason for archiving. */
  readonly reason: ArchiveReason;

  /** Optional archive note. */
  readonly note?: string | null;

  /** Optional personal reflection capturing why the user stopped or archived. */
  readonly whyStopped?: string | null;

  /** Optional structured archive metadata. */
  readonly metadata?: Record<string, unknown> | null;

  /** The user's active reading relationship with the work, if one exists. */
  readonly relationship?: ReadingRelationship | null;

  /** Associated access paths (preserved untouched). */
  readonly accessPaths?: readonly AccessPath[];

  /** Associated memories (preserved untouched and optionally augmented). */
  readonly memories?: readonly Memory[];

  /** If archived as part of a merge, the ID of the target work. */
  readonly mergedIntoWorkId?: WorkId | null;

  /** Archive timestamp (ISO string, defaults to current time). */
  readonly archivedAt?: string;

  /**
   * If true, also creates a standalone Memory entity with type `WhyStopped`
   * when `whyStopped` reflection text is provided. Defaults to true.
   */
  readonly createWhyStoppedMemory?: boolean;
}

export interface ArchiveWorkResult {
  /** The work entity, soft-archived with `deletedAt` set. */
  readonly work: Work;

  /** The immutable snapshot record of the archive action. */
  readonly archiveRecord: ArchiveRecord;

  /** The updated reading relationship with state marked archived/completed, progress INTACT. */
  readonly relationship: ReadingRelationship | null;

  /** Preserved access paths, completely unchanged. */
  readonly accessPaths: readonly AccessPath[];

  /** Preserved memories (including optional why-stopped memory). */
  readonly memories: readonly Memory[];

  /** The created 'Why Stopped' reflection memory, if one was generated. */
  readonly whyStoppedMemory: Memory | null;

  /** Emitted domain event. */
  readonly event: WorkArchivedEvent;
}

// ---------------------------------------------------------------------------
// Pure Use Case Function
// ---------------------------------------------------------------------------

/**
 * Archive a work out of active reading shelves into historical preservation.
 *
 * Adheres strictly to the core permanence principle:
 * Reading progress, access paths, and memories are NEVER destroyed or wiped.
 */
export function archiveWork(params: ArchiveWorkParams): ArchiveWorkResult {
  const now = params.archivedAt ?? new Date().toISOString();
  const trimmedWhyStopped = params.whyStopped?.trim() || null;
  const trimmedNote = params.note?.trim() || null;

  // 1. Invariant check: work must exist
  if (!params.work || !params.work.id) {
    throw new Error('Archive invariant violated: valid work must be specified');
  }

  // 2. Map personal state from archive reason if updating relationship
  let targetState: PersonalState = PersonalState.Archived;
  if (params.reason === ArchiveReason.Completed) {
    targetState = PersonalState.Completed;
  } else if (params.reason === ArchiveReason.Dropped) {
    targetState = PersonalState.Dropped;
  }

  // 3. Update ReadingRelationship if provided — PROGRESS IS NEVER DESTROYED
  let updatedRelationship: ReadingRelationship | null = null;
  if (params.relationship) {
    updatedRelationship = applyReadingRelationshipPatch(params.relationship, {
      personalState: targetState,
      stoppedAt: params.relationship.stoppedAt ?? now,
      stoppedReason: params.reason,
      stoppedNote: trimmedWhyStopped ?? trimmedNote ?? params.relationship.stoppedNote,
      // INVARIANT: currentAnchor is strictly preserved and never nulled out
      currentAnchor: params.relationship.currentAnchor,
      completedAt:
        params.reason === ArchiveReason.Completed
          ? (params.relationship.completedAt ?? now)
          : params.relationship.completedAt,
    });
  }

  // 4. Create optional WhyStopped reflection Memory
  let whyStoppedMemory: Memory | null = null;
  const shouldCreateMemory = params.createWhyStoppedMemory ?? true;
  if (trimmedWhyStopped && shouldCreateMemory) {
    whyStoppedMemory = createMemory({
      workId: params.work.id,
      type: MemoryType.WhyStopped,
      title: `Archive Reflection (${params.reason})`,
      body: trimmedWhyStopped,
      privacyState: params.work.privacyState,
      spoilerLevel: SpoilerLevel.SpoilerFree,
      showInGlobalGallery: false,
      accessPathId: null,
      progressAnchor: params.relationship?.currentAnchor ?? null,
      createdAt: now,
    });
  }

  // 5. Build preserved memories list
  const existingMemories = params.memories ?? [];
  const finalMemories: readonly Memory[] = whyStoppedMemory
    ? [...existingMemories, whyStoppedMemory]
    : [...existingMemories];

  // 6. Build preserved access paths list (never altered)
  const finalAccessPaths: readonly AccessPath[] = params.accessPaths ? [...params.accessPaths] : [];

  // 7. Create ArchiveRecord snapshot
  const archiveRecord = createArchiveRecord({
    id: newId() as ArchiveRecordId,
    workId: params.work.id,
    reason: params.reason,
    note: trimmedNote,
    whyStopped: trimmedWhyStopped,
    previousState: params.relationship?.personalState ?? null,
    previousProgress: params.relationship?.currentAnchor ?? null,
    archivedAt: now,
    mergedIntoWorkId: params.mergedIntoWorkId ?? null,
    metadata: params.metadata ?? null,
  });

  // 8. Soft-archive work (set deletedAt and optionally mergedIntoWorkId)
  const updatedWork = applyWorkPatch(params.work, {
    deletedAt: now,
    ...(params.mergedIntoWorkId ? { mergedIntoWorkId: params.mergedIntoWorkId } : {}),
  });

  // 9. Emit domain event
  const event = createDomainEvent('work.archived', {
    workId: params.work.id,
    reason: params.reason,
    note: trimmedNote ?? undefined,
  }, undefined, now);

  return {
    work: updatedWork,
    archiveRecord,
    relationship: updatedRelationship,
    accessPaths: finalAccessPaths,
    memories: finalMemories,
    whyStoppedMemory,
    event,
  };
}
