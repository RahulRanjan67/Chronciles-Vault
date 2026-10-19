import { create } from "zustand";

export interface FriendProfile {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly avatarUrl: string;
  readonly bio: string;
  readonly currentlyConsuming: {
    readonly title: string;
    readonly medium: string;
    readonly progress: string;
    readonly coverRef?: string;
  };
  readonly totalWorksLogged: number;
  readonly mutualShelvesCount: number;
  readonly isFollowing: boolean;
  readonly joinedYear: number;
}

export interface FriendActivityItem {
  readonly id: string;
  readonly friendId: string;
  readonly friendHandle: string;
  readonly friendDisplayName: string;
  readonly friendAvatar: string;
  readonly actionType: "progress" | "review" | "shelf_add" | "quote" | "audiobook_listen";
  readonly workTitle: string;
  readonly detail: string;
  readonly timestamp: string;
  readonly rating?: number;
  readonly coverRef?: string;
}

export interface SharedShelfWorkEntry {
  readonly id: string;
  readonly workId: string;
  readonly title: string;
  readonly contentType: string;
  readonly coverRef?: string;
  readonly addedByHandle: string;
  readonly recommenderNote: string;
  readonly upvotesCount: number;
  readonly addedAt: string;
}

export interface SharedShelf {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly iconEmoji: string;
  readonly createdByHandle: string;
  readonly memberHandles: readonly string[];
  readonly works: readonly SharedShelfWorkEntry[];
  readonly isPublicList: boolean;
  readonly publicShareCode: string;
  readonly updatedAt: string;
  readonly isVaultGated?: boolean;
}

const STORAGE_KEY = "cv:friends_and_shared_shelves:v1";

const DEFAULT_FRIENDS: readonly FriendProfile[] = [];

const DEFAULT_ACTIVITY: readonly FriendActivityItem[] = [];

const DEFAULT_SHARED_SHELVES: readonly SharedShelf[] = [];

export interface FriendsState {
  readonly friends: readonly FriendProfile[];
  readonly activityFeed: readonly FriendActivityItem[];
  readonly sharedShelves: readonly SharedShelf[];
  readonly toggleFollow: (friendId: string) => void;
  readonly removeFriend: (friendId: string) => void;
  readonly addWorkToSharedShelf: (shelfId: string, work: { id: string; title: string; contentType: string; coverRef?: string; note?: string }) => void;
  readonly removeWorkFromSharedShelf: (shelfId: string, entryId: string) => void;
  readonly deleteSharedShelf: (shelfId: string) => void;
  readonly flushActivityFeed: () => void;
  readonly upvoteShelfWork: (shelfId: string, entryId: string) => void;
  readonly createSharedShelf: (title: string, description: string, iconEmoji?: string, isPublic?: boolean) => SharedShelf;
}

export const useFriendsStore = create<FriendsState>((set, get) => {
  const loadInitial = (): {
    friends: FriendProfile[];
    activity: FriendActivityItem[];
    shelves: SharedShelf[];
  } => {
    if (typeof window === "undefined") {
      return {
        friends: [...DEFAULT_FRIENDS],
        activity: [...DEFAULT_ACTIVITY],
        shelves: [...DEFAULT_SHARED_SHELVES],
      };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.friends) && Array.isArray(parsed.shelves)) {
          const sanitizedShelves = parsed.shelves.map((shelf: SharedShelf) => {
            const isVault = shelf.id === "shelf-dark-vault-guild" || shelf.title.toLowerCase().includes("vault");
            return {
              ...shelf,
              isVaultGated: isVault || shelf.isVaultGated,
              works: shelf.works.map((w: SharedShelfWorkEntry) => ({
                ...w,
                recommenderNote: (w.recommenderNote || "").replace(/in C:\\Users\\[^\s.]+/gi, "").trim(),
              })),
            };
          });
          return {
            friends: parsed.friends,
            activity: Array.isArray(parsed.activity) ? parsed.activity : [...DEFAULT_ACTIVITY],
            shelves: sanitizedShelves,
          };
        }
      }
    } catch {
      // fallback
    }
    return {
      friends: [...DEFAULT_FRIENDS],
      activity: [...DEFAULT_ACTIVITY],
      shelves: [...DEFAULT_SHARED_SHELVES],
    };
  };

  const initial = loadInitial();

  const persist = (friends: readonly FriendProfile[], shelves: readonly SharedShelf[], activity: readonly FriendActivityItem[]) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ friends, shelves, activity }),
        );
      }
    } catch {
      // ignore
    }
  };

  return {
    friends: initial.friends,
    activityFeed: initial.activity,
    sharedShelves: initial.shelves,

    toggleFollow: (friendId: string) => {
      set((state) => {
        const nextFriends = state.friends.map((f) =>
          f.id === friendId ? { ...f, isFollowing: !f.isFollowing } : f,
        );
        persist(nextFriends, state.sharedShelves, state.activityFeed);
        return { friends: nextFriends };
      });
    },

    removeFriend: (friendId: string) => {
      set((state) => {
        const nextFriends = state.friends.filter((f) => f.id !== friendId);
        persist(nextFriends, state.sharedShelves, state.activityFeed);
        return { friends: nextFriends };
      });
    },

    addWorkToSharedShelf: (shelfId, work) => {
      set((state) => {
        const nextShelves = state.sharedShelves.map((shelf) => {
          if (shelf.id !== shelfId) return shelf;
          const newEntry: SharedShelfWorkEntry = {
            id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            workId: work.id,
            title: work.title,
            contentType: work.contentType,
            coverRef: work.coverRef,
            addedByHandle: "@Archivist",
            recommenderNote: work.note?.trim() || "Recommended by Archivist",
            upvotesCount: 1,
            addedAt: new Date().toISOString(),
          };
          return {
            ...shelf,
            works: [newEntry, ...shelf.works],
            updatedAt: new Date().toISOString(),
          };
        });
        persist(state.friends, nextShelves, state.activityFeed);
        return { sharedShelves: nextShelves };
      });
    },

    removeWorkFromSharedShelf: (shelfId, entryId) => {
      set((state) => {
        const nextShelves = state.sharedShelves.map((shelf) => {
          if (shelf.id !== shelfId) return shelf;
          return {
            ...shelf,
            works: shelf.works.filter((w) => w.id !== entryId),
            updatedAt: new Date().toISOString(),
          };
        });
        persist(state.friends, nextShelves, state.activityFeed);
        return { sharedShelves: nextShelves };
      });
    },

    deleteSharedShelf: (shelfId) => {
      set((state) => {
        const nextShelves = state.sharedShelves.filter((shelf) => shelf.id !== shelfId);
        persist(state.friends, nextShelves, state.activityFeed);
        return { sharedShelves: nextShelves };
      });
    },

    flushActivityFeed: () => {
      set((state) => {
        persist(state.friends, state.sharedShelves, []);
        return { activityFeed: [] };
      });
    },

    upvoteShelfWork: (shelfId, entryId) => {
      set((state) => {
        const nextShelves = state.sharedShelves.map((shelf) => {
          if (shelf.id !== shelfId) return shelf;
          return {
            ...shelf,
            works: shelf.works.map((w) =>
              w.id === entryId ? { ...w, upvotesCount: w.upvotesCount + 1 } : w,
            ),
          };
        });
        persist(state.friends, nextShelves, state.activityFeed);
        return { sharedShelves: nextShelves };
      });
    },

    createSharedShelf: (title, description, iconEmoji = "📚", isPublic = true) => {
      const newShelf: SharedShelf = {
        id: `shelf-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        iconEmoji,
        createdByHandle: "@Archivist",
        memberHandles: ["@Archivist"],
        isPublicList: isPublic,
        publicShareCode: `${title.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        updatedAt: new Date().toISOString(),
        works: [],
      };
      set((state) => {
        const nextShelves = [newShelf, ...state.sharedShelves];
        persist(state.friends, nextShelves, state.activityFeed);
        return { sharedShelves: nextShelves };
      });
      return newShelf;
    },
  };
});
