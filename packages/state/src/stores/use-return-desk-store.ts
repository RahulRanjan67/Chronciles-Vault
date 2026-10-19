import { create } from 'zustand';
import { WorkId } from '@grimoire/shared';
import {
  ReturnSignal,
  ReturnSignalType,
  computeReturnSignals,
  ReadingRelationship,
  UpdateEntry,
} from '@grimoire/domain';
import {
  clientRepository,
  HydratedWorkItem,
} from '../client-repository';

export interface ReturnDeskState {
  allSignals: ReturnSignal[];
  heroSignal: ReturnSignal | null;
  heroWork: HydratedWorkItem | null;
  continueRail: Array<{ signal: ReturnSignal; item: HydratedWorkItem }>;
  catchUpList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }>;
  bingeReadyList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }>;
  stalledList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }>;
  waitingList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }>;
  rediscoverList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }>;

  // Refresher drawer state
  selectedWorkId: WorkId | null;
  selectedWorkItem: HydratedWorkItem | null;
  isRefresherOpen: boolean;

  // Actions
  refresh: () => void;
  openRefresher: (workId: WorkId) => void;
  closeRefresher: () => void;
}

function calculateDeskState() {
  const items = clientRepository.getItems();
  const itemMap = new Map<WorkId, HydratedWorkItem>();
  const relationships: ReadingRelationship[] = [];
  const updatesMap = new Map<WorkId, readonly UpdateEntry[]>();

  for (const item of items) {
    if (item.work.deletedAt) continue;
    itemMap.set(item.work.id, item);
    if (item.relationship) {
      relationships.push(item.relationship);
    }
    if (item.updates.length > 0) {
      updatesMap.set(item.work.id, item.updates);
    }
  }

  const signals = computeReturnSignals(relationships, updatesMap, new Date());

  const continueRail: Array<{ signal: ReturnSignal; item: HydratedWorkItem }> = [];
  const catchUpList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }> = [];
  const bingeReadyList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }> = [];
  const stalledList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }> = [];
  const waitingList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }> = [];
  const rediscoverList: Array<{ signal: ReturnSignal; item: HydratedWorkItem }> = [];

  for (const signal of signals) {
    const item = itemMap.get(signal.workId);
    if (!item) continue;

    switch (signal.type) {
      case ReturnSignalType.ContinueNow:
        continueRail.push({ signal, item });
        break;
      case ReturnSignalType.CatchUp:
        catchUpList.push({ signal, item });
        break;
      case ReturnSignalType.BingeReady:
        bingeReadyList.push({ signal, item });
        break;
      case ReturnSignalType.Stalled:
        stalledList.push({ signal, item });
        break;
      case ReturnSignalType.Waiting:
        waitingList.push({ signal, item });
        break;
      case ReturnSignalType.Rediscover:
        rediscoverList.push({ signal, item });
        break;
    }
  }

  // Choose the hero signal: top priority item overall (ContinueNow or CatchUp)
  const heroSignal: ReturnSignal | null = signals[0] ?? null;
  const heroWork = heroSignal ? itemMap.get(heroSignal.workId) ?? null : null;

  return {
    allSignals: signals,
    heroSignal,
    heroWork,
    continueRail,
    catchUpList,
    bingeReadyList,
    stalledList,
    waitingList,
    rediscoverList,
  };
}

export const useReturnDeskStore = create<ReturnDeskState>((set, get) => ({
  ...calculateDeskState(),
  selectedWorkId: null,
  selectedWorkItem: null,
  isRefresherOpen: false,

  refresh: () => {
    const desk = calculateDeskState();
    const currentSelectedId = get().selectedWorkId;
    const selectedWorkItem = currentSelectedId ? clientRepository.getItem(currentSelectedId) ?? null : null;
    set({
      ...desk,
      selectedWorkItem,
    });
  },

  openRefresher: (workId: WorkId) => {
    const item = clientRepository.getItem(workId) ?? null;
    set({
      selectedWorkId: workId,
      selectedWorkItem: item,
      isRefresherOpen: true,
    });
  },

  closeRefresher: () => {
    set({
      isRefresherOpen: false,
      selectedWorkId: null,
      selectedWorkItem: null,
    });
  },
}));
