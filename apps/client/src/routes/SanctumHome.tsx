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
  UserPlus,
  Zap,
  Download,
  Smartphone,
  Monitor,
  AlertTriangle,
  FileText,
  HelpCircle,
} from "lucide-react";

export interface RoomProfile {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly motto: string;
  readonly accentColor: string;
  readonly themePreference: "midnight-arcana" | "parchment-ink" | "xianxia-realm" | "ink";
}

const DEFAULT_ROOMS: readonly RoomProfile[] = [
  {
    id: "main-sanctum",
    name: "DemoUser1 · Grand Sanctum",
    title: "Anime, Web Series, Movies & Multi-Medium Vault",
    motto: "Account: DemoUser1 — Local PC watch folder (Takopi's Original Sin 1080p, Web Series & Novels) synced.",
    accentColor: "#4f46e5",
    themePreference: "midnight-arcana",
  },
  {
    id: "scholar-study",
    name: "DemoUser1 · Antique Parchment",
    title: "Sunlit Vellum Study, Light Novels & EPUBs",
    motto: "Warm antique vellum paper, burnt sienna ink, and distraction-free deep reading.",
    accentColor: "#ea580c",
    themePreference: "parchment-ink",
  },
  {
    id: "xianxia-pavilion",
    name: "DemoUser1 · Blossom Pavilion",
    title: "Cultivation Novels, Manhwa & Donghua Chamber",
    motto: "Ten thousand chapters of ascension in sakura-white & crimson rose.",
    accentColor: "#e11d48",
    themePreference: "xianxia-realm",
  },
  {
    id: "ink-atelier",
    name: "DemoUser1 · Sumi-e Ink Atelier",
    title: "Pure White Canvas & Stark Black Manga / Seinen Room",
    motto: "High-contrast gallery white paper, obsidian sumi-e ink, and vermilion seals.",
    accentColor: "#09090b",
    themePreference: "ink",
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
  { threshold: 0, code: "01 · UNLOCKING SANCTUM DOORS", detail: "Mounting Room Profile & Atmospheric Theme Engine…" },
  { threshold: 26, code: "02 · LIGHTING ARCHIVE SHELVES", detail: "Hydrating Works, Progress Anchors & Reading Relationships…" },
  { threshold: 58, code: "03 · UNSEALING MARGINALIA & LORE", detail: "Indexing Quotes, Character Notebooks & Adaptation Graph…" },
  { threshold: 84, code: "04 · CALIBRATING LOCAL SHELF & VAULT", detail: "Preparing OPFS Ebook/Video Engine & AES-256 Seals…" },
  { threshold: 100, code: "05 · ROOM READY FOR ENTRY", detail: "Your personal fiction sanctum is fully hydrated and waiting." },
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultIds = new Set(DEFAULT_ROOMS.map((r) => r.id));
          const customOnly = parsed.filter((r) => !defaultIds.has(r.id));
          return [...DEFAULT_ROOMS, ...customOnly];
        }
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

  // User Account (Persists in localStorage so signed-up users never have to sign in again)
  const [currentUser, setCurrentUser] = React.useState<string>(() => {
    if (typeof window === "undefined") return "DemoUser1";
    return window.localStorage.getItem("cv:username") || "DemoUser1";
  });
  const [showSignUpModal, setShowSignUpModal] = React.useState(false);
  const [signUpInput, setSignUpInput] = React.useState("");

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
      ? "rgba(251, 191, 36, 0.24)"
      : lampIntensity === "bright"
        ? "rgba(244, 63, 94, 0.26)"
        : "rgba(99, 102, 241, 0.26)";

  return (
    <div
      className={`relative min-h-screen bg-[var(--cv-bg)] text-[var(--cv-text)] bg-cover bg-center bg-fixed selection:bg-[var(--cv-accent-muted)] overflow-x-hidden ${
        isExitingToRoom ? "cv-room-exit-curtain" : ""
      }`}
      style={{ backgroundImage: "var(--cv-bg-image)" }}
      onMouseMove={(e) => {
        const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
        setPointerTilt({ x: nx, y: ny });
      }}
    >
      {/* Theme Background Image Readability Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "var(--cv-main-overlay)" }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          ARCHITECTURAL TOP HEADER BAR (CLEAN & GAME SCREEN FOCUS)
         ═══════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-40 border-b-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)]/95 backdrop-blur-md">
        {/* Main Architectural Header Bar */}
        <div className="px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-accent)] text-[var(--cv-accent-fg)] flex items-center justify-center font-mono font-bold text-cv-xs shadow-[2px_2px_0px_var(--cv-border-strong)]">
              CV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-cv-sm uppercase tracking-wider text-[var(--cv-text)]">
                  Chronicles Vault
                </span>
              </div>
            </div>
          </div>

          {/* Center Inline 4-Theme Architectural Switcher */}
          <div className="hidden xl:flex items-center border border-[var(--cv-border-strong)] bg-[var(--cv-surface)]">
            {[
              { id: "midnight-arcana", label: "01 Midnight", roomIdx: 0 },
              { id: "parchment-ink", label: "02 Antique Parchment", roomIdx: 1 },
              { id: "xianxia-realm", label: "03 Blossom", roomIdx: 2 },
              { id: "ink", label: "04 Ink", roomIdx: 3 },
            ].map((t) => {
              const isCurrentTheme = activeRoom.themePreference === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const targetRoom = rooms[t.roomIdx] ?? rooms[0]!;
                    handleSelectRoom(targetRoom);
                  }}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border-r last:border-r-0 border-[var(--cv-border)] transition-colors cursor-pointer ${
                    isCurrentTheme
                      ? "bg-[var(--cv-accent)] text-[var(--cv-accent-fg)] font-bold"
                      : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:bg-[var(--cv-surface-hover)]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {isWebFullHome && (
              <>
                <a
                  href="#why-better"
                  className="hidden lg:inline-flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Manifesto</span>
                </a>
                <a
                  href="#popular-portals"
                  className="hidden lg:inline-flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Portals</span>
                </a>
                <a
                  href="#installers"
                  className="hidden md:inline-flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--cv-accent-strong)] hover:text-[var(--cv-text)] border border-[var(--cv-accent)]/40 bg-[var(--cv-accent)]/10 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={onOpenFeaturesGuide}
                  className="inline-flex flex-col items-center gap-1 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--cv-text)] hover:bg-[var(--cv-surface-hover)] shadow-[2px_2px_0px_var(--cv-border-strong)] transition-all cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                  <span>Features</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowSignUpModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--cv-text)] hover:bg-[var(--cv-surface-hover)] shadow-[2px_2px_0px_var(--cv-border-strong)] transition-all cursor-pointer"
              title="Sign up as new explorer or switch profile handle"
            >
              <UserPlus className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
              <span>Sign Up / Switch</span>
            </button>
            <button
              type="button"
              onClick={() => handleEnterRoom()}
              className="inline-flex items-center gap-1.5 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-accent)] px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--cv-accent-fg)] shadow-[3px_3px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
            >
              <span>Enter My Room</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: HERO VIEWPORT — AWWWARDS EDITORIAL ARCHITECTURAL STAGE
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen pt-28 pb-12 px-4 sm:px-8 flex flex-col justify-between overflow-hidden">
        {/* Ambient Volumetric Lamp & Cursor-Following Spotlight */}
        <div
          className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            background: `radial-gradient(650px circle at ${50 + pointerTilt.x * 18}% ${
              42 + pointerTilt.y * 14
            }%, ${lampGlowColor}, transparent 72%)`,
          }}
        />

        {/* Architectural Grid Hairlines Overlay */}
        <div className="pointer-events-none absolute inset-x-4 sm:inset-x-8 top-24 bottom-8 border-x border-[var(--cv-border)]/45 max-w-7xl mx-auto" />

        {/* Main Hero Grid: Left Game-Screen Title Column | Right 3D Architectural Cockpit HUD */}
        <div className="relative z-10 max-w-7xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center py-6">
          {/* LEFT 6 COLS: Game Title Screen, User Greeting, Big Action Button, Atmosphere Switcher */}
          <div className="lg:col-span-6 space-y-6 cv-kinetic-enter">
            {/* Game Screen Hero Card */}
            <div className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-6 sm:p-8 shadow-[6px_6px_0px_var(--cv-border-strong)] space-y-6">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between border-b border-[var(--cv-border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--cv-accent-strong)]">
                    PLAYER PROFILE · {currentUser.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-mono border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2 py-0.5 text-[var(--cv-text-muted)]">
                  ROOM READY
                </span>
              </div>

              {/* Title & Greeting */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--cv-text-muted)]">
                  SANCTUM RESIDENCE · {activeRoom.name.toUpperCase()}
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--cv-text)] leading-tight">
                  Welcome back, <span className="text-[var(--cv-accent-strong)]">{currentUser}</span>.
                </h1>
                <p className="text-cv-xs sm:text-cv-sm text-[var(--cv-text-muted)] leading-relaxed max-w-xl">
                  Your private reading sanctum and multimedia workstation are online. Step inside to access your personal shelves, unread updates, and media.
                </p>
              </div>

              {/* High-Impact Game Title Primary Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleEnterRoom()}
                  className="w-full inline-flex items-center justify-center gap-3 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-accent)] px-8 py-4 sm:py-5 text-cv-base sm:text-cv-lg font-mono font-extrabold uppercase tracking-wider text-[var(--cv-accent-fg)] shadow-[6px_6px_0px_var(--cv-border-strong)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_var(--cv-border-strong)] transition-all cursor-pointer"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>ENTER MY ROOM ✦</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              {/* Sign Up / Switch User hint */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--cv-text-muted)] pt-1">
                <span>Active explorer: <strong className="text-[var(--cv-text)]">{currentUser}</strong> (auto-saved)</span>
                <button
                  type="button"
                  onClick={() => setShowSignUpModal(true)}
                  className="text-[var(--cv-accent-strong)] hover:underline font-bold cursor-pointer"
                >
                  + Sign Up / New ID
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 6 COLS: 3D Perspective Game Screen Cockpit HUD */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div
              className="relative w-full max-w-xl border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)]/95 p-6 sm:p-7 shadow-[8px_8px_0px_var(--cv-border-strong)] overflow-hidden transition-transform duration-200 ease-out"
              style={{
                transform: `perspective(1100px) rotateY(${pointerTilt.x * 4}deg) rotateX(${
                  -pointerTilt.y * 3.5
                }deg)`,
              }}
            >
              {/* Cockpit HUD Top Bar */}
              <div className="flex items-center justify-between border-b-2 border-[var(--cv-border-strong)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />
                  <span className="text-cv-xs font-mono font-bold uppercase tracking-wider text-[var(--cv-text)]">
                    USER: {currentUser.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Status HUD: Priority Alerts & Previously Left Media */}
              <div className="space-y-3 relative z-10">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--cv-text-subtle)] border-b border-[var(--cv-border)] pb-1 flex items-center justify-between">
                  <span>SESSION RADAR &amp; PRIORITY WORKS</span>
                  <span className="text-emerald-500">● LIVE READY</span>
                </div>

                {/* 1. High Priority Chapter Update */}
                <div className="border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] p-3.5 shadow-[2px_2px_0px_var(--cv-border-strong)] flex items-start gap-3">
                  <div className="p-2 border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] text-amber-500 shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-600 border border-amber-500/40">
                        UPDATE READY
                      </span>
                      <span className="text-[10px] font-mono text-[var(--cv-text-muted)]">Web Novel / Manhwa</span>
                    </div>
                    <h4 className="font-extrabold text-cv-sm text-[var(--cv-text)] truncate mt-1">
                      Omniscient Reader&apos;s Viewpoint
                    </h4>
                    <p className="text-[11px] font-mono text-[var(--cv-text-muted)] mt-0.5">
                      Chapter 552 Published · Ready to Read in Room
                    </p>
                  </div>
                </div>

                {/* 2. Half-Watched Local Media Resume */}
                <div className="border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] p-3.5 shadow-[2px_2px_0px_var(--cv-border-strong)] flex items-start gap-3">
                  <div className="p-2 border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] text-cyan-500 shrink-0">
                    <Film className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-cyan-500/20 text-cyan-600 border border-cyan-500/40">
                        RESUME WATCHING
                      </span>
                      <span className="text-[10px] font-mono text-[var(--cv-text-muted)]">Local Video Media</span>
                    </div>
                    <h4 className="font-extrabold text-cv-sm text-[var(--cv-text)] truncate mt-1">
                      Takopi&apos;s Original Sin (S01 1080p)
                    </h4>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--cv-text-muted)] mt-1">
                      <span>Episode 4 · 18:42 / 24:00</span>
                      <span className="text-[var(--cv-accent-strong)] font-bold">78%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--cv-border)] mt-1.5 overflow-hidden">
                      <div className="h-full bg-[var(--cv-accent-strong)] w-[78%]" />
                    </div>
                  </div>
                </div>

                {/* 3. Audiobook Active Bookmark */}
                <div className="border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] p-3.5 shadow-[2px_2px_0px_var(--cv-border-strong)] flex items-start gap-3">
                  <div className="p-2 border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] text-purple-500 shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-purple-500/20 text-purple-600 border border-purple-500/40">
                        AUDIOBOOK
                      </span>
                      <span className="text-[10px] font-mono text-[var(--cv-text-muted)]">Soundbooth Theater</span>
                    </div>
                    <h4 className="font-extrabold text-cv-sm text-[var(--cv-text)] truncate mt-1">
                      Dungeon Crawler Carl
                    </h4>
                    <p className="text-[11px] font-mono text-[var(--cv-text-muted)] mt-0.5">
                      Track 14 (Ch. 14) · Jeff Hays Narration
                    </p>
                  </div>
                </div>

                {/* Cockpit Bottom Session Launcher Bar */}
                <div className="pt-2 flex items-center justify-end border-t border-[var(--cv-border)]">
                  <button
                    type="button"
                    onClick={() => handleEnterRoom()}
                    className="inline-flex items-center gap-1.5 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-accent)] px-3.5 py-1.5 text-[11px] font-mono font-bold uppercase text-[var(--cv-accent-fg)] shadow-[2px_2px_0px_var(--cv-border-strong)] hover:opacity-95 transition-opacity cursor-pointer"
                  >
                    <span>Launch Session →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator (Web App Only) */}
        {isWebFullHome && (
          <div className="relative z-10 max-w-7xl w-full mx-auto pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-[var(--cv-border-strong)] text-cv-xs font-mono text-[var(--cv-text-muted)]">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-[var(--cv-accent-strong)] animate-bounce" />
              <span>
                SCROLL FOR <strong>01 / ARCHITECTURAL MANIFESTO</strong> &amp;{" "}
                <strong>02 / GLOBAL PORTAL DIRECTORY (24 SITES)</strong>
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <a href="#why-better" className="hover:text-[var(--cv-accent-strong)] font-bold">
                [01 · MANIFESTO]
              </a>
              <a href="#popular-portals" className="hover:text-[var(--cv-accent-strong)] font-bold">
                [02 · 24 PORTALS]
              </a>
              <a href="#installers" className="hover:text-[var(--cv-accent-strong)] font-bold text-[var(--cv-accent-strong)]">
                [03 · INSTALLERS]
              </a>
            </div>
          </div>
        )}
      </section>

      {isWebFullHome && (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2: WHY CHRONICLES VAULT IS BETTER (ARCHITECTURAL GRID)
             ═══════════════════════════════════════════════════════════════════ */}
          <section
            id="why-better"
            className="relative z-10 py-20 px-4 sm:px-8 border-t-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)]/85"
          >
            <div className="max-w-7xl mx-auto space-y-12">
              {/* Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-2 border-[var(--cv-border-strong)] pb-6">
                <div className="max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-2 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--cv-accent-strong)]">
                    <Flame className="h-3.5 w-3.5" />
                    <span>01 · ARCHITECTURAL MANIFESTO</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    Why Chronicles Vault Replaces Fragile Bookmarks, Spreadsheets &amp; Cloud Trackers
                  </h2>
                  <p className="text-cv-sm sm:text-cv-base text-[var(--cv-text-muted)] leading-relaxed">
                    Engineered as a{" "}
                    <strong className="text-[var(--cv-text)]">
                      permanent, local-first personal fiction &amp; cinema archive
                    </strong>{" "}
                    spanning Written Novels, Manga, Manhwa, Anime, Web Series, Movies, and Local PC
                    video folders.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenFeaturesGuide}
                  className="inline-flex items-center gap-2 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-accent)] px-5 py-3.5 text-cv-xs font-mono font-bold uppercase tracking-wider text-[var(--cv-accent-fg)] shadow-[4px_4px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all shrink-0 cursor-pointer"
                >
                  <Layers className="h-4 w-4" />
                  <span>Inspect All 32 Features &amp; Screenshots →</span>
                </button>
              </div>

              {/* 6 Pillar Architectural Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Globe,
                    badge: "01 · SURVIVES DEAD LINKS",
                    title: "Decoupled Permanent Work Identity",
                    oldWay:
                      "Browser bookmarks break the day a scanlator or streaming site changes domains—wiping out your title and episode/chapter number.",
                    betterWay:
                      "A Work is an immortal entity separated from its Access Paths. Attach web mirrors, RSS feeds, or local PC paths; your progress and notes stay 100% intact.",
                    tryRoute: "/work/01JPK3M9V0WORK000000000001",
                  },
                  {
                    icon: RotateCcw,
                    badge: "02 · HIATUS RECOVERY",
                    title: "The Return Desk & 30-Second Memory Refresher",
                    oldWay:
                      "After a 4-month break from a 300-chapter novel or series, you forget the cast—and Googling the wiki spoils major plot twists.",
                    betterWay:
                      "The Return Desk surfaces stalled works and opens a spoiler-safe Memory Refresher Drawer showing YOUR own past quotes, theories, and character notes.",
                    tryRoute: "/return-desk",
                  },
                  {
                    icon: Film,
                    badge: "03 · LOCAL PC VIDEO + EBOOKS",
                    title: "Local PC Anime/Series Archives + EPUB/PDF/CBZ",
                    oldWay:
                      "Downloaded anime ZIPs and MKV/MP4 web series sit forgotten in local PC Downloads\\watch folders with zero episode tracking.",
                    betterWay:
                      "Bind local PC archives (like Takopi's Original Sin S01, Gram Chikitsalay S02, The Revolutionaries S01) directly to DemoUser1's library alongside offline EPUB/CBZ readers.",
                    tryRoute: "/work/01JPK3M9V0WORK000000000011",
                  },
                  {
                    icon: FolderGit2,
                    badge: "04 · FRANCHISE INTELLIGENCE",
                    title: "Cross-Medium Adaptation & Lore Graph",
                    oldWay:
                      "Finishing Anime Season 1 and having no idea which Manhwa chapter or Web Novel volume to continue from.",
                    betterWay:
                      "Connect Web Novel ↔ Light Novel ↔ Manhwa ↔ Anime into a visual Adaptation Graph with exact chapter/episode handoff notes.",
                    tryRoute: "/work/01JPK3M9V0WORK000000000001",
                  },
                  {
                    icon: KeyRound,
                    badge: "05 · ZERO-KNOWLEDGE VAULT",
                    title: "Hidden Vault Works + Auto-Lock on Browser Close",
                    oldWay:
                      "Public cloud trackers expose your entire watch history, or complex vaults lock you out when switching tabs.",
                    betterWay:
                      "Unlock DemoUser1's Vault in 1 click to reveal 4 hidden works across /vault and /library, hide/unhide any work, and automatically re-lock when the browser closes.",
                    tryRoute: "/vault",
                  },
                  {
                    icon: Zap,
                    badge: "06 — ZERO LOCK-IN",
                    title: "Non-Destructive Merge & 1-Click Bookmark Import",
                    oldWay:
                      "Duplicate entries split your notes, and migrating 1,000 old browser bookmarks takes weeks of manual copy-pasting.",
                    betterWay:
                      "Bulk-import Chrome/Firefox bookmark HTML files or CSVs in seconds, and merge duplicate romanized/English titles with zero data loss.",
                    tryRoute: "/settings",
                  },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-6 flex flex-col justify-between shadow-[4px_4px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--cv-border)] pb-3">
                          <div className="h-9 w-9 bg-[var(--cv-accent)] text-[var(--cv-accent-fg)] border border-[var(--cv-border-strong)] flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="bg-[var(--cv-surface)] border border-[var(--cv-border-strong)] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[var(--cv-accent-strong)]">
                            {card.badge}
                          </span>
                        </div>

                        <h3 className="text-cv-lg font-extrabold text-[var(--cv-text)]">
                          {card.title}
                        </h3>

                        <div className="border-l-2 border-[var(--cv-danger)] bg-[var(--cv-bg)]/70 p-3 space-y-1">
                          <div className="text-[10px] font-mono font-bold uppercase text-[var(--cv-danger)]">
                            ✕ OLD TRACKERS / BOOKMARKS
                          </div>
                          <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                            {card.oldWay}
                          </p>
                        </div>

                        <div className="border-l-2 border-[var(--cv-success)] bg-[var(--cv-surface)]/70 p-3 space-y-1">
                          <div className="text-[10px] font-mono font-bold uppercase text-[var(--cv-success)]">
                            ✦ CHRONICLES VAULT ARCHITECTURE
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
                          className="text-cv-xs font-mono font-bold uppercase text-[var(--cv-accent-strong)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>OPEN IN ROOM</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={onOpenFeaturesGuide}
                          className="text-[11px] font-mono text-[var(--cv-text-subtle)] hover:text-[var(--cv-text)] cursor-pointer"
                        >
                          [GUIDE →]
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
          <section
            id="popular-portals"
            className="relative z-10 py-20 px-4 sm:px-8 border-t-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg)]/90"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-2 border-[var(--cv-border-strong)] pb-6">
                <div className="max-w-3xl space-y-2">
                  <div className="inline-flex items-center gap-2 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--cv-accent-strong)]">
                    <Compass className="h-3.5 w-3.5" />
                    <span>02 · GLOBAL PORTAL DIRECTORY (24 CURATED SITES)</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    Most Popular Manga, Manhwa, Web Novel &amp; Anime Sites
                  </h2>
                  <p className="text-cv-sm text-[var(--cv-text-muted)] leading-relaxed">
                    Launch your favorite reading and watching portals directly from your Room
                    Homepage, copy their URLs to bind as Work Access Paths, or click{" "}
                    <strong className="text-[var(--cv-text)]">+ RADAR</strong> to save any portal
                    into your triage queue.
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full lg:w-80">
                  <Search className="h-4 w-4 text-[var(--cv-text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    placeholder="Search MangaDex, Crunchyroll, Webtoon…"
                    className="w-full border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] pl-10 pr-4 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:border-[var(--cv-border-focus)]"
                  />
                </div>
              </div>

              {/* Sharp Architectural Medium Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "ALL PORTALS (24)" },
                  { id: "manga", label: "MANGA & COMICS (6)" },
                  { id: "manhwa", label: "MANHWA & WEBTOONS (6)" },
                  { id: "novel", label: "WEB & LIGHT NOVELS (6)" },
                  { id: "anime", label: "ANIME & DONGHUA (6)" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSiteCategory(tab.id as typeof siteCategory)}
                    className={`px-4 py-2 text-cv-xs font-mono font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                      siteCategory === tab.id
                        ? "border-[var(--cv-border-strong)] bg-[var(--cv-accent)] text-[var(--cv-accent-fg)] shadow-[3px_3px_0px_var(--cv-border-strong)]"
                        : "border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:border-[var(--cv-border-strong)]"
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
                    className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-5 flex flex-col justify-between shadow-[3px_3px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-cv-base font-extrabold text-[var(--cv-text)]">
                              {site.name}
                            </h3>
                            <span className="border border-[var(--cv-border-strong)] bg-[var(--cv-accent-muted)] px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[var(--cv-accent-strong)]">
                              {site.categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-[var(--cv-text-subtle)] mt-0.5">
                            {site.domain} · {site.languages}
                          </p>
                        </div>
                        <span className="border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2 py-0.5 text-[10px] font-mono uppercase text-[var(--cv-text-muted)] shrink-0">
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
                        className="inline-flex items-center gap-1.5 bg-[var(--cv-surface)] hover:bg-[var(--cv-surface-hover)] border border-[var(--cv-border-strong)] px-3 py-1.5 text-cv-xs font-mono font-bold uppercase text-[var(--cv-text)] transition-colors"
                      >
                        <span>LAUNCH</span>
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
                          className="inline-flex items-center gap-1 border border-[var(--cv-border-strong)] bg-[var(--cv-bg)] px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] cursor-pointer"
                          title="Copy portal URL"
                        >
                          {copiedSiteId === site.id ? (
                            <>
                              <Check className="h-3 w-3 text-[var(--cv-success)]" />
                              <span>COPIED</span>
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
                          className="inline-flex items-center gap-1 border border-[var(--cv-border-strong)] bg-[var(--cv-bg)] px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase text-[var(--cv-accent-strong)] hover:bg-[var(--cv-accent-muted)] cursor-pointer"
                          title="Quick-Capture portal to your Room Radar"
                        >
                          <Radar className="h-3 w-3" />
                          <span>{capturedSiteId === site.id ? "SAVED!" : "+ RADAR"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 4: DIRECT INSTALLERS & MULTI-DEVICE DOWNLOADS
             ═══════════════════════════════════════════════════════════════════ */}
          <section
            id="installers"
            className="relative z-10 py-20 px-4 sm:px-8 border-t-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg)]"
          >
            <div className="max-w-7xl mx-auto space-y-12">
              {/* Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-2 border-[var(--cv-border-strong)] pb-6">
                <div className="max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-2 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-3 py-1 text-cv-xs font-mono font-bold uppercase tracking-widest text-[var(--cv-accent-strong)] shadow-[2px_2px_0px_var(--cv-border-strong)]">
                    <Download className="h-3.5 w-3.5" />
                    <span>03 · STANDALONE NATIVE INSTALLERS</span>
                  </div>
                  <h2 className="text-cv-2xl sm:text-cv-3xl font-extrabold tracking-tight text-[var(--cv-text)]">
                    Direct Multi-Device Downloads &amp; Offline Installers
                  </h2>
                  <p className="text-cv-sm text-[var(--cv-text-muted)] leading-relaxed">
                    Install Chronicles Vault as a native offline application on your Android phone (Samsung Galaxy A14 &amp; all models) or Windows PC (x86 &amp; x64). Sideload cleanly without Play Store tracking or third-party store lock-in.
                  </p>
                </div>
              </div>

              {/* Crucial Network / Platform Notice Banner */}
              <div className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-surface)] p-5 shadow-[4px_4px_0px_var(--cv-border-strong)] flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="p-2 border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] shrink-0">
                  <AlertTriangle className="h-6 w-6 text-[#d97706]" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--cv-text)]">
                    ✦ ARCHITECTURAL NOTICE: WEB VS. NATIVE INSTALLERS ✦
                  </div>
                  <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                    <strong className="text-[var(--cv-text)]">Web Browser Version:</strong> Works best with instant portal linking, real-time multi-device cloud relay, and online metadata fetching — <strong className="text-[var(--cv-accent-strong)]">requires active internet connection</strong>.<br />
                    <strong className="text-[var(--cv-text)]">Windows &amp; Android Installers:</strong> Engineered for complete offline freedom. Index your local PC folders, watch downloaded anime ZIPs/MKVs, read offline EPUBs/CBZs, and sync over local Wi-Fi without internet.
                  </p>
                </div>
              </div>

              {/* Download Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ── CARD 1: ANDROID MOBILE INSTALLER ── */}
                <div className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-6 sm:p-8 shadow-[6px_6px_0px_var(--cv-border-strong)] flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--cv-border)] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)]">
                          <Smartphone className="h-6 w-6 text-[var(--cv-accent-strong)]" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-cv-lg text-[var(--cv-text)]">
                            Android Mobile App
                          </h3>
                          <p className="text-[11px] font-mono text-[var(--cv-text-muted)]">
                            Samsung Galaxy A14, One UI, Pixel &amp; All Android (v7.0 to 14+)
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-1 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] text-[var(--cv-accent-strong)]">
                        APK v1.0.0
                      </span>
                    </div>

                    <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                      Direct standalone APK download. Pre-configured with offline IndexedDB vault, EPUB/PDF/CBZ reader engines, audiobooks progress tracker, and Samsung A14 Wi-Fi LAN sync hub.
                    </p>

                    {/* Security & Play Protect Guidance */}
                    <div className="border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] p-4 space-y-2 text-[11px]">
                      <div className="font-mono font-bold uppercase text-[var(--cv-text)] flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-emerald-600" />
                        <span>How to Install Without Play Store Block:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-[var(--cv-text-muted)] font-mono text-[10px]">
                        <li>Tap <strong className="text-[var(--cv-text)]">Download Android APK</strong> below directly on your phone.</li>
                        <li>When browser prompts <em className="text-[var(--cv-text)]">&ldquo;File might be harmful&rdquo;</em>, tap <strong className="text-emerald-600">Download anyway</strong>.</li>
                        <li>Open the file → If prompted, tap <strong className="text-[var(--cv-text)]">Settings</strong> → toggle <strong className="text-emerald-600">Allow from this source</strong> ON → tap <strong className="text-[var(--cv-text)]">Install</strong>.</li>
                        <li>If Google Play Protect asks, tap <strong className="text-[var(--cv-text)]">More details</strong> → <strong className="text-emerald-600">Install anyway</strong>.</li>
                      </ol>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href="/installers/ChroniclesVault-Android-v1.0.apk"
                      download="ChroniclesVault-Android-v1.0.apk"
                      className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-accent)] px-5 py-3 text-cv-xs font-mono font-bold uppercase text-[var(--cv-accent-fg)] shadow-[3px_3px_0px_var(--cv-border-strong)] hover:opacity-95 transition-all cursor-pointer text-center"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Android APK (Direct)</span>
                    </a>
                  </div>
                </div>

                {/* ── CARD 2: WINDOWS PC WORKSTATION INSTALLER ── */}
                <div className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-6 sm:p-8 shadow-[6px_6px_0px_var(--cv-border-strong)] flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--cv-border)] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)]">
                          <Monitor className="h-6 w-6 text-[var(--cv-accent-strong)]" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-cv-lg text-[var(--cv-text)]">
                            Windows PC Workstation
                          </h3>
                          <p className="text-[11px] font-mono text-[var(--cv-text-muted)]">
                            Windows 10 / 11 (Universal x86 &amp; x64 Architecture)
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-1 border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] text-[var(--cv-accent-strong)]">
                        v2.0 Desktop Studio
                      </span>
                    </div>

                    <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                      Native Desktop Studio with Chromium/Edge WebView2 window, 3-pane Bento workstation, native PC watch folder scanner, desktop media launcher, and all 32 features built into the Help Center.
                    </p>

                    {/* Path-Agnostic Guarantee */}
                    <div className="border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] p-4 space-y-2 text-[11px]">
                      <div className="font-mono font-bold uppercase text-[var(--cv-text)] flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Universal PC Installation Guarantee:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[var(--cv-text-muted)] font-mono text-[10px]">
                        <li><strong className="text-[var(--cv-text)]">Zero Hardcoded Paths:</strong> Dynamically installs to <code className="text-[var(--cv-text)]">%LocalAppData%\Programs\ChroniclesVault</code>.</li>
                        <li><strong className="text-[var(--cv-text)]">Automatic Shortcuts:</strong> Creates clean Desktop and Start Menu shortcuts.</li>
                        <li><strong className="text-[var(--cv-text)]">Portable Mode:</strong> Also available as a standalone zero-install ZIP archive.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href="/installers/ChroniclesVault-Windows-x86-Setup.exe"
                      download="ChroniclesVault-Windows-x86-Setup.exe"
                      className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-accent)] px-5 py-3 text-cv-xs font-mono font-bold uppercase text-[var(--cv-accent-fg)] shadow-[3px_3px_0px_var(--cv-border-strong)] hover:opacity-95 transition-all cursor-pointer text-center"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Setup (.exe)</span>
                    </a>
                    <a
                      href="/installers/ChroniclesVault-Windows-x86-Setup.zip"
                      download="ChroniclesVault-Windows-x86-Setup.zip"
                      className="inline-flex items-center justify-center gap-2 border-2 border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-4 py-3 text-cv-xs font-mono font-bold uppercase text-[var(--cv-text)] shadow-[3px_3px_0px_var(--cv-border-strong)] hover:bg-[var(--cv-surface-hover)] transition-all cursor-pointer text-center"
                    >
                      <HardDrive className="h-4 w-4" />
                      <span>Portable .ZIP</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              FOOTER CTA BANNER
             ═══════════════════════════════════════════════════════════════════ */}
          <footer className="relative z-10 py-12 px-4 sm:px-8 border-t-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <div className="font-extrabold text-cv-base font-mono uppercase tracking-wider text-[var(--cv-text)]">
                  CHRONICLES VAULT
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] mt-1">
                  4 Distinct Themes (Midnight Arcana · Antique Parchment · Blossom Ascendant · Ink) ·
                  23 Seeded Anime, Series, Movies &amp; Written Works · Auto-Locking AES-256 Vault
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenFeaturesGuide}
                  className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-4 py-2.5 text-cv-xs font-mono font-bold uppercase text-[var(--cv-text)] hover:bg-[var(--cv-surface-hover)] shadow-[3px_3px_0px_var(--cv-border-strong)] cursor-pointer"
                >
                  32 Features &amp; Screenshots
                </button>
                <button
                  type="button"
                  onClick={() => handleEnterRoom()}
                  className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-accent)] px-5 py-2.5 text-cv-xs font-mono font-bold uppercase text-[var(--cv-accent-fg)] shadow-[3px_3px_0px_var(--cv-border-strong)] hover:opacity-95 cursor-pointer"
                >
                  Enter My Room ✦
                </button>
              </div>
            </div>
          </footer>
        </>
      )}
      {/* Sign Up / Switch Explorer Modal */}
      {showSignUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-6 shadow-[8px_8px_0px_var(--cv-border-strong)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--cv-border)] pb-3">
              <div className="font-mono font-bold text-cv-sm uppercase text-[var(--cv-text)] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                <span>CREATE SANCTUM ID — SIGN UP</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSignUpModal(false)}
                className="text-cv-xs font-mono text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] cursor-pointer"
              >
                [✕ CLOSE]
              </button>
            </div>
            <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
              Enter your explorer handle. Once created, your profile stays permanently signed in on this browser without needing to sign in again.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (signUpInput.trim()) {
                  const uname = signUpInput.trim();
                  window.localStorage.setItem("cv:username", uname);
                  setCurrentUser(uname);
                  setShowSignUpModal(false);
                  setSignUpInput("");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[var(--cv-text-subtle)] mb-1">
                  Explorer Handle / Username:
                </label>
                <input
                  type="text"
                  required
                  value={signUpInput}
                  onChange={(e) => setSignUpInput(e.target.value)}
                  placeholder="e.g. Kaelen, Sakura, ShadowArchivist"
                  className="w-full border-2 border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-3.5 py-2.5 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] font-mono focus:outline-none focus:border-[var(--cv-accent)]"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignUpModal(false)}
                  className="border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-4 py-2 text-cv-xs font-mono uppercase text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border-2 border-[var(--cv-border-strong)] bg-[var(--cv-accent)] px-5 py-2 text-cv-xs font-mono font-bold uppercase text-[var(--cv-accent-fg)] shadow-[3px_3px_0px_var(--cv-border-strong)] hover:opacity-95 cursor-pointer"
                >
                  Create ID &amp; Enter ✦
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SanctumHome;
