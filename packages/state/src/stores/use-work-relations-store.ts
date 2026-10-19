import { create } from 'zustand';
import { WorkId, WorkRelationId } from '@grimoire/shared';
import { WorkRelationType, WorkRelation } from '@grimoire/domain';
import { clientRepository } from '../client-repository';

export interface WorkRelationsState {
  relations: WorkRelation[];
  isLoading: boolean;

  // Actions
  loadRelations: (workId: WorkId) => void;
  linkWorkRelation: (
    sourceId: WorkId,
    targetId: WorkId,
    relationType: WorkRelationType,
    notes?: string,
  ) => WorkRelation;
  removeWorkRelation: (relationId: WorkRelationId) => void;
}

export const useWorkRelationsStore = create<WorkRelationsState>((set, get) => ({
  relations: [],
  isLoading: false,

  loadRelations: (workId: WorkId) => {
    set({ isLoading: true });
    const relations = clientRepository.getWorkRelations(workId);
    set({ relations, isLoading: false });
  },

  linkWorkRelation: (sourceId, targetId, relationType, notes) => {
    const relation = clientRepository.linkWorkRelation(
      sourceId,
      targetId,
      relationType,
      notes,
    );
    const current = get().relations;
    if (!current.some((r) => r.id === relation.id)) {
      set({ relations: [...current, relation] });
    }
    return relation;
  },

  removeWorkRelation: (relationId) => {
    clientRepository.removeWorkRelation(relationId);
    set((state) => ({
      relations: state.relations.filter((r) => r.id !== relationId),
    }));
  },
}));
