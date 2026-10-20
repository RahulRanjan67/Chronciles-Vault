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

const DEFAULT_FANFICTIONS: readonly FanfictionEntry[] = [];
const DEFAULT_VIDEO_EDITS: readonly VideoEditEntry[] = [];
const DEFAULT_FAN_ART: readonly FanArtEntry[] = [];

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
