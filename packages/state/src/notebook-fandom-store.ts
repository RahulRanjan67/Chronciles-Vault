import { create } from "zustand";
import {
  MemoryType,
  PersonalState,
  PrivacyState,
  SpoilerLevel,
  type Memory,
} from "@grimoire/domain";
import type { WorkId } from "@grimoire/shared";
import { clientRepository, type HydratedWorkItem } from "./client-repository";

// =============================================================================
// 1. Activatable Per-Work Notebook (BACKLOG.md §4.3)
// =============================================================================

export type NotebookEntryCategory =
  | "theory"
  | "clue"
  | "character"
  | "question"
  | "scratch";

export interface NotebookEntry {
  id: string;
  workId: WorkId;
  category: NotebookEntryCategory;
  title: string;
  body: string;
  chapterHint?: string | null;
  pinned: boolean;
  promotedMemoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotebookState {
  activatedWorkIds: string[];
  entries: NotebookEntry[];
  isActivated: (workId: string) => boolean;
  activateNotebook: (workId: WorkId) => void;
  deactivateNotebook: (workId: WorkId) => void;
  getEntriesForWork: (workId: string) => NotebookEntry[];
  addEntry: (input: {
    workId: WorkId;
    category: NotebookEntryCategory;
    title: string;
    body: string;
    chapterHint?: string | null;
  }) => NotebookEntry;
  updateEntry: (
    entryId: string,
    patch: Partial<Pick<NotebookEntry, "category" | "title" | "body" | "chapterHint" | "pinned">>,
  ) => void;
  deleteEntry: (entryId: string) => void;
  togglePin: (entryId: string) => void;
  promoteToMemory: (entryId: string) => Memory | null;
}

const NOTEBOOK_STORAGE_KEY = "cv_work_notebooks_v1";

interface PersistedNotebookData {
  activatedWorkIds: string[];
  entries: NotebookEntry[];
}

function createInitialNotebookSeed(): PersistedNotebookData {
  const now = new Date().toISOString();
  return {
    activatedWorkIds: ["work-orv", "work-lotm"],
    entries: [
      {
        id: "nb-orv-1",
        workId: "work-orv" as WorkId,
        category: "theory",
        title: "Secretive Plotter identity clues",
        body: "Notice how Secretive Plotter reacts to every regression turn of Yoo Joonghyuk and knows details even Ways of Survival only hinted at.",
        chapterHint: "Ch. 188",
        pinned: true,
        promotedMemoryId: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "nb-lotm-1",
        workId: "work-lotm" as WorkId,
        category: "clue",
        title: "Tarot Club Sequence Pathways tracker",
        body: "Fool (Seer), Justice (Spectator), Hanged Man (Sailor), Sun (Bard) — keep track of potion acting principles.",
        chapterHint: "Vol. 1",
        pinned: true,
        promotedMemoryId: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

function loadNotebookStorage(): PersistedNotebookData {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(NOTEBOOK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedNotebookData;
        if (parsed && Array.isArray(parsed.activatedWorkIds) && Array.isArray(parsed.entries)) {
          return parsed;
        }
      }
    } catch {
      // fall through
    }
  }
  return createInitialNotebookSeed();
}

function saveNotebookStorage(data: PersistedNotebookData): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota error
    }
  }
}

export const useNotebookStore = create<NotebookState>((set, get) => {
  const initial = loadNotebookStorage();
  return {
    activatedWorkIds: initial.activatedWorkIds,
    entries: initial.entries,

    isActivated: (workId: string) => get().activatedWorkIds.includes(workId),

    activateNotebook: (workId: WorkId) => {
      const current = get().activatedWorkIds;
      if (current.includes(workId)) return;
      const next = [...current, workId];
      set({ activatedWorkIds: next });
      saveNotebookStorage({ activatedWorkIds: next, entries: get().entries });
    },

    deactivateNotebook: (workId: WorkId) => {
      const next = get().activatedWorkIds.filter((id) => id !== workId);
      set({ activatedWorkIds: next });
      saveNotebookStorage({ activatedWorkIds: next, entries: get().entries });
    },

    getEntriesForWork: (workId: string) => {
      return get()
        .entries.filter((e) => e.workId === workId)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.updatedAt.localeCompare(a.updatedAt);
        });
    },

    addEntry: (input) => {
      const now = new Date().toISOString();
      const entry: NotebookEntry = {
        id: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        workId: input.workId,
        category: input.category,
        title: input.title.trim() || "Untitled scratch note",
        body: input.body.trim(),
        chapterHint: input.chapterHint?.trim() || null,
        pinned: false,
        promotedMemoryId: null,
        createdAt: now,
        updatedAt: now,
      };
      const activated = get().activatedWorkIds.includes(input.workId)
        ? get().activatedWorkIds
        : [...get().activatedWorkIds, input.workId];
      const nextEntries = [entry, ...get().entries];
      set({ activatedWorkIds: activated, entries: nextEntries });
      saveNotebookStorage({ activatedWorkIds: activated, entries: nextEntries });
      return entry;
    },

    updateEntry: (entryId, patch) => {
      const now = new Date().toISOString();
      const nextEntries = get().entries.map((e) =>
        e.id === entryId ? { ...e, ...patch, updatedAt: now } : e,
      );
      set({ entries: nextEntries });
      saveNotebookStorage({ activatedWorkIds: get().activatedWorkIds, entries: nextEntries });
    },

    deleteEntry: (entryId) => {
      const nextEntries = get().entries.filter((e) => e.id !== entryId);
      set({ entries: nextEntries });
      saveNotebookStorage({ activatedWorkIds: get().activatedWorkIds, entries: nextEntries });
    },

    togglePin: (entryId) => {
      const now = new Date().toISOString();
      const nextEntries = get().entries.map((e) =>
        e.id === entryId ? { ...e, pinned: !e.pinned, updatedAt: now } : e,
      );
      set({ entries: nextEntries });
      saveNotebookStorage({ activatedWorkIds: get().activatedWorkIds, entries: nextEntries });
    },

    promoteToMemory: (entryId) => {
      const entry = get().entries.find((e) => e.id === entryId);
      if (!entry) return null;
      const hydrated = clientRepository.getItem(entry.workId);
      if (!hydrated) return null;

      const preferredPath =
        hydrated.accessPaths.find((p) => p.isPreferred) ?? hydrated.accessPaths[0] ?? null;

      const memory = clientRepository.addMemory(entry.workId, {
        type: MemoryType.PersonalNote,
        title: entry.title,
        body: entry.body,
        privacyState: PrivacyState.Private,
        spoilerLevel: SpoilerLevel.Minor,
        showInGlobalGallery: false,
        accessPathId: preferredPath?.id ?? null,
        progressAnchor: hydrated.relationship?.currentAnchor ?? null,
        tags: ["notebook-graduated", entry.category],
        assets: [],
      });

      const now = new Date().toISOString();
      const nextEntries = get().entries.map((e) =>
        e.id === entryId ? { ...e, promotedMemoryId: memory.id, updatedAt: now } : e,
      );
      set({ entries: nextEntries });
      saveNotebookStorage({ activatedWorkIds: get().activatedWorkIds, entries: nextEntries });
      return memory;
    },
  };
});

// =============================================================================
// 2. First-Class Fandom Links (BACKLOG.md §4.5)
// =============================================================================

export type FandomLinkProvider = "fandom" | "wiki" | "subreddit" | "forum" | "custom";
export type FandomLinkProvenance = "manual" | "radar" | "provider" | "import";

export interface FandomLink {
  id: string;
  workId: WorkId;
  communityName: string;
  provider: FandomLinkProvider;
  canonicalTitle: string;
  url: string;
  language: string;
  isPreferred: boolean;
  provenance: FandomLinkProvenance;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FandomLinksState {
  links: FandomLink[];
  getLinksForWork: (workId: string) => FandomLink[];
  addFandomLink: (input: {
    workId: WorkId;
    communityName: string;
    provider?: FandomLinkProvider;
    canonicalTitle?: string;
    url: string;
    language?: string;
    isPreferred?: boolean;
    provenance?: FandomLinkProvenance;
  }) => FandomLink;
  removeFandomLink: (linkId: string) => void;
  setPreferredFandomLink: (workId: WorkId, linkId: string) => void;
}

const FANDOM_STORAGE_KEY = "cv_fandom_links_v1";

function createInitialFandomSeed(): FandomLink[] {
  const now = new Date().toISOString();
  return [
    {
      id: "fandom-orv-wiki",
      workId: "work-orv" as WorkId,
      communityName: "Omniscient Reader's Viewpoint Wiki",
      provider: "fandom",
      canonicalTitle: "Omniscient Reader's Viewpoint",
      url: "https://omniscient-readers-viewpoint.fandom.com/wiki/Omniscient_Reader%27s_Viewpoint_Wiki",
      language: "en",
      isPreferred: true,
      provenance: "manual",
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fandom-lotm-wiki",
      workId: "work-lotm" as WorkId,
      communityName: "Lord of the Mysteries Wiki",
      provider: "fandom",
      canonicalTitle: "Lord of the Mysteries",
      url: "https://lordofthemysteries.fandom.com/wiki/Lord_of_the_Mysteries_Wiki",
      language: "en",
      isPreferred: true,
      provenance: "manual",
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fandom-tog-wiki",
      workId: "work-tog" as WorkId,
      communityName: "Tower of God Wiki",
      provider: "fandom",
      canonicalTitle: "Tower of God",
      url: "https://towerofgod.fandom.com/wiki/Tower_of_God_Wiki",
      language: "en",
      isPreferred: true,
      provenance: "manual",
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function loadFandomStorage(): FandomLink[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(FANDOM_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FandomLink[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fall through
    }
  }
  return createInitialFandomSeed();
}

function saveFandomStorage(links: FandomLink[]): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(FANDOM_STORAGE_KEY, JSON.stringify(links));
    } catch {
      // ignore
    }
  }
}

export const useFandomLinksStore = create<FandomLinksState>((set, get) => ({
  links: loadFandomStorage(),

  getLinksForWork: (workId: string) => {
    return get()
      .links.filter((l) => l.workId === workId)
      .sort((a, b) => (a.isPreferred === b.isPreferred ? 0 : a.isPreferred ? -1 : 1));
  },

  addFandomLink: (input) => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(input.url.trim());
    } catch {
      throw new Error("Fandom link URL must be a valid HTTP(S) URL.");
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new Error("Fandom link URL must use HTTP or HTTPS.");
    }
    const existingForWork = get().links.filter((l) => l.workId === input.workId);
    const shouldBePreferred = input.isPreferred ?? existingForWork.length === 0;
    const now = new Date().toISOString();

    const inferredProvider: FandomLinkProvider =
      input.provider ??
      (parsedUrl.hostname.includes("fandom.com")
        ? "fandom"
        : parsedUrl.hostname.includes("reddit.com")
          ? "subreddit"
          : parsedUrl.hostname.includes("wiki")
            ? "wiki"
            : "custom");

    const newLink: FandomLink = {
      id: `fandom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      workId: input.workId,
      communityName: input.communityName.trim() || parsedUrl.hostname,
      provider: inferredProvider,
      canonicalTitle: input.canonicalTitle?.trim() || input.communityName.trim() || parsedUrl.hostname,
      url: parsedUrl.toString(),
      language: input.language?.trim() || "en",
      isPreferred: shouldBePreferred,
      provenance: input.provenance ?? "manual",
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const updated = get().links.map((l) =>
      shouldBePreferred && l.workId === input.workId ? { ...l, isPreferred: false } : l,
    );
    const next = [...updated, newLink];
    set({ links: next });
    saveFandomStorage(next);
    return newLink;
  },

  removeFandomLink: (linkId: string) => {
    const next = get().links.filter((l) => l.id !== linkId);
    set({ links: next });
    saveFandomStorage(next);
  },

  setPreferredFandomLink: (workId: WorkId, linkId: string) => {
    const now = new Date().toISOString();
    const next = get().links.map((l) =>
      l.workId === workId
        ? { ...l, isPreferred: l.id === linkId, updatedAt: now }
        : l,
    );
    set({ links: next });
    saveFandomStorage(next);
  },
}));

// =============================================================================
// 3. Local, Explainable Recommendation Engine (BACKLOG.md §3.2)
// =============================================================================

export type RecommendationCategory =
  | "connected_work"
  | "same_creator"
  | "genre_affinity"
  | "planned_gem"
  | "reread_highlight";

export interface LocalRecommendation {
  id: string;
  workId: WorkId;
  title: string;
  contentType: string;
  coverUrl: string | null;
  category: RecommendationCategory;
  reasonLabel: string;
  score: number;
}

export function generateLocalRecommendations(
  items: readonly HydratedWorkItem[],
  dismissedIds: ReadonlySet<string> = new Set(),
): LocalRecommendation[] {
  const activeItems = items.filter(
    (item) => !item.work.deletedAt && item.work.privacyState !== PrivacyState.Vault,
  );

  // Compute user's favorite genres from Reading / CaughtUp / Completed / high-rated works
  const genreWeights = new Map<string, number>();
  const favoriteCreators = new Map<string, string>(); // creatorName -> source workTitle

  for (const item of activeItems) {
    const state = item.relationship?.personalState;
    const isEngaged =
      state === PersonalState.Reading ||
      state === PersonalState.CaughtUp ||
      state === PersonalState.Completed ||
      item.relationship?.shelfTier === "favorite" ||
      item.relationship?.shelfTier === "highlight" ||
      item.relationship?.shelfTier === "priority_watch";

    if (isEngaged) {
      const weight = (item.work.rating ?? 8) >= 9 ? 3 : 2;
      for (const g of item.work.genres) {
        genreWeights.set(g, (genreWeights.get(g) ?? 0) + weight);
      }
      for (const c of item.work.creators ?? []) {
        if (!favoriteCreators.has(c.name.toLowerCase())) {
          favoriteCreators.set(c.name.toLowerCase(), item.work.title);
        }
      }
    }
  }

  const allRelations = clientRepository.getAllWorkRelations();
  const recommendations: LocalRecommendation[] = [];

  for (const item of activeItems) {
    const workId = item.work.id;
    if (dismissedIds.has(workId)) continue;

    const state = item.relationship?.personalState ?? PersonalState.Planned;

    // 1. Connected work (Sequel, Adaptation, Related) to an engaged work
    const relation = allRelations.find(
      (r) => r.sourceWorkId === workId || r.targetWorkId === workId,
    );
    if (
      relation &&
      (state === PersonalState.Planned ||
        state === PersonalState.Paused ||
        state === PersonalState.Waiting)
    ) {
      const otherId =
        relation.sourceWorkId === workId ? relation.targetWorkId : relation.sourceWorkId;
      const otherWork = activeItems.find((i) => i.work.id === otherId)?.work;
      if (otherWork) {
        recommendations.push({
          id: `rec-rel-${workId}`,
          workId,
          title: item.work.title,
          contentType: item.work.contentType,
          coverUrl: item.work.coverRef ?? null,
          category: "connected_work",
          reasonLabel: `Connected to "${otherWork.title}" in your Adaptation & Relation Graph`,
          score: 95,
        });
        continue;
      }
    }

    // 2. Other work by same creator
    const matchingCreator = (item.work.creators ?? []).find((c) => {
      const sourceTitle = favoriteCreators.get(c.name.toLowerCase());
      return sourceTitle && sourceTitle !== item.work.title;
    });
    if (matchingCreator) {
      const sourceTitle = favoriteCreators.get(matchingCreator.name.toLowerCase())!;
      recommendations.push({
        id: `rec-creator-${workId}`,
        workId,
        title: item.work.title,
        contentType: item.work.contentType,
        coverUrl: item.work.coverRef ?? null,
        category: "same_creator",
        reasonLabel: `By ${matchingCreator.name} (creator of "${sourceTitle}")`,
        score: 90,
      });
      continue;
    }

    // 3. Planned or Paused work matching top genres
    if (
      state === PersonalState.Planned ||
      state === PersonalState.Paused ||
      state === PersonalState.Stalled
    ) {
      const matchedGenres = item.work.genres
        .filter((g) => (genreWeights.get(g) ?? 0) >= 2)
        .sort((a, b) => (genreWeights.get(b) ?? 0) - (genreWeights.get(a) ?? 0));

      if (matchedGenres.length > 0) {
        const topTwo = matchedGenres.slice(0, 2).join(" & ");
        recommendations.push({
          id: `rec-genre-${workId}`,
          workId,
          title: item.work.title,
          contentType: item.work.contentType,
          coverUrl: item.work.coverRef ?? null,
          category: "genre_affinity",
          reasonLabel:
            state === PersonalState.Planned
              ? `On your Plan to Read shelf · Matches your affinity for ${topTwo}`
              : `Paused at ${item.relationship?.currentAnchor ? "saved anchor" : "start"} · Strong match for ${topTwo}`,
          score: 75 + matchedGenres.length * 4,
        });
        continue;
      }
    }

    // 4. Completed / Highlight work worth revisiting or rereading
    if (
      state === PersonalState.Completed ||
      item.relationship?.shelfTier === "highlight" ||
      item.relationship?.shelfTier === "favorite"
    ) {
      recommendations.push({
        id: `rec-reread-${workId}`,
        workId,
        title: item.work.title,
        contentType: item.work.contentType,
        coverUrl: item.work.coverRef ?? null,
        category: "reread_highlight",
        reasonLabel: `Completed favorite with ${item.memories.length} saved memor${item.memories.length === 1 ? "y" : "ies"} · Ideal for a reread pass`,
        score: 65 + item.memories.length * 3,
      });
    }
  }

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 8);
}

const DISMISSED_RECS_KEY = "cv_dismissed_recommendations_v1";

interface RecommendationsState {
  dismissedWorkIds: string[];
  dismissRecommendation: (workId: string) => void;
  restoreAllDismissed: () => void;
}

export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  dismissedWorkIds: (() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(DISMISSED_RECS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as string[];
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  })(),

  dismissRecommendation: (workId: string) => {
    const current = get().dismissedWorkIds;
    if (current.includes(workId)) return;
    const next = [...current, workId];
    set({ dismissedWorkIds: next });
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(DISMISSED_RECS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  },

  restoreAllDismissed: () => {
    set({ dismissedWorkIds: [] });
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(DISMISSED_RECS_KEY);
      } catch {
        // ignore
      }
    }
  },
}));
