import { create } from "zustand";
import { normalizeUrl } from "@chronicles-vault/domain";
import { sanitizeRadarCaptureUrl, type RadarImportBatch } from "../radar-import";

export type CaptureState = "pending" | "matched" | "created" | "merged" | "discarded" | "temporary";
export type BrowserSource = "chromium" | "firefox" | "edge" | "safari" | "unknown";

export interface RadarCaptureItem {
  id: string;
  url: string;
  normalizedUrl?: string;
  title: string;
  faviconUrl?: string | null;
  browserSource: BrowserSource;
  windowId?: number;
  tabId?: number;
  capturedAt: string;
  state: CaptureState;
  matchedWorkId?: string;
  matchedWorkTitle?: string;
  matchConfidence?: number;
  readerMetadata?: {
    metaDescription?: string;
    author?: string;
    canonicalUrl?: string;
    estimatedChapter?: number;
    estimatedVolume?: number;
    totalChapters?: number;
    scrollPercentage?: number;
    domWordCount?: number;
    detectedFormat?: "manga" | "webtoon" | "novel" | "article";
  };
  batchId?: string;
  batchLabel?: string;
}

export type RadarSortBy = "capturedAt" | "matchConfidence" | "title";
export type RadarSortOrder = "asc" | "desc";

export interface RadarFilters {
  state: CaptureState | "all";
  browserSource: BrowserSource | "all";
  sortBy: RadarSortBy;
  sortOrder: RadarSortOrder;
  groupByWork: boolean;
}

export interface RadarState extends RadarFilters {
  items: RadarCaptureItem[];
  pendingCount: number;
  storageError: string | null;
  refresh: () => void;
  setState: (state: CaptureState | "all") => void;
  setBrowserSource: (source: BrowserSource | "all") => void;
  setSortBy: (sortBy: RadarSortBy) => void;
  setSortOrder: (order: RadarSortOrder) => void;
  setGroupByWork: (group: boolean) => void;
  resetFilters: () => void;
  importBatch: (batch: RadarImportBatch) => { imported: number; duplicates: number };
  matchToWork: (itemId: string, workId: string, workTitle: string) => void;
  createNewWork: (itemId: string, workId: string, workTitle: string) => void;
  keepTemporary: (itemId: string) => void;
  discardItem: (itemId: string) => void;
  bulkDiscard: (itemIds: string[]) => void;
  bulkMatchToWork: (itemIds: string[], workId: string, workTitle: string) => void;
}

const STORAGE_KEY = "cv:radar-captures:v1";

const initialFilters: RadarFilters = {
  state: "all",
  browserSource: "all",
  sortBy: "capturedAt",
  sortOrder: "desc",
  groupByWork: true,
};

function isCaptureState(value: unknown): value is CaptureState {
  return (
    value === "pending" ||
    value === "matched" ||
    value === "created" ||
    value === "merged" ||
    value === "discarded" ||
    value === "temporary"
  );
}

function isBrowserSource(value: unknown): value is BrowserSource {
  return (
    value === "chromium" ||
    value === "firefox" ||
    value === "edge" ||
    value === "safari" ||
    value === "unknown"
  );
}

function isStoredItem(value: unknown): value is RadarCaptureItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  if (typeof item["url"] !== "string") return false;
  try {
    if (sanitizeRadarCaptureUrl(item["url"]).url !== item["url"]) return false;
  } catch {
    return false;
  }
  return (
    typeof item["id"] === "string" &&
    typeof item["title"] === "string" &&
    typeof item["capturedAt"] === "string" &&
    isCaptureState(item["state"]) &&
    isBrowserSource(item["browserSource"])
  );
}

const DEFAULT_RADAR_SEEDS: RadarCaptureItem[] = [
  {
    id: "radar-seed-1",
    url: "https://asuracomic.net/series/omniscient-readers-viewpoint-chapter-220",
    normalizedUrl: "https://asuracomic.net/series/omniscient-readers-viewpoint-chapter-220",
    title: "Omniscient Reader's Viewpoint - Chapter 220 - Asura Scans",
    browserSource: "chromium",
    capturedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    state: "pending",
    readerMetadata: {
      estimatedChapter: 220,
      detectedFormat: "manga",
      author: "Sing Shong",
    },
    batchLabel: "Active Reading Tabs",
  },
  {
    id: "radar-seed-2",
    url: "https://mangadex.org/chapter/frieren-chapter-131",
    normalizedUrl: "https://mangadex.org/chapter/frieren-chapter-131",
    title: "Frieren: Beyond Journey's End - Chapter 131 - MangaDex",
    browserSource: "chromium",
    capturedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    state: "pending",
    readerMetadata: {
      estimatedChapter: 131,
      detectedFormat: "manga",
      author: "Kanehito Yamada",
    },
    batchLabel: "Active Reading Tabs",
  },
  {
    id: "radar-seed-3",
    url: "https://mangadex.org/chapter/delicious-in-dungeon-chapter-97",
    normalizedUrl: "https://mangadex.org/chapter/delicious-in-dungeon-chapter-97",
    title: "Dungeon Meshi - Chapter 97 [END] - MangaDex",
    browserSource: "firefox",
    capturedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    state: "matched",
    matchedWorkId: "work-dungeon-meshi",
    matchedWorkTitle: "Delicious in Dungeon",
    matchConfidence: 0.98,
    readerMetadata: {
      estimatedChapter: 97,
      detectedFormat: "manga",
      author: "Ryoko Kui",
    },
    batchLabel: "Completed Manga Batch",
  },
  {
    id: "radar-seed-4",
    url: "https://tapas.io/episode/the-beginning-after-the-end-185",
    normalizedUrl: "https://tapas.io/episode/the-beginning-after-the-end-185",
    title: "The Beginning After The End - Episode 185 - Tapas",
    browserSource: "chromium",
    capturedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    state: "pending",
    readerMetadata: {
      estimatedChapter: 185,
      detectedFormat: "webtoon",
      author: "TurtleMe",
    },
    batchLabel: "Weekend Reading",
  },
  {
    id: "radar-seed-5",
    url: "https://webnovel.com/book/lord-of-mysteries-volume-2-chapter-214",
    normalizedUrl: "https://webnovel.com/book/lord-of-mysteries-volume-2-chapter-214",
    title: "Lord of the Mysteries - Vol 2 Chapter 214 - Webnovel",
    browserSource: "edge",
    capturedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    state: "pending",
    readerMetadata: {
      estimatedVolume: 2,
      estimatedChapter: 214,
      detectedFormat: "novel",
      author: "Cuttlefish That Loves Diving",
    },
    batchLabel: "Novels Staging",
  },
];

function loadItems(): { items: RadarCaptureItem[]; error: string | null } {
  if (typeof localStorage === "undefined") return { items: [], error: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      persistItems(DEFAULT_RADAR_SEEDS);
      return { items: DEFAULT_RADAR_SEEDS, error: null };
    }
    const decoded: unknown = JSON.parse(raw);
    if (!Array.isArray(decoded) || !decoded.every(isStoredItem)) {
      throw new Error("Saved Radar captures have an invalid format.");
    }
    return { items: decoded, error: null };
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : "Unable to read saved Radar captures.",
    };
  }
}

function persistItems(items: RadarCaptureItem[]): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Unable to save Radar captures.";
  }
}

function withUpdatedItems(
  items: RadarCaptureItem[],
): Pick<RadarState, "items" | "pendingCount" | "storageError"> {
  return {
    items,
    pendingCount: items.filter((item) => item.state === "pending").length,
    storageError: persistItems(items),
  };
}

const saved = loadItems();

export const useRadarStore = create<RadarState>((set) => ({
  ...initialFilters,
  items: saved.items,
  pendingCount: saved.items.filter((item) => item.state === "pending").length,
  storageError: saved.error,
  refresh: () => {
    const current = loadItems();
    set({
      ...current,
      pendingCount: current.items.filter((item) => item.state === "pending").length,
    });
  },
  setState: (state) => set({ state }),
  setBrowserSource: (browserSource) => set({ browserSource }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setGroupByWork: (groupByWork) => set({ groupByWork }),
  resetFilters: () => set(initialFilters),
  importBatch: (batch) => {
    let imported = 0;
    let duplicates = 0;
    set((state) => {
      const normalizedExisting = new Set(
        state.items.map((item) => item.normalizedUrl ?? normalizeUrl(item.url).normalizedUrl),
      );
      const ids = new Set(state.items.map((item) => item.id));
      const additions: RadarCaptureItem[] = [];
      for (const incoming of batch.items) {
        const incomingTime = Date.parse(incoming.capturedAt);
        const recentDuplicate =
          normalizedExisting.has(incoming.normalizedUrl) &&
          state.items.some((item) => {
            const existingUrl = item.normalizedUrl ?? normalizeUrl(item.url).normalizedUrl;
            return (
              existingUrl === incoming.normalizedUrl &&
              Math.abs(incomingTime - Date.parse(item.capturedAt)) <= 24 * 60 * 60 * 1000
            );
          });
        if (ids.has(incoming.id) || recentDuplicate) {
          duplicates++;
          continue;
        }
        additions.push({
          id: incoming.id,
          url: incoming.url,
          normalizedUrl: incoming.normalizedUrl,
          title: incoming.title,
          faviconUrl: incoming.faviconUrl,
          browserSource: incoming.browserSource,
          windowId: incoming.windowId,
          tabId: incoming.tabId,
          capturedAt: incoming.capturedAt,
          batchId: incoming.batchId,
          batchLabel: incoming.batchLabel,
          state: "pending",
        });
        ids.add(incoming.id);
        normalizedExisting.add(incoming.normalizedUrl);
        imported++;
      }
      return withUpdatedItems([...additions, ...state.items]);
    });
    return { imported, duplicates };
  },
  matchToWork: (itemId, workId, workTitle) =>
    set((state) =>
      withUpdatedItems(
        state.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                state: "matched",
                matchedWorkId: workId,
                matchedWorkTitle: workTitle,
                matchConfidence: 1,
              }
            : item,
        ),
      ),
    ),
  createNewWork: (itemId, workId, workTitle) =>
    set((state) =>
      withUpdatedItems(
        state.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                state: "created",
                matchedWorkId: workId,
                matchedWorkTitle: workTitle,
                matchConfidence: 1,
              }
            : item,
        ),
      ),
    ),
  keepTemporary: (itemId) =>
    set((state) =>
      withUpdatedItems(
        state.items.map((item) => (item.id === itemId ? { ...item, state: "temporary" } : item)),
      ),
    ),
  discardItem: (itemId) =>
    set((state) =>
      withUpdatedItems(
        state.items.map((item) => (item.id === itemId ? { ...item, state: "discarded" } : item)),
      ),
    ),
  bulkDiscard: (itemIds) => {
    const ids = new Set(itemIds);
    set((state) =>
      withUpdatedItems(
        state.items.map((item) => (ids.has(item.id) ? { ...item, state: "discarded" } : item)),
      ),
    );
  },
  bulkMatchToWork: (itemIds, workId, workTitle) => {
    const ids = new Set(itemIds);
    set((state) =>
      withUpdatedItems(
        state.items.map((item) =>
          ids.has(item.id)
            ? {
                ...item,
                state: "matched",
                matchedWorkId: workId,
                matchedWorkTitle: workTitle,
                matchConfidence: 1,
              }
            : item,
        ),
      ),
    );
  },
}));

export function selectFilteredRadarItems(state: RadarState): RadarCaptureItem[] {
  const { items, state: filterState, browserSource, sortBy, sortOrder } = state;

  return items
    .filter((item) => {
      if (filterState !== "all" && item.state !== filterState) return false;
      if (browserSource !== "all" && item.browserSource !== browserSource) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "capturedAt":
          comparison = new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
          break;
        case "matchConfidence":
          comparison = (b.matchConfidence ?? 0) - (a.matchConfidence ?? 0);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });
}

export function selectGroupedByWork(
  items: RadarCaptureItem[],
): Map<string | null, RadarCaptureItem[]> {
  const groups = new Map<string | null, RadarCaptureItem[]>();
  for (const item of items) {
    const key = item.matchedWorkId ?? null;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}
