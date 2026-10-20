import { create } from 'zustand';
import { WorkId, AccessPathId, WorkRelationId } from '@grimoire/shared';
import {
  PersonalState,
  ProgressAnchor,
  AccessPath,
  Memory,
  ProgressMethod,
  SourceHealth,
  applyHealthCheckResult,
  WorkRelationType,
  WorkRelation,
  ArchiveReason,
  ArchiveRecord,
  DuplicateCandidate,
  Work,
  ShelfPriorityTier,
} from '@grimoire/domain';
import {
  clientRepository,
  HydratedWorkItem,
  MergeOptions,
} from '../client-repository';
import { useLibraryStore } from './use-library-store';
import { useReturnDeskStore } from './use-return-desk-store';

export interface WorkDetailState {
  activeWorkId: WorkId | null;
  activeItem: HydratedWorkItem | null;
  relations: WorkRelation[];
  isLoading: boolean;

  // Actions
  loadWork: (workId: WorkId) => void;
  clearWork: () => void;
  updateShelfTier: (tier: ShelfPriorityTier) => void;
  updatePersonalState: (
    state: PersonalState,
    stoppedReason?: string,
    stoppedNote?: string,
  ) => void;
  recordProgress: (newAnchor: ProgressAnchor, method?: ProgressMethod) => void;
  advanceChapter: (delta: number) => void;
  addAccessPath: (path: Omit<AccessPath, 'id' | 'workId'>) => AccessPath | null;
  deleteAccessPath: (pathId: AccessPathId) => void;
  setPreferredAccessPath: (pathId: AccessPathId) => void;
  checkAccessPathHealth: (pathId: AccessPathId) => Promise<SourceHealth>;
  addMemory: (memory: Omit<Memory, 'id' | 'workId' | 'createdAt' | 'updatedAt'>) => Memory | null;

  // Cycle 9 Actions
  archiveWork: (
    workId: WorkId,
    reason: ArchiveReason,
    whyStoppedNote?: string,
  ) => ArchiveRecord | null;
  findDuplicates: (workId: WorkId) => DuplicateCandidate[];
  executeMerge: (
    targetId: WorkId,
    secondaryId: WorkId,
    options?: MergeOptions,
  ) => Work;
  loadRelations: (workId: WorkId) => void;
  linkWorkRelation: (
    sourceId: WorkId,
    targetId: WorkId,
    relationType: WorkRelationType,
    notes?: string,
  ) => WorkRelation | null;
  removeWorkRelation: (relationId: WorkRelationId) => void;
  updateCover: (coverRef: string | null) => void;
}

export const useWorkDetailStore = create<WorkDetailState>((set, get) => ({
  activeWorkId: null,
  activeItem: null,
  relations: [],
  isLoading: false,

  loadWork: (workId: WorkId) => {
    set({ isLoading: true, activeWorkId: workId });
    const item = clientRepository.getItem(workId) ?? null;
    const relations = clientRepository.getWorkRelations(workId);
    set({ activeItem: item, relations, isLoading: false });
  },

  clearWork: () => {
    set({ activeWorkId: null, activeItem: null, relations: [], isLoading: false });
  },

  updateShelfTier: (tier: ShelfPriorityTier) => {
    const { activeWorkId } = get();
    if (!activeWorkId) return;

    clientRepository.updateRelationship(activeWorkId, { shelfTier: tier });
    const updated = clientRepository.getItem(activeWorkId) ?? null;
    set({ activeItem: updated });

    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();
  },

  updatePersonalState: (state, stoppedReason, stoppedNote) => {
    const { activeWorkId } = get();
    if (!activeWorkId) return;

    clientRepository.updatePersonalState(activeWorkId, state, stoppedReason, stoppedNote);
    const updated = clientRepository.getItem(activeWorkId) ?? null;
    set({ activeItem: updated });

    // Sync other global stores
    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();
  },

  recordProgress: (newAnchor, method = ProgressMethod.Manual) => {
    const { activeWorkId } = get();
    if (!activeWorkId) return;

    clientRepository.recordProgress(activeWorkId, newAnchor, method);
    const updated = clientRepository.getItem(activeWorkId) ?? null;
    set({ activeItem: updated });

    // Sync other global stores
    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();
  },

  advanceChapter: (delta: number) => {
    const { activeItem, activeWorkId } = get();
    if (!activeWorkId || !activeItem) return;

    const currentAnchor = activeItem.relationship?.currentAnchor;
    let nextChapter = 1;

    if (currentAnchor && 'chapter' in currentAnchor && typeof currentAnchor.chapter === 'number') {
      nextChapter = Math.max(0, currentAnchor.chapter + delta);
    } else {
      nextChapter = Math.max(0, 1 + delta);
    }

    const newAnchor: ProgressAnchor = {
      type: 'chapter',
      chapter: nextChapter,
      title: `Chapter ${nextChapter}`,
    };

    clientRepository.recordProgress(activeWorkId, newAnchor, ProgressMethod.Manual);
    const updated = clientRepository.getItem(activeWorkId) ?? null;
    set({ activeItem: updated });

    // Sync other global stores
    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();
  },

  addAccessPath: (path) => {
    const { activeWorkId } = get();
    if (!activeWorkId) return null;

    const created = clientRepository.addAccessPath(activeWorkId, path);
    const updated = clientRepository.getItem(activeWorkId) ?? null;
    set({ activeItem: updated });

    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();
    return created;
  },

  deleteAccessPath: (pathId) => {
    const { activeWorkId } = get();
    if (!activeWorkId) return;

    clientRepository.deleteAccessPath(activeWorkId, pathId);
    const updated = clientRepository.getItem(activeWorkId) ?? null;
    set({ activeItem: updated });

    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();
  },

  setPreferredAccessPath: (pathId) => {
    const { activeWorkId } = get();
    if (!activeWorkId) return;

    clientRepository.setPreferredAccessPath(activeWorkId, pathId);
    const updated = clientRepository.getItem(activeWorkId) ?? null;
    set({ activeItem: updated });

    useLibraryStore.getState().refresh();
  },

  checkAccessPathHealth: async (pathId) => {
    const { activeWorkId, activeItem } = get();
    if (!activeWorkId || !activeItem) return SourceHealth.Unknown;

    const path = activeItem.accessPaths.find((p) => p.id === pathId);
    if (!path) return SourceHealth.Unknown;

    let probeOk = true;
    let status = 200;
    let errorMsg: string | undefined;

    if (path.kind === 'local_file') {
      // Local files are healthy if path is non-empty
      probeOk = Boolean(path.filePath && path.filePath.trim().length > 0);
    } else if (path.kind === 'web' || path.kind === 'feed') {
      const url = path.kind === 'web' ? path.url : path.feedUrl;
      if (!url || !url.startsWith('http')) {
        probeOk = false;
        errorMsg = 'Invalid URL scheme';
      } else if (typeof fetch !== 'undefined') {
        try {
          const resp = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          probeOk = resp.type === 'opaque' || resp.ok;
          status = resp.status || 200;
        } catch (e: unknown) {
          // In browser environment, no-cors or fetch failure may happen, handle gracefully
          probeOk = false;
          errorMsg = e instanceof Error ? e.message : 'Network probe failed';
        }
      }
    }

    const { monitorState } = applyHealthCheckResult(path, {
      ok: probeOk,
      status,
      errorMessage: errorMsg,
    });

    clientRepository.updateAccessPathHealth(activeWorkId, pathId, monitorState);
    const updated = clientRepository.getItem(activeWorkId) ?? null;
    set({ activeItem: updated });

    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();

    return monitorState.health;
  },

  addMemory: (memory) => {
    const { activeWorkId } = get();
    if (!activeWorkId) return null;

    const created = clientRepository.addMemory(activeWorkId, memory);
    const updated = clientRepository.getItem(activeWorkId) ?? null;
    set({ activeItem: updated });

    useReturnDeskStore.getState().refresh();
    return created;
  },

  archiveWork: (workId, reason, whyStoppedNote) => {
    const record = clientRepository.archiveWork(workId, reason, whyStoppedNote);
    const { activeWorkId } = get();
    if (activeWorkId === workId) {
      const updated = clientRepository.getItem(workId) ?? null;
      set({ activeItem: updated });
    }
    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();
    return record;
  },

  findDuplicates: (workId) => {
    return clientRepository.findDuplicates(workId);
  },

  executeMerge: (targetId, secondaryId, options) => {
    const merged = clientRepository.executeMerge(targetId, secondaryId, options);
    const { activeWorkId } = get();
    if (activeWorkId === targetId || activeWorkId === secondaryId) {
      const updated = clientRepository.getItem(targetId) ?? null;
      const relations = clientRepository.getWorkRelations(targetId);
      set({ activeItem: updated, activeWorkId: targetId, relations });
    }
    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();
    return merged;
  },

  loadRelations: (workId) => {
    const relations = clientRepository.getWorkRelations(workId);
    set({ relations });
  },

  linkWorkRelation: (sourceId, targetId, relationType, notes) => {
    const relation = clientRepository.linkWorkRelation(
      sourceId,
      targetId,
      relationType,
      notes,
    );
    const { activeWorkId } = get();
    if (activeWorkId) {
      const relations = clientRepository.getWorkRelations(activeWorkId);
      set({ relations });
    }
    return relation;
  },

  removeWorkRelation: (relationId) => {
    clientRepository.removeWorkRelation(relationId);
    const { activeWorkId } = get();
    if (activeWorkId) {
      const relations = clientRepository.getWorkRelations(activeWorkId);
      set({ relations });
    }
  },

  updateCover: (coverRef) => {
    const { activeWorkId } = get();
    if (!activeWorkId) return;
    clientRepository.updateWork(activeWorkId, { coverRef });
    get().loadWork(activeWorkId);
    useLibraryStore.getState().refresh();
    useReturnDeskStore.getState().refresh();
  },
}));
