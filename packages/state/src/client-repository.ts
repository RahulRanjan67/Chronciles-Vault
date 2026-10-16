/**
 * Client Storage & Repository Implementation for Chronicles Vault.
 *
 * Implements in-memory repository store with deterministic seeding
 * and optional localStorage persistence.
 */

import {
  WorkId,
  ReadingRelationshipId,
  AccessPathId,
  MemoryId,
  WorkRelationId,
  ArchiveRecordId,
  newId,
} from "@chronicles-vault/shared";
import {
  Work,
  WorkSummary,
  ContentType,
  ContentOrigin,
  PublicationState,
  PrivacyState,
  ReadingRelationship,
  PersonalState,
  ReadingPriority,
  ProgressEvent,
  ProgressMethod,
  ProgressConfidence,
  ProgressAnchor,
  AccessPath,
  AccessPathKind,
  AccessCapability,
  SourceHealth,
  WebAccessPath,
  LocalFileAccessPath,
  Memory,
  MemoryAsset,
  MemoryType,
  SpoilerLevel,
  UpdateEntry,
  UpdateCertainty,
  toWorkSummary,
  validateWorkInvariant,
  validateMemoryInvariant,
  type HealthMonitorState,
  WorkRelationType,
  WorkRelation,
  createWorkRelation,
  validateWorkRelationInvariant,
  ArchiveReason,
  ArchiveRecord,
  createArchiveRecord,
  validateArchiveRecordInvariant,
  DuplicateCandidate,
  MergeResolution,
  ExternalIdentifier,
  calculateTitleSimilarity,
  calculateUrlSimilarity,
} from "@chronicles-vault/domain";

const STORAGE_KEY = "cv:local_vault:v1";
const ARCHIVE_STORAGE_KEY = "cv:archive_records:v1";
const RELATIONS_STORAGE_KEY = "cv:work_relations:v1";

export interface MergeOptions {
  resolution?: Partial<MergeResolution>;
  preferredProgressWorkId?: WorkId;
  progressChoice?: "target" | "secondary" | "highest" | "custom";
  customAnchor?: ProgressAnchor;
  whyMergedNote?: string;
  preferredCoverWorkId?: WorkId;
}

export interface HydratedWorkItem {
  work: Work;
  relationship?: ReadingRelationship;
  accessPaths: AccessPath[];
  latestProgress?: ProgressEvent;
  memories: Memory[];
  updates: UpdateEntry[];
}

export interface MemoryGalleryRecord {
  readonly memory: Memory;
  readonly workTitle: string | null;
}

export type NewMemoryData = Omit<Memory, "id" | "workId" | "createdAt" | "updatedAt" | "assets"> & {
  readonly assets?: readonly Omit<MemoryAsset, "memoryId">[];
};

// ---------------------------------------------------------------------------
// Seed Data (Realistic Digital & Serialized Fiction Works)
// ---------------------------------------------------------------------------

export interface UserAccountProfile {
  id: string;
  username: string;
  displayName: string;
  role: string;
  localWatchDir?: string;
  isDemo?: boolean;
}

export const DEFAULT_USER_ACCOUNT: UserAccountProfile = {
  id: "account-owner",
  username: "Archivist",
  displayName: "Archivist",
  role: "Library Keeper",
};

export const AVAILABLE_USER_PROFILES: UserAccountProfile[] = [
  DEFAULT_USER_ACCOUNT,
  {
    id: "account-demouser1",
    username: "DemoUser1",
    displayName: "DemoUser1",
    role: "Sample Explorer & Collector",
    localWatchDir: "C:\\Users\\67rah\\Downloads\\watch",
    isDemo: true,
  },
  {
    id: "account-guest",
    username: "Guest",
    displayName: "Guest Explorer",
    role: "Visitor",
  },
];

export const DEMO_USER_ACCOUNT = AVAILABLE_USER_PROFILES[1]!;

export const DEFAULT_WORK_COVERS: Record<string, string> = {
  "work-orv": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx119257-Pi21aq3ey9GG.jpg",
  "work-frieren": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx118586-CXKgWikBFQgS.jpg",
  "work-dungeon-meshi": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx86082-MXizJxzbijdd.jpg",
  "work-tower-of-god": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx85143-23oup3ETbFJk.jpg",
  "work-lotm": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/b125291-5UbQcPd0JwiV.png",
  "work-chainsaw-man": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx105778-euxXZEIfDY2u.png",
  "work-tbate": "https://cdn.myanimelist.net/images/manga/2/236173.jpg",
  "work-solo-leveling": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx105398-b673Vt5ZSuz3.jpg",
  "work-vagabond": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx30656-9mW113O7rDnA.png",
  "work-apothecary-diaries": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/nx99022-Hh2WdyNgR8HM.jpg",
  "work-takopi": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx142600-7d7rV5p5m4c8.jpg",
  "work-gram-chikitsalay": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
  "work-the-revolutionaries": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80",
  "work-frieren-anime": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-n1fmjRv4Jlt5.jpg",
  "work-solo-leveling-anime": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx151807-m1gX3iwfIsLu.png",
  "work-arcane-series": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
  "work-severance-series": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
  "work-your-name-movie": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21519-XIr3PeczUjjF.png",
  "work-dune-two-movie": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
  "work-vault-berserk-uncut": "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx30002-7EzO7o21jzeF.jpg",
  "work-vault-chainsaw-reze": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx151657-3c7z2qG2p1w7.jpg",
  "work-vault-reverend-insanity": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
  "work-vault-edgerunners": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx120377-p2P2bH5g2L9O.jpg",
  "work-dungeon-crawler-carl-audio": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
};

function createInitialSeed(): HydratedWorkItem[] {
  const now = new Date();
  const dayMs = 86400000;

  const w1Id = "work-orv" as WorkId;
  const w1RelId = "rel-orv" as ReadingRelationshipId;
  const w1PathId = "path-orv-web" as AccessPathId;

  const w2Id = "work-frieren" as WorkId;
  const w2RelId = "rel-frieren" as ReadingRelationshipId;
  const w2PathId = "path-frieren-md" as AccessPathId;

  const w3Id = "work-dungeon-meshi" as WorkId;
  const w3RelId = "rel-meshi" as ReadingRelationshipId;
  const w3PathId = "path-meshi-local" as AccessPathId;

  const w4Id = "work-tower-of-god" as WorkId;
  const w4RelId = "rel-tog" as ReadingRelationshipId;
  const w4PathId = "path-tog-naver" as AccessPathId;

  const w5Id = "work-lotm" as WorkId;
  const w5RelId = "rel-lotm" as ReadingRelationshipId;
  const w5PathId = "path-lotm-web" as AccessPathId;

  const w6Id = "work-chainsaw-man" as WorkId;
  const w6RelId = "rel-csm" as ReadingRelationshipId;
  const w6PathId = "path-csm-plus" as AccessPathId;

  const w7Id = "work-tbate" as WorkId;
  const w7RelId = "rel-tbate" as ReadingRelationshipId;
  const w7PathId = "path-tbate-tapas" as AccessPathId;

  const w8Id = "work-solo-leveling" as WorkId;
  const w8RelId = "rel-sl" as ReadingRelationshipId;
  const w8PathId = "path-sl-kakao" as AccessPathId;

  const w9Id = "work-vagabond" as WorkId;
  const w9RelId = "rel-vagabond" as ReadingRelationshipId;
  const w9PathId = "path-vagabond-cbz" as AccessPathId;

  const w10Id = "work-apothecary-diaries" as WorkId;
  const w10RelId = "rel-apothecary" as ReadingRelationshipId;
  const w10PathId = "path-apothecary-epub" as AccessPathId;

  return [
    {
      work: {
        id: w1Id,
        title: "Omniscient Reader’s Viewpoint",
        description:
          "Only I know the end of this world. One day, ordinary office worker Kim Dokja finds himself stuck inside the apocalyptic web novel Three Ways to Survive the Apocalypse.",
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w1Id] ?? null,
        alternativeTitles: ["전지적 독자 시점", "ORV"],
        aliases: ["Dokja", "ORV"],
        externalIds: [{ provider: "anilist", externalId: "119257" }],
        genres: ["Action", "Fantasy", "System", "Apocalypse"],
        tags: ["Regression", "Constellations", "Smart Protagonist"],
        createdAt: new Date(now.getTime() - 180 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w1RelId,
        workId: w1Id,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 150 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 188, title: "Chapter 188" },
        preferredAccessPathId: w1PathId,
        createdAt: new Date(now.getTime() - 150 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w1PathId,
          workId: w1Id,
          kind: AccessPathKind.Web,
          provider: "Webtoons",
          label: "Official Webtoon Release",
          url: "https://www.webtoons.com/en/action/omniscient-reader/list?title_no=2154",
          capabilities: [AccessCapability.Read, AccessCapability.Updates],
          health: SourceHealth.Healthy,
          healthState: SourceHealth.Healthy,
          lastCheckedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "user_added" },
          createdAt: new Date(now.getTime() - 150 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        } as WebAccessPath,
      ],
      memories: [
        {
          id: "mem-orv-1" as MemoryId,
          workId: w1Id,
          type: MemoryType.Quote,
          title: "Prologue survival declaration",
          body: "There are three ways to survive in a ruined world. Now, I have forgotten a few, but one thing is certain: the fact that you who are reading this will survive.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.SpoilerFree,
          showInGlobalGallery: true,
          accessPathId: null,
          tags: ["quote", "prologue"],
          progressAnchor: { type: "chapter", chapter: 0 },
          assets: [],
          createdAt: new Date(now.getTime() - 140 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 140 * dayMs).toISOString(),
        },
        {
          id: "mem-orv-2" as MemoryId,
          workId: w1Id,
          type: MemoryType.PersonalNote,
          title: "Secretive Plotter Theory",
          body: "The Secretive Plotter definitely knows more than any normal constellation. The way he reacts to Dokja suggests he has witnessed countless regressions.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.Minor,
          showInGlobalGallery: false,
          accessPathId: null,
          tags: ["theory", "lore"],
          progressAnchor: { type: "chapter", chapter: 145 },
          assets: [],
          createdAt: new Date(now.getTime() - 30 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 30 * dayMs).toISOString(),
        },
      ],
      updates: [
        {
          detectedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
          workId: w1Id,
          label: "Chapter 195",
          certainty: UpdateCertainty.Confirmed,
          numericIndex: 195,
          sourceUrl: "https://webtoons.com",
        },
      ],
    },
    {
      work: {
        id: w2Id,
        title: "Frieren: Beyond Journey’s End",
        description:
          "The adventure is over, but life goes on for an elf mage just beginning to learn what living is all about.",
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w2Id] ?? null,
        alternativeTitles: ["葬送のフリーレン", "Sousou no Frieren"],
        aliases: ["Frieren"],
        externalIds: [{ provider: "anilist", externalId: "118556" }],
        genres: ["Fantasy", "Adventure", "Drama"],
        tags: ["Elf", "Magic", "Melancholy", "Time Passage"],
        createdAt: new Date(now.getTime() - 200 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w2RelId,
        workId: w2Id,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 190 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 124, title: "Chapter 124" },
        preferredAccessPathId: w2PathId,
        createdAt: new Date(now.getTime() - 190 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w2PathId,
          workId: w2Id,
          kind: AccessPathKind.Web,
          provider: "MangaDex",
          label: "MangaDex Scanlation Feed",
          url: "https://mangadex.org/title/b0b721ff-c388-4486-aa0f-c8b0e99e53b0",
          capabilities: [AccessCapability.Read, AccessCapability.Updates],
          health: SourceHealth.Healthy,
          healthState: SourceHealth.Healthy,
          lastCheckedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "user_added" },
          createdAt: new Date(now.getTime() - 190 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
        } as WebAccessPath,
      ],
      memories: [
        {
          id: "mem-frieren-1" as MemoryId,
          workId: w2Id,
          type: MemoryType.WhySaved,
          title: "Why I love this story",
          body: "The depiction of how time feels completely different for an elf compared to mortals hits so hard. Himmel’s smile when buying the ring was unforgettable.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.SpoilerFree,
          showInGlobalGallery: true,
          accessPathId: null,
          tags: ["reflection", "favorite"],
          progressAnchor: { type: "chapter", chapter: 30 },
          assets: [],
          createdAt: new Date(now.getTime() - 100 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 100 * dayMs).toISOString(),
        },
      ],
      updates: [
        {
          detectedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
          workId: w2Id,
          label: "Chapter 128",
          certainty: UpdateCertainty.Confirmed,
          numericIndex: 128,
          sourceUrl: "https://mangadex.org",
        },
      ],
    },
    {
      work: {
        id: w3Id,
        title: "Delicious in Dungeon (Dungeon Meshi)",
        description:
          "When young adventurer Laios and his company are attacked and soundly thrashed by a dragon deep in a dungeon, the party loses all its money and provisions.",
        contentType: ContentType.CBZ,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w3Id] ?? null,
        alternativeTitles: ["ダンジョン飯", "Dungeon Meshi"],
        aliases: ["Dungeon Meshi"],
        externalIds: [{ provider: "myanimelist", externalId: "85701" }],
        genres: ["Fantasy", "Comedy", "Cooking", "Gourmet"],
        tags: ["Monsters", "Ecology", "Worldbuilding"],
        createdAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 12 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w3RelId,
        workId: w3Id,
        personalState: PersonalState.Paused,
        priority: ReadingPriority.Normal,
        startedAt: new Date(now.getTime() - 100 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 40 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: new Date(now.getTime() - 40 * dayMs).toISOString(),
        stoppedReason: "Waiting to binge complete series offline",
        stoppedNote:
          "Stopped around chapter 52 when Senshi’s backstory was introduced. Need uninterrupted weekend to finish.",
        currentAnchor: { type: "chapter", chapter: 52, title: "Chapter 52: Dumplings 1" },
        preferredAccessPathId: w3PathId,
        createdAt: new Date(now.getTime() - 100 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 40 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w3PathId,
          workId: w3Id,
          kind: AccessPathKind.LocalFile,
          provider: "Local Storage",
          label: "Local CBZ Complete Archive",
          filePath: "D:/Manga/Dungeon Meshi/Vol 1-14.cbz",
          fileId: "file-meshi-cbz",
          format: "cbz",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 40 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk" },
          createdAt: new Date(now.getTime() - 100 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 40 * dayMs).toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [
        {
          id: "mem-meshi-1" as MemoryId,
          workId: w3Id,
          type: MemoryType.WhyStopped,
          title: "Reason for pausing",
          body: "Senshi’s griffin soup story was so emotional. I stopped here so I can binge the final 40 chapters in one sitting when I have free time.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.Minor,
          showInGlobalGallery: true,
          accessPathId: null,
          tags: ["pause-note", "senshi"],
          progressAnchor: { type: "chapter", chapter: 52 },
          assets: [],
          createdAt: new Date(now.getTime() - 40 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 40 * dayMs).toISOString(),
        },
      ],
      updates: [
        {
          detectedAt: new Date(now.getTime() - 10 * dayMs).toISOString(),
          workId: w3Id,
          label: "Chapter 97 (Final)",
          certainty: UpdateCertainty.Confirmed,
          numericIndex: 97,
        },
      ],
    },
    {
      work: {
        id: w4Id,
        title: "Tower of God",
        description:
          "What do you desire? Money and wealth? Honor and pride? Authority and power? Revenge? Or something that transcends them all? Whatever you desire—it’s here.",
        contentType: ContentType.Webtoon,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w4Id] ?? null,
        alternativeTitles: ["신의 탑", "Sin-ui Tap"],
        aliases: ["TOG"],
        externalIds: [{ provider: "webtoons", externalId: "95" }],
        genres: ["Action", "Fantasy", "Adventure", "Mystery"],
        tags: ["Shinsu", "Climbing", "Huge Cast", "Complex Politics"],
        createdAt: new Date(now.getTime() - 300 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w4RelId,
        workId: w4Id,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 250 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 610, title: "Season 3 Ep. 193" },
        preferredAccessPathId: w4PathId,
        createdAt: new Date(now.getTime() - 250 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w4PathId,
          workId: w4Id,
          kind: AccessPathKind.Web,
          provider: "Naver Webtoon",
          label: "Naver Webtoon Official",
          url: "https://comic.naver.com/webtoon/list?titleId=183559",
          capabilities: [AccessCapability.Read, AccessCapability.Updates],
          health: SourceHealth.Healthy,
          healthState: SourceHealth.Healthy,
          lastCheckedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "official" },
          createdAt: new Date(now.getTime() - 250 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        } as WebAccessPath,
      ],
      memories: [
        {
          id: "mem-tog-1" as MemoryId,
          workId: w4Id,
          type: MemoryType.Quote,
          title: "Khun Aguero Agnis motto",
          body: "I will not be ruled by anyone. I will create my own rules.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.Minor,
          showInGlobalGallery: true,
          accessPathId: null,
          tags: ["khun", "quote"],
          progressAnchor: { type: "chapter", chapter: 45 },
          assets: [],
          createdAt: new Date(now.getTime() - 200 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 200 * dayMs).toISOString(),
        },
      ],
      updates: [
        {
          detectedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
          workId: w4Id,
          label: "Chapter 614",
          certainty: UpdateCertainty.Confirmed,
          numericIndex: 614,
        },
      ],
    },
    {
      work: {
        id: w5Id,
        title: "Lord of the Mysteries",
        description:
          "With the rising of the steam and machinery, who can come close to being a Beyonder? Mysterious horrors whisper in the dark.",
        contentType: ContentType.WebNovel,
        origin: ContentOrigin.Chinese,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w5Id] ?? null,
        alternativeTitles: ["诡秘之主", "Guimi Zhi Zhu"],
        aliases: ["LOTM"],
        externalIds: [{ provider: "qidian", externalId: "1010868264" }],
        genres: ["Mystery", "Supernatural", "Steampunk", "Lovecraftian", "Fantasy"],
        tags: ["Tarot Club", "Potions", "Fools Journey", "Victorian"],
        createdAt: new Date(now.getTime() - 250 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 60 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w5RelId,
        workId: w5Id,
        personalState: PersonalState.Stalled,
        priority: ReadingPriority.Normal,
        startedAt: new Date(now.getTime() - 220 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 65 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: new Date(now.getTime() - 65 * dayMs).toISOString(),
        stoppedReason: "Hit complex volume 3 transition",
        stoppedNote:
          "Stopped around chapter 480 when Klein was living as Sherlock Moriarty. Plot got dense with Backlund smog investigation.",
        currentAnchor: {
          type: "chapter",
          chapter: 482,
          title: "Chapter 482: The Detective’s Deduction",
        },
        preferredAccessPathId: w5PathId,
        createdAt: new Date(now.getTime() - 220 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 65 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w5PathId,
          workId: w5Id,
          kind: AccessPathKind.Web,
          provider: "Webnovel / Qidian",
          label: "Official Translation Portal",
          url: "https://www.webnovel.com/book/lord-of-mysteries_11022733006234505",
          capabilities: [AccessCapability.Read, AccessCapability.Updates],
          health: SourceHealth.Healthy,
          healthState: SourceHealth.Healthy,
          lastCheckedAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 65 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "webnovel" },
          createdAt: new Date(now.getTime() - 220 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 65 * dayMs).toISOString(),
        } as WebAccessPath,
      ],
      memories: [
        {
          id: "mem-lotm-1" as MemoryId,
          workId: w5Id,
          type: MemoryType.Quote,
          title: "The Fool honorific name",
          body: "The Fool that doesn’t belong to this era; The Mysterious Ruler above the gray fog; The King of Yellow and Black who wields good luck.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.SpoilerFree,
          showInGlobalGallery: true,
          accessPathId: null,
          tags: ["honorific", "tarot-club"],
          progressAnchor: { type: "chapter", chapter: 15 },
          assets: [],
          createdAt: new Date(now.getTime() - 210 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 210 * dayMs).toISOString(),
        },
      ],
      updates: [],
    },
    {
      work: {
        id: w6Id,
        title: "Chainsaw Man",
        description:
          "Denji’s life of poverty is changed forever when he merges with his pet chainsaw devil, Pochita! Now he’s living in the big city and an official Devil Hunter.",
        contentType: ContentType.Manga,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w6Id] ?? null,
        alternativeTitles: ["チェンソーマン", "CSM"],
        aliases: ["CSM"],
        externalIds: [{ provider: "anilist", externalId: "105778" }],
        genres: ["Action", "Horror", "Supernatural", "Dark Fantasy"],
        tags: ["Devils", "Gore", "Wild Ride"],
        createdAt: new Date(now.getTime() - 180 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w6RelId,
        workId: w6Id,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 160 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 178, title: "Chapter 178" },
        preferredAccessPathId: w6PathId,
        createdAt: new Date(now.getTime() - 160 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w6PathId,
          workId: w6Id,
          kind: AccessPathKind.Web,
          provider: "MANGA Plus by SHUEISHA",
          label: "Manga Plus Simultaneous Release",
          url: "https://mangaplus.shueisha.co.jp/titles/100037",
          capabilities: [AccessCapability.Read, AccessCapability.Updates],
          health: SourceHealth.Healthy,
          healthState: SourceHealth.Healthy,
          lastCheckedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "official" },
          createdAt: new Date(now.getTime() - 160 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        } as WebAccessPath,
      ],
      memories: [],
      updates: [
        {
          detectedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
          workId: w6Id,
          label: "Chapter 179",
          certainty: UpdateCertainty.Confirmed,
          numericIndex: 179,
        },
      ],
    },
    {
      work: {
        id: w7Id,
        title: "The Beginning After the End",
        description:
          "King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power.",
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Western,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w7Id] ?? null,
        alternativeTitles: ["TBATE"],
        aliases: ["TBATE"],
        externalIds: [{ provider: "tapas", externalId: "tbate" }],
        genres: ["Action", "Adventure", "Fantasy", "Isekai"],
        tags: ["Reincarnation", "Mana Core", "Dragons"],
        createdAt: new Date(now.getTime() - 140 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 4 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w7RelId,
        workId: w7Id,
        personalState: PersonalState.Waiting,
        priority: ReadingPriority.Normal,
        startedAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 20 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 185, title: "Chapter 185" },
        preferredAccessPathId: w7PathId,
        createdAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 20 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w7PathId,
          workId: w7Id,
          kind: AccessPathKind.Web,
          provider: "Tapas",
          label: "Official Tapas Release",
          url: "https://tapas.io/series/tbate-comic",
          capabilities: [AccessCapability.Read, AccessCapability.Updates],
          health: SourceHealth.Healthy,
          healthState: SourceHealth.Healthy,
          lastCheckedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 20 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "tapas" },
          createdAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 20 * dayMs).toISOString(),
        } as WebAccessPath,
      ],
      memories: [],
      updates: [],
    },
    {
      work: {
        id: w8Id,
        title: "Solo Leveling",
        description:
          "In a world where hunters must battle deadly monsters to protect mankind from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a struggle for survival.",
        contentType: ContentType.Manhwa,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w8Id] ?? null,
        alternativeTitles: ["나 혼자만 레벨업", "Na Honjaman Rebeleop"],
        aliases: ["SL"],
        externalIds: [{ provider: "kakaopage", externalId: "solo-leveling" }],
        genres: ["Action", "Fantasy", "System"],
        tags: ["Shadow Monarch", "Necromancer", "OP Protagonist"],
        createdAt: new Date(now.getTime() - 400 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w8RelId,
        workId: w8Id,
        personalState: PersonalState.Completed,
        priority: ReadingPriority.Low,
        startedAt: new Date(now.getTime() - 350 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
        completedAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 200, title: "Epilogue Side Story 21" },
        preferredAccessPathId: w8PathId,
        createdAt: new Date(now.getTime() - 350 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w8PathId,
          workId: w8Id,
          kind: AccessPathKind.Web,
          provider: "KakaoPage",
          label: "Official Korean Webtoon",
          url: "https://page.kakao.com/content/50866481",
          capabilities: [AccessCapability.Read],
          health: SourceHealth.Healthy,
          healthState: SourceHealth.Healthy,
          lastCheckedAt: new Date(now.getTime() - 10 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "official" },
          createdAt: new Date(now.getTime() - 350 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 120 * dayMs).toISOString(),
        } as WebAccessPath,
      ],
      memories: [
        {
          id: "mem-sl-1" as MemoryId,
          workId: w8Id,
          type: MemoryType.Quote,
          title: "The Iconic Arise Command",
          body: "Arise.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.Minor,
          showInGlobalGallery: true,
          accessPathId: null,
          tags: ["arise", "iconic"],
          progressAnchor: { type: "chapter", chapter: 45 },
          assets: [],
          createdAt: new Date(now.getTime() - 300 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 300 * dayMs).toISOString(),
        },
      ],
      updates: [],
    },
    {
      work: {
        id: w9Id,
        title: "Vagabond",
        description:
          "Striving for enlightenment by way of the sword, Miyamoto Musashi is prepared to cut down anyone who stands in his path.",
        contentType: ContentType.CBZ,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Hiatus,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w9Id] ?? null,
        alternativeTitles: ["バガボンド"],
        aliases: ["Musashi"],
        externalIds: [{ provider: "myanimelist", externalId: "656" }],
        genres: ["Action", "Historical", "Martial Arts", "Philosophy"],
        tags: ["Samurai", "Musashi", "Masterpiece Artwork", "Farming Arc"],
        createdAt: new Date(now.getTime() - 90 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 15 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w9RelId,
        workId: w9Id,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.Normal,
        startedAt: new Date(now.getTime() - 80 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 15 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 215, title: "Chapter 215: The Spiral" },
        preferredAccessPathId: w9PathId,
        createdAt: new Date(now.getTime() - 80 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 15 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w9PathId,
          workId: w9Id,
          kind: AccessPathKind.LocalFile,
          provider: "Local Disk Archive",
          label: "Vagabond VizBig Editions (CBZ)",
          filePath: "D:/Manga/Vagabond/VizBig_1-12.cbz",
          fileId: "file-vagabond-cbz",
          format: "cbz",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 15 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk" },
          createdAt: new Date(now.getTime() - 80 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 15 * dayMs).toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [
        {
          id: "mem-vagabond-1" as MemoryId,
          workId: w9Id,
          type: MemoryType.Quote,
          title: "Takuan Soho wisdom",
          body: "Preoccupied with a single leaf, you won’t see the tree. Preoccupied with a single tree, you’ll miss the entire forest.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.SpoilerFree,
          showInGlobalGallery: true,
          accessPathId: null,
          tags: ["philosophy", "quote"],
          progressAnchor: { type: "chapter", chapter: 28 },
          assets: [],
          createdAt: new Date(now.getTime() - 70 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 70 * dayMs).toISOString(),
        },
      ],
      updates: [],
    },
    {
      work: {
        id: w10Id,
        title: "The Apothecary Diaries (Kusuriya no Hitorigoto)",
        description:
          "Maomao, a young woman trained in the art of herbal medicine, is forced to work as a lowly servant in the inner palace of the imperial court.",
        contentType: ContentType.EPUB,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS[w10Id] ?? null,
        alternativeTitles: ["薬屋のひとりごと", "Kusuriya no Hitorigoto"],
        aliases: ["Apothecary"],
        externalIds: [{ provider: "jnovel", externalId: "apothecary-diaries" }],
        genres: ["Mystery", "Historical", "Drama", "Medical"],
        tags: ["Poison Testing", "Imperial Palace", "Clever Protagonist"],
        createdAt: new Date(now.getTime() - 100 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: w10RelId,
        workId: w10Id,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.Normal,
        startedAt: new Date(now.getTime() - 60 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "epub_locator",
          cfi: "epubcfi(/6/14[xchapter_04]!/4/2/10/1:42)",
          percent: 68,
        },
        preferredAccessPathId: w10PathId,
        createdAt: new Date(now.getTime() - 60 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: w10PathId,
          workId: w10Id,
          kind: AccessPathKind.LocalFile,
          provider: "J-Novel Club EPUB",
          label: "Light Novel Vol 1-11 EPUB",
          filePath: "D:/Books/LightNovels/Apothecary_Diaries_Vol_11.epub",
          fileId: "file-apothecary-epub",
          format: "epub",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
          lastOpenedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk" },
          createdAt: new Date(now.getTime() - 60 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [
        {
          id: "mem-apothecary-1" as MemoryId,
          workId: w10Id,
          type: MemoryType.WhySaved,
          title: "Maomao’s obsession with poisons",
          body: "Her euphoric reaction when testing poisons on herself is both hilarious and morbidly fascinating. The detective deduction in the inner palace is top notch.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.SpoilerFree,
          showInGlobalGallery: true,
          accessPathId: null,
          tags: ["maomao", "favorite"],
          progressAnchor: { type: "chapter", chapter: 4 },
          assets: [],
          createdAt: new Date(now.getTime() - 50 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 50 * dayMs).toISOString(),
        },
      ],
      updates: [],
    },
    // ─── 11. TAKOPI'S ORIGINAL SIN (Local PC Anime Zip/Video in C:\Users\67rah\Downloads\watch) ───
    {
      work: {
        id: "work-takopi" as WorkId,
        title: "Takopi’s Original Sin (Season 1 — 1080p Dual Audio)",
        description:
          "Happian alien Takopi lands on Earth to spread happiness, meeting Shizuka Kuze—a young girl enduring relentless tragedy. Linked directly to DemoUser1's local PC download in C:\\Users\\67rah\\Downloads\\watch.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-takopi"] ?? null,
        alternativeTitles: ["タコピーの原罪", "Takopii no Genzai", "Takopis Original Sin S01"],
        aliases: ["Takopi"],
        externalIds: [{ provider: "anilist", externalId: "142600" }],
        genres: ["Psychological", "Drama", "Sci-Fi", "Tragedy"],
        tags: ["DemoUser1", "Local PC Video", "1080p Dual Audio", "Hindi-Japanese ESub", "Time Loop"],
        createdAt: new Date(now.getTime() - 14 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-takopi" as ReadingRelationshipId,
        workId: "work-takopi" as WorkId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 10 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 4,
          season: 1,
          timestampSeconds: 1120,
          title: "Ep 4 — To Make You Smile (18:40)",
        },
        preferredAccessPathId: "path-takopi-local" as AccessPathId,
        createdAt: new Date(now.getTime() - 10 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      },
      accessPaths: [
        {
          id: "path-takopi-local" as AccessPathId,
          workId: "work-takopi" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 PC Watch Folder",
          label: "Takopis.Original.Sin.S01.1080p.x264.Hindi.Japanese.Esubs.MoviesMod.org.zip (3.38 GB)",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Takopis.Original.Sin.S01.1080p.x264.Hindi.Japanese.Esubs.MoviesMod.org.zip",
          fileId: "file-takopi-s01-local",
          format: "zip/mp4",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk_demouser1" },
          createdAt: new Date(now.getTime() - 10 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [
        {
          id: "mem-takopi-1" as MemoryId,
          workId: "work-takopi" as WorkId,
          type: MemoryType.PersonalNote,
          title: "Timestamp 18:40 — Happy Camera Time-Rewind Scene",
          body: "DemoUser1 Local Video Note: The contrast between Takopi's innocent voice and the dark reality of Shizuka's home life is devastating. Dual-audio Japanese/Hindi ESub track synced cleanly at 1080p.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.Minor,
          showInGlobalGallery: true,
          accessPathId: "path-takopi-local" as AccessPathId,
          tags: ["DemoUser1", "timestamp", "anime", "local-video"],
          progressAnchor: { type: "episode", episode: 4, season: 1, timestampSeconds: 1120 },
          assets: [],
          createdAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        },
      ],
      updates: [],
    },
    // ─── 12. GRAM CHIKITSALAY S02 (Local PC Web Series in C:\Users\67rah\Downloads\watch) ───
    {
      work: {
        id: "work-gram-chikitsalay" as WorkId,
        title: "Gram Chikitsalay (Season 2 — 1080p WEB-DL 5.1)",
        description:
          "Heartfelt and chaotic rural medical drama following a young city doctor reviving a village health center. Linked directly to DemoUser1's local PC download in C:\\Users\\67rah\\Downloads\\watch.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Original,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-gram-chikitsalay"] ?? null,
        alternativeTitles: ["Gram Chikitsalay S02", "ग्राम चिकित्सालय"],
        aliases: ["Gram Chikitsalay"],
        externalIds: [],
        genres: ["Web Series", "Drama", "Comedy", "Medical"],
        tags: ["DemoUser1", "Web Series", "Local PC Video", "1080p Hindi 5.1 ESub"],
        createdAt: new Date(now.getTime() - 12 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-gram-chikitsalay" as ReadingRelationshipId,
        workId: "work-gram-chikitsalay" as WorkId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 9 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 5,
          season: 2,
          timestampSeconds: 1640,
          title: "S02E05 — Monsoon Outbreak (27:20)",
        },
        preferredAccessPathId: "path-gram-local" as AccessPathId,
        createdAt: new Date(now.getTime() - 9 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-gram-local" as AccessPathId,
          workId: "work-gram-chikitsalay" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 PC Watch Folder",
          label: "Gram.Chikitsalay.S02.1080p.Hindi.WEB-DL.5.1.ESub.x264-MoviesLeech.zip (3.76 GB)",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Gram.Chikitsalay.S02.1080p.Hindi.WEB-DL.5.1.ESub.x264-MoviesLeech.zip",
          fileId: "file-gram-s02-local",
          format: "zip/mkv",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk_demouser1" },
          createdAt: new Date(now.getTime() - 9 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 13. THE REVOLUTIONARIES S01 (Local PC Web Series in C:\Users\67rah\Downloads\watch) ───
    {
      work: {
        id: "work-the-revolutionaries" as WorkId,
        title: "The Revolutionaries (Season 1 — 1080p WEB-DL 5.1)",
        description:
          "Gripping historical thriller chronicling young underground freedom fighters who risked everything to dismantle imperial rule. Linked to DemoUser1's 9.06 GB local PC archive.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Original,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-the-revolutionaries"] ?? null,
        alternativeTitles: ["The Revolutionaries S01"],
        aliases: ["Revolutionaries"],
        externalIds: [],
        genres: ["Web Series", "Historical", "Thriller", "Action"],
        tags: ["DemoUser1", "Web Series", "Local PC Video", "9.06 GB Archive", "5.1 Surround"],
        createdAt: new Date(now.getTime() - 11 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-revolutionaries" as ReadingRelationshipId,
        workId: "work-the-revolutionaries" as WorkId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 8 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 3,
          season: 1,
          timestampSeconds: 2100,
          title: "S01E03 — The Midnight Manifesto (35:00)",
        },
        preferredAccessPathId: "path-revolutionaries-local" as AccessPathId,
        createdAt: new Date(now.getTime() - 8 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-revolutionaries-local" as AccessPathId,
          workId: "work-the-revolutionaries" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 PC Watch Folder",
          label: "The.Revolutionaries.S01.1080p.Hindi.WEB-DL.5.1.ESub.x264-MoviesLeech.zip (9.06 GB)",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\The.Revolutionaries.S01.1080p.Hindi.WEB-DL.5.1.ESub.x264-MoviesLeech.zip",
          fileId: "file-revolutionaries-s01-local",
          format: "zip/mkv",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk_demouser1" },
          createdAt: new Date(now.getTime() - 8 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 14. FRIEREN: BEYOND JOURNEY'S END (TV ANIME BD 1080P) ───
    {
      work: {
        id: "work-frieren-anime" as WorkId,
        title: "Frieren: Beyond Journey’s End (TV Anime — 1080p Blu-Ray)",
        description:
          "Madhouse's critically acclaimed anime adaptation of elven mage Frieren's journey to Aureole after the Demon King's defeat.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-frieren-anime"] ?? null,
        alternativeTitles: ["葬送のフリーレン", "Sousou no Frieren TV"],
        aliases: ["Frieren Anime"],
        externalIds: [{ provider: "anilist", externalId: "154587" }],
        genres: ["Anime", "Fantasy", "Adventure", "Drama"],
        tags: ["DemoUser1", "Madhouse", "Sakuga", "Local PC Video", "1080p FLAC"],
        createdAt: new Date(now.getTime() - 60 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-frieren-anime" as ReadingRelationshipId,
        workId: "work-frieren-anime" as WorkId,
        personalState: PersonalState.Completed,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 55 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
        completedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 28,
          season: 1,
          timestampSeconds: 1420,
          title: "Ep 28 — It Would Be Embarrassing When We Meet Again",
        },
        preferredAccessPathId: "path-frieren-anime-local" as AccessPathId,
        createdAt: new Date(now.getTime() - 55 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-frieren-anime-local" as AccessPathId,
          workId: "work-frieren-anime" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 Local Anime Archive",
          label: "Sousou.no.Frieren.S01E01-28.1080p.BluRay.DualAudio.mkv",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Sousou.no.Frieren.S01.1080p.BluRay.mkv",
          fileId: "file-frieren-anime-local",
          format: "mkv",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk_demouser1" },
          createdAt: new Date(now.getTime() - 55 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 15. SOLO LEVELING: ARISE FROM THE SHADOW (ANIME S02) ───
    {
      work: {
        id: "work-solo-leveling-anime" as WorkId,
        title: "Solo Leveling: Arise from the Shadow (Anime Season 2)",
        description:
          "A-1 Pictures anime adaptation of Sung Jinwoo's rise as the Shadow Monarch across the Demon Castle and Jeju Island Raid arcs.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Korean,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-solo-leveling-anime"] ?? null,
        alternativeTitles: ["Ore dake Level Up na Ken Season 2"],
        aliases: ["SL Anime"],
        externalIds: [{ provider: "anilist", externalId: "151807" }],
        genres: ["Anime", "Action", "Fantasy", "System"],
        tags: ["DemoUser1", "A-1 Pictures", "Sawano Hiroyuki OST", "Jeju Island Raid"],
        createdAt: new Date(now.getTime() - 40 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-sl-anime" as ReadingRelationshipId,
        workId: "work-solo-leveling-anime" as WorkId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 35 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 12,
          season: 2,
          timestampSeconds: 1295,
          title: "S02E12 — Exchange (Beru vs Jinwoo)",
        },
        preferredAccessPathId: "path-sl-anime-web" as AccessPathId,
        createdAt: new Date(now.getTime() - 35 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-sl-anime-web" as AccessPathId,
          workId: "work-solo-leveling-anime" as WorkId,
          kind: AccessPathKind.Web,
          provider: "Crunchyroll Simulcast",
          label: "Crunchyroll 1080p Stream",
          url: "https://www.crunchyroll.com/series/GDKHZEJ0K/solo-leveling",
          capabilities: [AccessCapability.Read, AccessCapability.Updates],
          health: SourceHealth.Healthy,
          healthState: SourceHealth.Healthy,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "demouser1" },
          createdAt: new Date(now.getTime() - 35 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as WebAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 16. ARCANE: LEAGUE OF LEGENDS (WEB SERIES — 4K HDR) ───
    {
      work: {
        id: "work-arcane-series" as WorkId,
        title: "Arcane: League of Legends (Complete Web Series — 4K HDR)",
        description:
          "Fortiche's landmark animated web series set in utopian Piltover and the oppressed underground of Zaun, following sisters Vi and Jinx.",
        contentType: ContentType.Donghua,
        origin: ContentOrigin.Western,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-arcane-series"] ?? null,
        alternativeTitles: ["Arcane Season 1 & 2"],
        aliases: ["Arcane"],
        externalIds: [],
        genres: ["Web Series", "Sci-Fi", "Steampunk", "Action", "Drama"],
        tags: ["DemoUser1", "Web Series", "Fortiche", "4K HDR", "Masterpiece"],
        createdAt: new Date(now.getTime() - 45 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-arcane" as ReadingRelationshipId,
        workId: "work-arcane-series" as WorkId,
        personalState: PersonalState.Completed,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 45 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
        completedAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 9,
          season: 2,
          timestampSeconds: 2980,
          title: "S02E09 — The Dirt Under Your Nails",
        },
        preferredAccessPathId: "path-arcane-local" as AccessPathId,
        createdAt: new Date(now.getTime() - 45 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-arcane-local" as AccessPathId,
          workId: "work-arcane-series" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 PC Watch Folder",
          label: "Arcane.S02.2160p.WEB-DL.DDP5.1.Atmos.DV.HDR.mkv",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Arcane.S02.2160p.WEB-DL.HDR.mkv",
          fileId: "file-arcane-s02",
          format: "mkv",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk_demouser1" },
          createdAt: new Date(now.getTime() - 45 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 17. SEVERANCE (WEB SERIES — SEASON 2) ───
    {
      work: {
        id: "work-severance-series" as WorkId,
        title: "Severance (Season 2 — Sci-Fi Thriller Web Series)",
        description:
          "Mark leads a team of office workers at Lumon Industries whose memories have been surgically divided between their work and personal lives.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Western,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-severance-series"] ?? null,
        alternativeTitles: ["Severance Lumon S02"],
        aliases: ["Severance"],
        externalIds: [],
        genres: ["Web Series", "Sci-Fi", "Mystery", "Psychological Thriller"],
        tags: ["DemoUser1", "Web Series", "Lumon", "Mystery Box"],
        createdAt: new Date(now.getTime() - 30 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 4 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-severance" as ReadingRelationshipId,
        workId: "work-severance-series" as WorkId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 28 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 4 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 8,
          season: 2,
          timestampSeconds: 2450,
          title: "S02E08 — Sweet Vitriol",
        },
        preferredAccessPathId: "path-severance-local" as AccessPathId,
        createdAt: new Date(now.getTime() - 28 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 4 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-severance-local" as AccessPathId,
          workId: "work-severance-series" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 PC Watch Folder",
          label: "Severance.S02.1080p.ATVP.WEB-DL.DDP5.1.Atmos.mkv",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Severance.S02.1080p.WEB-DL.mkv",
          fileId: "file-severance-s02",
          format: "mkv",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk_demouser1" },
          createdAt: new Date(now.getTime() - 28 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 18. YOUR NAME / KIMI NO NA WA (4K UHD MOVIE) ───
    {
      work: {
        id: "work-your-name-movie" as WorkId,
        title: "Your Name. (Kimi no Na wa. — 4K UHD Remaster Movie)",
        description:
          "Makoto Shinkai's theatrical anime movie masterpiece about two teenagers bound across time and a falling comet.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-your-name-movie"] ?? null,
        alternativeTitles: ["君の名は。", "Kimi no Na wa"],
        aliases: ["Your Name Movie"],
        externalIds: [{ provider: "anilist", externalId: "21519" }],
        genres: ["Movie", "Anime", "Romance", "Supernatural", "Drama"],
        tags: ["DemoUser1", "Movie", "Makoto Shinkai", "4K UHD BluRay", "Local PC Video"],
        createdAt: new Date(now.getTime() - 90 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 6 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-your-name" as ReadingRelationshipId,
        workId: "work-your-name-movie" as WorkId,
        personalState: PersonalState.Completed,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 90 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 6 * dayMs).toISOString(),
        completedAt: new Date(now.getTime() - 6 * dayMs).toISOString(),
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 1,
          season: 1,
          timestampSeconds: 4462,
          title: "Feature Film — Kataware-doki Crater Scene (01:14:22)",
        },
        preferredAccessPathId: "path-your-name-local" as AccessPathId,
        createdAt: new Date(now.getTime() - 90 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 6 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-your-name-local" as AccessPathId,
          workId: "work-your-name-movie" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 PC Watch Folder",
          label: "Your.Name.2016.2160p.UHD.BluRay.TrueHD.5.1.x265.mkv",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Your.Name.2016.2160p.UHD.BluRay.mkv",
          fileId: "file-your-name-movie",
          format: "mkv",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk_demouser1" },
          createdAt: new Date(now.getTime() - 90 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 19. DUNE: PART TWO (2024 IMAX 1080P MOVIE) ───
    {
      work: {
        id: "work-dune-two-movie" as WorkId,
        title: "Dune: Part Two (2024 IMAX Edition — Feature Movie)",
        description:
          "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Western,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-dune-two-movie"] ?? null,
        alternativeTitles: ["Dune 2 IMAX"],
        aliases: ["Dune Part Two"],
        externalIds: [],
        genres: ["Movie", "Sci-Fi", "Adventure", "Epic"],
        tags: ["DemoUser1", "Movie", "IMAX 1080p", "Local PC Video", "Hans Zimmer"],
        createdAt: new Date(now.getTime() - 50 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 7 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-dune-two" as ReadingRelationshipId,
        workId: "work-dune-two-movie" as WorkId,
        personalState: PersonalState.Completed,
        priority: ReadingPriority.Normal,
        startedAt: new Date(now.getTime() - 50 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 7 * dayMs).toISOString(),
        completedAt: new Date(now.getTime() - 7 * dayMs).toISOString(),
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 1,
          season: 1,
          timestampSeconds: 5940,
          title: "Feature Film — Riding Shai-Hulud Sandworm (01:39:00)",
        },
        preferredAccessPathId: "path-dune-local" as AccessPathId,
        createdAt: new Date(now.getTime() - 50 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 7 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-dune-local" as AccessPathId,
          workId: "work-dune-two-movie" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 PC Watch Folder",
          label: "Dune.Part.Two.2024.IMAX.1080p.BluRay.Atmos.mkv",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Dune.Part.Two.2024.IMAX.1080p.mkv",
          fileId: "file-dune-two-movie",
          format: "mkv",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "local_disk_demouser1" },
          createdAt: new Date(now.getTime() - 50 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 20. HIDDEN VAULT WORK #1: BERSERK UNCUT (SEALED IN DEMOUSER1 VAULT) ───
    {
      work: {
        id: "work-vault-berserk-uncut" as WorkId,
        title: "Berserk: The Golden Age Memorial Uncut (1080p Local Vault)",
        description:
          "[HIDDEN VAULT ARCHIVE — DEMOUSER1] Uncut Blu-Ray collector's edition of Kentaro Miura's Golden Age Arc & Eclipse chapters. Concealed when Vault is locked.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Vault,
        coverRef: DEFAULT_WORK_COVERS["work-vault-berserk-uncut"] ?? null,
        alternativeTitles: ["ベルセルク 黄金時代篇"],
        aliases: ["Berserk Uncut"],
        externalIds: [],
        genres: ["Dark Fantasy", "Seinen", "Action", "Tragedy"],
        tags: ["DemoUser1", "Hidden Vault", "Uncut BD", "Local PC Video", "Mature"],
        createdAt: new Date(now.getTime() - 25 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-vault-berserk" as ReadingRelationshipId,
        workId: "work-vault-berserk-uncut" as WorkId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 20 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 11,
          season: 1,
          timestampSeconds: 980,
          title: "Ep 11 — The Eclipse (Uncut Vault Master)",
        },
        preferredAccessPathId: "path-vault-berserk" as AccessPathId,
        createdAt: new Date(now.getTime() - 20 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-vault-berserk" as AccessPathId,
          workId: "work-vault-berserk-uncut" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 Encrypted Vault Drive",
          label: "Berserk.Golden.Age.Uncut.1080p.BD.DualAudio.mkv",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Berserk.Golden.Age.Uncut.1080p.mkv",
          fileId: "file-vault-berserk",
          format: "mkv",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "vault_demouser1" },
          createdAt: new Date(now.getTime() - 20 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 21. HIDDEN VAULT WORK #2: CHAINSAW MAN — REZE ARC MOVIE (SEALED IN VAULT) ───
    {
      work: {
        id: "work-vault-chainsaw-reze" as WorkId,
        title: "Chainsaw Man — The Movie: Reze Arc (Private Keyframe Cut)",
        description:
          "[HIDDEN VAULT ARCHIVE — DEMOUSER1] MAPPA theatrical movie cut & private storyboard archive of Denji and Reze (Bomb Devil). Concealed when Vault is locked.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Vault,
        coverRef: DEFAULT_WORK_COVERS["work-vault-chainsaw-reze"] ?? null,
        alternativeTitles: ["劇場版 チェンソーマン レゼ篇"],
        aliases: ["CSM Reze Movie"],
        externalIds: [],
        genres: ["Movie", "Anime", "Action", "Romance", "Dark Fantasy"],
        tags: ["DemoUser1", "Hidden Vault", "Movie", "MAPPA", "Local PC Video"],
        createdAt: new Date(now.getTime() - 18 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-vault-reze" as ReadingRelationshipId,
        workId: "work-vault-chainsaw-reze" as WorkId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 15 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 1,
          season: 1,
          timestampSeconds: 1840,
          title: "Movie Reel 02 — Midnight School Pool Scene (30:40)",
        },
        preferredAccessPathId: "path-vault-reze" as AccessPathId,
        createdAt: new Date(now.getTime() - 15 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-vault-reze" as AccessPathId,
          workId: "work-vault-chainsaw-reze" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 Encrypted Vault Drive",
          label: "Chainsaw.Man.Reze.Arc.Movie.1080p.RawCut.mp4",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Chainsaw.Man.Reze.Movie.1080p.mp4",
          fileId: "file-vault-reze",
          format: "mp4",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "vault_demouser1" },
          createdAt: new Date(now.getTime() - 15 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 22. HIDDEN VAULT WORK #3: REVEREND INSANITY (UNCENSORED 2334 CH EPUB) ───
    {
      work: {
        id: "work-vault-reverend-insanity" as WorkId,
        title: "Reverend Insanity (Gu Zhen Ren — Uncensored 2334 Ch. Vault EPUB)",
        description:
          "[HIDDEN VAULT ARCHIVE — DEMOUSER1] Fang Yuan's ruthless 500-year demonic cultivation chronicle via the Spring Autumn Cicada. Preserved offline in DemoUser1's private vault.",
        contentType: ContentType.WebNovel,
        origin: ContentOrigin.Chinese,
        publicationState: PublicationState.Hiatus,
        privacyState: PrivacyState.Vault,
        coverRef: DEFAULT_WORK_COVERS["work-vault-reverend-insanity"] ?? null,
        alternativeTitles: ["蠱真人", "Master of Gu"],
        aliases: ["RI", "Gu Zhen Ren"],
        externalIds: [],
        genres: ["Dark Xianxia", "Cultivation", "Philosophy", "Strategy"],
        tags: ["DemoUser1", "Hidden Vault", "Villain Protagonist", "Uncensored EPUB"],
        createdAt: new Date(now.getTime() - 35 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-vault-ri" as ReadingRelationshipId,
        workId: "work-vault-reverend-insanity" as WorkId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 30 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "chapter",
          chapter: 1285,
          title: "Ch. 1285 — Perseverance (Reverse Flow River)",
        },
        preferredAccessPathId: "path-vault-ri" as AccessPathId,
        createdAt: new Date(now.getTime() - 30 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-vault-ri" as AccessPathId,
          workId: "work-vault-reverend-insanity" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 Encrypted Vault Drive",
          label: "Reverend_Insanity_Complete_1-2334_Uncensored.epub",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Reverend_Insanity_1-2334.epub",
          fileId: "file-vault-ri",
          format: "epub",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "vault_demouser1" },
          createdAt: new Date(now.getTime() - 30 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 23. HIDDEN VAULT WORK #4: CYBERPUNK: EDGERUNNERS (UNCENSORED BD 1080P) ───
    {
      work: {
        id: "work-vault-edgerunners" as WorkId,
        title: "Cyberpunk: Edgerunners (Uncensored BD 1080p Dual Audio)",
        description:
          "[HIDDEN VAULT ARCHIVE — DEMOUSER1] Studio Trigger's high-octane Night City anime web series following David Martinez and Lucy. Stored in DemoUser1's private vault.",
        contentType: ContentType.Anime,
        origin: ContentOrigin.Japanese,
        publicationState: PublicationState.Completed,
        privacyState: PrivacyState.Vault,
        coverRef: DEFAULT_WORK_COVERS["work-vault-edgerunners"] ?? null,
        alternativeTitles: ["サイバーパンク エッジランナーズ"],
        aliases: ["Edgerunners"],
        externalIds: [{ provider: "anilist", externalId: "120377" }],
        genres: ["Anime", "Web Series", "Cyberpunk", "Sci-Fi", "Action"],
        tags: ["DemoUser1", "Hidden Vault", "Studio Trigger", "Local PC Video", "1080p BD"],
        createdAt: new Date(now.getTime() - 22 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-vault-edgerunners" as ReadingRelationshipId,
        workId: "work-vault-edgerunners" as WorkId,
        personalState: PersonalState.Completed,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 22 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        completedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "episode",
          episode: 10,
          season: 1,
          timestampSeconds: 1380,
          title: "Ep 10 — My Moon My Man (I Really Want to Stay at Your House)",
        },
        preferredAccessPathId: "path-vault-edgerunners" as AccessPathId,
        createdAt: new Date(now.getTime() - 22 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-vault-edgerunners" as AccessPathId,
          workId: "work-vault-edgerunners" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 Encrypted Vault Drive",
          label: "Cyberpunk.Edgerunners.S01.1080p.Uncensored.BD.mkv",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\Cyberpunk.Edgerunners.S01.1080p.mkv",
          fileId: "file-vault-edgerunners",
          format: "mkv",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "vault_demouser1" },
          createdAt: new Date(now.getTime() - 22 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [],
      updates: [],
    },
    // ─── 24. DUNGEON CRAWLER CARL (AUDIOBOOK — SOUNDBOOTH THEATER) ───
    {
      work: {
        id: "work-dungeon-crawler-carl-audio" as WorkId,
        title: "Dungeon Crawler Carl (Audiobook — Soundbooth Theater Edition)",
        description:
          "Matt Dinniman's legendary LitRPG phenomenon narrated by Jeff Hays with a full cinematic soundscape. Follows Carl and Princess Donut through the World Dungeon.",
        contentType: ContentType.Audiobook,
        origin: ContentOrigin.Western,
        publicationState: PublicationState.Ongoing,
        privacyState: PrivacyState.Public,
        coverRef: DEFAULT_WORK_COVERS["work-dungeon-crawler-carl-audio"] ?? null,
        alternativeTitles: ["DCC: Book One Audio Immersion Tunnel"],
        aliases: ["DCC Audio", "Dungeon Crawler Carl"],
        externalIds: [{ provider: "audible", externalId: "B08V85WFKG" }],
        genres: ["Audiobook", "LitRPG", "Sci-Fi", "Dark Comedy", "Post-Apocalyptic"],
        tags: ["DemoUser1", "Audiobook", "Narrator: Jeff Hays", "Soundbooth Theater", "Princess Donut"],
        createdAt: new Date(now.getTime() - 14 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        deletedAt: null,
      },
      relationship: {
        id: "rel-dcc-audio" as ReadingRelationshipId,
        workId: "work-dungeon-crawler-carl-audio" as WorkId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.High,
        startedAt: new Date(now.getTime() - 14 * dayMs).toISOString(),
        lastActiveAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: {
          type: "audiobook",
          chapter: 14,
          track: 14,
          timestampSeconds: 1420,
          totalSeconds: 2740,
          narrator: "Jeff Hays",
          title: "Track 14 — Floor 3: Overcooked Crawlers",
        },
        preferredAccessPathId: "path-dcc-soundbooth" as AccessPathId,
        createdAt: new Date(now.getTime() - 14 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
      },
      accessPaths: [
        {
          id: "path-dcc-soundbooth" as AccessPathId,
          workId: "work-dungeon-crawler-carl-audio" as WorkId,
          kind: AccessPathKind.Web,
          provider: "Soundbooth Theater",
          label: "Soundbooth Theater Immersion Stream",
          url: "https://soundbooththeater.com/series/dungeon-crawler-carl/",
          capabilities: [AccessCapability.Read, AccessCapability.Updates],
          health: SourceHealth.Healthy,
          healthState: SourceHealth.Healthy,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: true,
          provenance: { source: "soundbooth" },
          createdAt: new Date(now.getTime() - 14 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as WebAccessPath,
        {
          id: "path-dcc-local-audio" as AccessPathId,
          workId: "work-dungeon-crawler-carl-audio" as WorkId,
          kind: AccessPathKind.LocalFile,
          provider: "DemoUser1 Audiobooks Folder",
          label: "DCC_Book01_Soundbooth_Theater.m4b",
          filePath: "C:\\Users\\67rah\\Downloads\\watch\\DCC_Book01_Soundbooth_Theater.m4b",
          fileId: "file-dcc-audio-01",
          format: "m4b",
          capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
          health: SourceHealth.Local,
          healthState: SourceHealth.Local,
          lastCheckedAt: now.toISOString(),
          lastOpenedAt: now.toISOString(),
          isPreferred: false,
          provenance: { source: "local_disk_demouser1" },
          createdAt: new Date(now.getTime() - 14 * dayMs).toISOString(),
          updatedAt: now.toISOString(),
        } as LocalFileAccessPath,
      ],
      memories: [
        {
          id: "mem-dcc-1" as MemoryId,
          workId: "work-dungeon-crawler-carl-audio" as WorkId,
          type: MemoryType.Quote,
          title: "AI Announcement: Goddammit Donut",
          body: "New Achievement! You have entered the world dungeon wearing only pink boxers and a bathrobe. Reward: None. Put some pants on, Carl.",
          privacyState: PrivacyState.Public,
          spoilerLevel: SpoilerLevel.SpoilerFree,
          showInGlobalGallery: true,
          accessPathId: null,
          tags: ["jeff-hays", "achievement", "donut"],
          progressAnchor: {
            type: "audiobook",
            chapter: 1,
            track: 1,
            timestampSeconds: 320,
            narrator: "Jeff Hays",
          },
          assets: [],
          createdAt: new Date(now.getTime() - 13 * dayMs).toISOString(),
          updatedAt: new Date(now.getTime() - 13 * dayMs).toISOString(),
        },
      ],
      updates: [
        {
          detectedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
          workId: "work-dungeon-crawler-carl-audio" as WorkId,
          label: "Book 7 Audio Track Master Preview",
          certainty: UpdateCertainty.Confirmed,
          numericIndex: 7,
        },
      ],
    },
  ];
}

function createInitialRelationsSeed(): WorkRelation[] {
  const now = new Date().toISOString();
  return [
    {
      id: "rel-orv-lotm" as WorkRelationId,
      sourceWorkId: "work-orv" as WorkId,
      targetWorkId: "work-lotm" as WorkId,
      relationType: WorkRelationType.Related,
      notes: "Seminal modern web fantasy with constellation/cosmic entities.",
      description: "Seminal modern web fantasy with constellation/cosmic entities.",
      createdAt: now,
    },
    {
      id: "rel-apothecary-frieren" as WorkRelationId,
      sourceWorkId: "work-apothecary-diaries" as WorkId,
      targetWorkId: "work-frieren" as WorkId,
      relationType: WorkRelationType.Related,
      notes: "Rich period mystery & fantasy character study.",
      description: "Rich period mystery & fantasy character study.",
      createdAt: now,
    },
    {
      id: "rel-sl-orv" as WorkRelationId,
      sourceWorkId: "work-solo-leveling" as WorkId,
      targetWorkId: "work-orv" as WorkId,
      relationType: WorkRelationType.Related,
      notes: "Foundational Korean portal fantasy & system progression.",
      description: "Foundational Korean portal fantasy & system progression.",
      createdAt: now,
    },
    {
      id: "rel-frieren-manga-anime" as WorkRelationId,
      sourceWorkId: "work-frieren" as WorkId,
      targetWorkId: "work-frieren-anime" as WorkId,
      relationType: WorkRelationType.AdaptationOf,
      notes: "Manga Chapter 60 corresponds to Season 1 Episode 28 of the Madhouse Anime.",
      description: "Manga Chapter 60 corresponds to Season 1 Episode 28 of the Madhouse Anime.",
      createdAt: now,
    },
    {
      id: "rel-sl-manhwa-anime" as WorkRelationId,
      sourceWorkId: "work-solo-leveling" as WorkId,
      targetWorkId: "work-solo-leveling-anime" as WorkId,
      relationType: WorkRelationType.AdaptationOf,
      notes: "Manhwa Chapter 110 corresponds to Anime Season 2 Episode 12 (Jeju Island Raid).",
      description: "Manhwa Chapter 110 corresponds to Anime Season 2 Episode 12 (Jeju Island Raid).",
      createdAt: now,
    },
  ];
}

// ---------------------------------------------------------------------------
// Client Repository Singleton
// ---------------------------------------------------------------------------

export class ClientRepository {
  private items: Map<WorkId, HydratedWorkItem> = new Map();
  private archiveRecords: Map<ArchiveRecordId, ArchiveRecord> = new Map();
  private workRelations: Map<WorkRelationId, WorkRelation> = new Map();
  private readonly persistStorage: boolean;

  constructor(options?: { empty?: boolean }) {
    this.persistStorage = !options?.empty;
    if (!options?.empty) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    const seed = createInitialSeed();
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as HydratedWorkItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const item of parsed) {
              if (!item.work.coverRef && DEFAULT_WORK_COVERS[item.work.id]) {
                (item as { work: Work }).work = {
                  ...item.work,
                  coverRef: DEFAULT_WORK_COVERS[item.work.id]!,
                };
              }
              if (!item.work.tags.includes("DemoUser1")) {
                (item as { work: Work }).work = {
                  ...item.work,
                  tags: [...item.work.tags, "DemoUser1"],
                };
              }
              this.items.set(item.work.id, item);
            }
          }
        }

        const rawArchive = window.localStorage.getItem(ARCHIVE_STORAGE_KEY);
        if (rawArchive) {
          const parsedArchive = JSON.parse(rawArchive) as ArchiveRecord[];
          if (Array.isArray(parsedArchive)) {
            for (const rec of parsedArchive) {
              this.archiveRecords.set(rec.id, rec);
            }
          }
        }

        const rawRelations = window.localStorage.getItem(RELATIONS_STORAGE_KEY);
        if (rawRelations) {
          const parsedRelations = JSON.parse(rawRelations) as WorkRelation[];
          if (Array.isArray(parsedRelations)) {
            for (const rel of parsedRelations) {
              this.workRelations.set(rel.id, rel);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load Chronicles Vault cache from localStorage:", err);
      }
    }

    // Ensure all DemoUser1 seed works (including Anime, Web Series, Movies, Takopi & Vault works) exist
    let addedMissingSeed = false;
    for (const item of seed) {
      if (!item.work.tags.includes("DemoUser1")) {
        (item as { work: Work }).work = {
          ...item.work,
          tags: [...item.work.tags, "DemoUser1"],
        };
      }
      if (!this.items.has(item.work.id)) {
        this.items.set(item.work.id, item);
        addedMissingSeed = true;
      }
    }

    const seedRelations = createInitialRelationsSeed();
    for (const rel of seedRelations) {
      if (!this.workRelations.has(rel.id)) {
        this.workRelations.set(rel.id, rel);
        addedMissingSeed = true;
      }
    }

    if (addedMissingSeed) {
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    if (this.persistStorage && typeof window !== "undefined" && window.localStorage) {
      try {
        const arr = Array.from(this.items.values());
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        const archiveArr = Array.from(this.archiveRecords.values());
        window.localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archiveArr));
        const relationsArr = Array.from(this.workRelations.values());
        window.localStorage.setItem(RELATIONS_STORAGE_KEY, JSON.stringify(relationsArr));
      } catch (err) {
        console.warn("Failed to save Chronicles Vault state to localStorage:", err);
      }
    }
  }

  // Work queries
  public getItems(): HydratedWorkItem[] {
    return Array.from(this.items.values());
  }

  public getItem(id: WorkId): HydratedWorkItem | undefined {
    return this.items.get(id);
  }

  public getSummaries(): WorkSummary[] {
    return Array.from(this.items.values())
      .filter((i) => !i.work.deletedAt)
      .map((i) => toWorkSummary(i.work));
  }

  // Work mutations
  public createWork(
    workParams: Omit<Work, "id" | "createdAt" | "updatedAt" | "deletedAt">,
    initialState: PersonalState = PersonalState.Reading,
    initialAnchor?: ProgressAnchor,
    initialPath?: { provider: string; url?: string; label: string },
  ): HydratedWorkItem {
    validateWorkInvariant(workParams);
    const now = new Date().toISOString();
    const id = newId() as WorkId;
    const work: Work = {
      ...workParams,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const pathId = newId() as AccessPathId;
    const accessPaths: AccessPath[] = initialPath
      ? [
          {
            id: pathId,
            workId: id,
            kind: AccessPathKind.Web,
            provider: initialPath.provider,
            label: initialPath.label,
            url: initialPath.url ?? "",
            capabilities: [AccessCapability.Read, AccessCapability.Updates],
            health: SourceHealth.Healthy,
            healthState: SourceHealth.Healthy,
            lastCheckedAt: now,
            lastOpenedAt: now,
            isPreferred: true,
            provenance: { source: "work_creation" },
            createdAt: now,
            updatedAt: now,
          } as WebAccessPath,
        ]
      : [];

    const relId = newId() as ReadingRelationshipId;
    const relationship: ReadingRelationship = {
      id: relId,
      workId: id,
      personalState: initialState,
      priority: ReadingPriority.Normal,
      startedAt: initialState === PersonalState.Reading ? now : null,
      lastActiveAt: now,
      completedAt: initialState === PersonalState.Completed ? now : null,
      stoppedAt: null,
      stoppedReason: null,
      stoppedNote: null,
      currentAnchor: initialAnchor ?? { type: "chapter", chapter: 1, title: "Chapter 1" },
      preferredAccessPathId: accessPaths[0]?.id ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const item: HydratedWorkItem = {
      work,
      relationship,
      accessPaths,
      memories: [],
      updates: [],
    };

    this.items.set(id, item);
    this.saveToStorage();
    return item;
  }

  public updateWork(id: WorkId, patch: Partial<Omit<Work, "id" | "createdAt">>): Work {
    const item = this.items.get(id);
    if (!item) throw new Error(`Work with ID ${id} not found`);

    item.work = {
      ...item.work,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    validateWorkInvariant(item.work);
    this.saveToStorage();
    return item.work;
  }

  public deleteWork(id: WorkId): void {
    const item = this.items.get(id);
    if (item) {
      item.work = {
        ...item.work,
        deletedAt: new Date().toISOString(),
      };
      this.saveToStorage();
    }
  }

  // Reading relationship operations
  public updatePersonalState(
    workId: WorkId,
    state: PersonalState,
    stoppedReason?: string,
    stoppedNote?: string,
  ): ReadingRelationship {
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const now = new Date().toISOString();
    if (!item.relationship) {
      item.relationship = {
        id: newId() as ReadingRelationshipId,
        workId,
        personalState: state,
        priority: ReadingPriority.Normal,
        startedAt: state === PersonalState.Reading ? now : null,
        lastActiveAt: now,
        completedAt: state === PersonalState.Completed ? now : null,
        stoppedAt: state === PersonalState.Paused || state === PersonalState.Stalled ? now : null,
        stoppedReason: stoppedReason ?? null,
        stoppedNote: stoppedNote ?? null,
        currentAnchor: { type: "chapter", chapter: 1 },
        preferredAccessPathId: item.accessPaths[0]?.id ?? null,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      item.relationship = {
        ...item.relationship,
        personalState: state,
        lastActiveAt: now,
        completedAt: state === PersonalState.Completed ? now : item.relationship.completedAt,
        stoppedAt:
          state === PersonalState.Paused || state === PersonalState.Stalled
            ? now
            : item.relationship.stoppedAt,
        stoppedReason:
          stoppedReason !== undefined ? stoppedReason : item.relationship.stoppedReason,
        stoppedNote: stoppedNote !== undefined ? stoppedNote : item.relationship.stoppedNote,
        updatedAt: now,
      };
    }

    this.saveToStorage();
    return item.relationship;
  }

  public updateRelationship(
    workId: WorkId,
    patch: Partial<Omit<ReadingRelationship, "id" | "workId" | "createdAt">>,
  ): ReadingRelationship {
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const now = new Date().toISOString();
    if (!item.relationship) {
      item.relationship = {
        id: newId() as ReadingRelationshipId,
        workId,
        personalState: PersonalState.Reading,
        priority: ReadingPriority.Normal,
        startedAt: now,
        lastActiveAt: now,
        completedAt: null,
        stoppedAt: null,
        stoppedReason: null,
        stoppedNote: null,
        currentAnchor: { type: "chapter", chapter: 1 },
        preferredAccessPathId: item.accessPaths[0]?.id ?? null,
        ...patch,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      item.relationship = {
        ...item.relationship,
        ...patch,
        updatedAt: now,
      };
    }

    this.saveToStorage();
    return item.relationship;
  }

  public recordProgress(
    workId: WorkId,
    newAnchor: ProgressAnchor,
    method: ProgressMethod = ProgressMethod.Manual,
  ): ProgressEvent {
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const now = new Date().toISOString();
    const anchorBefore = item.relationship?.currentAnchor ?? null;

    const event: ProgressEvent = {
      id: newId(),
      workId,
      readingRelationshipId: item.relationship?.id,
      accessPathId: item.relationship?.preferredAccessPathId ?? undefined,
      method,
      confidence: ProgressConfidence.Confirmed,
      anchorBefore: anchorBefore ?? undefined,
      anchorAfter: newAnchor,
      createdAt: now,
    };

    if (item.relationship) {
      item.relationship = {
        ...item.relationship,
        currentAnchor: newAnchor,
        lastActiveAt: now,
        updatedAt: now,
      };
    }

    item.latestProgress = event;
    this.saveToStorage();
    return event;
  }

  // Access Path operations
  public addAccessPath(workId: WorkId, path: Omit<AccessPath, "id" | "workId">): AccessPath {
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const newPath = {
      ...path,
      id: newId() as AccessPathId,
      workId,
    } as AccessPath;

    if (newPath.isPreferred) {
      item.accessPaths = item.accessPaths.map((p) => ({
        ...p,
        isPreferred: false,
      })) as AccessPath[];
      if (item.relationship) {
        item.relationship = {
          ...item.relationship,
          preferredAccessPathId: newPath.id,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    item.accessPaths = [...item.accessPaths, newPath];
    this.saveToStorage();
    return newPath;
  }

  public setPreferredAccessPath(workId: WorkId, pathId: AccessPathId): void {
    const item = this.items.get(workId);
    if (!item) return;

    item.accessPaths = item.accessPaths.map((p) => ({
      ...p,
      isPreferred: p.id === pathId,
    })) as AccessPath[];

    if (item.relationship) {
      item.relationship = {
        ...item.relationship,
        preferredAccessPathId: pathId,
        updatedAt: new Date().toISOString(),
      };
    }
    this.saveToStorage();
  }

  public deleteAccessPath(workId: WorkId, pathId: AccessPathId): void {
    const item = this.items.get(workId);
    if (!item) return;

    item.accessPaths = item.accessPaths.filter((p) => p.id !== pathId);

    // If preferred access path was deleted, clear or fallback to next available
    if (item.relationship?.preferredAccessPathId === pathId) {
      const fallback = item.accessPaths.find((p) => p.isPreferred) ?? item.accessPaths[0] ?? null;
      item.relationship = {
        ...item.relationship,
        preferredAccessPathId: fallback?.id ?? null,
        updatedAt: new Date().toISOString(),
      };
    }

    // Work, relationship, memories, and progress remain 100% intact even with 0 access paths
    this.saveToStorage();
  }

  public updateAccessPathHealth(
    workId: WorkId,
    pathId: AccessPathId,
    monitorState: HealthMonitorState,
  ): AccessPath | null {
    const item = this.items.get(workId);
    if (!item) return null;

    const pathIndex = item.accessPaths.findIndex((p) => p.id === pathId);
    if (pathIndex === -1) return null;

    const currentPath = item.accessPaths[pathIndex];
    const now = new Date().toISOString();
    const updatedPath = {
      ...currentPath,
      health: monitorState.health,
      healthState: monitorState.health,
      lastCheckedAt: monitorState.lastCheckedAt ?? now,
      healthMonitorState: monitorState,
      updatedAt: now,
    } as AccessPath;

    item.accessPaths[pathIndex] = updatedPath;
    this.saveToStorage();
    return updatedPath;
  }

  // Memory operations
  public listMemories(): MemoryGalleryRecord[] {
    return Array.from(this.items.values())
      .filter((item) => !item.work.deletedAt)
      .flatMap((item) => item.memories.map((memory) => ({ memory, workTitle: item.work.title })))
      .sort((a, b) => b.memory.createdAt.localeCompare(a.memory.createdAt));
  }

  public addMemory(workId: WorkId, memory: NewMemoryData): Memory {
    if (memory.privacyState === PrivacyState.Vault) {
      throw new Error("Vault memories must be encrypted in the private vault repository.");
    }
    const item = this.items.get(workId);
    if (!item) throw new Error(`Work with ID ${workId} not found`);

    const now = new Date().toISOString();
    const id = newId() as MemoryId;
    const newMem: Memory = {
      ...memory,
      id,
      workId,
      accessPathId: memory.accessPathId ?? null,
      progressAnchor: memory.progressAnchor ?? null,
      assets: (memory.assets ?? []).map((asset) => ({ ...asset, memoryId: id })),
      tags: memory.tags ?? [],
      showInGlobalGallery: memory.showInGlobalGallery ?? true,
      createdAt: now,
      updatedAt: now,
    };
    validateMemoryInvariant(newMem);
    if (newMem.accessPathId && !item.accessPaths.some((path) => path.id === newMem.accessPathId)) {
      throw new Error("Memory access path must belong to its Work.");
    }

    item.memories = [...item.memories, newMem];
    this.saveToStorage();
    return newMem;
  }

  public updateMemory(
    memoryId: MemoryId,
    patch: Partial<
      Pick<
        Memory,
        | "title"
        | "body"
        | "tags"
        | "readingAttemptId"
        | "spoilerLevel"
        | "showInGlobalGallery"
        | "privacyState"
      >
    >,
  ): Memory {
    if (patch.privacyState === PrivacyState.Vault) {
      throw new Error("Vault memories must be encrypted in the private vault repository.");
    }
    for (const item of this.items.values()) {
      const index = item.memories.findIndex((memory) => memory.id === memoryId);
      if (index < 0) continue;
      const existing = item.memories[index];
      if (!existing) break;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      validateMemoryInvariant(updated);
      item.memories[index] = updated;
      this.saveToStorage();
      return updated;
    }
    throw new Error(`Memory with ID ${memoryId} not found.`);
  }

  public deleteMemory(memoryId: MemoryId): boolean {
    for (const item of this.items.values()) {
      const index = item.memories.findIndex((memory) => memory.id === memoryId);
      if (index < 0) continue;
      item.memories = item.memories.filter((memory) => memory.id !== memoryId);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Archive Operations
  // ---------------------------------------------------------------------------

  public archiveWork(
    workId: WorkId,
    reason: ArchiveReason,
    whyStoppedNote?: string,
  ): ArchiveRecord {
    const item = this.items.get(workId);
    if (!item) {
      throw new Error(`Work with ID ${workId} not found.`);
    }

    const now = new Date().toISOString();
    const record = createArchiveRecord({
      workId,
      reason,
      note: whyStoppedNote ?? null,
      previousState: item.relationship?.personalState ?? null,
      previousProgress: item.relationship?.currentAnchor ?? null,
      archivedAt: now,
    });

    this.archiveRecords.set(record.id, record);

    item.work = {
      ...item.work,
      deletedAt: now,
      updatedAt: now,
    };

    if (item.relationship) {
      item.relationship = {
        ...item.relationship,
        stoppedReason: reason,
        stoppedNote: whyStoppedNote ?? null,
        stoppedAt: now,
        updatedAt: now,
      };
    }

    this.saveToStorage();
    return record;
  }

  public restoreWork(workId: WorkId): Work {
    const item = this.items.get(workId);
    if (!item) {
      throw new Error(`Work with ID ${workId} not found.`);
    }

    item.work = {
      ...item.work,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage();
    return item.work;
  }

  public getArchiveRecords(): ArchiveRecord[] {
    return Array.from(this.archiveRecords.values());
  }

  public getArchivedWorks(): Array<{
    work: Work;
    record?: ArchiveRecord;
    relationship?: ReadingRelationship;
  }> {
    return Array.from(this.items.values())
      .filter((item) => Boolean(item.work.deletedAt))
      .map((item) => {
        const records = Array.from(this.archiveRecords.values())
          .filter((r) => r.workId === item.work.id)
          .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));
        return {
          work: item.work,
          record: records[0],
          relationship: item.relationship,
        };
      });
  }

  // ---------------------------------------------------------------------------
  // Work Relation Operations
  // ---------------------------------------------------------------------------

  public getWorkRelations(workId: WorkId): WorkRelation[] {
    return Array.from(this.workRelations.values()).filter(
      (rel) => rel.sourceWorkId === workId || rel.targetWorkId === workId,
    );
  }

  public getAllWorkRelations(): WorkRelation[] {
    return Array.from(this.workRelations.values());
  }

  public linkWorkRelation(
    sourceWorkId: WorkId,
    targetWorkId: WorkId,
    relationType: WorkRelationType,
    notes?: string,
  ): WorkRelation {
    validateWorkRelationInvariant({ sourceWorkId, targetWorkId });
    if (!this.items.has(sourceWorkId)) {
      throw new Error(`Source work ${sourceWorkId} not found.`);
    }
    if (!this.items.has(targetWorkId)) {
      throw new Error(`Target work ${targetWorkId} not found.`);
    }

    // Check if identical relation already exists
    const existing = Array.from(this.workRelations.values()).find(
      (r) =>
        r.sourceWorkId === sourceWorkId &&
        r.targetWorkId === targetWorkId &&
        r.relationType === relationType,
    );
    if (existing) {
      return existing;
    }

    const relation = createWorkRelation({
      sourceWorkId,
      targetWorkId,
      relationType,
      notes: notes ?? null,
    });

    this.workRelations.set(relation.id, relation);
    this.saveToStorage();
    return relation;
  }

  public removeWorkRelation(relationId: WorkRelationId): void {
    this.workRelations.delete(relationId);
    this.saveToStorage();
  }

  // ---------------------------------------------------------------------------
  // Deduplication & Merge Operations
  // ---------------------------------------------------------------------------

  public findDuplicates(workId: WorkId): DuplicateCandidate[] {
    const targetItem = this.items.get(workId);
    if (!targetItem) return [];

    const candidates: Map<string, DuplicateCandidate> = new Map();
    const targetWork = targetItem.work;
    const targetTitle = targetWork.title.trim().toLowerCase();

    for (const item of this.items.values()) {
      if (item.work.id === workId || item.work.deletedAt) continue;
      const candidateWork = item.work;
      let bestConfidence = 0.0;
      const matchedFields: string[] = [];

      // 1. External ID matches
      if (targetWork.externalIds.length > 0 && candidateWork.externalIds.length > 0) {
        for (const ext1 of targetWork.externalIds) {
          for (const ext2 of candidateWork.externalIds) {
            if (ext1.provider === ext2.provider && ext1.externalId === ext2.externalId) {
              bestConfidence = Math.max(bestConfidence, 0.99);
              matchedFields.push(`externalId:${ext1.provider}`);
            }
          }
        }
      }

      // 2. Primary title exact or similarity
      const candTitle = candidateWork.title.trim().toLowerCase();
      if (targetTitle === candTitle) {
        bestConfidence = Math.max(bestConfidence, 0.95);
        matchedFields.push("exact_title");
      } else {
        const sim = calculateTitleSimilarity(targetWork.title, candidateWork.title);
        if (sim >= 0.7) {
          bestConfidence = Math.max(bestConfidence, sim);
          matchedFields.push("title_similarity");
        }
      }

      // 3. Alternative titles & Aliases
      const allTargetAliases = [...targetWork.alternativeTitles, ...targetWork.aliases].map((a) =>
        a.trim().toLowerCase(),
      );
      const allCandAliases = [...candidateWork.alternativeTitles, ...candidateWork.aliases].map((a) =>
        a.trim().toLowerCase(),
      );

      for (const tAlias of allTargetAliases) {
        if (!tAlias) continue;
        if (candTitle === tAlias || allCandAliases.includes(tAlias)) {
          bestConfidence = Math.max(bestConfidence, 0.88);
          matchedFields.push("alias_match");
          break;
        }
      }

      for (const cAlias of allCandAliases) {
        if (!cAlias) continue;
        if (targetTitle === cAlias) {
          bestConfidence = Math.max(bestConfidence, 0.88);
          matchedFields.push("alias_match");
          break;
        }
      }

      // 4. Access Path URL similarity
      for (const p1 of targetItem.accessPaths) {
        const u1 = "url" in p1 ? (p1 as WebAccessPath).url : undefined;
        if (!u1) continue;
        for (const p2 of item.accessPaths) {
          const u2 = "url" in p2 ? (p2 as WebAccessPath).url : undefined;
          if (!u2) continue;
          const urlSim = calculateUrlSimilarity(u1, u2);
          if (urlSim >= 0.8) {
            bestConfidence = Math.max(bestConfidence, 0.9);
            matchedFields.push("access_url");
          }
        }
      }

      if (bestConfidence >= 0.4) {
        candidates.set(candidateWork.id, {
          work: toWorkSummary(candidateWork),
          confidence: Math.round(bestConfidence * 100) / 100,
          matchedFields: Array.from(new Set(matchedFields)),
        });
      }
    }

    return Array.from(candidates.values()).sort((a, b) => b.confidence - a.confidence);
  }

  public executeMerge(
    targetId: WorkId,
    secondaryId: WorkId,
    options?: MergeOptions,
  ): Work {
    if (targetId === secondaryId) {
      throw new Error("Cannot merge a work into itself.");
    }
    const targetItem = this.items.get(targetId);
    const secondaryItem = this.items.get(secondaryId);

    if (!targetItem || !secondaryItem) {
      throw new Error(`Target work (${targetId}) or secondary work (${secondaryId}) not found.`);
    }

    const now = new Date().toISOString();

    // 1. Reassign Access Paths (non-destructive union)
    const existingUrls = new Set(
      targetItem.accessPaths
        .map((p) =>
          "url" in p
            ? (p as WebAccessPath).url
            : "filePath" in p
              ? (p as LocalFileAccessPath).filePath
              : "",
        )
        .filter(Boolean),
    );

    const transferredPaths: AccessPath[] = [];
    for (const path of secondaryItem.accessPaths) {
      const urlOrPath =
        "url" in path
          ? (path as WebAccessPath).url
          : "filePath" in path
            ? (path as LocalFileAccessPath).filePath
            : "";
      if (!urlOrPath || !existingUrls.has(urlOrPath)) {
        transferredPaths.push({
          ...path,
          workId: targetId,
          isPreferred: false,
          updatedAt: now,
        });
        if (urlOrPath) existingUrls.add(urlOrPath);
      }
    }
    targetItem.accessPaths = [...targetItem.accessPaths, ...transferredPaths];

    // 2. Reassign Memories (non-destructive)
    const transferredMemories = secondaryItem.memories.map((m) => ({
      ...m,
      workId: targetId,
      updatedAt: now,
    }));
    targetItem.memories = [...targetItem.memories, ...transferredMemories];

    // 3. Reassign Work Relations
    for (const [relId, rel] of this.workRelations.entries()) {
      if (rel.sourceWorkId === secondaryId || rel.targetWorkId === secondaryId) {
        const newSource = rel.sourceWorkId === secondaryId ? targetId : rel.sourceWorkId;
        const newTarget = rel.targetWorkId === secondaryId ? targetId : rel.targetWorkId;
        if (newSource !== newTarget) {
          this.workRelations.set(relId, {
            ...rel,
            sourceWorkId: newSource,
            targetWorkId: newTarget,
          });
        } else {
          this.workRelations.delete(relId);
        }
      }
    }

    // 4. Progress Resolution
    const targetRel = targetItem.relationship;
    const secondaryRel = secondaryItem.relationship;

    let chosenAnchor: ProgressAnchor | null = targetRel?.currentAnchor ?? null;
    const targetChapter =
      targetRel?.currentAnchor &&
      "chapter" in targetRel.currentAnchor &&
      typeof targetRel.currentAnchor.chapter === "number"
        ? targetRel.currentAnchor.chapter
        : 0;
    const secChapter =
      secondaryRel?.currentAnchor &&
      "chapter" in secondaryRel.currentAnchor &&
      typeof secondaryRel.currentAnchor.chapter === "number"
        ? secondaryRel.currentAnchor.chapter
        : 0;

    if (options?.customAnchor) {
      chosenAnchor = options.customAnchor;
    } else if (
      options?.progressChoice === "secondary" ||
      options?.preferredProgressWorkId === secondaryId
    ) {
      chosenAnchor = secondaryRel?.currentAnchor ?? chosenAnchor;
    } else if (options?.progressChoice === "highest") {
      if (secChapter > targetChapter && secondaryRel?.currentAnchor) {
        chosenAnchor = secondaryRel.currentAnchor;
      }
    }

    if (!targetItem.relationship && secondaryItem.relationship) {
      targetItem.relationship = {
        ...secondaryItem.relationship,
        id: newId() as ReadingRelationshipId,
        workId: targetId,
        currentAnchor: chosenAnchor ?? secondaryItem.relationship.currentAnchor,
        updatedAt: now,
      };
    } else if (targetItem.relationship) {
      targetItem.relationship = {
        ...targetItem.relationship,
        currentAnchor: chosenAnchor ?? targetItem.relationship.currentAnchor,
        lastActiveAt: now,
        updatedAt: now,
      };
    }

    // 5. Merge Metadata (union of aliases, externalIds, genres, tags)
    const combinedAlt = Array.from(
      new Set([...targetItem.work.alternativeTitles, ...secondaryItem.work.alternativeTitles]),
    );
    const combinedAliases = Array.from(
      new Set([...targetItem.work.aliases, ...secondaryItem.work.aliases]),
    );
    const combinedGenres = Array.from(
      new Set([...targetItem.work.genres, ...secondaryItem.work.genres]),
    );
    const combinedTags = Array.from(
      new Set([...targetItem.work.tags, ...secondaryItem.work.tags]),
    );

    const extIdMap = new Map<string, ExternalIdentifier>();
    for (const ext of targetItem.work.externalIds) {
      extIdMap.set(`${ext.provider}:${ext.externalId}`, ext);
    }
    for (const ext of secondaryItem.work.externalIds) {
      extIdMap.set(`${ext.provider}:${ext.externalId}`, ext);
    }

    let coverRef = targetItem.work.coverRef;
    if (
      options?.preferredCoverWorkId === secondaryId ||
      (!coverRef && secondaryItem.work.coverRef)
    ) {
      coverRef = secondaryItem.work.coverRef;
    }

    targetItem.work = {
      ...targetItem.work,
      alternativeTitles: combinedAlt,
      aliases: combinedAliases,
      genres: combinedGenres,
      tags: combinedTags,
      externalIds: Array.from(extIdMap.values()),
      coverRef,
      updatedAt: now,
    };
    validateWorkInvariant(targetItem.work);

    // 6. Non-destructively archive the secondary work
    const archiveRecord = createArchiveRecord({
      workId: secondaryId,
      reason: ArchiveReason.Duplicate,
      note: options?.whyMergedNote ?? `Merged into ${targetItem.work.title} (${targetId})`,
      previousState: secondaryItem.relationship?.personalState ?? null,
      previousProgress: secondaryItem.relationship?.currentAnchor ?? null,
      archivedAt: now,
    });
    this.archiveRecords.set(archiveRecord.id, archiveRecord);

    secondaryItem.work = {
      ...secondaryItem.work,
      deletedAt: now,
      updatedAt: now,
    };
    secondaryItem.accessPaths = [];
    secondaryItem.memories = [];

    this.saveToStorage();
    return targetItem.work;
  }
}

// Global client repository singleton
export const clientRepository = new ClientRepository();
