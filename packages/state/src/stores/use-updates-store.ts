import { create } from "zustand";
import type { HydratedWorkItem } from "../client-repository";

const STORAGE_KEY = "cv:updates_state:v1";

interface PersistedUpdatesState {
  seenIds: string[];
  dismissedIds: string[];
  snoozedUntil: Record<string, string>;
}

function loadPersisted(): PersistedUpdatesState {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedUpdatesState>;
        return {
          seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds : [],
          dismissedIds: Array.isArray(parsed.dismissedIds) ? parsed.dismissedIds : [],
          snoozedUntil:
            parsed.snoozedUntil && typeof parsed.snoozedUntil === "object"
              ? parsed.snoozedUntil
              : {},
        };
      }
    } catch {
      // Fallback
    }
  }
  return { seenIds: [], dismissedIds: [], snoozedUntil: {} };
}

function savePersisted(state: PersistedUpdatesState): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }
}

export function buildUpdateFeedId(
  workId: string,
  detectedAt: string,
  label: string,
): string {
  return `${workId}:${detectedAt}:${label}`;
}

export function collectLibraryUpdateIds(
  items: readonly HydratedWorkItem[],
  nowMs: number = Date.now(),
): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.work.deletedAt || item.work.privacyState === "vault") continue;
    for (const update of item.updates) {
      const detectedMs = Date.parse(update.detectedAt);
      if (Number.isFinite(detectedMs) && detectedMs <= nowMs) {
        ids.push(buildUpdateFeedId(item.work.id, update.detectedAt, update.label));
      }
    }
  }
  return ids;
}

export interface UpdatesState {
  seenIds: string[];
  dismissedIds: string[];
  snoozedUntil: Record<string, string>;
  markSeen: (updateId: string) => void;
  markAllSeen: (updateIds: readonly string[]) => void;
  dismissUpdate: (updateId: string) => void;
  restoreDismissed: (updateId: string) => void;
  snoozeUpdate: (updateId: string, durationMs?: number, nowMs?: number) => void;
  unsnoozeUpdate: (updateId: string) => void;
  isUpdateActive: (updateId: string, nowMs?: number) => boolean;
  isUpdateSeen: (updateId: string) => boolean;
  getUnreadCount: (items: readonly HydratedWorkItem[], nowMs?: number) => number;
}

const DEFAULT_SNOOZE_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useUpdatesStore = create<UpdatesState>((set, get) => {
  const initial = loadPersisted();

  return {
    seenIds: initial.seenIds,
    dismissedIds: initial.dismissedIds,
    snoozedUntil: initial.snoozedUntil,

    markSeen: (updateId) => {
      const current = get();
      if (current.seenIds.includes(updateId)) return;
      const seenIds = [...current.seenIds, updateId];
      savePersisted({
        seenIds,
        dismissedIds: current.dismissedIds,
        snoozedUntil: current.snoozedUntil,
      });
      set({ seenIds });
    },

    markAllSeen: (updateIds) => {
      const current = get();
      const merged = Array.from(new Set([...current.seenIds, ...updateIds]));
      savePersisted({
        seenIds: merged,
        dismissedIds: current.dismissedIds,
        snoozedUntil: current.snoozedUntil,
      });
      set({ seenIds: merged });
    },

    dismissUpdate: (updateId) => {
      const current = get();
      const dismissedIds = Array.from(new Set([...current.dismissedIds, updateId]));
      const seenIds = Array.from(new Set([...current.seenIds, updateId]));
      savePersisted({
        seenIds,
        dismissedIds,
        snoozedUntil: current.snoozedUntil,
      });
      set({ dismissedIds, seenIds });
    },

    restoreDismissed: (updateId) => {
      const current = get();
      const dismissedIds = current.dismissedIds.filter((id) => id !== updateId);
      savePersisted({
        seenIds: current.seenIds,
        dismissedIds,
        snoozedUntil: current.snoozedUntil,
      });
      set({ dismissedIds });
    },

    snoozeUpdate: (updateId, durationMs = DEFAULT_SNOOZE_MS, nowMs = Date.now()) => {
      const current = get();
      const untilIso = new Date(nowMs + durationMs).toISOString();
      const snoozedUntil = { ...current.snoozedUntil, [updateId]: untilIso };
      const seenIds = Array.from(new Set([...current.seenIds, updateId]));
      savePersisted({
        seenIds,
        dismissedIds: current.dismissedIds,
        snoozedUntil,
      });
      set({ snoozedUntil, seenIds });
    },

    unsnoozeUpdate: (updateId) => {
      const current = get();
      const snoozedUntil = { ...current.snoozedUntil };
      delete snoozedUntil[updateId];
      savePersisted({
        seenIds: current.seenIds,
        dismissedIds: current.dismissedIds,
        snoozedUntil,
      });
      set({ snoozedUntil });
    },

    isUpdateActive: (updateId, nowMs = Date.now()) => {
      const current = get();
      if (current.dismissedIds.includes(updateId)) return false;
      const snoozeIso = current.snoozedUntil[updateId];
      if (snoozeIso) {
        const untilMs = Date.parse(snoozeIso);
        if (Number.isFinite(untilMs) && untilMs > nowMs) {
          return false;
        }
      }
      return true;
    },

    isUpdateSeen: (updateId) => {
      return get().seenIds.includes(updateId);
    },

    getUnreadCount: (items, nowMs = Date.now()) => {
      const current = get();
      const allIds = collectLibraryUpdateIds(items, nowMs);
      let unread = 0;
      for (const id of allIds) {
        if (!current.isUpdateActive(id, nowMs)) continue;
        if (!current.seenIds.includes(id)) {
          unread++;
        }
      }
      return unread;
    },
  };
});
