import { create } from "zustand";
import { WorkId } from "@grimoire/shared";
import {
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  PersonalState,
  ProgressAnchor,
} from "@grimoire/domain";
import { clientRepository } from "../client-repository";
import { useLibraryStore } from "./use-library-store";

export interface UserPersonalListItem {
  id: string;
  workId: string;
  position: number;
  personalNote: string | null;
  createdAt: string;
}

export interface UserPersonalList {
  id: string;
  title: string;
  description: string | null;
  privacyState: PrivacyState;
  items: UserPersonalListItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CommunityWorkEntry {
  id: string;
  title: string;
  author?: string;
  contentType: ContentType;
  origin?: ContentOrigin;
  coverRef?: string;
  genres: string[];
  synopsis?: string;
  curatorNote?: string;
  rating?: number;
  totalChapters?: number | string;
  sourceUrl?: string;
}

export interface CommunityList {
  id: string;
  title: string;
  curator: {
    name: string;
    handle: string;
    avatar?: string;
    verified: boolean;
  };
  description: string;
  genres: string[];
  tags: string[];
  followersCount: number;
  likesCount: number;
  updatedAt: string;
  items: CommunityWorkEntry[];
}

export interface ListsState {
  // Personal lists
  myLists: UserPersonalList[];
  selectedListId: string | null;

  // Community lists
  communityLists: CommunityList[];
  communitySearchQuery: string;
  communityGenreFilter: string;

  // Actions - Personal Lists
  setSelectedListId: (id: string | null) => void;
  createList: (params: {
    title: string;
    description?: string;
    privacyState?: PrivacyState;
  }) => UserPersonalList;
  updateList: (
    id: string,
    patch: Partial<Omit<UserPersonalList, "id" | "createdAt">>
  ) => void;
  deleteList: (id: string) => void;
  softDeleteList: (id: string) => void;
  restoreList: (id: string) => void;
  purgeList: (id: string) => void;
  getDeletedLists: () => UserPersonalList[];
  addWorkToList: (listId: string, workId: string, note?: string) => void;
  removeWorkFromList: (listId: string, workId: string) => void;
  isWorkInList: (listId: string, workId: string) => boolean;
  moveListItem: (listId: string, itemId: string, direction: "up" | "down") => void;
  setListItemNote: (listId: string, itemId: string, note: string | null) => void;

  // Publication history (metadata only; never the published content)
  publications: PublicationRecord[];
  recordPublication: (record: Omit<PublicationRecord, "id">) => void;

  // Actions - Community Lists & Exploration
  setCommunitySearchQuery: (query: string) => void;
  setCommunityGenreFilter: (genre: string) => void;
  cloneCommunityList: (
    communityListId: string
  ) => { list: UserPersonalList; importedCount: number };
  addCommunityWorkToLibrary: (entry: CommunityWorkEntry) => WorkId;
  refresh: () => void;
}

const STORAGE_KEY = "cv:user_lists:v1";

function getInitialPersonalLists(): UserPersonalList[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as UserPersonalList[];
      }
    } catch {
      // Fallback
    }
  }

  return [];
}

function persistPersonalLists(lists: UserPersonalList[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch {
      // Ignore
    }
  }
}

export const COMMUNITY_LISTS_SEED: CommunityList[] = [];

export interface PublicationRecord {
  id: string;
  listId: string;
  title: string;
  format: "html" | "markdown";
  generatedAt: string;
  entryCount: number;
  excludedCount: number;
}

const PUBLICATIONS_STORAGE_KEY = "cv:publications:v1";
const MAX_PUBLICATION_RECORDS = 50;

function getInitialPublications(): PublicationRecord[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(PUBLICATIONS_STORAGE_KEY);
      if (stored) return JSON.parse(stored) as PublicationRecord[];
    } catch {
      // Fallback
    }
  }
  return [];
}

function persistPublications(records: PublicationRecord[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PUBLICATIONS_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Ignore
    }
  }
}

export const useListsStore = create<ListsState>((set, get) => {
  const initialPersonal = getInitialPersonalLists();

  return {
    myLists: initialPersonal,
    selectedListId: initialPersonal[0]?.id ?? null,
    communityLists: COMMUNITY_LISTS_SEED,
    communitySearchQuery: "",
    communityGenreFilter: "All",
    publications: getInitialPublications(),

    setSelectedListId: (id) => set({ selectedListId: id }),

    createList: ({ title, description, privacyState = PrivacyState.Public }) => {
      const now = new Date().toISOString();
      const newList: UserPersonalList = {
        id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        description: description?.trim() || null,
        privacyState,
        items: [],
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...get().myLists, newList];
      persistPersonalLists(updated);
      set({ myLists: updated, selectedListId: newList.id });
      return newList;
    },

    updateList: (id, patch) => {
      const updated = get().myLists.map((list) => {
        if (list.id !== id) return list;
        return {
          ...list,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
      });
      persistPersonalLists(updated);
      set({ myLists: updated });
    },

    deleteList: (id) => {
      get().softDeleteList(id);
    },

    softDeleteList: (id) => {
      const now = new Date().toISOString();
      const updated = get().myLists.map((l) => (l.id === id ? { ...l, deletedAt: now, updatedAt: now } : l));
      persistPersonalLists(updated);
      const activeLists = updated.filter((l) => !l.deletedAt);
      const nextSelected = get().selectedListId === id ? (activeLists[0]?.id ?? null) : get().selectedListId;
      set({ myLists: updated, selectedListId: nextSelected });
    },

    restoreList: (id) => {
      const now = new Date().toISOString();
      const updated = get().myLists.map((l) => (l.id === id ? { ...l, deletedAt: null, updatedAt: now } : l));
      persistPersonalLists(updated);
      set({ myLists: updated });
    },

    purgeList: (id) => {
      const updated = get().myLists.filter((l) => l.id !== id);
      persistPersonalLists(updated);
      const activeLists = updated.filter((l) => !l.deletedAt);
      const nextSelected = get().selectedListId === id ? (activeLists[0]?.id ?? null) : get().selectedListId;
      set({ myLists: updated, selectedListId: nextSelected });
    },

    getDeletedLists: () => {
      return get().myLists.filter((l) => Boolean(l.deletedAt));
    },

    addWorkToList: (listId, workId, note) => {
      const now = new Date().toISOString();
      const updated = get().myLists.map((list) => {
        if (list.id !== listId) return list;
        if (list.items.some((item) => item.workId === workId)) return list;
        const newItem: UserPersonalListItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          workId,
          position: list.items.length,
          personalNote: note ?? null,
          createdAt: now,
        };
        return {
          ...list,
          items: [...list.items, newItem],
          updatedAt: now,
        };
      });
      persistPersonalLists(updated);
      set({ myLists: updated });
    },

    removeWorkFromList: (listId, workId) => {
      const updated = get().myLists.map((list) => {
        if (list.id !== listId) return list;
        return {
          ...list,
          items: list.items.filter((item) => item.workId !== workId),
          updatedAt: new Date().toISOString(),
        };
      });
      persistPersonalLists(updated);
      set({ myLists: updated });
    },

    moveListItem: (listId, itemId, direction) => {
      const now = new Date().toISOString();
      const updated = get().myLists.map((list) => {
        if (list.id !== listId) return list;
        const ordered = [...list.items].sort((a, b) => a.position - b.position);
        const index = ordered.findIndex((item) => item.id === itemId);
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return list;
        const moving = ordered[index];
        const other = ordered[targetIndex];
        if (!moving || !other) return list;
        ordered[index] = other;
        ordered[targetIndex] = moving;
        return {
          ...list,
          items: ordered.map((item, position) => ({ ...item, position })),
          updatedAt: now,
        };
      });
      persistPersonalLists(updated);
      set({ myLists: updated });
    },

    setListItemNote: (listId, itemId, note) => {
      const trimmed = note?.trim() ? note.trim().slice(0, 500) : null;
      const now = new Date().toISOString();
      const updated = get().myLists.map((list) => {
        if (list.id !== listId) return list;
        return {
          ...list,
          items: list.items.map((item) =>
            item.id === itemId ? { ...item, personalNote: trimmed } : item
          ),
          updatedAt: now,
        };
      });
      persistPersonalLists(updated);
      set({ myLists: updated });
    },

    recordPublication: (record) => {
      const entry: PublicationRecord = {
        ...record,
        id: `pub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      const updated = [entry, ...get().publications].slice(0, MAX_PUBLICATION_RECORDS);
      persistPublications(updated);
      set({ publications: updated });
    },

    isWorkInList: (listId, workId) => {
      const list = get().myLists.find((l) => l.id === listId);
      return list ? list.items.some((item) => item.workId === workId) : false;
    },

    setCommunitySearchQuery: (query) => set({ communitySearchQuery: query }),
    setCommunityGenreFilter: (genre) => set({ communityGenreFilter: genre }),

    cloneCommunityList: (communityListId) => {
      const community = get().communityLists.find((c) => c.id === communityListId);
      if (!community) {
        throw new Error("Community list not found");
      }

      // Check existing library works
      const existingItems = clientRepository.getItems();
      let importedCount = 0;
      const workIds: string[] = [];

      for (const entry of community.items) {
        // Try finding existing work by title match
        const found = existingItems.find(
          (item) => item.work.title.toLowerCase() === entry.title.toLowerCase()
        );

        if (found) {
          workIds.push(found.work.id);
        } else {
          // Import new work to library
          const newWork = clientRepository.createWork(
            {
              title: entry.title,
              alternativeTitles: [],
              aliases: [],
              description: entry.synopsis ?? entry.curatorNote ?? null,
              contentType: entry.contentType,
              origin: entry.origin ?? ContentOrigin.Unknown,
              publicationState: PublicationState.Unknown,
              privacyState: PrivacyState.Public,
              coverRef: entry.coverRef ?? null,
              externalIds: [],
              genres: entry.genres,
              tags: community.tags,
            },
            PersonalState.Planned,
            { type: "chapter", chapter: 1, title: "Chapter 1" }
          );
          workIds.push(newWork.work.id);
          importedCount++;
        }
      }

      // Refresh library store so UI reflects new works
      useLibraryStore.getState().refresh();

      // Create new personal list
      const now = new Date().toISOString();
      const newList: UserPersonalList = {
        id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: `${community.title} (Cloned)`,
        description: `Imported from community curation by ${community.curator.name} (${community.curator.handle})`,
        privacyState: PrivacyState.Public,
        items: workIds.map((wId, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          workId: wId,
          position: idx,
          personalNote: community.items[idx]?.curatorNote ?? null,
          createdAt: now,
        })),
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...get().myLists, newList];
      persistPersonalLists(updated);
      set({ myLists: updated, selectedListId: newList.id });

      return { list: newList, importedCount };
    },

    addCommunityWorkToLibrary: (entry) => {
      const existingItems = clientRepository.getItems();
      const found = existingItems.find(
        (item) => item.work.title.toLowerCase() === entry.title.toLowerCase()
      );
      if (found) {
        return found.work.id;
      }

      const newWork = clientRepository.createWork(
        {
          title: entry.title,
          alternativeTitles: [],
          aliases: [],
          description: entry.synopsis ?? entry.curatorNote ?? null,
          contentType: entry.contentType,
          origin: entry.origin ?? ContentOrigin.Unknown,
          publicationState: PublicationState.Unknown,
          privacyState: PrivacyState.Public,
          coverRef: entry.coverRef ?? null,
          externalIds: [],
          genres: entry.genres,
          tags: [],
        },
        PersonalState.Planned,
        { type: "chapter", chapter: 1, title: "Chapter 1" }
      );

      useLibraryStore.getState().refresh();
      return newWork.work.id;
    },

    refresh: () => {
      set({ myLists: getInitialPersonalLists() });
    },
  };
});
