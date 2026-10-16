import { create } from "zustand";
import { WorkId } from "@chronicles-vault/shared";
import {
  Work,
  ContentType,
  PersonalState,
  SourceHealth,
  ProgressAnchor,
  ProgressMethod,
  AccessPath,
  ReadingRelationship,
} from "@chronicles-vault/domain";
import { clientRepository, HydratedWorkItem } from "../client-repository";

export type LibraryViewMode = "grid" | "compact" | "table" | "board";
export type LibrarySortBy = "updatedAt" | "title" | "lastActive" | "progress";
export type SortOrder = "asc" | "desc";

export interface LibraryFilters {
  searchQuery: string;
  contentType: ContentType | "all";
  personalState: PersonalState | "all";
  sourceHealth: SourceHealth | "all";
  genre: string | "all";
  tag: string | "all";
  sortBy: LibrarySortBy;
  sortOrder: SortOrder;
  viewMode: LibraryViewMode;
}

export interface LibraryState extends LibraryFilters {
  items: HydratedWorkItem[];
  allGenres: string[];
  allTags: string[];

  // Actions
  refresh: () => void;
  setSearchQuery: (query: string) => void;
  setContentType: (type: ContentType | "all") => void;
  setPersonalState: (state: PersonalState | "all") => void;
  setSourceHealth: (health: SourceHealth | "all") => void;
  setGenre: (genre: string | "all") => void;
  setTag: (tag: string | "all") => void;
  setSortBy: (sortBy: LibrarySortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  setViewMode: (mode: LibraryViewMode) => void;
  resetFilters: () => void;

  // Mutation Actions
  createWork: (
    workParams: Omit<Work, "id" | "createdAt" | "updatedAt" | "deletedAt">,
    initialState?: PersonalState,
    initialAnchor?: ProgressAnchor,
    initialPath?: { provider: string; url?: string; label: string },
  ) => HydratedWorkItem;
  updateWork: (id: WorkId, patch: Partial<Omit<Work, "id" | "createdAt">>) => Work;
  updateRelationship: (
    workId: WorkId,
    patch: Partial<Omit<ReadingRelationship, "id" | "workId" | "createdAt">>,
  ) => ReadingRelationship;
  deleteWork: (id: WorkId) => void;
  addAccessPath: (workId: WorkId, path: Omit<AccessPath, "id" | "workId">) => AccessPath;
  recordProgress: (workId: WorkId, anchor: ProgressAnchor, method?: ProgressMethod) => void;
}

const initialFilters: LibraryFilters = {
  searchQuery: "",
  contentType: "all",
  personalState: "all",
  sourceHealth: "all",
  genre: "all",
  tag: "all",
  sortBy: "lastActive",
  sortOrder: "desc",
  viewMode: "grid",
};

function extractUniqueGenresAndTags(items: HydratedWorkItem[]) {
  const genres = new Set<string>();
  const tags = new Set<string>();
  for (const item of items) {
    if (item.work.deletedAt) continue;
    for (const g of item.work.genres) genres.add(g);
    for (const t of item.work.tags) tags.add(t);
  }
  return {
    allGenres: Array.from(genres).sort(),
    allTags: Array.from(tags).sort(),
  };
}

export const useLibraryStore = create<LibraryState>((set, get) => {
  const initialItems = clientRepository.getItems();
  const { allGenres, allTags } = extractUniqueGenresAndTags(initialItems);

  return {
    ...initialFilters,
    items: initialItems,
    allGenres,
    allTags,

    refresh: () => {
      const items = clientRepository.getItems();
      const meta = extractUniqueGenresAndTags(items);
      set({ items, ...meta });
    },

    setSearchQuery: (query) => set({ searchQuery: query }),
    setContentType: (contentType) => set({ contentType }),
    setPersonalState: (personalState) => set({ personalState }),
    setSourceHealth: (sourceHealth) => set({ sourceHealth }),
    setGenre: (genre) => set({ genre }),
    setTag: (tag) => set({ tag }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
    setViewMode: (viewMode) => set({ viewMode }),

    resetFilters: () =>
      set({
        searchQuery: "",
        contentType: "all",
        personalState: "all",
        sourceHealth: "all",
        genre: "all",
        tag: "all",
        sortBy: "lastActive",
        sortOrder: "desc",
      }),

    createWork: (workParams, initialState, initialAnchor, initialPath) => {
      const created = clientRepository.createWork(
        workParams,
        initialState,
        initialAnchor,
        initialPath,
      );
      get().refresh();
      return created;
    },

    updateWork: (id, patch) => {
      const updated = clientRepository.updateWork(id, patch);
      get().refresh();
      return updated;
    },

    updateRelationship: (workId, patch) => {
      const updated = clientRepository.updateRelationship(workId, patch);
      get().refresh();
      return updated;
    },

    deleteWork: (id) => {
      clientRepository.deleteWork(id);
      get().refresh();
    },

    addAccessPath: (workId, path) => {
      const accessPath = clientRepository.addAccessPath(workId, path);
      get().refresh();
      return accessPath;
    },

    recordProgress: (workId, anchor, method = ProgressMethod.Reader) => {
      clientRepository.recordProgress(workId, anchor, method);
      get().refresh();
    },
  };
});

/**
 * Selector for filtered and sorted works based on active library state.
 * When `options.includeVaultWorks` is false (default when Vault is locked),
 * works with `privacyState === "vault"` are concealed.
 */
export function selectFilteredWorks(
  state: LibraryState,
  options?: { includeVaultWorks?: boolean },
): HydratedWorkItem[] {
  const includeVaultWorks = options?.includeVaultWorks ?? false;
  const {
    items,
    searchQuery,
    contentType,
    personalState,
    sourceHealth,
    genre,
    tag,
    sortBy,
    sortOrder,
  } = state;

  return items
    .filter((item) => {
      // Exclude soft-deleted items
      if (item.work.deletedAt) return false;

      // Conceal Vault-classified works unless Vault is currently unlocked
      if (!includeVaultWorks && item.work.privacyState === "vault") {
        return false;
      }

      // Search Query (matches title, aliases, alternativeTitles, description, tags, creators, originalTitle)
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.work.title.toLowerCase().includes(q);
        const matchesOriginalTitle = item.work.originalTitle
          ? item.work.originalTitle.toLowerCase().includes(q)
          : false;
        const matchesAlt = item.work.alternativeTitles.some((a) => a.toLowerCase().includes(q));
        const matchesAlias = item.work.aliases.some((a) => a.toLowerCase().includes(q));
        const matchesDesc = item.work.description
          ? item.work.description.toLowerCase().includes(q)
          : false;
        const matchesTag = item.work.tags.some((t) => t.toLowerCase().includes(q));
        const matchesGenre = item.work.genres.some((g) => g.toLowerCase().includes(q));
        const matchesCreator = (item.work.creators ?? []).some((c) =>
          c.name.toLowerCase().includes(q),
        );
        if (
          !matchesTitle &&
          !matchesOriginalTitle &&
          !matchesAlt &&
          !matchesAlias &&
          !matchesDesc &&
          !matchesTag &&
          !matchesGenre &&
          !matchesCreator
        ) {
          return false;
        }
      }

      // Content Type filter
      if (contentType !== "all" && item.work.contentType !== contentType) {
        return false;
      }

      // Personal State filter
      if (personalState !== "all") {
        if (!item.relationship || item.relationship.personalState !== personalState) {
          return false;
        }
      }

      // Source Health filter
      if (sourceHealth !== "all") {
        const hasMatchingHealth = item.accessPaths.some((p) => p.health === sourceHealth);
        if (!hasMatchingHealth) return false;
      }

      // Genre filter
      if (genre !== "all" && !item.work.genres.includes(genre)) {
        return false;
      }

      // Tag filter
      if (tag !== "all" && !item.work.tags.includes(tag)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = a.work.title.localeCompare(b.work.title);
          break;
        case "updatedAt":
          comparison = new Date(b.work.updatedAt).getTime() - new Date(a.work.updatedAt).getTime();
          break;
        case "lastActive": {
          const aActive = a.relationship?.lastActiveAt
            ? new Date(a.relationship.lastActiveAt).getTime()
            : 0;
          const bActive = b.relationship?.lastActiveAt
            ? new Date(b.relationship.lastActiveAt).getTime()
            : 0;
          comparison = bActive - aActive;
          break;
        }
        case "progress": {
          const aAnchor = a.relationship?.currentAnchor;
          const bAnchor = b.relationship?.currentAnchor;
          const aVal = aAnchor && "chapter" in aAnchor ? aAnchor.chapter : 0;
          const bVal = bAnchor && "chapter" in bAnchor ? bAnchor.chapter : 0;
          comparison = (bVal as number) - (aVal as number);
          break;
        }
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });
}
