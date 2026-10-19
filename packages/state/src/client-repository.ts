/**
 * Client Storage & Repository Implementation for Grimoire.
 *
 * Implements in-memory repository store
 * and optional localStorage persistence.
 */

import {
  WorkId,
  ReadingRelationshipId,
  AccessPathId,
  MemoryId,
  WorkRelationId,
  ArchiveRecordId,
  newId,
} from "@grimoire/shared";
import {
  Work,
  WorkSummary,
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  ReadingRelationship,
  PersonalState,
  ReadingPriority,
  ProgressEvent,
  ProgressMethod,
  ProgressConfidence,
  ProgressAnchor,
  AccessPath,
  AccessPathKind,
  AccessCapability,
  SourceHealth,
  WebAccessPath,
  LocalFileAccessPath,
  Memory,
  MemoryAsset,
  MemoryType,
  SpoilerLevel,
  UpdateEntry,
  UpdateCertainty,
  toWorkSummary,
  validateWorkInvariant,
  validateMemoryInvariant,
  type HealthMonitorState,
  WorkRelationType,
  WorkRelation,
  createWorkRelation,
  validateWorkRelationInvariant,
  ArchiveReason,
  ArchiveRecord,
  createArchiveRecord,
  validateArchiveRecordInvariant,
  DuplicateCandidate,
  MergeResolution,
  ExternalIdentifier,
  calculateTitleSimilarity,
  calculateUrlSimilarity,
} from "@grimoire/domain";

const STORAGE_KEY = "cv:local_vault:v1";
const ARCHIVE_STORAGE_KEY = "cv:archive_records:v1";
const RELATIONS_STORAGE_KEY = "cv:work_relations:v1";

export interface MergeOptions {
  resolution?: Partial<MergeResolution>;
  preferredProgressWorkId?: WorkId;
  progressChoice?: "target" | "secondary" | "highest" | "custom";
  customAnchor?: ProgressAnchor;
  whyMergedNote?: string;
  preferredCoverWorkId?: WorkId;
}

export interface HydratedWorkItem {
  work: Work;
  relationship?: ReadingRelationship;
  accessPaths: AccessPath[];
  latestProgress?: ProgressEvent;
  memories: Memory[];
  updates: UpdateEntry[];
}

export interface MemoryGalleryRecord {
  readonly memory: Memory;
  readonly workTitle: string | null;
}

export type NewMemoryData = Omit<Memory, "id" | "workId" | "createdAt" | "updatedAt" | "assets"> & {
  readonly assets?: readonly Omit<MemoryAsset, "memoryId">[];
};

// ---------------------------------------------------------------------------
// Seed Data (Realistic Digital & Serialized Fiction Works)
// ---------------------------------------------------------------------------

export interface UserAccountProfile {
  id: string;
  username: string;
  displayName: string;
  role: string;
  localWatchDir?: string;
  isDemo?: boolean;
}

export const DEFAULT_USER_ACCOUNT: UserAccountProfile = {
  id: "account-owner",
  username: "Archivist",
  displayName: "Archivist",
  role: "Library Keeper",
};

export const AVAILABLE_USER_PROFILES: UserAccountProfile[] = [
  DEFAULT_USER_ACCOUNT,
];

export const DEMO_USER_ACCOUNT = DEFAULT_USER_ACCOUNT;

export const DEFAULT_WORK_COVERS: Record<string, string> = {};

function createInitialSeed(): HydratedWorkItem[] {
  return [];
}

function createDemoUser2Seed(): HydratedWorkItem[] {
  return [];
}

export function createInitialArchiveSeed(): { works: HydratedWorkItem[]; records: ArchiveRecord[] } {
  return { works: [], records: [] };
}

function createInitialRelationsSeed(): WorkRelation[] {
  return [];
}

// ---------------------------------------------------------------------------
// Client Repository Singleton
// ---------------------------------------------------------------------------

export class ClientRepository {
  private items: Map<WorkId, HydratedWorkItem> = new Map();
  private archiveRecords: Map<ArchiveRecordId, ArchiveRecord> = new Map();
  private workRelations: Map<WorkRelationId, WorkRelation> = new Map();
  private readonly persistStorage: boolean;

  constructor(options?: { empty?: boolean }) {
    this.persistStorage = !options?.empty;
    if (!options?.empty) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as HydratedWorkItem[];
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              this.items.set(item.work.id, item);
            }
          }
        }

        const rawArchive = window.localStorage.getItem(ARCHIVE_STORAGE_KEY);
        if (rawArchive) {
          const parsedArchive = JSON.parse(rawArchive) as ArchiveRecord[];
          if (Array.isArray(parsedArchive)) {
            for (const rec of parsedArchive) {
              this.archiveRecords.set(rec.id, rec);
            }
          }
        }

        const rawRelations = window.localStorage.getItem(RELATIONS_STORAGE_KEY);
        if (rawRelations) {
          const parsedRelations = JSON.parse(rawRelations) as WorkRelation[];
          if (Array.isArray(parsedRelations)) {
            for (const rel of parsedRelations) {
              this.workRelations.set(rel.id, rel);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load Grimoire cache from localStorage:", err);
      }
    }
  }

  private saveToStorage(): void {
    if (this.persistStorage && typeof window !== "undefined" && window.localStorage) {
      try {
        const arr = Array.from(this.items.values());
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        const archiveArr = Array.from(this.archiveRecords.values());
        window.localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archiveArr));
        const relationsArr = Array.from(this.workRelations.values());
        window.localStorage.setItem(RELATIONS_STORAGE_KEY, JSON.stringify(relationsArr));
      } catch (err) {
        console.warn("Failed to save Grimoire state to localStorage:", err);
      }
    }
  }

  // Work queries
  public getItems(): HydratedWorkItem[] {
    return Array.from(this.items.values());
  }

  public getItem(id: WorkId): HydratedWorkItem | undefined {
    return this.items.get(id);
  }

  public getSummaries(): WorkSummary[] {
    return Array.from(this.items.values())
      .filter((i) => !i.work.deletedAt)
      .map((i) => toWorkSummary(i.work));
  }

  // Work mutations
  public createWork(
    workParams: Omit<Work, "id" | "createdAt" | "updatedAt" | "deletedAt">,
    initialState: PersonalState = PersonalState.Reading,
    initialAnchor?: ProgressAnchor,
    initialPath?: { provider: string; url?: string; label: string },
  ): HydratedWorkItem {
    validateWorkInvariant(workParams);
    const now = new Date().toISOString();
    const id = newId() as WorkId;
    const work: Work = {
      ...workParams,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const pathId = newId() as AccessPathId;
    const accessPaths: AccessPath[] = initialPath
      ? [
          {
            id: pathId,
            workId: id,
            kind: AccessPathKind.Web,
            provider: initialPath.provider,
            label: initialPath.label,
            url: initialPath.url ?? "",
            capabilities: [AccessCapability.Read, AccessCapability.Updates],
            health: SourceHealth.Healthy,
            healthState: SourceHealth.Healthy,
            lastCheckedAt: now,
            lastOpenedAt: now,
            isPreferred: true,
            provenance: { source: "work_creation" },
            createdAt: now,
            updatedAt: now,
          } as WebAccessPath,
        ]
      : [];

    const relId = newId() as ReadingRelationshipId;
    const relationship: ReadingRelationship = {
      id: relId,
      workId: id,
      personalState: initialState,
      priority: ReadingPriority.Normal,
      startedAt: initialState === PersonalState.Reading ? now : null,
      lastActiveAt: now,
      completedAt: initialState === PersonalState.Completed ? now : null,
      stoppedAt: null,
      stoppedReason: null,
      stoppedNote: null,
      currentAnchor: initialAnchor ?? { type: "chapter", chapter: 1, title: "Chapter 1" },
      preferredAccessPathId: accessPaths[0]?.id ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const item: HydratedWorkItem = {
      work,
      relationship,
      accessPaths,
      memories: [],
      updates: [],
    };

    this.items.set(id, item);
    this.saveToStorage();
    return item;
  }

  public updateWork(id: WorkId, patch: Partial<Omit<Work, "id" | "createdAt">>): Work {
    const item = this.items.get(id);
    if (!item) throw new Error(`Work with ID ${id} not found`);

    item.work = {
      ...item.work,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    validateWorkInvariant(item.work);
    this.saveToStorage();
    return item.work;
  }

  public deleteWork(id: WorkId): void {
    const item = this.items.get(id);
    if (item) {
      item.work = {
        ...item.work,
        deletedAt: new Date().toISOString(),
      };
      this.saveToStorage();
    }
  }

  public purgeWork(id: WorkId): boolean {
    const deleted = this.items.delete(id);
    if (deleted) {
      for (const [relId, rel] of Array.from(this.workRelations.entries())) {
        if (rel.sourceWorkId === id || rel.targetWorkId === id) {
          this.workRelations.delete(relId);
        }
      }
      this.saveToStorage();
    }
    return deleted;
  }

  public purgeAllDeletedWorks(): number {
    let count = 0;
    for (const [id, item] of Array.from(this.items.entries())) {
      if (item.work.deletedAt) {
        this.items.delete(id);
        for (const [relId, rel] of Array.from(this.workRelations.entries())) {
          if (rel.sourceWorkId === id || rel.targetWorkId === id) {
            this.workRelations.delete(relId);
          }
        }
        count++;
      }
    }
    if (count > 0) {
      this.saveToStorage();
    }
    return count;
  }

  public resetToDefaultSeed(): void {
    this.items.clear();
    this.workRelations.clear();
    this.archiveRecords.clear();
    this.saveToStorage();
  }


  // Reading relationship operations
  public updatePersonalState(
    workId: WorkId,
    state: PersonalState,
    stoppedReason?: string,
    stoppedNote?: string,
  ): ReadingRelationship {
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const now = new Date().toISOString();
    if (!item.relationship) {
      item.relationship = {
        id: newId() as ReadingRelationshipId,
        workId,
        personalState: state,
        priority: ReadingPriority.Normal,
        startedAt: state === PersonalState.Reading ? now : null,
        lastActiveAt: now,
        completedAt: state === PersonalState.Completed ? now : null,
        stoppedAt: state === PersonalState.Paused || state === PersonalState.Stalled ? now : null,
        stoppedReason: stoppedReason ?? null,
        stoppedNote: stoppedNote ?? null,
        currentAnchor: { type: "chapter", chapter: 1 },
        preferredAccessPathId: item.accessPaths[0]?.id ?? null,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      item.relationship = {
        ...item.relationship,
        personalState: state,
        lastActiveAt: now,
        completedAt: state === PersonalState.Completed ? now : item.relationship.completedAt,
        stoppedAt:
          state === PersonalState.Paused || state === PersonalState.Stalled
            ? now
            : item.relationship.stoppedAt,
        stoppedReason:
          stoppedReason !== undefined ? stoppedReason : item.relationship.stoppedReason,
        stoppedNote: stoppedNote !== undefined ? stoppedNote : item.relationship.stoppedNote,
        updatedAt: now,
      };
    }

    this.saveToStorage();
    return item.relationship;
  }

  public updateRelationship(
    workId: WorkId,
    patch: Partial<Omit<ReadingRelationship, "id" | "workId" | "createdAt">>,
  ): ReadingRelationship {
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const now = new Date().toISOString();
    if (!item.relationship) {
      item.relationship = {
        id: newId() as ReadingRelationshipId,
        workId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.Normal,
        startedAt: now,
        lastActiveAt: now,
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 1 },
        preferredAccessPathId: item.accessPaths[0]?.id ?? null,
        ...patch,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      item.relationship = {
        ...item.relationship,
        ...patch,
        updatedAt: now,
      };
    }

    this.saveToStorage();
    return item.relationship;
  }

  public recordProgress(
    workId: WorkId,
    newAnchor: ProgressAnchor,
    method: ProgressMethod = ProgressMethod.Manual,
  ): ProgressEvent {
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const now = new Date().toISOString();
    const anchorBefore = item.relationship?.currentAnchor ?? null;

    const event: ProgressEvent = {
      id: newId(),
      workId,
      readingRelationshipId: item.relationship?.id,
      accessPathId: item.relationship?.preferredAccessPathId ?? undefined,
      method,
      confidence: ProgressConfidence.Confirmed,
      anchorBefore: anchorBefore ?? undefined,
      anchorAfter: newAnchor,
      createdAt: now,
    };

    if (item.relationship) {
      item.relationship = {
        ...item.relationship,
        currentAnchor: newAnchor,
        lastActiveAt: now,
        updatedAt: now,
      };
    }

    item.latestProgress = event;
    this.saveToStorage();
    return event;
  }

  // Access Path operations
  public addAccessPath(workId: WorkId, path: Omit<AccessPath, "id" | "workId">): AccessPath {
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const newPath = {
      ...path,
      id: newId() as AccessPathId,
      workId,
    } as AccessPath;

    if (newPath.isPreferred) {
      item.accessPaths = item.accessPaths.map((p) => ({
        ...p,
        isPreferred: false,
      })) as AccessPath[];
      if (item.relationship) {
        item.relationship = {
          ...item.relationship,
          preferredAccessPathId: newPath.id,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    item.accessPaths = [...item.accessPaths, newPath];
    this.saveToStorage();
    return newPath;
  }

  public setPreferredAccessPath(workId: WorkId, pathId: AccessPathId): void {
    const item = this.items.get(workId);
    if (!item) return;

    item.accessPaths = item.accessPaths.map((p) => ({
      ...p,
      isPreferred: p.id === pathId,
    })) as AccessPath[];

    if (item.relationship) {
      item.relationship = {
        ...item.relationship,
        preferredAccessPathId: pathId,
        updatedAt: new Date().toISOString(),
      };
    }
    this.saveToStorage();
  }

  public deleteAccessPath(workId: WorkId, pathId: AccessPathId): void {
    const item = this.items.get(workId);
    if (!item) return;

    item.accessPaths = item.accessPaths.filter((p) => p.id !== pathId);

    // If preferred access path was deleted, clear or fallback to next available
    if (item.relationship?.preferredAccessPathId === pathId) {
      const fallback = item.accessPaths.find((p) => p.isPreferred) ?? item.accessPaths[0] ?? null;
      item.relationship = {
        ...item.relationship,
        preferredAccessPathId: fallback?.id ?? null,
        updatedAt: new Date().toISOString(),
      };
    }

    // Work, relationship, memories, and progress remain 100% intact even with 0 access paths
    this.saveToStorage();
  }

  public updateAccessPathHealth(
    workId: WorkId,
    pathId: AccessPathId,
    monitorState: HealthMonitorState,
  ): AccessPath | null {
    const item = this.items.get(workId);
    if (!item) return null;

    const pathIndex = item.accessPaths.findIndex((p) => p.id === pathId);
    if (pathIndex === -1) return null;

    const currentPath = item.accessPaths[pathIndex];
    const now = new Date().toISOString();
    const updatedPath = {
      ...currentPath,
      health: monitorState.health,
      healthState: monitorState.health,
      lastCheckedAt: monitorState.lastCheckedAt ?? now,
      healthMonitorState: monitorState,
      updatedAt: now,
    } as AccessPath;

    item.accessPaths[pathIndex] = updatedPath;
    this.saveToStorage();
    return updatedPath;
  }

  // Memory operations
  public listMemories(): MemoryGalleryRecord[] {
    return Array.from(this.items.values())
      .filter((item) => !item.work.deletedAt)
      .flatMap((item) => item.memories.map((memory) => ({ memory, workTitle: item.work.title })))
      .sort((a, b) => b.memory.createdAt.localeCompare(a.memory.createdAt));
  }

  public addMemory(workId: WorkId, memory: NewMemoryData): Memory {
    if (memory.privacyState === PrivacyState.Vault) {
      throw new Error("Vault memories must be encrypted in the private vault repository.");
    }
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const now = new Date().toISOString();
    const id = newId() as MemoryId;
    const newMem: Memory = {
      ...memory,
      id,
      workId,
      accessPathId: memory.accessPathId ?? null,
      progressAnchor: memory.progressAnchor ?? null,
      assets: (memory.assets ?? []).map((asset) => ({ ...asset, memoryId: id })),
      tags: memory.tags ?? [],
      showInGlobalGallery: memory.showInGlobalGallery ?? true,
      createdAt: now,
      updatedAt: now,
    };
    validateMemoryInvariant(newMem);
    if (newMem.accessPathId && !item.accessPaths.some((path) => path.id === newMem.accessPathId)) {
      throw new Error("Memory access path must belong to its Work.");
    }

    item.memories = [...item.memories, newMem];
    this.saveToStorage();
    return newMem;
  }

  public updateMemory(
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
  ): Memory {
    if (patch.privacyState === PrivacyState.Vault) {
      throw new Error("Vault memories must be encrypted in the private vault repository.");
    }
    for (const item of this.items.values()) {
      const index = item.memories.findIndex((memory) => memory.id === memoryId);
      if (index < 0) continue;
      const existing = item.memories[index];
      if (!existing) break;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      validateMemoryInvariant(updated);
      item.memories[index] = updated;
      this.saveToStorage();
      return updated;
    }
    throw new Error(`Memory with ID ${memoryId} not found.`);
  }

  public deleteMemory(memoryId: MemoryId): boolean {
    for (const item of this.items.values()) {
      const index = item.memories.findIndex((memory) => memory.id === memoryId);
      if (index < 0) continue;
      item.memories = item.memories.filter((memory) => memory.id !== memoryId);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Archive Operations
  // ---------------------------------------------------------------------------

  public archiveWork(
    workId: WorkId,
    reason: ArchiveReason,
    whyStoppedNote?: string,
  ): ArchiveRecord {
    const item = this.items.get(workId);
    if (!item) {
      throw new Error(`Work with ID ${workId} not found.`);
    }

    const now = new Date().toISOString();
    const record = createArchiveRecord({
      workId,
      reason,
      note: whyStoppedNote ?? null,
      previousState: item.relationship?.personalState ?? null,
      previousProgress: item.relationship?.currentAnchor ?? null,
      archivedAt: now,
    });

    this.archiveRecords.set(record.id, record);

    item.work = {
      ...item.work,
      deletedAt: now,
      updatedAt: now,
    };

    if (item.relationship) {
      item.relationship = {
        ...item.relationship,
        stoppedReason: reason,
        stoppedNote: whyStoppedNote ?? null,
        stoppedAt: now,
        updatedAt: now,
      };
    }

    this.saveToStorage();
    return record;
  }

  public restoreWork(workId: WorkId): Work {
    const item = this.items.get(workId);
    if (!item) {
      throw new Error(`Work with ID ${workId} not found.`);
    }

    item.work = {
      ...item.work,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage();
    return item.work;
  }

  public getArchiveRecords(): ArchiveRecord[] {
    return Array.from(this.archiveRecords.values());
  }

  public getArchivedWorks(): Array<{
    work: Work;
    record?: ArchiveRecord;
    relationship?: ReadingRelationship;
  }> {
    return Array.from(this.items.values())
      .filter((item) => Boolean(item.work.deletedAt))
      .map((item) => {
        const records = Array.from(this.archiveRecords.values())
          .filter((r) => r.workId === item.work.id)
          .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));
        return {
          work: item.work,
          record: records[0],
          relationship: item.relationship,
        };
      });
  }

  // ---------------------------------------------------------------------------
  // Work Relation Operations
  // ---------------------------------------------------------------------------

  public getWorkRelations(workId: WorkId): WorkRelation[] {
    return Array.from(this.workRelations.values()).filter(
      (rel) => rel.sourceWorkId === workId || rel.targetWorkId === workId,
    );
  }

  public getAllWorkRelations(): WorkRelation[] {
    return Array.from(this.workRelations.values());
  }

  public linkWorkRelation(
    sourceWorkId: WorkId,
    targetWorkId: WorkId,
    relationType: WorkRelationType,
    notes?: string,
  ): WorkRelation {
    validateWorkRelationInvariant({ sourceWorkId, targetWorkId });
    if (!this.items.has(sourceWorkId)) {
      throw new Error(`Source work ${sourceWorkId} not found.`);
    }
    if (!this.items.has(targetWorkId)) {
      throw new Error(`Target work ${targetWorkId} not found.`);
    }

    // Check if identical relation already exists
    const existing = Array.from(this.workRelations.values()).find(
      (r) =>
        r.sourceWorkId === sourceWorkId &&
        r.targetWorkId === targetWorkId &&
        r.relationType === relationType,
    );
    if (existing) {
      return existing;
    }

    const relation = createWorkRelation({
      sourceWorkId,
      targetWorkId,
      relationType,
      notes: notes ?? null,
    });

    this.workRelations.set(relation.id, relation);
    this.saveToStorage();
    return relation;
  }

  public removeWorkRelation(relationId: WorkRelationId): void {
    this.workRelations.delete(relationId);
    this.saveToStorage();
  }

  // ---------------------------------------------------------------------------
  // Deduplication & Merge Operations
  // ---------------------------------------------------------------------------

  public findDuplicates(workId: WorkId): DuplicateCandidate[] {
    const targetItem = this.items.get(workId);
    if (!targetItem) return [];

    const candidates: Map<string, DuplicateCandidate> = new Map();
    const targetWork = targetItem.work;
    const targetTitle = targetWork.title.trim().toLowerCase();

    for (const item of this.items.values()) {
      if (item.work.id === workId || item.work.deletedAt) continue;
      const candidateWork = item.work;
      let bestConfidence = 0.0;
      const matchedFields: string[] = [];

      // 1. External ID matches
      if (targetWork.externalIds.length > 0 && candidateWork.externalIds.length > 0) {
        for (const ext1 of targetWork.externalIds) {
          for (const ext2 of candidateWork.externalIds) {
            if (ext1.provider === ext2.provider && ext1.externalId === ext2.externalId) {
              bestConfidence = Math.max(bestConfidence, 0.99);
              matchedFields.push(`externalId:${ext1.provider}`);
            }
          }
        }
      }

      // 2. Primary title exact or similarity
      const candTitle = candidateWork.title.trim().toLowerCase();
      if (targetTitle === candTitle) {
        bestConfidence = Math.max(bestConfidence, 0.95);
        matchedFields.push("exact_title");
      } else {
        const sim = calculateTitleSimilarity(targetWork.title, candidateWork.title);
        if (sim >= 0.7) {
          bestConfidence = Math.max(bestConfidence, sim);
          matchedFields.push("title_similarity");
        }
      }

      // 3. Alternative titles & Aliases
      const allTargetAliases = [...targetWork.alternativeTitles, ...targetWork.aliases].map((a) =>
        a.trim().toLowerCase(),
      );
      const allCandAliases = [...candidateWork.alternativeTitles, ...candidateWork.aliases].map((a) =>
        a.trim().toLowerCase(),
      );

      for (const tAlias of allTargetAliases) {
        if (!tAlias) continue;
        if (candTitle === tAlias || allCandAliases.includes(tAlias)) {
          bestConfidence = Math.max(bestConfidence, 0.88);
          matchedFields.push("alias_match");
          break;
        }
      }

      for (const cAlias of allCandAliases) {
        if (!cAlias) continue;
        if (targetTitle === cAlias) {
          bestConfidence = Math.max(bestConfidence, 0.88);
          matchedFields.push("alias_match");
          break;
        }
      }

      // 4. Access Path URL similarity
      for (const p1 of targetItem.accessPaths) {
        const u1 = "url" in p1 ? (p1 as WebAccessPath).url : undefined;
        if (!u1) continue;
        for (const p2 of item.accessPaths) {
          const u2 = "url" in p2 ? (p2 as WebAccessPath).url : undefined;
          if (!u2) continue;
          const urlSim = calculateUrlSimilarity(u1, u2);
          if (urlSim >= 0.8) {
            bestConfidence = Math.max(bestConfidence, 0.9);
            matchedFields.push("access_url");
          }
        }
      }

      if (bestConfidence >= 0.4) {
        candidates.set(candidateWork.id, {
          work: toWorkSummary(candidateWork),
          confidence: Math.round(bestConfidence * 100) / 100,
          matchedFields: Array.from(new Set(matchedFields)),
        });
      }
    }

    return Array.from(candidates.values()).sort((a, b) => b.confidence - a.confidence);
  }

  public executeMerge(
    targetId: WorkId,
    secondaryId: WorkId,
    options?: MergeOptions,
  ): Work {
    if (targetId === secondaryId) {
      throw new Error("Cannot merge a work into itself.");
    }
    const targetItem = this.items.get(targetId);
    const secondaryItem = this.items.get(secondaryId);

    if (!targetItem || !secondaryItem) {
      throw new Error(`Target work (${targetId}) or secondary work (${secondaryId}) not found.`);
    }

    const now = new Date().toISOString();

    // 1. Reassign Access Paths (non-destructive union)
    const existingUrls = new Set(
      targetItem.accessPaths
        .map((p) =>
          "url" in p
            ? (p as WebAccessPath).url
            : "filePath" in p
              ? (p as LocalFileAccessPath).filePath
              : "",
        )
        .filter(Boolean),
    );

    const transferredPaths: AccessPath[] = [];
    for (const path of secondaryItem.accessPaths) {
      const urlOrPath =
        "url" in path
          ? (path as WebAccessPath).url
          : "filePath" in path
            ? (path as LocalFileAccessPath).filePath
            : "";
      if (!urlOrPath || !existingUrls.has(urlOrPath)) {
        transferredPaths.push({
          ...path,
          workId: targetId,
          isPreferred: false,
          updatedAt: now,
        });
        if (urlOrPath) existingUrls.add(urlOrPath);
      }
    }
    targetItem.accessPaths = [...targetItem.accessPaths, ...transferredPaths];

    // 2. Reassign Memories (non-destructive)
    const transferredMemories = secondaryItem.memories.map((m) => ({
      ...m,
      workId: targetId,
      updatedAt: now,
    }));
    targetItem.memories = [...targetItem.memories, ...transferredMemories];

    // 3. Reassign Work Relations
    for (const [relId, rel] of this.workRelations.entries()) {
      if (rel.sourceWorkId === secondaryId || rel.targetWorkId === secondaryId) {
        const newSource = rel.sourceWorkId === secondaryId ? targetId : rel.sourceWorkId;
        const newTarget = rel.targetWorkId === secondaryId ? targetId : rel.targetWorkId;
        if (newSource !== newTarget) {
          this.workRelations.set(relId, {
            ...rel,
            sourceWorkId: newSource,
            targetWorkId: newTarget,
          });
        } else {
          this.workRelations.delete(relId);
        }
      }
    }

    // 4. Progress Resolution
    const targetRel = targetItem.relationship;
    const secondaryRel = secondaryItem.relationship;

    let chosenAnchor: ProgressAnchor | null = targetRel?.currentAnchor ?? null;
    const targetChapter =
      targetRel?.currentAnchor &&
      "chapter" in targetRel.currentAnchor &&
      typeof targetRel.currentAnchor.chapter === "number"
        ? targetRel.currentAnchor.chapter
        : 0;
    const secChapter =
      secondaryRel?.currentAnchor &&
      "chapter" in secondaryRel.currentAnchor &&
      typeof secondaryRel.currentAnchor.chapter === "number"
        ? secondaryRel.currentAnchor.chapter
        : 0;

    if (options?.customAnchor) {
      chosenAnchor = options.customAnchor;
    } else if (
      options?.progressChoice === "secondary" ||
      options?.preferredProgressWorkId === secondaryId
    ) {
      chosenAnchor = secondaryRel?.currentAnchor ?? chosenAnchor;
    } else if (options?.progressChoice === "highest") {
      if (secChapter > targetChapter && secondaryRel?.currentAnchor) {
        chosenAnchor = secondaryRel.currentAnchor;
      }
    }

    if (!targetItem.relationship && secondaryItem.relationship) {
      targetItem.relationship = {
        ...secondaryItem.relationship,
        id: newId() as ReadingRelationshipId,
        workId: targetId,
        currentAnchor: chosenAnchor ?? secondaryItem.relationship.currentAnchor,
        updatedAt: now,
      };
    } else if (targetItem.relationship) {
      targetItem.relationship = {
        ...targetItem.relationship,
        currentAnchor: chosenAnchor ?? targetItem.relationship.currentAnchor,
        lastActiveAt: now,
        updatedAt: now,
      };
    }

    // 5. Merge Metadata (union of aliases, externalIds, genres, tags)
    const combinedAlt = Array.from(
      new Set([...targetItem.work.alternativeTitles, ...secondaryItem.work.alternativeTitles]),
    );
    const combinedAliases = Array.from(
      new Set([...targetItem.work.aliases, ...secondaryItem.work.aliases]),
    );
    const combinedGenres = Array.from(
      new Set([...targetItem.work.genres, ...secondaryItem.work.genres]),
    );
    const combinedTags = Array.from(
      new Set([...targetItem.work.tags, ...secondaryItem.work.tags]),
    );

    const extIdMap = new Map<string, ExternalIdentifier>();
    for (const ext of targetItem.work.externalIds) {
      extIdMap.set(`${ext.provider}:${ext.externalId}`, ext);
    }
    for (const ext of secondaryItem.work.externalIds) {
      extIdMap.set(`${ext.provider}:${ext.externalId}`, ext);
    }

    let coverRef = targetItem.work.coverRef;
    if (
      options?.preferredCoverWorkId === secondaryId ||
      (!coverRef && secondaryItem.work.coverRef)
    ) {
      coverRef = secondaryItem.work.coverRef;
    }

    targetItem.work = {
      ...targetItem.work,
      alternativeTitles: combinedAlt,
      aliases: combinedAliases,
      genres: combinedGenres,
      tags: combinedTags,
      externalIds: Array.from(extIdMap.values()),
      coverRef,
      updatedAt: now,
    };
    validateWorkInvariant(targetItem.work);

    // 6. Non-destructively archive the secondary work
    const archiveRecord = createArchiveRecord({
      workId: secondaryId,
      reason: ArchiveReason.Duplicate,
      note: options?.whyMergedNote ?? `Merged into ${targetItem.work.title} (${targetId})`,
      previousState: secondaryItem.relationship?.personalState ?? null,
      previousProgress: secondaryItem.relationship?.currentAnchor ?? null,
      archivedAt: now,
    });
    this.archiveRecords.set(archiveRecord.id, archiveRecord);

    secondaryItem.work = {
      ...secondaryItem.work,
      deletedAt: now,
      updatedAt: now,
    };
    secondaryItem.accessPaths = [];
    secondaryItem.memories = [];

    this.saveToStorage();
    return targetItem.work;
  }
}

// Global client repository singleton
export const clientRepository = new ClientRepository();
