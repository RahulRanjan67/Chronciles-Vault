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
}

const STORAGE_KEY = "cv:friends_and_shared_shelves:v1";

const DEFAULT_FRIENDS: readonly FriendProfile[] = [
  {
    id: "friend-caelum",
    handle: "@CaelumReader",
    displayName: "Caelum Vance",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    bio: "Devouring 100 chapters of progression fantasy and web novels every Sunday. Constellation fanatic.",
    currentlyConsuming: {
      title: "Shadow Slave",
      medium: "Web Novel",
      progress: "Ch. 1420 — Tomb of Ariel",
      coverRef: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b125291-5UbQcPd0JwiV.png",
    },
    totalWorksLogged: 148,
    mutualShelvesCount: 2,
    isFollowing: true,
    joinedYear: 2024,
  },
  {
    id: "friend-aurelia",
    handle: "@VellumArchivist",
    displayName: "Lady Aurelia",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    bio: "Collector of antique deluxe manga, dark fantasy, and occult gothic fiction. Seinen connoisseur.",
    currentlyConsuming: {
      title: "Berserk (Uncut Deluxe Edition)",
      medium: "Manga & Anime",
      progress: "Vol. 13 — The Eclipse",
      coverRef: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx30656-9mW113O7rDnA.png",
    },
    totalWorksLogged: 215,
    mutualShelvesCount: 3,
    isFollowing: true,
    joinedYear: 2023,
  },
  {
    id: "friend-jin",
    handle: "@MurimWanderer",
    displayName: "Jin So-Wol",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    bio: "Seeking every blossoming blade and martial arts saint across modern Murim manhwa and wuxia.",
    currentlyConsuming: {
      title: "Return of the Mount Hua Sect",
      medium: "Manhwa",
      progress: "Ch. 152 — Season 2 Finale",
      coverRef: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx105398-b673Vt5ZSuz3.jpg",
    },
    totalWorksLogged: 184,
    mutualShelvesCount: 1,
    isFollowing: false,
    joinedYear: 2024,
  },
  {
    id: "friend-marcus",
    handle: "@AudiobookHermit",
    displayName: "Marcus Thorne",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    bio: "Audiobook purist listening at 1.75x speed. Full-cast cinematic sound design, GraphicAudio & LitRPG.",
    currentlyConsuming: {
      title: "Dungeon Crawler Carl (Soundbooth Theater)",
      medium: "Audiobook",
      progress: "Track 18 (00:42:10)",
      coverRef: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80",
    },
    totalWorksLogged: 92,
    mutualShelvesCount: 2,
    isFollowing: true,
    joinedYear: 2025,
  },
  {
    id: "friend-sora",
    handle: "@MangaNomad",
    displayName: "Sora Hayashi",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    bio: "Tracking raw tankobons, scanlations, and seasonal anime Blu-Rays since 2012.",
    currentlyConsuming: {
      title: "Frieren: Beyond Journey's End",
      medium: "Anime & Manga",
      progress: "Ep. 28 / Ch. 128",
      coverRef: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-n1fmjRv4Jlt5.jpg",
    },
    totalWorksLogged: 340,
    mutualShelvesCount: 3,
    isFollowing: false,
    joinedYear: 2022,
  },
];

const DEFAULT_ACTIVITY: readonly FriendActivityItem[] = [
  {
    id: "act-01",
    friendId: "friend-caelum",
    friendHandle: "@CaelumReader",
    friendDisplayName: "Caelum Vance",
    friendAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    actionType: "progress",
    workTitle: "Shadow Slave",
    detail: "Advanced 28 chapters today up to Chapter 1420 (Tomb of Ariel arc)!",
    timestamp: "12 minutes ago",
    coverRef: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b125291-5UbQcPd0JwiV.png",
  },
  {
    id: "act-02",
    friendId: "friend-marcus",
    friendHandle: "@AudiobookHermit",
    friendDisplayName: "Marcus Thorne",
    friendAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    actionType: "audiobook_listen",
    workTitle: "Dungeon Crawler Carl (Soundbooth Theater)",
    detail: "Listened to 2.5 hours at 1.75x speed. Jeff Hays' voice for Princess Donut is unmatched.",
    timestamp: "45 minutes ago",
    rating: 10,
    coverRef: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "act-03",
    friendId: "friend-aurelia",
    friendHandle: "@VellumArchivist",
    friendDisplayName: "Lady Aurelia",
    friendAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    actionType: "review",
    workTitle: "Berserk (Uncut Deluxe Edition)",
    detail: "Rated 10/10: 'Miura's penmanship in the Golden Age climax remains the pinnacle of dark fantasy.'",
    timestamp: "2 hours ago",
    rating: 10,
    coverRef: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx30656-9mW113O7rDnA.png",
  },
  {
    id: "act-04",
    friendId: "friend-jin",
    friendHandle: "@MurimWanderer",
    friendDisplayName: "Jin So-Wol",
    friendAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    actionType: "shelf_add",
    workTitle: "Return of the Mount Hua Sect",
    detail: "Added to shared shelf: 'Co-op Book Club: Epic Progression Fantasy'.",
    timestamp: "5 hours ago",
    coverRef: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx105398-b673Vt5ZSuz3.jpg",
  },
];

const DEFAULT_SHARED_SHELVES: readonly SharedShelf[] = [
  {
    id: "shelf-progression-guild",
    title: "Co-op Book Club: Epic Progression Fantasy",
    description: "Curated circle of the highest-rated progression fantasy, web novels, and LitRPG.",
    iconEmoji: "⚔️",
    createdByHandle: "@CaelumReader",
    memberHandles: ["@DemoUser1", "@CaelumReader", "@MurimWanderer"],
    isPublicList: true,
    publicShareCode: "PROG-2026-FANTASY",
    updatedAt: new Date().toISOString(),
    works: [
      {
        id: "entry-01",
        workId: "work-orv",
        title: "Omniscient Reader's Viewpoint",
        contentType: "web_novel",
        coverRef: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx119257-Pi21aq3ey9GG.jpg",
        addedByHandle: "@DemoUser1",
        recommenderNote: "The foundational Korean meta-fiction masterpiece. Must read before the epilogue.",
        upvotesCount: 14,
        addedAt: "2026-10-01T12:00:00Z",
      },
      {
        id: "entry-02",
        workId: "work-lotm",
        title: "Lord of the Mysteries",
        contentType: "web_novel",
        coverRef: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b125291-5UbQcPd0JwiV.png",
        addedByHandle: "@CaelumReader",
        recommenderNote: "Victorian steampunk meets Eldritch Tarot Club. The magic system is unmatched.",
        upvotesCount: 18,
        addedAt: "2026-10-02T15:30:00Z",
      },
      {
        id: "entry-03",
        workId: "work-dungeon-crawler-carl-audio",
        title: "Dungeon Crawler Carl (Audio Edition)",
        contentType: "audiobook",
        coverRef: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80",
        addedByHandle: "@AudiobookHermit",
        recommenderNote: "Full-cast sound design makes this audio drama pure adrenaline from track one.",
        upvotesCount: 22,
        addedAt: "2026-10-05T09:15:00Z",
      },
    ],
  },
  {
    id: "shelf-dark-vault-guild",
    title: "Guilty Pleasures & Dark Seinen Vault Guild",
    description: "Private collaborative shelf for dark fantasy, psychological thrillers, and uncut cinema.",
    iconEmoji: "🗝️",
    createdByHandle: "@DemoUser1",
    memberHandles: ["@DemoUser1", "@VellumArchivist"],
    isPublicList: false,
    publicShareCode: "DARK-VAULT-UNCUT",
    updatedAt: new Date().toISOString(),
    works: [
      {
        id: "entry-04",
        workId: "work-vault-berserk-uncut",
        title: "[VAULT] Berserk: The Golden Age (Uncut)",
        contentType: "anime",
        coverRef: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx33-jK2aXoO81jfe.jpg",
        addedByHandle: "@DemoUser1",
        recommenderNote: "Keep sealed in Vault until ready. The 1997 uncut remaster is sublime.",
        upvotesCount: 9,
        addedAt: "2026-10-06T18:00:00Z",
      },
      {
        id: "entry-05",
        workId: "work-takopi",
        title: "Takopi's Original Sin (S01 1080p)",
        contentType: "anime",
        coverRef: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx142600-7d7rV5p5m4c8.jpg",
        addedByHandle: "@VellumArchivist",
        recommenderNote: "Emotional gut punch. Local dual audio archive in C:\\Users\\67rah\\Downloads\\watch.",
        upvotesCount: 11,
        addedAt: "2026-10-08T11:20:00Z",
      },
    ],
  },
  {
    id: "shelf-top-anime-edits",
    title: "Public List: Iconic Fiction & Anime Edits of 2026",
    description: "Community curated public list connecting high-tier animation scenes, reels, and sound design.",
    iconEmoji: "🎬",
    createdByHandle: "@MangaNomad",
    memberHandles: ["@MangaNomad", "@DemoUser1", "@CaelumReader", "@JinSoWol"],
    isPublicList: true,
    publicShareCode: "EDITS-2026-PUBLIC",
    updatedAt: new Date().toISOString(),
    works: [
      {
        id: "entry-06",
        workId: "work-solo-leveling-anime",
        title: "Solo Leveling (Anime Season 2)",
        contentType: "anime",
        coverRef: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx151807-m1gX3iwfIsLu.png",
        addedByHandle: "@MangaNomad",
        recommenderNote: "Jeju Island raid aura edit with Sawano Hiroyuki score.",
        upvotesCount: 31,
        addedAt: "2026-10-09T14:40:00Z",
      },
      {
        id: "entry-07",
        workId: "work-frieren-anime",
        title: "Frieren: Beyond Journey's End (Anime TV BD)",
        contentType: "anime",
        coverRef: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-n1fmjRv4Jlt5.jpg",
        addedByHandle: "@DemoUser1",
        recommenderNote: "Zoltraak first-class mage exam battle edit.",
        upvotesCount: 27,
        addedAt: "2026-10-10T16:00:00Z",
      },
    ],
  },
];

export interface FriendsState {
  readonly friends: readonly FriendProfile[];
  readonly activityFeed: readonly FriendActivityItem[];
  readonly sharedShelves: readonly SharedShelf[];
  readonly toggleFollow: (friendId: string) => void;
  readonly addWorkToSharedShelf: (shelfId: string, work: { id: string; title: string; contentType: string; coverRef?: string; note?: string }) => void;
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
          return parsed;
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
            addedByHandle: "@DemoUser1",
            recommenderNote: work.note?.trim() || "Recommended by DemoUser1",
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
        createdByHandle: "@DemoUser1",
        memberHandles: ["@DemoUser1"],
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
