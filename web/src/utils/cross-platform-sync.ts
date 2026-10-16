/**
 * Chronicles Vault — Cross-Platform Synchronization Client
 * Connects `web/`, `pc app/`, and `mobile app/` via the shared CRDT/HLC Sync Hub
 * running in `venv/sync_hub_server.py` (or embedded inside `pc app/pc_workstation_app.py`)
 * on `http://127.0.0.1:47920`.
 */

import { clientRepository, useLibraryStore } from "@chronicles-vault/state";

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

export async function syncWithCrossPlatformHub(
  platform: "web" | "pc-app" | "mobile-app" = "web",
  deviceName = "Browser Web Sanctum",
): Promise<SyncMergeResult | null> {
  try {
    const currentItems = clientRepository.getItems();
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
      // Merge converged items into local vault storage and refresh Zustand store
      const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : { version: 1 };
      parsed.items = data.state.items;
      window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(parsed));
      useLibraryStore.getState().refresh();
    }

    return {
      ok: true,
      stats: data.stats,
      hlc: data.state?.hlc,
    };
  } catch {
    return null;
  }
}
