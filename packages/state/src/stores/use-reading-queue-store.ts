import { create } from "zustand";
import { PersonalState } from "@chronicles-vault/domain";
import { clientRepository, type HydratedWorkItem } from "../client-repository";

export interface ReadingQueueItem {
  readonly id: string;
  readonly workId: string;
  readonly position: number;
  readonly pinned: boolean;
  readonly targetDate: string | null;
  readonly estimatedMinutes: number | null;
  readonly addedAt: string;
}

export interface ReadingQueueState {
  items: ReadingQueueItem[];
  isPaused: boolean;
  addToQueue: (
    workId: string,
    options?: { pinned?: boolean; targetDate?: string | null; estimatedMinutes?: number | null },
  ) => void;
  removeFromQueue: (workId: string) => void;
  moveQueueItem: (workId: string, direction: "up" | "down") => void;
  togglePin: (workId: string) => void;
  togglePinQueueItem: (workId: string) => void;
  setTargetDate: (workId: string, targetDate: string | null) => void;
  setQueueTargetDate: (workId: string, targetDate: string | null) => void;
  setEstimatedMinutes: (workId: string, estimatedMinutes: number | null) => void;
  setQueueEstimatedMinutes: (workId: string, estimatedMinutes: number | null) => void;
  togglePaused: () => void;
  toggleQueuePaused: () => void;
  suggestNextWorks: (libraryItems?: readonly HydratedWorkItem[]) => HydratedWorkItem[];
  getSuggestedWorks: (libraryItems?: readonly HydratedWorkItem[]) => HydratedWorkItem[];
}

const STORAGE_KEY = "cv:reading_queue:v1";

interface PersistedQueue {
  items: ReadingQueueItem[];
  isPaused: boolean;
}

function loadInitialQueue(): PersistedQueue {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedQueue>;
        if (Array.isArray(parsed.items)) {
          return {
            items: parsed.items,
            isPaused: Boolean(parsed.isPaused),
          };
        }
      }
    } catch {
      // Fallback
    }
  }
  const now = new Date().toISOString();
  const seedItems = clientRepository
    .getItems()
    .filter(
      (item) =>
        item.relationship?.personalState === PersonalState.Planned ||
        item.relationship?.personalState === PersonalState.Waiting,
    )
    .slice(0, 3)
    .map((item, idx) => ({
      id: `queue-seed-${idx + 1}`,
      workId: item.work.id,
      position: idx,
      pinned: idx === 0,
      targetDate: null,
      estimatedMinutes: 45 + idx * 30,
      addedAt: now,
    }));

  return { items: seedItems, isPaused: false };
}

function persistQueue(state: PersistedQueue): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }
}

function normalizePositions(items: ReadingQueueItem[]): ReadingQueueItem[] {
  const pinned = items.filter((i) => i.pinned).sort((a, b) => a.position - b.position);
  const unpinned = items.filter((i) => !i.pinned).sort((a, b) => a.position - b.position);
  return [...pinned, ...unpinned].map((item, index) => ({
    ...item,
    position: index,
  }));
}

export const useReadingQueueStore = create<ReadingQueueState>((set, get) => {
  const initial = loadInitialQueue();

  const togglePin = (workId: string) => {
    const current = get();
    const toggled = current.items.map((item) =>
      item.workId === workId ? { ...item, pinned: !item.pinned } : item,
    );
    const items = normalizePositions(toggled);
    persistQueue({ items, isPaused: current.isPaused });
    set({ items });
  };

  const setTargetDate = (workId: string, targetDate: string | null) => {
    const current = get();
    const items = current.items.map((item) =>
      item.workId === workId ? { ...item, targetDate } : item,
    );
    persistQueue({ items, isPaused: current.isPaused });
    set({ items });
  };

  const setEstimatedMinutes = (workId: string, estimatedMinutes: number | null) => {
    const current = get();
    const items = current.items.map((item) =>
      item.workId === workId ? { ...item, estimatedMinutes } : item,
    );
    persistQueue({ items, isPaused: current.isPaused });
    set({ items });
  };

  const togglePaused = () => {
    const current = get();
    const isPaused = !current.isPaused;
    persistQueue({ items: current.items, isPaused });
    set({ isPaused });
  };

  const suggestNextWorks = (libraryItems?: readonly HydratedWorkItem[]) => {
    const source = libraryItems ?? clientRepository.getItems();
    const queuedIds = new Set(get().items.map((i) => i.workId));
    const tierWeight = (tier?: string) => {
      if (tier === "priority_watch") return 3;
      if (tier === "favorite") return 2;
      if (tier === "highlight") return 1;
      return 0;
    };
    return source
      .filter(
        (item) =>
          !item.work.deletedAt &&
          item.work.privacyState !== "vault" &&
          !queuedIds.has(item.work.id) &&
          (item.relationship?.personalState === PersonalState.Planned ||
            item.relationship?.personalState === PersonalState.Paused ||
            item.relationship?.personalState === PersonalState.Stalled ||
            item.relationship?.personalState === PersonalState.Waiting ||
            item.relationship?.personalState === PersonalState.Reading),
      )
      .sort(
        (a, b) =>
          tierWeight(b.relationship?.shelfTier) - tierWeight(a.relationship?.shelfTier),
      )
      .slice(0, 6);
  };

  return {
    items: normalizePositions(initial.items),
    isPaused: initial.isPaused,

    addToQueue: (workId, options) => {
      const current = get();
      if (current.items.some((i) => i.workId === workId)) return;
      const newItem: ReadingQueueItem = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        workId,
        position: current.items.length,
        pinned: Boolean(options?.pinned),
        targetDate: options?.targetDate ?? null,
        estimatedMinutes: options?.estimatedMinutes ?? 60,
        addedAt: new Date().toISOString(),
      };
      const items = normalizePositions([...current.items, newItem]);
      persistQueue({ items, isPaused: current.isPaused });
      set({ items });
    },

    removeFromQueue: (workId) => {
      const current = get();
      const items = normalizePositions(current.items.filter((i) => i.workId !== workId));
      persistQueue({ items, isPaused: current.isPaused });
      set({ items });
    },

    moveQueueItem: (workId, direction) => {
      const current = get();
      const ordered = [...current.items].sort((a, b) => a.position - b.position);
      const index = ordered.findIndex((i) => i.workId === workId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
      const moving = ordered[index];
      const other = ordered[targetIndex];
      if (!moving || !other) return;
      ordered[index] = other;
      ordered[targetIndex] = moving;
      const items = ordered.map((item, position) => ({ ...item, position }));
      persistQueue({ items, isPaused: current.isPaused });
      set({ items });
    },

    togglePin,
    togglePinQueueItem: togglePin,
    setTargetDate,
    setQueueTargetDate: setTargetDate,
    setEstimatedMinutes,
    setQueueEstimatedMinutes: setEstimatedMinutes,
    togglePaused,
    toggleQueuePaused: togglePaused,
    suggestNextWorks,
    getSuggestedWorks: suggestNextWorks,
  };
});
