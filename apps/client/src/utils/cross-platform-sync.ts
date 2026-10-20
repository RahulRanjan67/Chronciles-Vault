/**
 * Grimoire — Cross-Platform Synchronization Client
 * Connects `web/`, `pc app/`, and `mobile app/` via the shared CRDT/HLC Sync Hub
 * running in `venv/sync_hub_server.py` (or embedded inside `pc app/pc_workstation_app.py`)
 * on `http://127.0.0.1:47920`.
 */

import { clientRepository, useLibraryStore } from "@grimoire/state";

export interface SyncStatusResponse {
  ok: boolean;
  hlc: string;
  lastSyncedAt: string;
  worksCount: number;
  roomsCount: number;
  connectedDevices: Record<
    string,
    { name: string; platform: string; lastSeenAt: string }
  >;
  lanUrl: string;
}

export interface SyncMergeResult {
  ok: boolean;
  stats: {
    added: number;
    merged: number;
    total: number;
  };
  hlc?: string;
}

export interface SyncFilterOptions {
  workScope?: "all" | "whitelist" | "blacklist";
  selectedWorkIds?: string[];
  excludedWorkIds?: string[];
  categoryIds?: string[];
  optedOutMemoryIds?: string[];
  includeVault?: boolean; // Strictly false if vault is locked!
}

const DEFAULT_SYNC_HUB_URL = "http://127.0.0.1:47920";
const VAULT_STORAGE_KEY = "cv:local_vault:v1";

export function getSyncHubUrl(): string {
  if (typeof window !== "undefined") {
    return (
      window.localStorage.getItem("cv:sync_hub_url:v1") || DEFAULT_SYNC_HUB_URL
    );
  }
  return DEFAULT_SYNC_HUB_URL;
}

export async function probeSyncHubStatus(): Promise<SyncStatusResponse | null> {
  try {
    const res = await fetch(`${getSyncHubUrl()}/api/sync/status`, {
      method: "GET",
    });
    if (!res.ok) return null;
    return (await res.json()) as SyncStatusResponse;
  } catch {
    return null;
  }
}

let isSyncInProgress = false;

export async function syncWithCrossPlatformHub(
  platform: "web" | "pc-app" | "mobile-app" = "web",
  deviceName = "Browser Web Sanctum",
  options?: SyncFilterOptions,
): Promise<SyncMergeResult | null> {
  if (isSyncInProgress) {
    console.warn("A synchronization operation is already in progress. Skipping concurrent invocation.");
    return null;
  }
  isSyncInProgress = true;
  try {
    let currentItems = clientRepository.getItems();

    // ─── FILTER WORKS & MEMORIES ACCORDING TO USER SYNC PREFERENCES ───
    if (options) {
      // 1. Vault gating: if vault is not open/unlocked, strictly omit vault items
      if (!options.includeVault) {
        currentItems = currentItems.filter((i) => i.work.privacyState !== "vault");
      }

      // 2. Work scope: All vs Whitelist vs Blacklist
      if (options.workScope === "whitelist" && Array.isArray(options.selectedWorkIds)) {
        const set = new Set(options.selectedWorkIds);
        currentItems = currentItems.filter((i) => set.has(i.work.id));
      } else if (options.workScope === "blacklist" && Array.isArray(options.excludedWorkIds)) {
        const set = new Set(options.excludedWorkIds);
        currentItems = currentItems.filter((i) => !set.has(i.work.id));
      }

      // 3. Memory opt-outs: Filter out memories the user chose to keep local
      if (Array.isArray(options.optedOutMemoryIds) && options.optedOutMemoryIds.length > 0) {
        const optOutSet = new Set(options.optedOutMemoryIds);
        currentItems = currentItems.map((item) => ({
          ...item,
          memories: item.memories.filter((m) => !optOutSet.has(m.id)),
        }));
      }

      // 4. Memory vault gating: if vault is locked, remove vault memories
      if (!options.includeVault) {
        currentItems = currentItems.map((item) => ({
          ...item,
          memories: item.memories.filter((m) => m.privacyState !== "vault"),
        }));
      }
    }

    const res = await fetch(`${getSyncHubUrl()}/api/sync/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        deviceName,
        items: currentItems,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      ok: boolean;
      stats: { added: number; merged: number; total: number };
      state: { items: unknown[]; hlc: string };
    };

    if (data.ok && Array.isArray(data.state?.items) && typeof window !== "undefined") {
      // Import converged items into client repository and refresh Zustand store
      clientRepository.importData({
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        works: data.state.items,
      });
      useLibraryStore.getState().refresh();
    }

    return {
      ok: true,
      stats: data.stats,
      hlc: data.state?.hlc,
    };
  } catch {
    return null;
  } finally {
    isSyncInProgress = false;
  }
}
