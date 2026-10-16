import { create } from 'zustand';
import { WorkId } from '@chronicles-vault/shared';
import { DuplicateCandidate, Work } from '@chronicles-vault/domain';
import { clientRepository, MergeOptions } from '../client-repository';
import { useLibraryStore } from './use-library-store';
import { useReturnDeskStore } from './use-return-desk-store';
import { useWorkDetailStore } from './use-work-detail-store';

export interface MergeWizardState {
  isOpen: boolean;
  targetWorkId: WorkId | null;
  secondaryWorkId: WorkId | null;
  candidates: DuplicateCandidate[];
  isSearching: boolean;
  isMerging: boolean;

  // Actions
  openWizard: (targetWorkId: WorkId) => void;
  closeWizard: () => void;
  setSecondaryWorkId: (workId: WorkId | null) => void;
  findDuplicates: (workId: WorkId) => DuplicateCandidate[];
  executeMerge: (
    targetId: WorkId,
    secondaryId: WorkId,
    options?: MergeOptions,
  ) => Work;
}

export const useMergeWizardStore = create<MergeWizardState>((set, get) => ({
  isOpen: false,
  targetWorkId: null,
  secondaryWorkId: null,
  candidates: [],
  isSearching: false,
  isMerging: false,

  openWizard: (targetWorkId: WorkId) => {
    set({ isOpen: true, targetWorkId, secondaryWorkId: null, isSearching: true });
    const candidates = clientRepository.findDuplicates(targetWorkId);
    set({ candidates, isSearching: false });
  },

  closeWizard: () => {
    set({ isOpen: false, targetWorkId: null, secondaryWorkId: null, candidates: [] });
  },

  setSecondaryWorkId: (workId: WorkId | null) => {
    set({ secondaryWorkId: workId });
  },

  findDuplicates: (workId: WorkId) => {
    set({ isSearching: true });
    const candidates = clientRepository.findDuplicates(workId);
    set({ candidates, isSearching: false });
    return candidates;
  },

  executeMerge: (targetId, secondaryId, options) => {
    set({ isMerging: true });
    try {
      const merged = clientRepository.executeMerge(targetId, secondaryId, options);
      useLibraryStore.getState().refresh();
      useReturnDeskStore.getState().refresh();
      if (useWorkDetailStore.getState().activeWorkId === targetId) {
        useWorkDetailStore.getState().loadWork(targetId);
      }
      set({ isMerging: false, isOpen: false, secondaryWorkId: null });
      return merged;
    } catch (err) {
      set({ isMerging: false });
      throw err;
    }
  },
}));
