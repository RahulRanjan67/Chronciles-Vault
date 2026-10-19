import { create } from "zustand";
import { clientRepository } from "../client-repository";
import {
  ContentType,
  PersonalState,
  WorkRelationType,
  Work,
  ContentOrigin,
  PublicationState,
  PrivacyState,
} from "@grimoire/domain";
import type { WorkId } from "@grimoire/shared";

export interface FanfictionEntry {
  readonly id: string;
  readonly workId: string; // Parent work ID (e.g. work-orv, work-berserk)
  readonly title: string;
  readonly author: string;
  readonly platform: "AO3" | "FanFiction.net" | "Wattpad" | "Original Sanctum";
  readonly sourceUrl: string;
  readonly summary: string;
  readonly wordCount: number;
  readonly chaptersCount: number;
  readonly rating: string; // e.g. "Teen", "Mature", "Explicit"
  readonly tags: readonly string[];
  readonly isPromotedToWork: boolean;
  readonly promotedWorkId?: string;
  readonly createdAt: string;
}

export interface VideoEditEntry {
  readonly id: string;
  readonly workId: string;
  readonly title: string;
  readonly editorName: string;
  readonly platform: "youtube" | "tiktok" | "instagram" | "local_video";
  readonly url: string;
  readonly audioTrack: string;
  readonly aspectRatio: "16:9" | "9:16";
  readonly notes?: string;
  readonly createdAt: string;
}

export interface FanArtEntry {
  readonly id: string;
  readonly workId: string;
  readonly title: string;
  readonly artistName: string;
  readonly imageUrl: string; // Data URL or Web URL
  readonly caption: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
}

const STORAGE_KEY = "cv:fan_creations_store:v1";

const DEFAULT_FANFICTIONS: readonly FanfictionEntry[] = [
  {
    id: "fanfic-orv-01",
    workId: "work-orv",
    title: "Rewrite the Star Stream (1864th Round Epilogue)",
    author: "ConstellationReader_99",
    platform: "AO3",
    sourceUrl: "https://archiveofourown.org/works/rewrite-star-stream",
    summary:
      "What if Kim Dokja did not become the Oldest Dream alone? An alternate 1864th round epilogue where the Company boards the subway train and rewrites the final chapter together.",
    wordCount: 184500,
    chaptersCount: 45,
    rating: "Teen",
    tags: ["Fix-It", "Found Family", "Alternate Ending", "Kim Dokja's Company"],
    isPromotedToWork: false,
    createdAt: "2026-09-12T10:00:00Z",
  },
  {
    id: "fanfic-berserk-01",
    workId: "work-vault-berserk-uncut",
    title: "The Moonlight Path to Falconia",
    author: "BlackSwordsmanScribe",
    platform: "AO3",
    sourceUrl: "https://archiveofourown.org/works/moonlight-path-falconia",
    summary:
      "A deep character study following Guts, Casca, and the Moonlight Boy on the shores of Skellig Island before the fateful encounter.",
    wordCount: 92400,
    chaptersCount: 22,
    rating: "Mature",
    tags: ["Dark Fantasy", "Healing", "Casca & Guts", "Canon Divergence"],
    isPromotedToWork: false,
    createdAt: "2026-09-20T14:30:00Z",
  },
  {
    id: "fanfic-sl-01",
    workId: "work-solo-leveling",
    title: "Monarch of the Silent Eclipse",
    author: "ShadowMonarchFan",
    platform: "FanFiction.net",
    sourceUrl: "https://fanfiction.net/s/monarch-silent-eclipse",
    summary:
      "An expansion on the Shadow Monarch's war across the dimensional gap, detailing Sung Jin-woo's 27-year campaign in the void.",
    wordCount: 120000,
    chaptersCount: 30,
    rating: "Teen",
    tags: ["Action", "Monarch Wars", "Worldbuilding", "Canon Compliant"],
    isPromotedToWork: false,
    createdAt: "2026-09-25T08:00:00Z",
  },
];

const DEFAULT_VIDEO_EDITS: readonly VideoEditEntry[] = [
  {
    id: "edit-orv-01",
    workId: "work-orv",
    title: "Kim Dokja — The Demon King of Salvation [Constellation Aura Edit]",
    editorName: "@dokja_edits",
    platform: "tiktok",
    url: "https://www.tiktok.com/@dokja_edits/video/71928391823",
    audioTrack: "DVRST - Close Eyes (Slowed + Reverb)",
    aspectRatio: "9:16",
    notes: "Over 2.4M views on BookTok. Iconic transition from scenario 1 to the Demon King selection.",
    createdAt: "2026-09-18T16:00:00Z",
  },
  {
    id: "edit-orv-02",
    workId: "work-orv",
    title: "ORV Webtoon Cinematic Movie Trailer AMV",
    editorName: "AuraEditsYT",
    platform: "youtube",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    audioTrack: "Hiroyuki Sawano - Perfect Time (Orchestral)",
    aspectRatio: "16:9",
    notes: "Official webtoon pan & zoom motion graphics with custom typography.",
    createdAt: "2026-09-22T19:00:00Z",
  },
  {
    id: "edit-berserk-01",
    workId: "work-vault-berserk-uncut",
    title: "Guts' Theme — 1997 Nostalgia Reel",
    editorName: "@berserk_seinen",
    platform: "instagram",
    url: "https://www.instagram.com/reels/berserk_theme_edit",
    audioTrack: "Susumu Hirasawa - Guts (Original Master)",
    aspectRatio: "9:16",
    notes: "High-contrast film grain aesthetic using the 1080p Blu-Ray master.",
    createdAt: "2026-09-28T12:00:00Z",
  },
  {
    id: "edit-takopi-01",
    workId: "work-takopi",
    title: "Takopi's Original Sin — The Camera in the Sunflower Field",
    editorName: "@animemood_clips",
    platform: "youtube",
    url: "https://www.youtube.com/watch?v=takopi_sunflower_reel",
    audioTrack: "Radwimps - Sparkle (Piano Solo)",
    aspectRatio: "16:9",
    notes: "Linked to local PC archive in C:\\Media\\Vault\\Downloads.",
    createdAt: "2026-10-02T11:00:00Z",
  },
];

const DEFAULT_FAN_ART: readonly FanArtEntry[] = [
  {
    id: "art-orv-01",
    workId: "work-orv",
    title: "The Fourth Wall and the Reader",
    artistName: "Blackbox0021",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    caption: "Concept illustration of Kim Dokja reading under the starry train ceiling.",
    tags: ["Digital Painting", "Kim Dokja", "Star Stream"],
    createdAt: "2026-09-15T14:00:00Z",
  },
  {
    id: "art-berserk-01",
    workId: "work-vault-berserk-uncut",
    title: "The Dragon Slayer in the Crimson Fog",
    artistName: "KentarouDisciple",
    imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
    caption: "Sumi-e ink brush painting of the Dragon Slayer blade resting in stone.",
    tags: ["Ink Brush", "Guts", "Dragon Slayer"],
    createdAt: "2026-09-24T18:00:00Z",
  },
];

export interface FanCreationsState {
  readonly fanfictions: readonly FanfictionEntry[];
  readonly videoEdits: readonly VideoEditEntry[];
  readonly fanArt: readonly FanArtEntry[];
  readonly getFanfictionsForWork: (workId: string) => readonly FanfictionEntry[];
  readonly getVideoEditsForWork: (workId: string) => readonly VideoEditEntry[];
  readonly getFanArtForWork: (workId: string) => readonly FanArtEntry[];
  readonly addFanfiction: (entry: Omit<FanfictionEntry, "id" | "isPromotedToWork" | "createdAt">) => FanfictionEntry;
  readonly promoteFanfictionToWork: (fanficId: string) => Work | null;
  readonly addVideoEdit: (entry: Omit<VideoEditEntry, "id" | "createdAt">) => VideoEditEntry;
  readonly addFanArt: (entry: Omit<FanArtEntry, "id" | "createdAt">) => FanArtEntry;
  readonly removeFanfiction: (id: string) => void;
  readonly removeVideoEdit: (id: string) => void;
  readonly removeFanArt: (id: string) => void;
}

export const useFanCreationsStore = create<FanCreationsState>((set, get) => {
  const loadInitial = () => {
    if (typeof window === "undefined") {
      return {
        fanfics: [...DEFAULT_FANFICTIONS],
        edits: [...DEFAULT_VIDEO_EDITS],
        art: [...DEFAULT_FAN_ART],
      };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.fanfics) && Array.isArray(parsed.edits)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return {
      fanfics: [...DEFAULT_FANFICTIONS],
      edits: [...DEFAULT_VIDEO_EDITS],
      art: [...DEFAULT_FAN_ART],
    };
  };

  const initial = loadInitial();

  const persist = (
    fanfics: readonly FanfictionEntry[],
    edits: readonly VideoEditEntry[],
    art: readonly FanArtEntry[],
  ) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ fanfics, edits, art }),
        );
      }
    } catch {
      // ignore
    }
  };

  return {
    fanfictions: initial.fanfics,
    videoEdits: initial.edits,
    fanArt: initial.art,

    getFanfictionsForWork: (workId: string) => {
      return get().fanfictions.filter((f) => f.workId === workId);
    },

    getVideoEditsForWork: (workId: string) => {
      return get().videoEdits.filter((e) => e.workId === workId);
    },

    getFanArtForWork: (workId: string) => {
      return get().fanArt.filter((a) => a.workId === workId);
    },

    addFanfiction: (entry) => {
      const created: FanfictionEntry = {
        ...entry,
        id: `fanfic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        isPromotedToWork: false,
        createdAt: new Date().toISOString(),
      };
      set((state) => {
        const next = [created, ...state.fanfictions];
        persist(next, state.videoEdits, state.fanArt);
        return { fanfictions: next };
      });
      return created;
    },

    promoteFanfictionToWork: (fanficId: string): Work | null => {
      const fanfic = get().fanfictions.find((f) => f.id === fanficId);
      if (!fanfic) return null;

      const parentItem = clientRepository.getItems().find((i) => i.work.id === fanfic.workId);
      const parentTitle = parentItem?.work.title ?? "Original Work";

      // 1. Create full-time Work in clientRepository
      const createdItem = clientRepository.createWork(
        {
          title: `[Fanfic] ${fanfic.title}`,
          alternativeTitles: [`${fanfic.title} (${fanfic.author})`],
          aliases: [fanfic.title],
          contentType: ContentType.Fanfiction,
          origin: ContentOrigin.Western,
          publicationState: PublicationState.Completed,
          privacyState: PrivacyState.Public,
          coverRef: parentItem?.work.coverRef ?? null,
          externalIds: [],
          description: `Promoted from Fanfiction section of "${parentTitle}". Original Author: ${fanfic.author} (${fanfic.platform}).\n\nSummary:\n${fanfic.summary}`,
          genres: ["Fanfiction", ...(fanfic.tags as string[])],
          tags: ["promoted-fanfic", fanfic.platform.toLowerCase(), fanfic.rating.toLowerCase()],
          creators: [
            {
              id: `creator-${Date.now()}`,
              workId: "" as WorkId,
              name: fanfic.author,
              role: "author",
              sortOrder: 0,
            },
          ],
          totalChapters: fanfic.chaptersCount,
        },
        PersonalState.Reading,
        { type: "chapter", chapter: 1, title: "Chapter 1" },
        fanfic.sourceUrl
          ? {
              label: `${fanfic.platform} Story Page`,
              url: fanfic.sourceUrl,
              provider: fanfic.platform,
            }
          : undefined,
      );

      // 2. Establish bidirectional WorkRelation linking promoted fanfic to original work
      clientRepository.linkWorkRelation(
        createdItem.work.id,
        fanfic.workId as WorkId,
        WorkRelationType.FanfictionOf,
        `Promoted fanfiction of ${parentTitle} by ${fanfic.author}`,
      );

      // 3. Mark fanfiction as promoted
      set((state) => {
        const next = state.fanfictions.map((f) =>
          f.id === fanficId
            ? { ...f, isPromotedToWork: true, promotedWorkId: createdItem.work.id }
            : f,
        );
        persist(next, state.videoEdits, state.fanArt);
        return { fanfictions: next };
      });

      return createdItem.work;
    },

    addVideoEdit: (entry) => {
      const created: VideoEditEntry = {
        ...entry,
        id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      set((state) => {
        const next = [created, ...state.videoEdits];
        persist(state.fanfictions, next, state.fanArt);
        return { videoEdits: next };
      });
      return created;
    },

    addFanArt: (entry) => {
      const created: FanArtEntry = {
        ...entry,
        id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      set((state) => {
        const next = [created, ...state.fanArt];
        persist(state.fanfictions, state.videoEdits, next);
        return { fanArt: next };
      });
      return created;
    },

    removeFanfiction: (id) => {
      set((state) => {
        const next = state.fanfictions.filter((f) => f.id !== id);
        persist(next, state.videoEdits, state.fanArt);
        return { fanfictions: next };
      });
    },

    removeVideoEdit: (id) => {
      set((state) => {
        const next = state.videoEdits.filter((e) => e.id !== id);
        persist(state.fanfictions, next, state.fanArt);
        return { videoEdits: next };
      });
    },

    removeFanArt: (id) => {
      set((state) => {
        const next = state.fanArt.filter((a) => a.id !== id);
        persist(state.fanfictions, state.videoEdits, next);
        return { fanArt: next };
      });
    },
  };
});
