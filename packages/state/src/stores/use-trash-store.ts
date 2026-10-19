import { create } from "zustand";
import { WorkId, MemoryId } from "@grimoire/shared";
import { Memory } from "@grimoire/domain";
import { clientRepository, HydratedWorkItem } from "../client-repository";
import { useListsStore, UserPersonalList } from "./use-lists-store";
import { useLibraryStore } from "./use-library-store";

export type TrashFilter = "all" | "works" | "memories" | "lists";

export interface DeletedMemoryItem {
  memory: Memory;
  workTitle: string;
  workId: WorkId;
}

export interface TrashState {
  deletedWorks: HydratedWorkItem[];
  deletedMemories: DeletedMemoryItem[];
  deletedLists: UserPersonalList[];
  totalTrashCount: number;
  activeFilter: TrashFilter;
  isLoading: boolean;

  // Actions
  setActiveFilter: (filter: TrashFilter) => void;
  refreshTrash: () => void;
  restoreWork: (workId: WorkId) => void;
  purgeWork: (workId: WorkId) => void;
  restoreMemory: (memoryId: MemoryId) => void;
  purgeMemory: (memoryId: MemoryId) => void;
  restoreList: (listId: string) => void;
  purgeList: (listId: string) => void;
  emptyAllTrash: () => void;
  autoPurgeExpired: (retentionDays?: number) => void;
}

export const useTrashStore = create<TrashState>((set, get) => {
  function computeState() {
    const deletedWorks = clientRepository.getDeletedWorks();
    const deletedMemories = clientRepository.getDeletedMemories();
    const deletedLists = useListsStore.getState().getDeletedLists();
    const totalTrashCount = deletedWorks.length + deletedMemories.length + deletedLists.length;
    return { deletedWorks, deletedMemories, deletedLists, totalTrashCount };
  }

  const initial = computeState();

  return {
    deletedWorks: initial.deletedWorks,
    deletedMemories: initial.deletedMemories,
    deletedLists: initial.deletedLists,
    totalTrashCount: initial.totalTrashCount,
    activeFilter: "all",
    isLoading: false,

    setActiveFilter: (activeFilter) => set({ activeFilter }),

    refreshTrash: () => {
      set(computeState());
    },

    restoreWork: (workId) => {
      clientRepository.restoreWork(workId);
      try {
        useLibraryStore.getState().refresh();
      } catch {
        // Safe fallback
      }
      set(computeState());
    },

    purgeWork: (workId) => {
      clientRepository.purgeWork(workId);
      set(computeState());
    },

    restoreMemory: (memoryId) => {
      clientRepository.restoreMemory(memoryId);
      set(computeState());
    },

    purgeMemory: (memoryId) => {
      clientRepository.purgeMemory(memoryId);
      set(computeState());
    },

    restoreList: (listId) => {
      useListsStore.getState().restoreList(listId);
      set(computeState());
    },

    purgeList: (listId) => {
      useListsStore.getState().purgeList(listId);
      set(computeState());
    },

    emptyAllTrash: () => {
      clientRepository.purgeAllTrash();
      const deletedLists = useListsStore.getState().getDeletedLists();
      for (const list of deletedLists) {
        useListsStore.getState().purgeList(list.id);
      }
      try {
        useLibraryStore.getState().refresh();
      } catch {
        // Safe fallback
      }
      set(computeState());
    },

    autoPurgeExpired: (retentionDays = 30) => {
      clientRepository.purgeExpiredTrash(retentionDays);
      const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      const deletedLists = useListsStore.getState().getDeletedLists();
      for (const list of deletedLists) {
        if (list.deletedAt && new Date(list.deletedAt).getTime() < cutoffMs) {
          useListsStore.getState().purgeList(list.id);
        }
      }
      set(computeState());
    },
  };
});
