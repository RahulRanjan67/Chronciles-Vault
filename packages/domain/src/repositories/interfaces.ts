import {
  WorkId,
  ReadingRelationshipId,
  AccessPathId,
  MemoryId,
  CaptureId,
  CaptureBatchId,
} from '@chronicles-vault/shared';
import {
  Work,
  WorkSummary,
  ContentType,
  PublicationState,
  PrivacyState,
} from '../entities/work.js';
import {
  ReadingRelationship,
  PersonalState,
  ReadingPriority,
  ReadingAttempt,
  ReadingSession,
} from '../entities/reading-relationship.js';
import { AccessPath, SourceHealth } from '../entities/access-path.js';
import { ProgressEvent } from '../entities/progress.js';
import { Memory, MemoryType, SpoilerLevel } from '../entities/memory.js';
import { Capture, CaptureBatch, CaptureState } from '../entities/capture.js';
import { ArchiveReason } from '../entities/archive.js';
import { ExternalIdentifier } from '../value-objects/external-identifier.js';
import { UpdateEntry } from '../value-objects/update-entry.js';

// ---------------------------------------------------------------------------
// Common Pagination & Query Result Types
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly offset: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Work Repository Types
// ---------------------------------------------------------------------------

export interface WorkListQuery {
  readonly contentTypes?: readonly ContentType[];
  readonly publicationStates?: readonly PublicationState[];
  readonly privacyStates?: readonly PrivacyState[];
  readonly genres?: readonly string[];
  readonly tags?: readonly string[];
  readonly includeDeleted?: boolean;
  readonly offset?: number;
  readonly limit?: number;
  readonly sortBy?: 'title' | 'createdAt' | 'updatedAt';
  readonly sortDirection?: 'asc' | 'desc';
}

export interface WorkSearchQuery {
  readonly query: string;
  readonly limit?: number;
}

export interface WorkSearchResult {
  readonly work: WorkSummary;
  readonly score: number;
  readonly matchedOn: 'title' | 'alias' | 'tag' | 'genre' | 'externalId';
}

export interface DuplicateCandidate {
  readonly work: WorkSummary;
  readonly confidence: number; // 0.0 to 1.0
  readonly matchedFields: readonly string[];
}

export interface MergeResolution {
  readonly primaryWorkId: WorkId;
  readonly mergedAliases: readonly string[];
  readonly mergedExternalIds: readonly ExternalIdentifier[];
  readonly mergedGenres: readonly string[];
  readonly mergedTags: readonly string[];
  readonly preferredCoverRef?: string | null;
}

export interface WorkRepository {
  create(work: Work): Promise<Work>;
  getById(id: WorkId): Promise<Work | null>;
  update(id: WorkId, patch: Partial<Work>): Promise<Work>;
  archive(id: WorkId, reason: ArchiveReason, note?: string): Promise<void>;
  list(query: WorkListQuery): Promise<PaginatedResult<WorkSummary>>;
  search(query: WorkSearchQuery): Promise<readonly WorkSearchResult[]>;
  findDuplicates(work: Partial<Work>): Promise<readonly DuplicateCandidate[]>;
  merge(sourceId: WorkId, targetId: WorkId, resolution: MergeResolution): Promise<Work>;
}

// ---------------------------------------------------------------------------
// Reading Repository Types
// ---------------------------------------------------------------------------

export interface ReadingListFilter {
  readonly personalStates?: readonly PersonalState[];
  readonly priorities?: readonly ReadingPriority[];
}

export interface ReadingRepository {
  getRelationship(workId: WorkId): Promise<ReadingRelationship | null>;
  upsertRelationship(rel: ReadingRelationship): Promise<ReadingRelationship>;
  recordProgress(event: ProgressEvent): Promise<ProgressEvent>;
  getProgressHistory(workId: WorkId, limit?: number): Promise<readonly ProgressEvent[]>;
  getAttempts(workId: WorkId): Promise<readonly ReadingAttempt[]>;
  createAttempt(attempt: ReadingAttempt): Promise<ReadingAttempt>;
  recordSession(session: ReadingSession): Promise<ReadingSession>;
  getSessions(workId: WorkId, limit?: number): Promise<readonly ReadingSession[]>;
  listRelationships(filter?: ReadingListFilter): Promise<readonly ReadingRelationship[]>;
}

// ---------------------------------------------------------------------------
// Access Path Repository Types
// ---------------------------------------------------------------------------

export interface AccessPathRepository {
  add(path: AccessPath): Promise<AccessPath>;
  getById(id: AccessPathId): Promise<AccessPath | null>;
  getByWork(workId: WorkId): Promise<readonly AccessPath[]>;
  update(id: AccessPathId, patch: Partial<AccessPath>): Promise<AccessPath>;
  remove(id: AccessPathId): Promise<void>;
  updateHealth(id: AccessPathId, health: SourceHealth, errorMessage?: string): Promise<void>;
  setPreferred(workId: WorkId, accessPathId: AccessPathId): Promise<void>;
}

// ---------------------------------------------------------------------------
// Memory Repository Types
// ---------------------------------------------------------------------------

export interface MemoryListOptions {
  readonly types?: readonly MemoryType[];
  readonly spoilerLevels?: readonly SpoilerLevel[];
  readonly privacyStates?: readonly PrivacyState[];
  readonly tags?: readonly string[];
  readonly limit?: number;
  readonly offset?: number;
}

export interface GlobalMemoryOptions {
  readonly onlyGallery?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

export interface MemoryRepository {
  create(memory: Memory): Promise<Memory>;
  getById(id: MemoryId): Promise<Memory | null>;
  listByWork(workId: WorkId, options?: MemoryListOptions): Promise<readonly Memory[]>;
  listGlobal(options?: GlobalMemoryOptions): Promise<readonly Memory[]>;
  update(id: MemoryId, patch: Partial<Memory>): Promise<Memory>;
  delete(id: MemoryId): Promise<void>;
}

// ---------------------------------------------------------------------------
// Capture Repository Types
// ---------------------------------------------------------------------------

export interface CaptureRepository {
  createBatch(batch: CaptureBatch): Promise<CaptureBatch>;
  addItems(batchId: CaptureBatchId, items: readonly Capture[]): Promise<readonly Capture[]>;
  listPending(limit?: number): Promise<readonly Capture[]>;
  updateState(id: CaptureId, state: CaptureState, workId?: WorkId): Promise<void>;
  getBatch(batchId: CaptureBatchId): Promise<CaptureBatch | null>;
}

// ---------------------------------------------------------------------------
// Search Repository Types
// ---------------------------------------------------------------------------

export type SearchScope = 'works' | 'memories' | 'lore' | 'lists';

export interface SearchMatch {
  readonly entityType: SearchScope;
  readonly entityId: string;
  readonly title: string;
  readonly snippet?: string;
  readonly score: number;
}

export interface SearchResults {
  readonly query: string;
  readonly matches: readonly SearchMatch[];
  readonly totalCount: number;
}

export interface SearchRepository {
  search(query: string, scopes: readonly SearchScope[], vaultUnlocked: boolean): Promise<SearchResults>;
  indexWork(work: Work): Promise<void>;
  indexMemory(memory: Memory): Promise<void>;
  removeIndex(entityType: SearchScope, entityId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Update Repository Types
// ---------------------------------------------------------------------------

export interface UpdateRepository {
  addUpdates(updates: readonly UpdateEntry[]): Promise<void>;
  getUpdatesByWork(workId: WorkId): Promise<readonly UpdateEntry[]>;
  getRecentUpdates(limit?: number): Promise<readonly UpdateEntry[]>;
  clearUpdates(workId: WorkId): Promise<void>;
}
