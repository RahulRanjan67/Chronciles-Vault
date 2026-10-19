/**
 * ADR-010: Persistence Layer Unification Boundary
 *
 * Defines the domain-aligned repository contracts consumed by UI stores and
 * feature modules so application code does not depend on concrete storage
 * mechanics (localStorage vs IndexedDB vs Capacitor SQLite).
 */

import type {
  AccessPath,
  AccessPathId,
  ArchiveReason,
  ArchiveRecord,
  DuplicateCandidate,
  HealthMonitorState,
  Memory,
  MemoryId,
  PersonalState,
  ProgressAnchor,
  ProgressEvent,
  ProgressMethod,
  ReadingRelationship,
  Work,
  WorkId,
  WorkRelation,
  WorkRelationId,
  WorkRelationType,
  WorkSummary,
} from "@grimoire/domain";
import {
  ClientRepository,
  clientRepository,
  type HydratedWorkItem,
  type MemoryGalleryRecord,
  type MergeOptions,
  type NewMemoryData,
} from "./client-repository";

export interface IWorkRepository {
  getItems(): HydratedWorkItem[];
  getItem(id: WorkId): HydratedWorkItem | undefined;
  getSummaries(): WorkSummary[];
  createWork(
    workParams: Omit<Work, "id" | "createdAt" | "updatedAt" | "deletedAt">,
    initialState?: PersonalState,
    initialAnchor?: ProgressAnchor,
    initialPath?: { provider: string; url?: string; label: string },
  ): HydratedWorkItem;
  updateWork(
    id: WorkId,
    patch: Partial<Omit<Work, "id" | "createdAt">>,
  ): Work;
  deleteWork(id: WorkId): void;
  findDuplicates(workId: WorkId): DuplicateCandidate[];
  executeMerge(
    targetId: WorkId,
    secondaryId: WorkId,
    options?: MergeOptions,
  ): Work;
}

export interface IRelationshipRepository {
  updatePersonalState(
    workId: WorkId,
    state: PersonalState,
    stoppedReason?: string,
    stoppedNote?: string,
  ): ReadingRelationship;
  updateRelationship(
    workId: WorkId,
    patch: Partial<Omit<ReadingRelationship, "id" | "workId" | "createdAt">>,
  ): ReadingRelationship;
  recordProgress(
    workId: WorkId,
    newAnchor: ProgressAnchor,
    method?: ProgressMethod,
  ): ProgressEvent;
}

export interface IAccessPathRepository {
  addAccessPath(
    workId: WorkId,
    path: Omit<AccessPath, "id" | "workId">,
  ): AccessPath;
  setPreferredAccessPath(workId: WorkId, pathId: AccessPathId): void;
  deleteAccessPath(workId: WorkId, pathId: AccessPathId): void;
  updateAccessPathHealth(
    workId: WorkId,
    pathId: AccessPathId,
    monitorState: HealthMonitorState,
  ): AccessPath | null;
}

export interface IMemoryRepository {
  listMemories(): MemoryGalleryRecord[];
  addMemory(workId: WorkId, memory: NewMemoryData): Memory;
  updateMemory(
    memoryId: MemoryId,
    patch: Partial<
      Pick<
        Memory,
        | "title"
        | "body"
        | "tags"
        | "readingAttemptId"
        | "spoilerLevel"
        | "showInGlobalGallery"
        | "privacyState"
      >
    >,
  ): Memory;
  deleteMemory(memoryId: MemoryId): boolean;
  softDeleteMemory(memoryId: MemoryId): boolean;
  restoreMemory(memoryId: MemoryId): boolean;
  purgeMemory(memoryId: MemoryId): boolean;
}

export interface IUpdateRepository {
  getItems(): HydratedWorkItem[];
}

export interface IArchiveRepository {
  archiveWork(
    workId: WorkId,
    reason: ArchiveReason,
    whyStoppedNote?: string,
  ): ArchiveRecord;
  restoreWork(workId: WorkId): Work;
  getArchiveRecords(): ArchiveRecord[];
  getArchivedWorks(): Array<{
    work: Work;
    record?: ArchiveRecord;
    relationship?: ReadingRelationship;
  }>;
}

export interface ITrashRepository {
  getDeletedWorks(): HydratedWorkItem[];
  getDeletedMemories(): Array<{ memory: Memory; workTitle: string; workId: WorkId }>;
  getTrashCount(): number;
  purgeExpiredTrash(retentionDays?: number): { worksPurged: number; memoriesPurged: number };
  purgeAllTrash(): { worksPurged: number; memoriesPurged: number };
}

export interface IWorkRelationRepository {
  getWorkRelations(workId: WorkId): WorkRelation[];
  getAllWorkRelations(): WorkRelation[];
  linkWorkRelation(
    sourceWorkId: WorkId,
    targetWorkId: WorkId,
    relationType: WorkRelationType,
    notes?: string,
  ): WorkRelation;
  removeWorkRelation(relationId: WorkRelationId): void;
}

/**
 * Canonical unified repository contract across Web, PWA, and Capacitor Native SQLite.
 */
export interface IChroniclesRepository
  extends IWorkRepository,
    IRelationshipRepository,
    IAccessPathRepository,
    IMemoryRepository,
    IUpdateRepository,
    IArchiveRepository,
    ITrashRepository,
    IWorkRelationRepository {}

/** Unified alias for `IChroniclesRepository`. */
export type ClientDataRepository = IChroniclesRepository;

/** Browser localStorage/in-memory adapter implementing `IChroniclesRepository`. */
export const BrowserRepositoryAdapter = ClientRepository;
export type BrowserRepositoryAdapter = ClientRepository;

/** Default browser repository instance. */
export const browserRepository: IChroniclesRepository = clientRepository;

let activeRepository: IChroniclesRepository = clientRepository;

/** Returns the active repository adapter (Browser localStorage/IndexedDB by default, or SQLite on native/desktop). */
export function getActiveRepository(): IChroniclesRepository {
  return activeRepository;
}

/** Swaps the active repository adapter at startup without requiring UI code to branch. */
export function setActiveRepository(repo: IChroniclesRepository): void {
  activeRepository = repo;
}

/** Alias for `getActiveRepository`. */
export const getActiveClientRepository = getActiveRepository;

/** Alias for `setActiveRepository`. */
export const setActiveClientRepository = setActiveRepository;
