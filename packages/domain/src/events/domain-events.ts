import {
  WorkId,
  ReadingRelationshipId,
  AccessPathId,
  MemoryId,
  CaptureId,
  newId,
} from '@grimoire/shared';
import { Work } from '../entities/work.js';
import { PersonalState } from '../entities/reading-relationship.js';
import { ProgressEvent } from '../entities/progress.js';
import { AccessPath, SourceHealth } from '../entities/access-path.js';
import { Memory } from '../entities/memory.js';
import { Capture, CaptureState } from '../entities/capture.js';
import { ArchiveReason } from '../entities/archive.js';
import { UpdateEntry } from '../value-objects/update-entry.js';

// ---------------------------------------------------------------------------
// Base Domain Event
// ---------------------------------------------------------------------------

export interface BaseDomainEvent<TType extends string, TPayload> {
  readonly id: string;
  readonly type: TType;
  readonly timestamp: string;
  readonly payload: TPayload;
}

// ---------------------------------------------------------------------------
// Individual Domain Events
// ---------------------------------------------------------------------------

export type WorkCreatedEvent = BaseDomainEvent<
  'work.created',
  { readonly workId: WorkId; readonly work: Work }
>;

export type WorkUpdatedEvent = BaseDomainEvent<
  'work.updated',
  { readonly workId: WorkId; readonly patch: Partial<Work> }
>;

export type WorkArchivedEvent = BaseDomainEvent<
  'work.archived',
  { readonly workId: WorkId; readonly reason: ArchiveReason; readonly note?: string }
>;

export type WorkMergedEvent = BaseDomainEvent<
  'work.merged',
  { readonly sourceId: WorkId; readonly targetId: WorkId; readonly resolution: string }
>;

export type RelationshipStartedEvent = BaseDomainEvent<
  'relationship.started',
  { readonly relationshipId: ReadingRelationshipId; readonly workId: WorkId }
>;

export type RelationshipPausedEvent = BaseDomainEvent<
  'relationship.paused',
  { readonly relationshipId: ReadingRelationshipId; readonly workId: WorkId; readonly reason?: string }
>;

export type RelationshipResumedEvent = BaseDomainEvent<
  'relationship.resumed',
  { readonly relationshipId: ReadingRelationshipId; readonly workId: WorkId }
>;

export type RelationshipCompletedEvent = BaseDomainEvent<
  'relationship.completed',
  { readonly relationshipId: ReadingRelationshipId; readonly workId: WorkId; readonly completedAt: string }
>;

export type RelationshipStateChangedEvent = BaseDomainEvent<
  'relationship.stateChanged',
  {
    readonly relationshipId: ReadingRelationshipId;
    readonly workId: WorkId;
    readonly from: PersonalState;
    readonly to: PersonalState;
  }
>;

export type ProgressRecordedEvent = BaseDomainEvent<
  'progress.recorded',
  { readonly event: ProgressEvent }
>;

export type SourceAddedEvent = BaseDomainEvent<
  'source.added',
  { readonly accessPath: AccessPath }
>;

export type SourceRemovedEvent = BaseDomainEvent<
  'source.removed',
  { readonly accessPathId: AccessPathId; readonly workId: WorkId }
>;

export type SourceHealthChangedEvent = BaseDomainEvent<
  'source.healthChanged',
  {
    readonly accessPathId: AccessPathId;
    readonly from: SourceHealth;
    readonly to: SourceHealth;
    readonly errorMessage?: string;
  }
>;

export type MemoryCreatedEvent = BaseDomainEvent<
  'memory.created',
  { readonly memory: Memory }
>;

export type MemoryUpdatedEvent = BaseDomainEvent<
  'memory.updated',
  { readonly memoryId: MemoryId; readonly patch: Partial<Memory> }
>;

export type MemoryDeletedEvent = BaseDomainEvent<
  'memory.deleted',
  { readonly memoryId: MemoryId; readonly workId?: WorkId }
>;

export type CaptureCreatedEvent = BaseDomainEvent<
  'capture.created',
  { readonly capture: Capture }
>;

export type CaptureTriagedEvent = BaseDomainEvent<
  'capture.triaged',
  { readonly captureId: CaptureId; readonly state: CaptureState; readonly workId?: WorkId }
>;

export type FileImportedEvent = BaseDomainEvent<
  'file.imported',
  {
    readonly fileId: string;
    readonly filePath: string;
    readonly format?: string;
    readonly workId?: WorkId;
  }
>;

export type UpdateDetectedEvent = BaseDomainEvent<
  'update.detected',
  { readonly workId: WorkId; readonly entry: UpdateEntry }
>;

export type VaultLockedEvent = BaseDomainEvent<
  'vault.locked',
  { readonly timestamp: string }
>;

export type VaultUnlockedEvent = BaseDomainEvent<
  'vault.unlocked',
  { readonly timestamp: string }
>;

// ---------------------------------------------------------------------------
// Discriminated Union
// ---------------------------------------------------------------------------

/**
 * Union of all domain events emitted across Grimoire.
 */
export type DomainEvent =
  | WorkCreatedEvent
  | WorkUpdatedEvent
  | WorkArchivedEvent
  | WorkMergedEvent
  | RelationshipStartedEvent
  | RelationshipPausedEvent
  | RelationshipResumedEvent
  | RelationshipCompletedEvent
  | RelationshipStateChangedEvent
  | ProgressRecordedEvent
  | SourceAddedEvent
  | SourceRemovedEvent
  | SourceHealthChangedEvent
  | MemoryCreatedEvent
  | MemoryUpdatedEvent
  | MemoryDeletedEvent
  | CaptureCreatedEvent
  | CaptureTriagedEvent
  | FileImportedEvent
  | UpdateDetectedEvent
  | VaultLockedEvent
  | VaultUnlockedEvent;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a domain event with a new ID and current timestamp.
 */
export function createDomainEvent<TType extends DomainEvent['type']>(
  type: TType,
  payload: Extract<DomainEvent, { type: TType }>['payload'],
  customId?: string,
  customTimestamp?: string,
): Extract<DomainEvent, { type: TType }> {
  return {
    id: customId ?? newId(),
    type,
    timestamp: customTimestamp ?? new Date().toISOString(),
    payload,
  } as Extract<DomainEvent, { type: TType }>;
}
