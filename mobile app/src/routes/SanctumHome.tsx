import * as React from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  ExternalLink,
  Film,
  Flame,
  FolderGit2,
  Globe,
  HardDrive,
  KeyRound,
  LampDesk,
  Layers,
  Lock,
  MessageSquare,
  Plus,
  Radar,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Star,
  UserCheck,
  Zap,
} from "lucide-react";

export interface RoomProfile {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly motto: string;
  readonly accentColor: string;
  readonly themePreference: "midnight-arcana" | "parchment-ink" | "xianxia-realm";
}

const DEFAULT_ROOMS: readonly RoomProfile[] = [
  {
    id: "main-sanctum",
    name: "Archivist's Main Sanctum",
    title: "Grand Library & Multi-Medium Vault",
    motto: "Every chronicle, chapter anchor, and marginalia note kept forever.",
    accentColor: "#818cf8",
    themePreference: "midnight-arcana",
  },
  {
    id: "xianxia-pavilion",
    name: "Blossom Cultivation Pavilion",
    title: "Web Novels, Manhwa & Donghua Room",
    motto: "Ten thousand chapters of ascension without losing a single realm.",
    accentColor: "#fb7185",
    themePreference: "xianxia-realm",
  },
  {
    id: "scholar-study",
    name: "Candlelit Vellum Study",
    title: "Light Novels, EPUBs & Literary Archive",
    motto: "Warm ink, quiet annotations, and distraction-free deep reading.",
    accentColor: "#d97706",
    themePreference: "parchment-ink",
  },
];

export interface PopularSiteEntry {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly domain: string;
  readonly category: "manga" | "manhwa" | "novel" | "anime";
  readonly categoryLabel: string;
  readonly badge: string;
  readonly description: string;
  readonly languages: string;
}

const POPULAR_READING_SITES: readonly PopularSiteEntry[] = [
  // MANGA
  {
    id: "mangadex",
    name: "MangaDex",
    url: "https://mangadex.org",
    domain: "mangadex.org",
    category: "manga",
    categoryLabel: "Manga",
    badge: "Community Gold Standard",
    description: "Ad-free, community-driven scanlation and official simulpub hub with rich multi-language chapters.",
    languages: "Multi-language (EN/JP/ES/FR+)",
  },
  {
    id: "mangaplus",
    name: "MANGA Plus by SHUEISHA",
    url: "https://mangaplus.shueisha.co.jp",
    domain: "mangaplus.shueisha.co.jp",
    category: "manga",
    categoryLabel: "Manga",
    badge: "Official Simulpub",
    description: "Official global simultaneous releases of Weekly Shonen Jump & Jump+ series straight from Tokyo.",
    languages: "EN / ES / TH / ID / PT / FR",
  },
  {
    id: "viz-shonenjump",
    name: "VIZ Media / Shonen Jump",
    url: "https://www.viz.com/shonenjump",
    domain: "viz.com",
    category: "manga",
    categoryLabel: "Manga",
    badge: "Official Vault",
    description: "High-resolution digital vault of iconic Shonen Jump manga and graphic novel volumes.",
    languages: "English",
  },
  {
    id: "comick",
    name: "ComicK",
    url: "https://comick.io",
    domain: "comick.io",
    category: "manga",
    categoryLabel: "Manga",
    badge: "Fast Tracker & Reader",
    description: "High-speed manga and manhwa index with release tracking and multiple translation group comparison.",
    languages: "Multi-language",
  },
  {
    id: "bookwalker",
    name: "BOOK☆WALKER Global",
    url: "https://global.bookwalker.jp",
    domain: "global.bookwalker.jp",
    category: "manga",
    categoryLabel: "Manga & LN",
    badge: "Official Storefront",
    description: "Kadokawa's official digital bookstore for uncut Manga and Light Novel volumes.",
    languages: "English / Japanese",
  },
  {
    id: "batoto",
    name: "Bato.to",
    url: "https://bato.to",
    domain: "bato.to",
    category: "manga",
    categoryLabel: "Manga & Josei",
    badge: "Large Archive",
    description: "Expansive catalog of manga, otome isekai, josei, and full-color comics.",
    languages: "Multi-language",
  },

  // MANHWA & WEBTOONS
  {
    id: "webtoon",
    name: "WEBTOON",
    url: "https://www.webtoons.com",
    domain: "webtoons.com",
    category: "manhwa",
    categoryLabel: "Manhwa / Webtoon",
    badge: "Official Global #1",
    description: "The largest vertical-scroll webtoon platform featuring action fantasies, romances, and Canvas indies.",
    languages: "EN / KR / JP / ES / FR / TH",
  },
  {
    id: "tapas",
    name: "Tapas",
    url: "https://tapas.io",
    domain: "tapas.io",
    category: "manhwa",
    categoryLabel: "Manhwa & Novels",
    badge: "Official Portal",
    description: "Home to hit Korean manhwa adaptations (TBATE, Solo Leveling universe) and serialized web novels.",
    languages: "English",
  },
  {
    id: "tappytoon",
    name: "Tappytoon",
    url: "https://www.tappytoon.com",
    domain: "tappytoon.com",
    category: "manhwa",
    categoryLabel: "Manhwa",
    badge: "Official Simulpub",
    description: "Premium licensed Korean manhwa and light novels across action, regression, and fantasy romance.",
    languages: "EN / FR / DE",
  },
  {
    id: "manta",
    name: "Manta Comics",
    url: "https://manta.net",
    domain: "manta.net",
    category: "manhwa",
    categoryLabel: "Manhwa",
    badge: "Binge Subscription",
    description: "Flat-rate binge-reading catalog of exclusive Korean romance, fantasy, and thriller webtoons.",
    languages: "EN / ES / FR",
  },
  {
    id: "lezhin",
    name: "Lezhin Comics",
    url: "https://www.lezhinus.com",
    domain: "lezhinus.com",
    category: "manhwa",
    categoryLabel: "Manhwa",
    badge: "Mature & Action",
    description: "High-art Korean webtoons specializing in mature storytelling, action thrillers, and drama.",
    languages: "EN / KR / JP",
  },
  {
    id: "kakaopage",
    name: "KakaoPage",
    url: "https://page.kakao.com",
    domain: "page.kakao.com",
    category: "manhwa",
    categoryLabel: "Manhwa & K-Novels",
    badge: "Korean Origin Hub",
    description: "Original Korean powerhouse behind Solo Leveling, Return of the Mount Hua Sect, and SSS-Class Suicide Hunter.",
    languages: "Korean",
  },

  // WEB NOVELS & LIGHT NOVELS
  {
    id: "royalroad",
    name: "Royal Road",
    url: "https://www.royalroad.com",
    domain: "royalroad.com",
    category: "novel",
    categoryLabel: "Web Novel",
    badge: "LitRPG & Progression",
    description: "The premier Western web novel sanctuary for Progression Fantasy, LitRPG, Time Loops, and Sci-Fi epics.",
    languages: "English",
  },
  {
    id: "wuxiaworld",
    name: "Wuxiaworld",
    url: "https://www.wuxiaworld.com",
    domain: "wuxiaworld.com",
    category: "novel",
    categoryLabel: "Xianxia / K-Novel",
    badge: "Official Cultivation Hub",
    description: "Legendary home of licensed Chinese Xianxia/Wuxia cultivation novels and Korean fantasy translations.",
    languages: "English",
  },
  {
    id: "novelupdates",
    name: "NovelUpdates",
    url: "https://www.novelupdates.com",
    domain: "novelupdates.com",
    category: "novel",
    categoryLabel: "Novel Directory",
    badge: "Master Meta-Index",
    description: "Comprehensive directory, release feed, and tag encyclopedia for translated Asian web novels and light novels.",
    languages: "English Index (CN/JP/KR)",
  },
  {
    id: "ao3",
    name: "Archive of Our Own (AO3)",
    url: "https://archiveofourown.org",
    domain: "archiveofourown.org",
    category: "novel",
    categoryLabel: "Transformative & Original",
    badge: "Non-Profit Archive",
    description: "World-renowned tag-wrangled fiction archive with built-in 1-click EPUB/PDF/MOBI/HTML download.",
    languages: "All Languages",
  },
  {
    id: "webnovel",
    name: "Webnovel (Qidian Intl)",
    url: "https://www.webnovel.com",
    domain: "webnovel.com",
    category: "novel",
    categoryLabel: "Web Novel",
    badge: "Massive Serial Catalog",
    description: "Global platform for serialized Chinese cultivation novels, Lord of the Mysteries, and original system fiction.",
    languages: "English / Multi",
  },
  {
    id: "jnovelclub",
    name: "J-Novel Club",
    url: "https://j-novel.club",
    domain: "j-novel.club",
    category: "novel",
    categoryLabel: "Light Novel",
    badge: "Pre-Pub & DRM-Free EPUB",
    description: "Official Japanese Light Novel publisher offering weekly pre-publication chapters and DRM-free EPUBs.",
    languages: "English",
  },

  // ANIME & DONGHUA
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    url: "https://www.crunchyroll.com",
    domain: "crunchyroll.com",
    category: "anime",
    categoryLabel: "Anime",
    badge: "Global Simulcast",
    description: "World's largest dedicated anime streaming library with same-day Japanese broadcast simulcasts.",
    languages: "Sub & Dub (Multi)",
  },
  {
    id: "bilibili",
    name: "Bilibili Global",
    url: "https://www.bilibili.tv",
    domain: "bilibili.tv",
    category: "anime",
    categoryLabel: "Donghua & Anime",
    badge: "Official Donghua Hub",
    description: "Primary official streaming home for Chinese 2D/3D Donghua (Link Click, Fog Hill of Five Elements, Soul Land).",
    languages: "EN / ID / TH / VI / ES",
  },
  {
    id: "anilist",
    name: "AniList",
    url: "https://anilist.co",
    domain: "anilist.co",
    category: "anime",
    categoryLabel: "Anime & Manga DB",
    badge: "GraphQL Integrated",
    description: "Modern anime & manga database (connected directly to Chronicles Vault's 1-click Cover Art fetcher).",
    languages: "English",
  },
  {
    id: "myanimelist",
    name: "MyAnimeList (MAL)",
    url: "https://myanimelist.net",
    domain: "myanimelist.net",
    category: "anime",
    categoryLabel: "Anime & Manga DB",
    badge: "Encyclopedic DB",
    description: "Deep database of anime studios, voice actors, seasonal charts, and manga serializations.",
    languages: "English",
  },
  {
    id: "hidive",
    name: "HIDIVE",
    url: "https://www.hidive.com",
    domain: "hidive.com",
    category: "anime",
    categoryLabel: "Anime",
    badge: "Sentai Simulcasts",
    description: "Curated streaming service for exclusive seasonal anime simulcasts, uncut home video versions, and dubs.",
    languages: "English / Spanish / Portuguese",
  },
  {
    id: "muse-anione",
    name: "Muse Asia & Ani-One",
    url: "https://www.youtube.com/@MuseAsia",
    domain: "youtube.com/@MuseAsia",
    category: "anime",
    categoryLabel: "Anime (Free Official)",
    badge: "Official Free Simulcast",
    description: "Official licensed YouTube channels streaming full HD seasonal anime episodes legally for free.",
    languages: "English & Asian Subtitles",
  },
];

const LOADING_STAGES = [
  { threshold: 0, code: "01 // UNLOCKING SANCTUM DOORS", detail: "Mounting Room Profile & Atmospheric Theme Engine…" },
  { threshold: 26, code: "02 // LIGHTING ARCHIVE SHELVES", detail: "Hydrating Works, Progress Anchors & Reading Relationships…" },
  { threshold: 58, code: "03 // UNSEALING MARGINALIA & LORE", detail: "Indexing Quotes, Character Notebooks & Adaptation Graph…" },
  { threshold: 84, code: "04 // CALIBRATING LOCAL SHELF & VAULT", detail: "Preparing OPFS Ebook/Video Engine & AES-256 Seals…" },
  { threshold: 100, code: "05 // ROOM READY FOR ENTRY", detail: "Your personal fiction sanctum is fully hydrated and waiting." },
] as const;

export interface SanctumHomeProps {
  onEnterRoom: (targetRoute?: string) => void;
  onOpenFeaturesGuide: () => void;
  preloadWorkspace?: () => Promise<void>;
  platformMode?: "web" | "pc" | "mobile";
}

const ROOM_STORAGE_KEY = "cv:active_room_profile:v1";
const CUSTOM_ROOMS_STORAGE_KEY = "cv:custom_room_profiles:v1";

export function SanctumHome({
  onEnterRoom,
  onOpenFeaturesGuide,
  preloadWorkspace,
  platformMode = (import.meta.env?.VITE_PLATFORM_MODE as "web" | "pc" | "mobile" | undefined) ?? "web",
}: SanctumHomeProps) {
  const isWebFullHome = platformMode === "web";
  // ─── Loading & Session Hydration State ─────────────────────────
  const [progress, setProgress] = React.useState<number>(8);
  const [isRoomReady, setIsRoomReady] = React.useState<boolean>(false);
  const [isExitingToRoom, setIsExitingToRoom] = React.useState<boolean>(false);
  const [roomStats, setRoomStats] = React.useState<{
    worksCount: number;
    activeCount: number;
    memoriesCount: number;
    chaptersTracked: number;
  }>({
    worksCount: 12,
    activeCount: 5,
    memoriesCount: 18,
    chaptersTracked: 1420,
  });

  // ─── Room (User Profile) State ────────────────────────────────
  const [rooms, setRooms] = React.useState<readonly RoomProfile[]>(() => {
    if (typeof window === "undefined") return DEFAULT_ROOMS;
    try {
      const saved = window.localStorage.getItem(CUSTOM_ROOMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RoomProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ROOMS;
  });

  const [activeRoomId, setActiveRoomId] = React.useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_ROOMS[0]!.id;
    return window.localStorage.getItem(ROOM_STORAGE_KEY) || DEFAULT_ROOMS[0]!.id;
  });

  const [showCreateRoom, setShowCreateRoom] = React.useState(false);
  const [newRoomName, setNewRoomName] = React.useState("");
  const [newRoomTitle, setNewRoomTitle] = React.useState("");

  const activeRoom = React.useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? rooms[0]!,
    [rooms, activeRoomId],
  );

  // ─── Interactive 3D Room Mouse Parallax & Lamp State ──────────
  const [pointerTilt, setPointerTilt] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lampIntensity, setLampIntensity] = React.useState<"warm" | "bright" | "moonlight">("warm");

  // ─── Popular Sites Directory Filter State ─────────────────────
  const [siteCategory, setSiteCategory] = React.useState<"all" | "manga" | "manhwa" | "novel" | "anime">("all");
  const [siteSearch, setSiteSearch] = React.useState("");
  const [copiedSiteId, setCopiedSiteId] = React.useState<string | null>(null);
  const [capturedSiteId, setCapturedSiteId] = React.useState<string | null>(null);

  // ─── Background Preloading + Smooth Progress Ticker ───────────
  React.useEffect(() => {
    let cancelled = false;
    let preloadDone = false;

    const runPreload = async () => {
      try {
        // 1. Trigger WorkspaceShell chunk download in background
        const workspacePromise = preloadWorkspace ? preloadWorkspace() : Promise.resolve();

        // 2. Hydrate @chronicles-vault/state in background and extract live Room telemetry
        const stateModule = await import("@chronicles-vault/state");
        const items = stateModule.clientRepository.getItems().filter((i) => !i.work.deletedAt);
        let activeCount = 0;
        let memoriesCount = 0;
        let chaptersTracked = 0;

        for (const item of items) {
          const st = item.relationship?.personalState;
          if (st === "reading" || st === "watching" || st === "rereading") {
            activeCount += 1;
          }
          memoriesCount += item.memories.length;
          const anchor = item.relationship?.currentAnchor;
          if (anchor && "chapter" in anchor && typeof anchor.chapter === "number") {
            chaptersTracked += anchor.chapter;
          }
        }

        if (!cancelled) {
          setRoomStats({
            worksCount: items.length,
            activeCount,
            memoriesCount,
            chaptersTracked: Math.max(chaptersTracked, items.length * 42),
          });
        }

        await workspacePromise;
        preloadDone = true;
      } catch {
        preloadDone = true;
      }
    };

    void runPreload();

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        // Advance briskly; once preloadDone is true, leap smoothly to 100%
        const step = preloadDone ? 14 : prev < 75 ? 7 : 3;
        const next = Math.min(100, prev + step);
        if (next === 100 && !cancelled) {
          setIsRoomReady(true);
        }
        return next;
      });
    }, 65);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [preloadWorkspace]);

  // Press Enter to Enter Room once ready
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        isRoomReady &&
        !showCreateRoom &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        handleEnterRoom();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRoomReady, showCreateRoom]);

  const handleSelectRoom = (room: RoomProfile) => {
    setActiveRoomId(room.id);
    try {
      window.localStorage.setItem(ROOM_STORAGE_KEY, room.id);
      document.documentElement.setAttribute("data-theme", room.themePreference);
      window.localStorage.setItem("chronicles-vault-theme", room.themePreference);
    } catch {
      // ignore
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const created: RoomProfile = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim(),
      title: newRoomTitle.trim() || "Personal Reading Sanctum",
      motto: "Custom user profile room in Chronicles Vault.",
      accentColor: "#818cf8",
      themePreference: "midnight-arcana",
    };
    const nextRooms = [...rooms, created];
    setRooms(nextRooms);
    try {
      window.localStorage.setItem(CUSTOM_ROOMS_STORAGE_KEY, JSON.stringify(nextRooms));
    } catch {
      // ignore
    }
    handleSelectRoom(created);
    setNewRoomName("");
    setNewRoomTitle("");
    setShowCreateRoom(false);
  };

  const handleEnterRoom = (targetRoute?: string) => {
    setIsExitingToRoom(true);
    window.setTimeout(() => {
      onEnterRoom(targetRoute);
    }, 340);
  };

  const handleQuickCaptureSite = async (site: PopularSiteEntry) => {
    try {
      const stateMod = await import("@chronicles-vault/state");
      const now = new Date().toISOString();
      const batchId = `portal-capture-${Date.now()}`;
      stateMod.useRadarStore.getState().importBatch({
        format: "chronicles-vault-radar",
        version: 1,
        batchId,
        batchLabel: "Sanctum Portal Directory",
        browserSource: "unknown",
        capturedAt: now,
        items: [
          {
            id: `radar-portal-${site.id}-${Date.now()}`,
            url: site.url,
            normalizedUrl: site.url.toLowerCase(),
            title: `${site.name} (${site.categoryLabel} — ${site.badge})`,
            browserSource: "unknown",
            capturedAt: now,
            batchId,
            batchLabel: "Sanctum Portal Directory",
          },
        ],
      });
      setCapturedSiteId(site.id);
      window.setTimeout(() => setCapturedSiteId(null), 2200);
    } catch {
      // fallback
    }
  };

  const currentStage = React.useMemo(() => {
    for (let i = LOADING_STAGES.length - 1; i >= 0; i--) {
      if (progress >= LOADING_STAGES[i]!.threshold) {
        return LOADING_STAGES[i]!;
      }
    }
    return LOADING_STAGES[0]!;
  }, [progress]);

  const filteredSites = React.useMemo(() => {
    return POPULAR_READING_SITES.filter((site) => {
      if (siteCategory !== "all" && site.category !== siteCategory) return false;
      if (siteSearch.trim().length > 0) {
        const q = siteSearch.toLowerCase();
        return (
          site.name.toLowerCase().includes(q) ||
          site.domain.toLowerCase().includes(q) ||
          site.description.toLowerCase().includes(q) ||
          site.categoryLabel.toLowerCase().includes(q) ||
          site.badge.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [siteCategory, siteSearch]);

  const lampGlowColor =
    lampIntensity === "warm"
      ? "rgba(251, 191, 36, 0.28)"
      : lampIntensity === "bright"
        ? "rgba(244, 63, 94, 0.30)"
        : "rgba(99, 102, 241, 0.30)";

  return (
    <div
      className={`min-h-screen bg-[var(--cv-bg)] text-[var(--cv-text)] selection:bg-[var(--cv-accent-muted)] overflow-x-hidden ${
        isExitingToRoom ? "cv-room-exit-curtain" : ""
      }`}
      onMouseMove={(e) => {
        const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
        setPointerTilt({ x: nx, y: ny });
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          TOP FLOATING SANCTUM NAVIGATION BAR
         ═══════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-40 border-b border-[var(--cv-border)] backdrop-blur-md px-4 sm:px-8 h-16 flex items-center justify-between"
        style={{ backgroundColor: "var(--cv-glass-bg)" }}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] flex items-center justify-center shadow-sm">
            <Sparkles className="h-4 w-4 text-[var(--cv-accent-strong)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-cv-sm tracking-tight text-[var(--cv-text)]">
                Chronicles Vault
              </span>
              <span className="hidden sm:inline-block rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2 py-0.5 text-[10px] font-mono text-[var(--cv-accent-strong)]">
                SANCTUM LOBBY
              </span>
            </div>
            <p className="text-[11px] text-[var(--cv-text-muted)] hidden sm:block">
              Permanent Personal Reading &amp; Watching Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isWebFullHome && (
            <>
              <a
                href="#why-better"
                className="hidden md:inline-flex items-center gap-1.5 rounded-cv px-3 py-1.5 text-cv-xs font-medium text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:bg-[var(--cv-surface)]/60 transition-colors"
              >
                Why Chronicles Vault
              </a>
              <a
                href="#popular-portals"
                className="hidden md:inline-flex items-center gap-1.5 rounded-cv px-3 py-1.5 text-cv-xs font-medium text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:bg-[var(--cv-surface)]/60 transition-colors"
              >
                Popular Sites Directory
              </a>
              <button
                type="button"
                onClick={onOpenFeaturesGuide}
                className="inline-flex items-center gap-1.5 rounded-cv border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-3 py-1.5 text-cv-xs font-medium text-[var(--cv-text)] hover:bg-[var(--cv-surface-hover)] transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
                <span>32 Features &amp; Steps</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => handleEnterRoom()}
            className="inline-flex items-center gap-1.5 rounded-cv bg-[var(--cv-accent)] px-3.5 py-1.5 text-cv-xs font-semibold text-[var(--cv-accent-fg)] shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
          >
            <span>Enter My Room</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: HERO VIEWPORT — "LOADING YOUR ROOM" (AWWWARDS ROOM STAGE)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen pt-20 pb-12 px-4 sm:px-8 flex flex-col justify-between overflow-hidden">
        {/* Ambient Volumetric Lamp & Cursor-Following Spotlight */}
        <div
          className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            background: `radial-gradient(650px circle at ${50 + pointerTilt.x * 18}% ${
              42 + pointerTilt.y * 14
            }%, ${lampGlowColor}, transparent 72%)`,
          }}
        />

        {/* Floating Dust Motes / Arcane Embers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            { left: "14%", top: "24%", delay: "0s", size: 6 },
            { left: "28%", top: "62%", delay: "1.1s", size: 4 },
            { left: "46%", top: "18%", delay: "2.3s", size: 5 },
            { left: "66%", top: "30%", delay: "0.7s", size: 7 },
            { left: "78%", top: "58%", delay: "1.9s", size: 5 },
            { left: "86%", top: "22%", delay: "3.1s", size: 4 },
          ].map((mote, i) => (
            <span
              key={i}
              className="cv-mote absolute rounded-full"
              style={{
                left: mote.left,
                top: mote.top,
                width: mote.size,
                height: mote.size,
                animationDelay: mote.delay,
                backgroundColor: "var(--cv-accent-strong)",
                boxShadow: "0 0 12px var(--cv-accent)",
              }}
            />
          ))}
        </div>

        {/* Main Hero Grid: Left Telemetry & Room Profiles | Right 3D Interactive Reading Room */}
        <div className="relative z-10 max-w-7xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center py-6">
          {/* LEFT 6 COLS: Kinetic Preloader Telemetry, Room Profile Selector & Enter Button */}
          <div className="lg:col-span-6 space-y-6 cv-kinetic-enter">
            {/* Live Status Pill */}
            <div className="inline-flex flex-wrap items-center gap-2.5 rounded-full border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)]/90 px-3.5 py-1.5 shadow-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  isRoomReady
                    ? "bg-[var(--cv-success)] shadow-[0_0_10px_var(--cv-success)]"
                    : "bg-[var(--cv-warning)] animate-pulse"
                }`}
              />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--cv-accent-strong)] font-semibold">
                {isRoomReady ? "ROOM SESSION READY" : "LOADING YOUR ROOM IN BACKGROUND…"}
              </span>
              <span className="text-cv-xs font-mono font-bold text-[var(--cv-text)] border-l border-[var(--cv-border)] pl-2.5">
                {String(progress).padStart(2, "0")}%
              </span>
            </div>

            {/* Kinetic Display Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.12] text-[var(--cv-text)]">
                {isRoomReady ? (
                  <>
                    Your Reading Room Is Lit,{" "}
                    <span className="text-[var(--cv-accent-strong)]">{activeRoom.name}</span>.
                  </>
                ) : (
                  <>
                    Preparing Your Personal{" "}
                    <span className="text-[var(--cv-accent-strong)]">Reading Room</span>…
                  </>
                )}
              </h1>
              <p className="text-cv-sm sm:text-cv-base text-[var(--cv-text-muted)] leading-relaxed max-w-xl">
                {activeRoom.motto} While you explore this sanctum, your chronicles, chapter anchors,
                offline shelf books, and encrypted vault seals are hydrating seamlessly in the
                background.
              </p>
            </div>

            {/* Live Preloader Telemetry Progress Box */}
            <div className="rounded-cv-xl border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)]/90 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--cv-accent-strong)]">
                    {currentStage.code}
                  </div>
                  <div className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                    {currentStage.detail}
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-[var(--cv-text)]">
                  {String(progress).padStart(3, "0")}%
                </div>
              </div>

              {/* Animated Progress Track */}
              <div className="h-2.5 w-full rounded-full bg-[var(--cv-surface)] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-150 ease-out"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, var(--cv-accent), var(--cv-accent-strong))",
                    boxShadow: "0 0 16px var(--cv-accent)",
                  }}
                />
              </div>

              {/* Live Room Profile Stats Strip */}
              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[var(--cv-border)] text-center">
                <div className="p-2 rounded-cv bg-[var(--cv-surface)]/50">
                  <div className="text-cv-sm sm:text-cv-base font-bold font-mono text-[var(--cv-text)]">
                    {roomStats.worksCount}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-[var(--cv-text-subtle)]">
                    Chronicles
                  </div>
                </div>
                <div className="p-2 rounded-cv bg-[var(--cv-surface)]/50">
                  <div className="text-cv-sm sm:text-cv-base font-bold font-mono text-[var(--cv-accent-strong)]">
                    {roomStats.activeCount}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-[var(--cv-text-subtle)]">
                    Active Now
                  </div>
                </div>
                <div className="p-2 rounded-cv bg-[var(--cv-surface)]/50">
                  <div className="text-cv-sm sm:text-cv-base font-bold font-mono text-[var(--cv-text)]">
                    {roomStats.memoriesCount}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-[var(--cv-text-subtle)]">
                    Memories
                  </div>
                </div>
                <div className="p-2 rounded-cv bg-[var(--cv-surface)]/50">
                  <div className="text-cv-sm sm:text-cv-base font-bold font-mono text-[var(--cv-success)]">
                    {roomStats.chaptersTracked}+
                  </div>
                  <div className="text-[10px] font-mono uppercase text-[var(--cv-text-subtle)]">
                    Ch. Tracked
                  </div>
                </div>
              </div>

              {/* Primary CTA: Enter My Room (Unlocks at 100%, with instant bypass available) */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleEnterRoom()}
                  className={`flex-1 inline-flex items-center justify-center gap-2.5 rounded-cv-lg px-6 py-3.5 text-cv-sm sm:text-cv-base font-bold transition-all cursor-pointer ${
                    isRoomReady
                      ? "bg-[var(--cv-accent)] text-[var(--cv-accent-fg)] shadow-[0_0_28px_var(--cv-accent-muted)] hover:scale-[1.01]"
                      : "bg-[var(--cv-surface-raised)] text-[var(--cv-text)] border border-[var(--cv-border-strong)]"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isRoomReady ? "Enter My Room ✦" : `Loading Your Room (${progress}%)…`}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {isWebFullHome && (
                  <button
                    type="button"
                    onClick={onOpenFeaturesGuide}
                    className="inline-flex items-center justify-center gap-2 rounded-cv-lg border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-4 py-3.5 text-cv-xs sm:text-cv-sm font-semibold text-[var(--cv-text)] hover:bg-[var(--cv-surface-hover)] transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                    <span>Feature Guide (32)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Room (User Profile) Switcher & Custom Room Creator */}
            <div className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)]/75 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                  <span className="text-cv-xs font-semibold uppercase tracking-wider font-mono text-[var(--cv-text-muted)]">
                    Select Your Room (User Profile &amp; Atmosphere)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateRoom((v) => !v)}
                  className="inline-flex items-center gap-1 text-cv-xs font-medium text-[var(--cv-accent-strong)] hover:underline cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Room</span>
                </button>
              </div>

              {showCreateRoom && (
                <form
                  onSubmit={handleCreateRoom}
                  className="p-3 rounded-cv border border-[var(--cv-border-strong)] bg-[var(--cv-surface)]/70 flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Room Name (e.g. Late-Night Manhwa Den)"
                    className="flex-1 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg)] px-3 py-1.5 text-cv-xs text-[var(--cv-text)]"
                  />
                  <input
                    type="text"
                    value={newRoomTitle}
                    onChange={(e) => setNewRoomTitle(e.target.value)}
                    placeholder="Specialty / Subtitle"
                    className="flex-1 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg)] px-3 py-1.5 text-cv-xs text-[var(--cv-text)]"
                  />
                  <button
                    type="submit"
                    className="rounded-cv bg-[var(--cv-accent)] px-3 py-1.5 text-cv-xs font-semibold text-[var(--cv-accent-fg)] cursor-pointer"
                  >
                    Create Room
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {rooms.map((room) => {
                  const isSelected = room.id === activeRoom.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => handleSelectRoom(room)}
                      className={`text-left rounded-cv-lg p-2.5 border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[var(--cv-accent)] bg-[var(--cv-accent-muted)] shadow-xs"
                          : "border-[var(--cv-border)] bg-[var(--cv-surface)]/50 hover:border-[var(--cv-border-strong)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-cv-xs font-bold text-[var(--cv-text)] truncate">
                          {room.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cv-accent-strong)] shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--cv-text-muted)] truncate mt-0.5">
                        {room.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT 6 COLS: Interactive 3D Parallax Sanctum Room Stage */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div
              className="relative w-full max-w-xl rounded-cv-2xl border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)]/90 p-6 sm:p-8 shadow-xl overflow-hidden transition-transform duration-200 ease-out"
              style={{
                transform: `perspective(1100px) rotateY(${pointerTilt.x * 5}deg) rotateX(${
                  -pointerTilt.y * 4
                }deg)`,
              }}
            >
              {/* Room Top Archway & Window Header */}
              <div className="flex items-center justify-between border-b border-[var(--cv-border)] pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--cv-accent-strong)]" />
                  <span className="text-cv-xs font-mono uppercase tracking-wider text-[var(--cv-text-muted)]">
                    SANCTUM CHAMBER // {activeRoom.name.toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLampIntensity((prev) =>
                      prev === "warm" ? "bright" : prev === "bright" ? "moonlight" : "warm",
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 py-1 text-[10px] font-mono text-[var(--cv-accent-strong)] hover:border-[var(--cv-border-strong)] cursor-pointer"
                  title="Click to cycle Sanctum Desk Lamp lighting"
                >
                  <LampDesk className="h-3 w-3" />
                  <span>Lamp: {lampIntensity.toUpperCase()}</span>
                </button>
              </div>

              {/* Architectural Room Scene: Left Shelf + Center Window/Desk + Right Shelf */}
              <div className="grid grid-cols-12 gap-3 items-end min-h-[290px] sm:min-h-[320px] relative">
                {/* Volumetric Lamp Cone in Center */}
                <div
                  className="cv-lamp-glow pointer-events-none absolute inset-x-10 top-4 bottom-8 rounded-full blur-2xl"
                  style={{ background: lampGlowColor }}
                />

                {/* LEFT BOOKSHELF TOWER (12 Animated Spines that light up with progress) */}
                <div className="col-span-3 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg)]/80 p-2.5 space-y-2 relative z-10">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--cv-text-subtle)] text-center">
                    West Archive
                  </div>
                  {[0, 1, 2].map((shelfRow) => (
                    <div
                      key={shelfRow}
                      className="h-16 border-b-2 border-[var(--cv-border-strong)] flex items-end justify-center gap-1 px-1 pb-0.5"
                    >
                      {[0, 1, 2, 3].map((bookIdx) => {
                        const spineNumber = shelfRow * 4 + bookIdx;
                        const isLit = progress >= (spineNumber + 1) * 7;
                        const heights = ["h-12", "h-14", "h-11", "h-13"];
                        return (
                          <div
                            key={bookIdx}
                            className={`w-3 rounded-t-xs transition-all duration-300 ${
                              heights[bookIdx % heights.length]
                            } ${
                              isLit
                                ? "cv-spine-active bg-[var(--cv-accent)] shadow-[0_0_8px_var(--cv-accent)]"
                                : "bg-[var(--cv-surface-raised)] opacity-40"
                            }`}
                            style={{ animationDelay: `${spineNumber * 0.12}s` }}
                          />
                        );
                      })}
                    </div>
                  ))}
                  <div className="text-[9px] font-mono text-center text-[var(--cv-accent-strong)]">
                    Novels &amp; Lore
                  </div>
                </div>

                {/* CENTER SANCTUM WINDOW + READING DESK + OPEN CHRONICLE TOME */}
                <div className="col-span-6 flex flex-col items-center justify-between h-full relative z-10 space-y-3">
                  {/* Arched Astral Window */}
                  <div className="w-40 sm:w-48 h-40 rounded-t-full border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] relative overflow-hidden flex flex-col items-center justify-center p-4 shadow-md text-center">
                    <div className="cv-orbit-ring absolute w-32 h-32 rounded-full border-2 border-dashed border-[var(--cv-accent)]/45" />
                    <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-[var(--cv-accent-strong)] relative z-10 px-2 break-words">
                      {isRoomReady ? "✦ ROOM READY ✦" : "HYDRATING"}
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono mt-1 text-[var(--cv-text)] relative z-10">
                      {progress}%
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[var(--cv-text-muted)] mt-0.5 relative z-10">
                      {roomStats.worksCount} Works Indexed
                    </div>
                  </div>

                  {/* Reading Desk with Interactive Lamp & Animated Open Book */}
                  <div className="w-full rounded-cv-lg border border-[var(--cv-border-strong)] bg-[var(--cv-surface)]/90 p-3 shadow-md relative">
                    <div className="flex items-center justify-around">
                      {/* Brass Desk Lamp */}
                      <button
                        type="button"
                        onClick={() =>
                          setLampIntensity((prev) =>
                            prev === "warm" ? "bright" : prev === "bright" ? "moonlight" : "warm",
                          )
                        }
                        className="flex flex-col items-center group cursor-pointer"
                        title="Click to toggle Desk Lamp"
                      >
                        <div className="h-8 w-8 rounded-full bg-[var(--cv-warning-muted)] border border-[var(--cv-warning)] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <LampDesk className="h-4 w-4 text-[var(--cv-warning)]" />
                        </div>
                        <span className="text-[9px] font-mono text-[var(--cv-text-subtle)] mt-1">
                          Desk Lamp
                        </span>
                      </button>

                      {/* Open Chronicle Tome with Turning Page Animation */}
                      <div className="relative flex flex-col items-center">
                        <div className="relative w-24 h-14 rounded-cv border border-[var(--cv-accent)] bg-[var(--cv-bg-elevated)] flex overflow-hidden shadow-[0_0_20px_var(--cv-accent-muted)]">
                          <div className="w-1/2 border-r border-[var(--cv-border)] p-1.5 flex flex-col justify-center gap-1">
                            <span className="h-1 w-full rounded bg-[var(--cv-text-subtle)]/50" />
                            <span className="h-1 w-4/5 rounded bg-[var(--cv-text-subtle)]/50" />
                            <span className="h-1 w-full rounded bg-[var(--cv-accent-strong)]/70" />
                          </div>
                          <div className="w-1/2 p-1.5 flex flex-col justify-center gap-1 relative">
                            <span className="h-1 w-full rounded bg-[var(--cv-text-subtle)]/50" />
                            <span className="h-1 w-3/4 rounded bg-[var(--cv-accent-strong)]/70" />
                            <span className="h-1 w-full rounded bg-[var(--cv-text-subtle)]/50" />
                            {!isRoomReady && (
                              <div className="cv-page-flip absolute inset-0 bg-[var(--cv-surface-raised)] border-l border-[var(--cv-accent)]" />
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-[var(--cv-accent-strong)] mt-1 font-semibold">
                          {isRoomReady ? "Chronicle Open" : "Turning Pages…"}
                        </span>
                      </div>

                      {/* Vault Seal Indicator */}
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-[var(--cv-accent-muted)] border border-[var(--cv-border-strong)] flex items-center justify-center">
                          <Shield className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                        </div>
                        <span className="text-[9px] font-mono text-[var(--cv-text-subtle)] mt-1">
                          AES-256
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT BOOKSHELF TOWER (Manga, Manhwa & Anime Vault) */}
                <div className="col-span-3 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg)]/80 p-2.5 space-y-2 relative z-10">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--cv-text-subtle)] text-center">
                    East Archive
                  </div>
                  {[0, 1, 2].map((shelfRow) => (
                    <div
                      key={shelfRow}
                      className="h-16 border-b-2 border-[var(--cv-border-strong)] flex items-end justify-center gap-1 px-1 pb-0.5"
                    >
                      {[0, 1, 2, 3].map((bookIdx) => {
                        const spineNumber = shelfRow * 4 + bookIdx;
                        const isLit = progress >= 15 + (spineNumber + 1) * 7;
                        const heights = ["h-13", "h-11", "h-14", "h-12"];
                        return (
                          <div
                            key={bookIdx}
                            className={`w-3 rounded-t-xs transition-all duration-300 ${
                              heights[bookIdx % heights.length]
                            } ${
                              isLit
                                ? "cv-spine-active bg-[var(--cv-accent-strong)] shadow-[0_0_8px_var(--cv-accent-strong)]"
                                : "bg-[var(--cv-surface-raised)] opacity-40"
                            }`}
                            style={{ animationDelay: `${(spineNumber + 3) * 0.12}s` }}
                          />
                        );
                      })}
                    </div>
                  ))}
                  <div className="text-[9px] font-mono text-center text-[var(--cv-accent-strong)]">
                    Manga &amp; Media
                  </div>
                </div>
              </div>

              {/* Room Interactive Footer Bar */}
              <div className="mt-5 pt-3 border-t border-[var(--cv-border)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--cv-text-muted)]">
                <span>Move cursor to inspect room · Click lamp to change lighting</span>
                <button
                  type="button"
                  onClick={() => handleEnterRoom()}
                  className="font-mono font-semibold text-[var(--cv-accent-strong)] hover:underline cursor-pointer"
                >
                  Press [Enter] to step inside →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator (Web App Only) */}
        {isWebFullHome && (
          <div className="relative z-10 max-w-7xl w-full mx-auto pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--cv-border)]/60 text-cv-xs text-[var(--cv-text-muted)]">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-[var(--cv-accent-strong)] animate-bounce" />
              <span>
                Scroll down to discover <strong>Why Chronicles Vault Is Better</strong> &amp; browse the{" "}
                <strong>Popular Manga / Manhwa / Novel / Anime Sites Directory</strong>
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <a href="#why-better" className="hover:text-[var(--cv-accent-strong)]">
                01 // WHY IT IS BETTER
              </a>
              <a href="#popular-portals" className="hover:text-[var(--cv-accent-strong)]">
                02 // POPULAR READING SITES
              </a>
            </div>
          </div>
        )}
      </section>

      {isWebFullHome && (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2: WHY CHRONICLES VAULT IS BETTER & WHY YOU SHOULD USE IT
             ═══════════════════════════════════════════════════════════════════ */}
          <section
            id="why-better"
        className="py-20 px-4 sm:px-8 border-t border-[var(--cv-border)] bg-[var(--cv-bg-elevated)]/40"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[var(--cv-accent-strong)]">
                <Flame className="h-3.5 w-3.5" />
                <span>01 // ARCHITECTURAL MANIFESTO</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Why Chronicles Vault Is Better Than Bookmarks, Spreadsheets &amp; Cloud Trackers
              </h2>
              <p className="text-cv-sm sm:text-cv-base text-[var(--cv-text-muted)] leading-relaxed">
                Most readers lose hundreds of hours of fiction history over a decade because browser
                tabs crash, translation sites change domains, and public trackers only support one
                country&apos;s medium. Chronicles Vault is engineered from first principles as a{" "}
                <strong className="text-[var(--cv-text)]">permanent, local-first personal reading intelligence system</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenFeaturesGuide}
              className="inline-flex items-center gap-2 rounded-cv-lg bg-[var(--cv-accent)] px-5 py-3.5 text-cv-sm font-bold text-[var(--cv-accent-fg)] shadow-md hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              <span>See All 32 Tiny Features &amp; Step-by-Step Screenshots →</span>
            </button>
          </div>

          {/* 6 Pillar Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                badge: "SURVIVES DEAD LINKS",
                title: "1. Decoupled Permanent Work Identity",
                oldWay: "Browser bookmarks break the day a scanlator or novel site changes domains—wiping out your title and chapter number.",
                betterWay:
                  "In Chronicles Vault, a Work is an immortal entity separated from its Access Paths. Attach 5 mirrors, RSS feeds, or local files; if a website dies, your Work, chapter progress, and notes stay 100% intact.",
                tryRoute: "/work/01JPK3M9V0WORK000000000001",
              },
              {
                icon: RotateCcw,
                badge: "HIATUS RECOVERY",
                title: "2. The Return Desk & 30-Second Memory Refresher",
                oldWay: "After a 4-month break from a 300-chapter novel, you forget who the characters are—and Googling the wiki spoils major character deaths.",
                betterWay:
                  "The Return Desk prioritizes stalled works with new chapters and opens a spoiler-safe Memory Refresher Drawer showing YOUR own past quotes, theories, and character notes up to your exact chapter.",
                tryRoute: "/return-desk",
              },
              {
                icon: Film,
                badge: "ALL MEDIUMS + LOCAL VIDEO",
                title: "3. Unified Ebooks (EPUB/PDF/CBZ) + Local Video Player",
                oldWay: "Separate apps for Japanese Anime, Korean Manhwa, Chinese Web Novels, local EPUBs, and downloaded MP4/MKV anime episodes.",
                betterWay:
                  "Track and consume every medium in one Room—including built-in offline EPUB, PDF, and RTL CBZ readers plus an inline HTML5 Local Video Player for linked anime/donghua episodes.",
                tryRoute: "/shelf",
              },
              {
                icon: FolderGit2,
                badge: "FRANCHISE INTELLIGENCE",
                title: "4. Cross-Medium Adaptation & Lore Graph",
                oldWay: "Finishing Anime Season 1 and having no idea which Manhwa chapter or Web Novel volume to continue from.",
                betterWay:
                  "Connect Web Novel ↔ Light Novel ↔ Manhwa ↔ Anime into a visual Adaptation Graph with chapter-mapping notes and a structured per-Work Lore Notebook for characters and cultivation realms.",
                tryRoute: "/work/01JPK3M9V0WORK000000000001",
              },
              {
                icon: KeyRound,
                badge: "ZERO-KNOWLEDGE PRIVACY",
                title: "5. AES-256-GCM Private Vault & Panic Lock",
                oldWay: "Public cloud trackers broadcast your entire reading life and guilty-pleasure titles on public profiles.",
                betterWay:
                  "Seal sensitive Works inside a client-side WebCrypto AES-256-GCM Vault (310,000 PBKDF2 iterations) with auto-lock on tab blur and a 1-second Ctrl+Shift+L panic lock.",
                tryRoute: "/vault",
              },
              {
                icon: Zap,
                badge: "ZERO LOCK-IN",
                title: "6. Non-Destructive Merge & 1-Click Bookmark Import",
                oldWay: "Duplicate entries split your notes, and migrating 1,000 old browser bookmarks takes weeks of manual copy-pasting.",
                betterWay:
                  "Bulk-import Chrome/Firefox bookmark HTML files or CSVs in seconds, and merge duplicate romanized/English titles with zero data loss using the 3-Step Merge Wizard.",
                tryRoute: "/settings",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 flex flex-col justify-between hover:border-[var(--cv-border-strong)] transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-cv-lg bg-[var(--cv-accent-muted)] border border-[var(--cv-border-strong)] flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[var(--cv-accent-strong)]" />
                      </div>
                      <span className="rounded-full bg-[var(--cv-surface)] border border-[var(--cv-border)] px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[var(--cv-accent-strong)]">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-cv-lg font-bold text-[var(--cv-text)]">{card.title}</h3>

                    <div className="rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg)]/60 p-3 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-[var(--cv-danger)]">
                        ✕ Standard Bookmarks / Trackers
                      </div>
                      <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                        {card.oldWay}
                      </p>
                    </div>

                    <div className="rounded-cv border border-[var(--cv-border-strong)] bg-[var(--cv-surface)]/50 p-3 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-[var(--cv-success)]">
                        ✦ The Chronicles Vault Way
                      </div>
                      <p className="text-cv-xs text-[var(--cv-text)] leading-relaxed">
                        {card.betterWay}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[var(--cv-border)] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleEnterRoom(card.tryRoute)}
                      className="text-cv-xs font-semibold text-[var(--cv-accent-strong)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open in My Room</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={onOpenFeaturesGuide}
                      className="text-[11px] font-mono text-[var(--cv-text-subtle)] hover:text-[var(--cv-text)] cursor-pointer"
                    >
                      Step-by-step guide →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: MOST POPULAR MANGA / ANIME / MANHWA / NOVEL SITES DIRECTORY
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="popular-portals" className="py-20 px-4 sm:px-8 border-t border-[var(--cv-border)]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[var(--cv-accent-strong)]">
                <Compass className="h-3.5 w-3.5" />
                <span>02 // GLOBAL PORTAL DIRECTORY (24 CURATED SITES)</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Most Popular Manga, Manhwa, Web Novel &amp; Anime Sites
              </h2>
              <p className="text-cv-sm text-[var(--cv-text-muted)] leading-relaxed">
                Launch your favorite reading and watching portals directly from your Room Homepage,
                copy their URLs to bind as Work Access Paths, or click{" "}
                <strong className="text-[var(--cv-text)]">+ Radar</strong> to save any portal into
                your triage queue.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="h-4 w-4 text-[var(--cv-text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={siteSearch}
                onChange={(e) => setSiteSearch(e.target.value)}
                placeholder="Search MangaDex, Royal Road, Webtoon…"
                className="w-full rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] pl-10 pr-4 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:border-[var(--cv-border-focus)]"
              />
            </div>
          </div>

          {/* Medium Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Portals (24)" },
              { id: "manga", label: "Manga & Comics (6)" },
              { id: "manhwa", label: "Manhwa & Webtoons (6)" },
              { id: "novel", label: "Web & Light Novels (6)" },
              { id: "anime", label: "Anime & Donghua (6)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSiteCategory(tab.id as typeof siteCategory)}
                className={`rounded-cv-full px-4 py-1.5 text-cv-xs font-semibold border transition-all cursor-pointer ${
                  siteCategory === tab.id
                    ? "border-[var(--cv-accent)] bg-[var(--cv-accent)] text-[var(--cv-accent-fg)]"
                    : "border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Portal Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSites.map((site) => (
              <div
                key={site.id}
                className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-5 flex flex-col justify-between hover:border-[var(--cv-border-strong)] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-cv-base font-bold text-[var(--cv-text)]">
                          {site.name}
                        </h3>
                        <span className="rounded-cv bg-[var(--cv-accent-muted)] px-2 py-0.5 text-[10px] font-mono font-semibold text-[var(--cv-accent-strong)]">
                          {site.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[var(--cv-text-subtle)] mt-0.5">
                        {site.domain} · {site.languages}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2 py-0.5 text-[10px] font-mono text-[var(--cv-text-muted)] shrink-0">
                      {site.badge}
                    </span>
                  </div>

                  <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                    {site.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--cv-border)] flex items-center justify-between gap-2">
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-cv bg-[var(--cv-surface)] hover:bg-[var(--cv-surface-hover)] border border-[var(--cv-border-strong)] px-3 py-1.5 text-cv-xs font-semibold text-[var(--cv-text)] transition-colors"
                  >
                    <span>Open Site</span>
                    <ExternalLink className="h-3 w-3 text-[var(--cv-accent-strong)]" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          void navigator.clipboard.writeText(site.url);
                        }
                        setCopiedSiteId(site.id);
                        window.setTimeout(() => setCopiedSiteId(null), 1800);
                      }}
                      className="inline-flex items-center gap-1 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg)] px-2.5 py-1.5 text-[11px] font-mono text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] cursor-pointer"
                      title="Copy portal URL"
                    >
                      {copiedSiteId === site.id ? (
                        <>
                          <Check className="h-3 w-3 text-[var(--cv-success)]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>URL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleQuickCaptureSite(site)}
                      className="inline-flex items-center gap-1 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg)] px-2.5 py-1.5 text-[11px] font-mono text-[var(--cv-accent-strong)] hover:bg-[var(--cv-accent-muted)] cursor-pointer"
                      title="Quick-Capture portal to your Room Radar"
                    >
                      <Radar className="h-3 w-3" />
                      <span>{capturedSiteId === site.id ? "Saved!" : "+ Radar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER CTA BANNER
         ═══════════════════════════════════════════════════════════════════ */}
      <footer className="py-12 px-4 sm:px-8 border-t border-[var(--cv-border)] bg-[var(--cv-bg-elevated)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-bold text-cv-base text-[var(--cv-text)]">
              Chronicles Vault — Your Personal Fiction Sanctum
            </div>
            <p className="text-cv-xs text-[var(--cv-text-muted)] mt-1">
              100% Local-First · Decoupled Work Identity · Offline EPUB/PDF/CBZ &amp; Video · AES-256-GCM Private Vault
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenFeaturesGuide}
              className="rounded-cv border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-4 py-2.5 text-cv-xs font-semibold text-[var(--cv-text)] hover:bg-[var(--cv-surface-hover)] cursor-pointer"
            >
              View All 32 Features &amp; Step-by-Step Guide
            </button>
            <button
              type="button"
              onClick={() => handleEnterRoom()}
              className="rounded-cv bg-[var(--cv-accent)] px-5 py-2.5 text-cv-xs font-bold text-[var(--cv-accent-fg)] shadow-sm hover:opacity-95 cursor-pointer"
            >
              Enter My Room ✦
            </button>
          </div>
        </div>
      </footer>
        </>
      )}
    </div>
  );
}

export default SanctumHome;
