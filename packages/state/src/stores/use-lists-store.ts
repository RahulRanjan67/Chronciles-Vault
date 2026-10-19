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

  const now = new Date().toISOString();
  return [
    {
      id: "list-all-time-favorites",
      title: "All-Time Fiction Favorites",
      description: "My personal 10/10 masterworks across all media types.",
      privacyState: PrivacyState.Public,
      items: [
        {
          id: "item-1",
          workId: "work-orv",
          position: 0,
          personalNote: "The constellation epilogue was sublime.",
          createdAt: now,
        },
        {
          id: "item-2",
          workId: "work-lotm",
          position: 1,
          personalNote: "Tarot club mysteries and pathway sequences.",
          createdAt: now,
        },
        {
          id: "item-3",
          workId: "work-frieren",
          position: 2,
          personalNote: "Melancholic meditation on mortality.",
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "list-weekend-binge",
      title: "Weekend High-Priority Binge",
      description: "Short or fast-paced series to marathon during downtime.",
      privacyState: PrivacyState.Private,
      items: [
        {
          id: "item-4",
          workId: "work-solo-leveling",
          position: 0,
          personalNote: "Pure hype and kinetic action.",
          createdAt: now,
        },
        {
          id: "item-5",
          workId: "work-chainsaw-man",
          position: 1,
          personalNote: "Fast, cinematic chapters.",
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
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

export const COMMUNITY_LISTS_SEED: CommunityList[] = [
  {
    id: "comm-progression-fantasy",
    title: "Top 50 Progression Fantasy & Cultivation",
    curator: {
      name: "ArcaneScholar",
      handle: "@arcanescholar",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      verified: true,
    },
    description: "The definitive ranked catalog of progression fantasy, cultivation, and system ascents where disciplined mastery and clever tactics shatter impossible odds.",
    genres: ["Progression Fantasy", "Cultivation", "Action", "Adventure"],
    tags: ["Power Ladders", "Training Arcs", "Hard Magic", "System"],
    followersCount: 14200,
    likesCount: 5890,
    updatedAt: "2026-10-04T12:00:00Z",
    items: [
      {
        id: "c-item-cradle",
        title: "Cradle: Unsouled",
        author: "Will Wight",
        contentType: ContentType.WesternNovel,
        origin: ContentOrigin.Western,
        coverRef: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
        genres: ["Progression Fantasy", "Cultivation", "Martial Arts"],
        synopsis: "Sacred artists climb from Copper to Monarch in an unforgiving world of sacred beasts and ascendants.",
        curatorNote: "The gold standard of Western Xianxia. Lindon's motto 'Gratitude' will be engraved in your mind.",
        rating: 9.8,
        totalChapters: "12 Volumes",
      },
      {
        id: "c-item-lotm",
        title: "Lord of the Mysteries",
        author: "Cuttlefish That Loves Diving",
        contentType: ContentType.WebNovel,
        origin: ContentOrigin.Chinese,
        coverRef: "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=400&auto=format&fit=crop&q=80",
        genres: ["Mystery", "Dark Fantasy", "Progression Fantasy"],
        synopsis: "Klein Moretti wakes in a steampunk Victorian world governed by 22 potion pathways, ancient gods, and tarot meetings.",
        curatorNote: "Unmatched potion progression with mind-bending cosmic horror stakes.",
        rating: 9.9,
        totalChapters: "1432 Chapters",
      },
      {
        id: "c-item-tog",
        title: "Tower of God",
        author: "SIU",
        contentType: ContentType.Webtoon,
        origin: ContentOrigin.Korean,
        coverRef: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80",
        genres: ["Action", "Fantasy", "Mystery"],
        synopsis: "What do you desire? Money and wealth? Honor and pride? Power and influence? Or something that transcends all of them? Whatever you desire is atop the Tower.",
        curatorNote: "Expansive Shinsu power system, high rankers, and multi-layered political intrigue.",
        rating: 9.5,
        totalChapters: "600+ Chapters",
      },
      {
        id: "c-item-tbate",
        title: "The Beginning After the End",
        author: "TurtleMe",
        contentType: ContentType.Webtoon,
        origin: ContentOrigin.Korean,
        coverRef: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
        genres: ["Fantasy", "Action", "Isekai"],
        synopsis: "King Grey reincarnates with his past wisdom into a magical world, forging his mana core through rigorous fundamentals.",
        curatorNote: "Exceptional core progression with high-stakes continental war.",
        rating: 9.2,
        totalChapters: "190+ Chapters",
      },
      {
        id: "c-item-mol",
        title: "Mother of Learning",
        author: "Domagoj Kurmaic (nobody103)",
        contentType: ContentType.WebNovel,
        origin: ContentOrigin.Western,
        coverRef: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&auto=format&fit=crop&q=80",
        genres: ["Fantasy", "Mystery", "Time Loop"],
        synopsis: "Zorian Kazinski, an antisocial mage academy student, is trapped in a one-month time loop with an impending invasion.",
        curatorNote: "The smartest, most methodical progression puzzle ever written.",
        rating: 9.7,
        totalChapters: "108 Chapters",
      },
    ],
  },
  {
    id: "comm-scifi-timeloops",
    title: "Masterpiece Sci-Fi & Time Loops",
    curator: {
      name: "ChronosReader",
      handle: "@chronosreader",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      verified: true,
    },
    description: "Mind-bending temporal paradoxes, cosmic dread, and psychological memory puzzles that reward analytical reading.",
    genres: ["Sci-Fi", "Time Loop", "Mystery", "Psychological"],
    tags: ["Mind Game", "Paradox", "Non-linear", "Thriller"],
    followersCount: 11800,
    likesCount: 4210,
    updatedAt: "2026-10-02T18:30:00Z",
    items: [
      {
        id: "c-item-steinsgate",
        title: "Steins;Gate",
        author: "5pb. / Nitroplus",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Japanese,
        coverRef: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
        genres: ["Sci-Fi", "Thriller", "Psychological"],
        synopsis: "Self-proclaimed mad scientist Rintaro Okabe accidentally invents a microwave that can send emails to the past, altering world lines.",
        curatorNote: "The quintessential time travel thriller with agonizing emotional stakes.",
        rating: 9.9,
        totalChapters: "24 Episodes",
      },
      {
        id: "c-item-orv",
        title: "Omniscient Reader's Viewpoint",
        author: "sing N song",
        contentType: ContentType.Webtoon,
        origin: ContentOrigin.Korean,
        coverRef: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
        genres: ["Apocalypse", "Supernatural", "Regression"],
        synopsis: "Kim Dokja, the sole reader of an obscure web novel, finds reality replaced by its brutal scenario quests alongside regressor Yoo Joonghyuk.",
        curatorNote: "A love letter to readers and regressors alike. 1864 rounds of sheer devotion.",
        rating: 9.8,
        totalChapters: "551 Web Novel / 220+ Webtoon",
      },
      {
        id: "c-item-perfect-run",
        title: "The Perfect Run",
        author: "Maxime J. Durand",
        contentType: ContentType.WebNovel,
        origin: ContentOrigin.Western,
        coverRef: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
        genres: ["Sci-Fi", "Superhero", "Comedy", "Time Loop"],
        synopsis: "Ryan 'Quicksave' Romano has the superpower to set a save point in time and reload whenever he dies in a madcap superhero city.",
        curatorNote: "Hilarious, heart-wrenching, and masterfully paced time loop antics.",
        rating: 9.6,
        totalChapters: "3 Volumes",
      },
      {
        id: "c-item-summertime",
        title: "Summertime Rendering",
        author: "Yasuki Tanaka",
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        coverRef: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80",
        genres: ["Mystery", "Supernatural", "Time Loop"],
        synopsis: "Shinpei returns to his isolated island hometown for his childhood friend's funeral, only to discover doppelganger 'shadows' mimicking locals.",
        curatorNote: "Fast-paced supernatural mystery where each loop gets shorter, increasing the panic.",
        rating: 9.4,
        totalChapters: "139 Chapters",
      },
    ],
  },
  {
    id: "comm-completed-webtoons",
    title: "Best Completed Webtoons (Zero Hiatus)",
    curator: {
      name: "ManhwaVault",
      handle: "@manhwavault",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      verified: true,
    },
    description: "Certified binge-ready manhwa & webtoons with complete final chapters. No waiting, no indefinite author hiatuses.",
    genres: ["Webtoon", "Action", "Supernatural", "Drama"],
    tags: ["Completed", "Binge-Ready", "Finished", "Manhwa"],
    followersCount: 23500,
    likesCount: 9400,
    updatedAt: "2026-10-05T08:00:00Z",
    items: [
      {
        id: "c-item-solo-leveling",
        title: "Solo Leveling",
        author: "Chugong, DUBU",
        contentType: ContentType.Webtoon,
        origin: ContentOrigin.Korean,
        coverRef: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80",
        genres: ["Action", "Fantasy", "Supernatural"],
        synopsis: "The world's weakest E-rank hunter Sung Jinwoo receives a secret quest after surviving a double dungeon slaughter.",
        curatorNote: "The landmark title that defined the global webtoon phenomenon. Fully finished.",
        rating: 9.4,
        totalChapters: "179 Chapters",
      },
      {
        id: "c-item-bastard",
        title: "Bastard",
        author: "Carnby Kim, Youngchan Hwang",
        contentType: ContentType.Webtoon,
        origin: ContentOrigin.Korean,
        coverRef: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&auto=format&fit=crop&q=80",
        genres: ["Thriller", "Psychological", "Horror"],
        synopsis: "There is a serial killer in my house. And he is my father.",
        curatorNote: "Incredible psychological suspense from start to finish.",
        rating: 9.7,
        totalChapters: "93 Chapters",
      },
      {
        id: "c-item-the-boxer",
        title: "The Boxer",
        author: "JH",
        contentType: ContentType.Webtoon,
        origin: ContentOrigin.Korean,
        coverRef: "https://images.unsplash.com/photo-1517438322307-e67111335449?w=400&auto=format&fit=crop&q=80",
        genres: ["Sports", "Psychological", "Drama"],
        synopsis: "Yu is an emotionless prodigy whose punches defy physics. But can the sweet science save a broken soul?",
        curatorNote: "A masterpiece of psychological trauma and salvation in sports fiction.",
        rating: 9.8,
        totalChapters: "104 Chapters",
      },
    ],
  },
  {
    id: "comm-cozy-fantasy",
    title: "Cozy Fantasy & Wholesome Escapes",
    curator: {
      name: "TeaAndTomes",
      handle: "@tea_and_tomes",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      verified: false,
    },
    description: "Low-stress, comforting narratives featuring warm fireplaces, found family, mouth-watering gourmet dishes, and gentle adventures.",
    genres: ["Fantasy", "Slice of Life", "Gourmet", "Comfort"],
    tags: ["Cozy", "Wholesome", "Food", "Found Family"],
    followersCount: 8900,
    likesCount: 3120,
    updatedAt: "2026-10-01T15:00:00Z",
    items: [
      {
        id: "c-item-dungeon-meshi",
        title: "Delicious in Dungeon (Dungeon Meshi)",
        author: "Ryoko Kui",
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        coverRef: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80",
        genres: ["Fantasy", "Comedy", "Gourmet"],
        synopsis: "When young adventurer Laios and his party are attacked by a dragon in the dungeon, they survive by cooking and eating monsters.",
        curatorNote: "Unbeatable ecology worldbuilding paired with delectable culinary art.",
        rating: 9.8,
        totalChapters: "97 Chapters (Complete)",
      },
      {
        id: "c-item-frieren",
        title: "Frieren: Beyond Journey's End",
        author: "Kanehito Yamada, Tsukasa Abe",
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        coverRef: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
        genres: ["Fantasy", "Adventure", "Drama"],
        synopsis: "The adventure is over, but life goes on for an elf mage just beginning to learn what living means.",
        curatorNote: "Warm, gentle, and profoundly touching meditation on time and memory.",
        rating: 9.9,
        totalChapters: "130+ Chapters",
      },
      {
        id: "c-item-apothecary",
        title: "The Apothecary Diaries",
        author: "Natsu Hyuuga, Nekokurage",
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        coverRef: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&auto=format&fit=crop&q=80",
        genres: ["Historical", "Mystery", "Medical"],
        synopsis: "Maomao, a pharmacist from the pleasure district, is sold into the imperial palace where her poison knowledge catches the eye of a high official.",
        curatorNote: "Delightful palace forensics with a uniquely eccentric protagonist.",
        rating: 9.6,
        totalChapters: "75+ Chapters",
      },
    ],
  },
];

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
