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
    name: "Grand Sanctum",
    title: "Anime, Web Series, Movies & Multimedia Chamber",
    motto: "Primary personal archive for serial fiction, animated series, and cinema.",
    accentColor: "#4f46e5",
    themePreference: "midnight-arcana",
  },
  {
    id: "scholar-study",
    name: "Antique Parchment",
    title: "Sunlit Vellum Study, Light Novels & EPUBs",
    motto: "Warm antique vellum paper, burnt sienna ink, and distraction-free deep reading.",
    accentColor: "#ea580c",
    themePreference: "parchment-ink",
  },
  {
    id: "xianxia-pavilion",
    name: "Blossom Pavilion",
    title: "Cultivation Novels, Manhwa & Donghua Chamber",
    motto: "Ten thousand chapters of ascension in sakura-white & crimson rose.",
    accentColor: "#e11d48",
    themePreference: "xianxia-realm",
  },
  {
    id: "ink-atelier",
    name: "Sumi-e Ink Atelier",
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
    description: "Modern anime & manga database (connected directly to Grimoire's 1-click Cover Art fetcher).",
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
    worksCount: 0,
    activeCount: 0,
    memoriesCount: 0,
    chaptersTracked: 0,
  });
  const [featuredWork, setFeaturedWork] = React.useState<{
    title: string;
    category: string;
    updateInfo: string;
  } | null>(null);
  const [featuredMedia, setFeaturedMedia] = React.useState<{
    title: string;
    subtitle: string;
    progressText: string;
    progressPercent: number;
  } | null>(null);

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
    if (typeof window === "undefined") return "Archivist";
    return window.localStorage.getItem("cv:username") || "Archivist";
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

        // 2. Hydrate @grimoire/state in background and extract live Room telemetry
        const stateModule = await import("@grimoire/state");
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

        const activeItem = items.find((i) => {
          const st = i.relationship?.personalState;
          return st === "reading" || st === "watching" || st === "rereading";
        }) ?? items[0];

        const mediaItem = items.find((i) => 
          i.work.contentType === "anime" || 
          i.work.contentType === "donghua" || 
          i.accessPaths.some((p) => p.kind === "local_file")
        );

        if (!cancelled) {
          setRoomStats({
            worksCount: items.length,
            activeCount,
            memoriesCount,
            chaptersTracked,
          });
          if (activeItem) {
            setFeaturedWork({
              title: activeItem.work.title,
              category: activeItem.work.contentType.toUpperCase(),
              updateInfo: activeItem.relationship?.currentAnchor
                ? "In Progress · Ready to Read"
                : "Ready to Read in Room",
            });
          }
          if (mediaItem) {
            setFeaturedMedia({
              title: mediaItem.work.title,
              subtitle: "Local Media Archive",
              progressText: "In Library",
              progressPercent: 50,
            });
          }
        }

        await workspacePromise;
        preloadDone = true;
        if (!cancelled) {
          setProgress(100);
          setIsRoomReady(true);
        }
      } catch {
        preloadDone = true;
        if (!cancelled) {
          setProgress(100);
          setIsRoomReady(true);
        }
      }
    };

    void runPreload();

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        const step = preloadDone ? 50 : 25;
        const next = Math.min(100, prev + step);
        if (next === 100 && !cancelled) {
          setIsRoomReady(true);
        }
        return next;
      });
    }, 20);

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
      window.localStorage.setItem("grimoire-theme", room.themePreference);
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
      motto: "Custom user profile room in Grimoire.",
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
    }, 80);
  };

  const handleQuickCaptureSite = async (site: PopularSiteEntry) => {
    try {
      const stateMod = await import("@grimoire/state");
      const now = new Date().toISOString();
      const batchId = `portal-capture-${Date.now()}`;
      stateMod.useRadarStore.getState().importBatch({
        format: "grimoire-radar",
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
      className={`relative min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)] bg-cover bg-center bg-fixed selection:bg-[var(--gm-accent-muted)] overflow-x-hidden ${
        isExitingToRoom ? "gm-room-exit-curtain" : ""
      }`}
      style={{ backgroundImage: "var(--gm-bg-image)" }}
      onMouseMove={(e) => {
        const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
        setPointerTilt({ x: nx, y: ny });
      }}
    >
      {/* Theme Background Image Readability Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "var(--gm-main-overlay)" }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          ARCHITECTURAL TOP HEADER BAR (CLEAN & GAME SCREEN FOCUS)
         ═══════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-40 border-b-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)]/95 backdrop-blur-md">
        {/* Main Architectural Header Bar */}
        <div className="px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] flex items-center justify-center font-mono font-bold text-gm-xs shadow-[2px_2px_0px_var(--gm-border-strong)]">
              CV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gm-sm uppercase tracking-wider text-[var(--gm-text)]">
                  Grimoire
                </span>
              </div>
            </div>
          </div>

          {/* Center Inline 4-Theme Architectural Switcher */}
          <div className="hidden xl:flex items-center border border-[var(--gm-border-strong)] bg-[var(--gm-surface)]">
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
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border-r last:border-r-0 border-[var(--gm-border)] transition-colors cursor-pointer ${
                    isCurrentTheme
                      ? "bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] font-bold"
                      : "text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)]"
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
                  className="hidden lg:inline-flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Manifesto</span>
                </a>
                <a
                  href="#popular-portals"
                  className="hidden lg:inline-flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Portals</span>
                </a>
                <a
                  href="#installers"
                  className="hidden md:inline-flex flex-col items-center gap-1 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--gm-accent-strong)] hover:text-[var(--gm-text)] border border-[var(--gm-accent)]/40 bg-[var(--gm-accent)]/10 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={onOpenFeaturesGuide}
                  className="inline-flex flex-col items-center gap-1 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)] shadow-[2px_2px_0px_var(--gm-border-strong)] transition-all cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                  <span>Features</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowSignUpModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)] shadow-[2px_2px_0px_var(--gm-border-strong)] transition-all cursor-pointer"
              title="Sign up as new explorer or switch profile handle"
            >
              <UserPlus className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
              <span>Sign Up / Switch</span>
            </button>
            <button
              type="button"
              onClick={() => handleEnterRoom()}
              className="inline-flex items-center gap-1.5 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--gm-accent-fg)] shadow-[3px_3px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
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
        <div className="pointer-events-none absolute inset-x-4 sm:inset-x-8 top-24 bottom-8 border-x border-[var(--gm-border)]/45 max-w-7xl mx-auto" />

        {/* Main Hero Grid: Left Game-Screen Title Column | Right 3D Architectural Cockpit HUD */}
        <div className="relative z-10 max-w-7xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center py-6">
          {/* LEFT 6 COLS: Game Title Screen, User Greeting, Big Action Button, Atmosphere Switcher */}
          <div className="lg:col-span-6 space-y-6 gm-kinetic-enter">
            {/* Game Screen Hero Card */}
            <div className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-6 sm:p-8 shadow-[6px_6px_0px_var(--gm-border-strong)] space-y-6">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--gm-accent-strong)]">
                    ARCHIVIST ACCESS TERMINAL
                  </span>
                </div>
                <span className="text-[10px] font-mono border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-500 font-bold">
                  ● ROOM READY
                </span>
              </div>

              {/* Title & Greeting */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gm-text-muted)]">
                  SANCTUM RESIDENCE · {activeRoom.name.toUpperCase()}
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--gm-text)] leading-tight">
                  WELCOME, ARCHIVIST{" "}
                  <span className="text-[var(--gm-accent-strong)]">{currentUser.toUpperCase()}</span>.
                </h1>
                <p className="text-gm-xs sm:text-gm-sm text-[var(--gm-text-muted)] leading-relaxed max-w-xl">
                  Your private reading sanctum and multimedia workstation are synchronized. Enter your room to browse your library shelves, chapter updates, and offline media.
                </p>
              </div>

              {/* High-Impact Game Title Primary Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleEnterRoom()}
                  className="w-full inline-flex items-center justify-center gap-3 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-8 py-4 sm:py-5 text-gm-base sm:text-gm-lg font-mono font-extrabold uppercase tracking-wider text-[var(--gm-accent-fg)] shadow-[6px_6px_0px_var(--gm-border-strong)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_var(--gm-border-strong)] transition-all cursor-pointer"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>ENTER YOUR ROOM ✦</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              {/* Account Switcher & Sign Up Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--gm-text-muted)] pt-1 border-t border-[var(--gm-border)]">
                <span>Active Profile: <strong className="text-[var(--gm-text)]">@{currentUser}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSignUpModal(true)}
                    className="border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)] shadow-[1px_1px_0px_var(--gm-border-strong)] transition-all cursor-pointer"
                  >
                    Switch Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignUpModal(true)}
                    className="border border-[var(--gm-accent)] bg-[var(--gm-accent-muted)] px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-[var(--gm-accent-strong)] hover:bg-[var(--gm-accent)] hover:text-[var(--gm-accent-fg)] shadow-[1px_1px_0px_var(--gm-border-strong)] transition-all cursor-pointer"
                  >
                    + Sign Up
                  </button>
                </div>
              </div>

              {/* Standalone Native Installers Download Strip */}
              <div className="border border-[var(--gm-border-strong)] bg-[var(--gm-surface)]/60 p-3 text-[11px] font-mono space-y-1.5 shadow-[2px_2px_0px_var(--gm-border-strong)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold uppercase text-[var(--gm-text)] flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
                    <span>Download Native Installers:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href="/downloads/pc_grimoire-Windows-x86-Setup.exe"
                      download="pc_grimoire-Windows-x86-Setup.exe"
                      className="inline-flex items-center gap-1 border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-[var(--gm-text)] hover:bg-[var(--gm-accent)] hover:text-[var(--gm-accent-fg)] transition-colors"
                    >
                      <Monitor className="h-3 w-3" />
                      <span>Windows x86 App</span>
                    </a>
                    <a
                      href="/downloads/mobile_grimoire-Android-v1.0.apk"
                      download="mobile_grimoire-Android-v1.0.apk"
                      className="inline-flex items-center gap-1 border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-[var(--gm-text)] hover:bg-[var(--gm-accent)] hover:text-[var(--gm-accent-fg)] transition-colors"
                    >
                      <Smartphone className="h-3 w-3" />
                      <span>Android Mobile APK</span>
                    </a>
                  </div>
                </div>
                <p className="text-[10px] italic text-[var(--gm-text-muted)] leading-tight">
                  Web version provides instant cloud updates; standalone installers available for offline local media archives.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT 6 COLS: 3D Perspective Game Screen Cockpit HUD */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div
              className="relative w-full max-w-xl border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)]/95 p-6 sm:p-7 shadow-[8px_8px_0px_var(--gm-border-strong)] overflow-hidden transition-transform duration-200 ease-out"
              style={{
                transform: `perspective(1100px) rotateY(${pointerTilt.x * 4}deg) rotateX(${
                  -pointerTilt.y * 3.5
                }deg)`,
              }}
            >
              {/* Cockpit HUD Top Bar: User Name & Sync Status */}
              <div className="flex items-center justify-between border-b-2 border-[var(--gm-border-strong)] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-gm-xs font-mono font-bold uppercase tracking-wider text-[var(--gm-text)]">
                    @{currentUser}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                    Sync Link Active
                  </span>
                </div>
              </div>

              {/* Profile Details Grid: Rank, Title, Tier & Updates */}
              <div className="grid grid-cols-3 gap-2 mb-4 border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3 shadow-[2px_2px_0px_var(--gm-border)]">
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                    Rank &amp; Title
                  </div>
                  <div className="text-gm-xs font-mono font-bold text-[var(--gm-text)] mt-0.5 truncate">
                    Grand Archivist
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                    Rank Tier
                  </div>
                  <div className="text-gm-xs font-mono font-bold text-[var(--gm-accent-strong)] mt-0.5">
                    Tier: S
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                    Active Works
                  </div>
                  <div className="text-gm-xs font-mono font-bold text-amber-500 mt-0.5">
                    {roomStats.activeCount > 0 ? `${roomStats.activeCount} Active` : "All Caught Up"}
                  </div>
                </div>
              </div>

              {/* Status HUD: High Priority Works & Half-Watched Local Media */}
              <div className="space-y-3 relative z-10">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--gm-text-subtle)] border-b border-[var(--gm-border)] pb-1 flex items-center justify-between">
                  <span>HIGH PRIORITY WORKS &amp; RESUME</span>
                  <span className="text-emerald-500 font-mono text-[9px] font-bold">● READY TO READ</span>
                </div>

                {/* 1. High Priority Chapter Update */}
                <div className="border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] p-3.5 shadow-[2px_2px_0px_var(--gm-border-strong)] flex items-start gap-3">
                  <div className="p-2 border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] text-amber-500 shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-500 border border-amber-500/40">
                        {featuredWork ? "ACTIVE READING" : "CHAMBER STANDBY"}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--gm-text-muted)]">
                        {featuredWork ? featuredWork.category : "Library Ready"}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-gm-sm text-[var(--gm-text)] truncate mt-1">
                      {featuredWork ? featuredWork.title : "Your Sanctum Awaits"}
                    </h4>
                    <p className="text-[11px] font-mono text-[var(--gm-text-muted)] mt-0.5">
                      {featuredWork ? featuredWork.updateInfo : "Enter room to browse your library and add works"}
                    </p>
                  </div>
                </div>

                {/* 2. Half-Watched Local Media Resume */}
                <div className="border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] p-3.5 shadow-[2px_2px_0px_var(--gm-border-strong)] flex items-start gap-3">
                  <div className="p-2 border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] text-cyan-500 shrink-0">
                    <Film className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-cyan-500/20 text-cyan-500 border border-cyan-500/40">
                        {featuredMedia ? "LOCAL MEDIA" : "MEDIA STANDBY"}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--gm-text-muted)]">
                        {featuredMedia ? featuredMedia.subtitle : "Workstation Player"}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-gm-sm text-[var(--gm-text)] truncate mt-1">
                      {featuredMedia ? featuredMedia.title : "Local Shelf Hub"}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--gm-text-muted)] mt-1">
                      <span>{featuredMedia ? featuredMedia.progressText : "Drop media files in Local Shelf to watch"}</span>
                      {featuredMedia && <span className="text-[var(--gm-accent-strong)] font-bold">{featuredMedia.progressPercent}%</span>}
                    </div>
                    {featuredMedia && (
                      <div className="w-full h-1.5 bg-[var(--gm-border)] mt-1.5 overflow-hidden">
                        <div className="h-full bg-[var(--gm-accent-strong)]" style={{ width: `${featuredMedia.progressPercent}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Cockpit Bottom Chamber Launcher Bar */}
                <div className="pt-2 flex items-center justify-between border-t border-[var(--gm-border)]">
                  <span className="text-[10px] font-mono text-[var(--gm-text-muted)]">
                    Chamber: <strong className="text-[var(--gm-text)]">{activeRoom.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEnterRoom()}
                    className="inline-flex items-center gap-1.5 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-3.5 py-1.5 text-[11px] font-mono font-bold uppercase text-[var(--gm-accent-fg)] shadow-[2px_2px_0px_var(--gm-border-strong)] hover:opacity-95 transition-opacity cursor-pointer"
                  >
                    <span>Launch Chamber →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator (Web App Only) */}
        {isWebFullHome && (
          <div className="relative z-10 max-w-7xl w-full mx-auto pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-[var(--gm-border-strong)] text-gm-xs font-mono text-[var(--gm-text-muted)]">
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-[var(--gm-accent-strong)] animate-bounce" />
              <span>
                SCROLL FOR <strong>01 / ARCHITECTURAL MANIFESTO</strong> &amp;{" "}
                <strong>02 / GLOBAL PORTAL DIRECTORY (24 SITES)</strong>
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <a href="#why-better" className="hover:text-[var(--gm-accent-strong)] font-bold">
                [01 · MANIFESTO]
              </a>
              <a href="#popular-portals" className="hover:text-[var(--gm-accent-strong)] font-bold">
                [02 · 24 PORTALS]
              </a>
              <a href="#installers" className="hover:text-[var(--gm-accent-strong)] font-bold text-[var(--gm-accent-strong)]">
                [03 · INSTALLERS]
              </a>
            </div>
          </div>
        )}
      </section>

      {isWebFullHome && (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2: WHY GRIMOIRE IS BETTER (ARCHITECTURAL GRID)
             ═══════════════════════════════════════════════════════════════════ */}
          <section
            id="why-better"
            className="relative z-10 py-20 px-4 sm:px-8 border-t-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)]/85"
          >
            <div className="max-w-7xl mx-auto space-y-12">
              {/* Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-2 border-[var(--gm-border-strong)] pb-6">
                <div className="max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-2 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--gm-accent-strong)]">
                    <Flame className="h-3.5 w-3.5" />
                    <span>01 · ARCHITECTURAL MANIFESTO</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    Why Grimoire Replaces Fragile Bookmarks, Spreadsheets &amp; Cloud Trackers
                  </h2>
                  <p className="text-gm-sm sm:text-gm-base text-[var(--gm-text-muted)] leading-relaxed">
                    Engineered as a{" "}
                    <strong className="text-[var(--gm-text)]">
                      permanent, local-first personal fiction &amp; cinema archive
                    </strong>{" "}
                    spanning Written Novels, Manga, Manhwa, Anime, Web Series, Movies, and Local PC
                    video folders.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenFeaturesGuide}
                  className="inline-flex items-center gap-2 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-5 py-3.5 text-gm-xs font-mono font-bold uppercase tracking-wider text-[var(--gm-accent-fg)] shadow-[4px_4px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all shrink-0 cursor-pointer"
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
                    tryRoute: "/library",
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
                      "Bind local PC archives (like MKV/MP4 series, Light Novels & EPUBs) directly into your library shelves alongside offline readers.",
                    tryRoute: "/library",
                  },
                  {
                    icon: FolderGit2,
                    badge: "04 · FRANCHISE INTELLIGENCE",
                    title: "Cross-Medium Adaptation & Lore Graph",
                    oldWay:
                      "Finishing Anime Season 1 and having no idea which Manhwa chapter or Web Novel volume to continue from.",
                    betterWay:
                      "Connect Web Novel ↔ Light Novel ↔ Manhwa ↔ Anime into a visual Adaptation Graph with exact chapter/episode handoff notes.",
                    tryRoute: "/library",
                  },
                  {
                    icon: KeyRound,
                    badge: "05 · ZERO-KNOWLEDGE VAULT",
                    title: "Isolated Zero-Knowledge Vault Chamber",
                    oldWay:
                      "Public cloud trackers expose your private titles, or complex vaults lock you out when switching tabs.",
                    betterWay:
                      "Sensitive works are isolated behind an encrypted zero-knowledge vault inside your room. Accessible strictly through the internal vault room with auto-lock on session close.",
                    tryRoute: "/library",
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
                      className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-6 flex flex-col justify-between shadow-[4px_4px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-3">
                          <div className="h-9 w-9 bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] border border-[var(--gm-border-strong)] flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="bg-[var(--gm-surface)] border border-[var(--gm-border-strong)] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[var(--gm-accent-strong)]">
                            {card.badge}
                          </span>
                        </div>

                        <h3 className="text-gm-lg font-extrabold text-[var(--gm-text)]">
                          {card.title}
                        </h3>

                        <div className="border-l-2 border-[var(--gm-danger)] bg-[var(--gm-bg)]/70 p-3 space-y-1">
                          <div className="text-[10px] font-mono font-bold uppercase text-[var(--gm-danger)]">
                            ✕ OLD TRACKERS / BOOKMARKS
                          </div>
                          <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                            {card.oldWay}
                          </p>
                        </div>

                        <div className="border-l-2 border-[var(--gm-success)] bg-[var(--gm-surface)]/70 p-3 space-y-1">
                          <div className="text-[10px] font-mono font-bold uppercase text-[var(--gm-success)]">
                            ✦ GRIMOIRE
                          </div>
                          <p className="text-gm-xs text-[var(--gm-text)] leading-relaxed">
                            {card.betterWay}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-[var(--gm-border)] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleEnterRoom(card.tryRoute)}
                          className="text-gm-xs font-mono font-bold uppercase text-[var(--gm-accent-strong)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>OPEN IN ROOM</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={onOpenFeaturesGuide}
                          className="text-[11px] font-mono text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)] cursor-pointer"
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
            className="relative z-10 py-20 px-4 sm:px-8 border-t-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg)]/90"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-2 border-[var(--gm-border-strong)] pb-6">
                <div className="max-w-3xl space-y-2">
                  <div className="inline-flex items-center gap-2 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--gm-accent-strong)]">
                    <Compass className="h-3.5 w-3.5" />
                    <span>02 · GLOBAL PORTAL DIRECTORY (24 CURATED SITES)</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    Most Popular Manga, Manhwa, Web Novel &amp; Anime Sites
                  </h2>
                  <p className="text-gm-sm text-[var(--gm-text-muted)] leading-relaxed">
                    Launch your favorite reading and watching portals directly from your Room
                    Homepage, copy their URLs to bind as Work Access Paths, or click{" "}
                    <strong className="text-[var(--gm-text)]">+ RADAR</strong> to save any portal
                    into your triage queue.
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full lg:w-80">
                  <Search className="h-4 w-4 text-[var(--gm-text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    placeholder="Search MangaDex, Crunchyroll, Webtoon…"
                    className="w-full border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] pl-10 pr-4 py-2 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:border-[var(--gm-border-focus)]"
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
                    className={`px-4 py-2 text-gm-xs font-mono font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                      siteCategory === tab.id
                        ? "border-[var(--gm-border-strong)] bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] shadow-[3px_3px_0px_var(--gm-border-strong)]"
                        : "border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:border-[var(--gm-border-strong)]"
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
                    className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-5 flex flex-col justify-between shadow-[3px_3px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-gm-base font-extrabold text-[var(--gm-text)]">
                              {site.name}
                            </h3>
                            <span className="border border-[var(--gm-border-strong)] bg-[var(--gm-accent-muted)] px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[var(--gm-accent-strong)]">
                              {site.categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-[var(--gm-text-subtle)] mt-0.5">
                            {site.domain} · {site.languages}
                          </p>
                        </div>
                        <span className="border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 py-0.5 text-[10px] font-mono uppercase text-[var(--gm-text-muted)] shrink-0">
                          {site.badge}
                        </span>
                      </div>

                      <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                        {site.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[var(--gm-border)] flex items-center justify-between gap-2">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[var(--gm-surface)] hover:bg-[var(--gm-surface-hover)] border border-[var(--gm-border-strong)] px-3 py-1.5 text-gm-xs font-mono font-bold uppercase text-[var(--gm-text)] transition-colors"
                      >
                        <span>LAUNCH</span>
                        <ExternalLink className="h-3 w-3 text-[var(--gm-accent-strong)]" />
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
                          className="inline-flex items-center gap-1 border border-[var(--gm-border-strong)] bg-[var(--gm-bg)] px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] cursor-pointer"
                          title="Copy portal URL"
                        >
                          {copiedSiteId === site.id ? (
                            <>
                              <Check className="h-3 w-3 text-[var(--gm-success)]" />
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
                          className="inline-flex items-center gap-1 border border-[var(--gm-border-strong)] bg-[var(--gm-bg)] px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase text-[var(--gm-accent-strong)] hover:bg-[var(--gm-accent-muted)] cursor-pointer"
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
            className="relative z-10 py-20 px-4 sm:px-8 border-t-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg)]"
          >
            <div className="max-w-7xl mx-auto space-y-12">
              {/* Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b-2 border-[var(--gm-border-strong)] pb-6">
                <div className="max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-2 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-3 py-1 text-gm-xs font-mono font-bold uppercase tracking-widest text-[var(--gm-accent-strong)] shadow-[2px_2px_0px_var(--gm-border-strong)]">
                    <Download className="h-3.5 w-3.5" />
                    <span>03 · STANDALONE NATIVE INSTALLERS</span>
                  </div>
                  <h2 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)]">
                    Direct Multi-Device Downloads &amp; Offline Installers
                  </h2>
                  <p className="text-gm-sm text-[var(--gm-text-muted)] leading-relaxed">
                    Install Grimoire as a native offline application on your Android phone (Samsung Galaxy A14 &amp; all models) or Windows PC (x86 &amp; x64). Sideload cleanly without Play Store tracking or third-party store lock-in.
                  </p>
                </div>
              </div>

              {/* Crucial Network / Platform Notice Banner */}
              <div className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-surface)] p-5 shadow-[4px_4px_0px_var(--gm-border-strong)] flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="p-2 border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] shrink-0">
                  <AlertTriangle className="h-6 w-6 text-[#d97706]" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--gm-text)]">
                    ✦ ARCHITECTURAL NOTICE: WEB VS. NATIVE INSTALLERS ✦
                  </div>
                  <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                    <strong className="text-[var(--gm-text)]">Web Browser Version:</strong> Works best with instant portal linking, real-time multi-device cloud relay, and online metadata fetching — <strong className="text-[var(--gm-accent-strong)]">requires active internet connection</strong>.<br />
                    <strong className="text-[var(--gm-text)]">Windows &amp; Android Installers:</strong> Engineered for complete offline freedom. Index your local PC folders, watch downloaded anime ZIPs/MKVs, read offline EPUBs/CBZs, and sync over local Wi-Fi without internet.
                  </p>
                  <p className="text-[11px] font-mono italic text-[var(--gm-accent-strong)] pt-1 border-t border-[var(--gm-border)]">
                    Web version provides instant cloud updates; standalone installers available for offline local media archives.
                  </p>
                </div>
              </div>

              {/* Download Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ── CARD 1: ANDROID MOBILE INSTALLER ── */}
                <div className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-6 sm:p-8 shadow-[6px_6px_0px_var(--gm-border-strong)] flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)]">
                          <Smartphone className="h-6 w-6 text-[var(--gm-accent-strong)]" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gm-lg text-[var(--gm-text)]">
                            Android Mobile APK
                          </h3>
                          <p className="text-[11px] font-mono text-[var(--gm-text-muted)]">
                            Samsung Galaxy A14, One UI, Pixel &amp; All Android (v7.0 to 14+)
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-1 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] text-[var(--gm-accent-strong)]">
                        APK v1.0.0
                      </span>
                    </div>

                    <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                      Direct standalone APK download. Pre-configured with offline IndexedDB vault, EPUB/PDF/CBZ reader engines, audiobooks progress tracker, and Samsung A14 Wi-Fi LAN sync hub.
                    </p>

                    {/* Security & Play Protect Guidance */}
                    <div className="border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] p-4 space-y-2 text-[11px]">
                      <div className="font-mono font-bold uppercase text-[var(--gm-text)] flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-emerald-600" />
                        <span>How to Install Without Play Store Block:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-[var(--gm-text-muted)] font-mono text-[10px]">
                        <li>Tap <strong className="text-[var(--gm-text)]">Download Android Mobile APK</strong> below directly on your phone.</li>
                        <li>When browser prompts <em className="text-[var(--gm-text)]">&ldquo;File might be harmful&rdquo;</em>, tap <strong className="text-emerald-600">Download anyway</strong>.</li>
                        <li>Open the file → If prompted, tap <strong className="text-[var(--gm-text)]">Settings</strong> → toggle <strong className="text-emerald-600">Allow from this source</strong> ON → tap <strong className="text-[var(--gm-text)]">Install</strong>.</li>
                        <li>If Google Play Protect asks, tap <strong className="text-[var(--gm-text)]">More details</strong> → <strong className="text-emerald-600">Install anyway</strong>.</li>
                      </ol>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href="/installers/ChroniclesVault-Android-v1.0.apk"
                      download="ChroniclesVault-Android-v1.0.apk"
                      className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-5 py-3 text-gm-xs font-mono font-bold uppercase text-[var(--gm-accent-fg)] shadow-[3px_3px_0px_var(--gm-border-strong)] hover:opacity-95 transition-all cursor-pointer text-center"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Android Mobile APK</span>
                    </a>
                  </div>
                </div>

                {/* ── CARD 2: WINDOWS PC WORKSTATION INSTALLER ── */}
                <div className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-6 sm:p-8 shadow-[6px_6px_0px_var(--gm-border-strong)] flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)]">
                          <Monitor className="h-6 w-6 text-[var(--gm-accent-strong)]" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gm-lg text-[var(--gm-text)]">
                            Windows x86 App
                          </h3>
                          <p className="text-[11px] font-mono text-[var(--gm-text-muted)]">
                            Windows 10 / 11 (Universal x86 &amp; x64 Architecture)
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-1 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] text-[var(--gm-accent-strong)]">
                        v2.0 Desktop Studio
                      </span>
                    </div>

                    <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                      Native Desktop Studio with Chromium/Edge WebView2 window, 3-pane Bento workstation, native PC watch folder scanner, desktop media launcher, and all 32 features built into the Help Center.
                    </p>

                    {/* Path-Agnostic Guarantee */}
                    <div className="border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] p-4 space-y-2 text-[11px]">
                      <div className="font-mono font-bold uppercase text-[var(--gm-text)] flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Universal PC Installation Guarantee:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[var(--gm-text-muted)] font-mono text-[10px]">
                        <li><strong className="text-[var(--gm-text)]">Zero Hardcoded Paths:</strong> Dynamically installs to <code className="text-[var(--gm-text)]">%LocalAppData%\Programs\ChroniclesVault</code>.</li>
                        <li><strong className="text-[var(--gm-text)]">Automatic Shortcuts:</strong> Creates clean Desktop and Start Menu shortcuts.</li>
                        <li><strong className="text-[var(--gm-text)]">Portable Mode:</strong> Also available as a standalone zero-install ZIP archive.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href="/installers/ChroniclesVault-Windows-x86-Setup.exe"
                      download="ChroniclesVault-Windows-x86-Setup.exe"
                      className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-5 py-3 text-gm-xs font-mono font-bold uppercase text-[var(--gm-accent-fg)] shadow-[3px_3px_0px_var(--gm-border-strong)] hover:opacity-95 transition-all cursor-pointer text-center"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Windows x86 App (.exe)</span>
                    </a>
                    <a
                      href="/installers/ChroniclesVault-Windows-x86-Setup.zip"
                      download="ChroniclesVault-Windows-x86-Setup.zip"
                      className="inline-flex items-center justify-center gap-2 border-2 border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-4 py-3 text-gm-xs font-mono font-bold uppercase text-[var(--gm-text)] shadow-[3px_3px_0px_var(--gm-border-strong)] hover:bg-[var(--gm-surface-hover)] transition-all cursor-pointer text-center"
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
          <footer className="relative z-10 py-12 px-4 sm:px-8 border-t-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <div className="font-extrabold text-gm-base font-mono uppercase tracking-wider text-[var(--gm-text)]">
                  GRIMOIRE
                </div>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1">
                  4 Distinct Themes (Midnight Arcana · Antique Parchment · Blossom Ascendant · Ink) ·
                  Local-First Privacy · Zero-Knowledge Vault
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenFeaturesGuide}
                  className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-4 py-2.5 text-gm-xs font-mono font-bold uppercase text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)] shadow-[3px_3px_0px_var(--gm-border-strong)] cursor-pointer"
                >
                  32 Features &amp; Screenshots
                </button>
                <button
                  type="button"
                  onClick={() => handleEnterRoom()}
                  className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-5 py-2.5 text-gm-xs font-mono font-bold uppercase text-[var(--gm-accent-fg)] shadow-[3px_3px_0px_var(--gm-border-strong)] hover:opacity-95 cursor-pointer"
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
          <div className="w-full max-w-lg border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-6 shadow-[8px_8px_0px_var(--gm-border-strong)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-3">
              <div className="font-mono font-bold text-gm-sm uppercase text-[var(--gm-text)] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                <span>ARCHIVIST ACCESS — SWITCH OR SIGN UP</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSignUpModal(false)}
                className="text-gm-xs font-mono text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] cursor-pointer"
              >
                [✕ CLOSE]
              </button>
            </div>

            {/* Quick Switch / Existing Profiles */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold uppercase text-[var(--gm-text-subtle)]">
                1. Quick Switch Profile:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: "Archivist",
                    title: "Archivist",
                    role: "Grand Archivist · All Categories",
                  },
                ].map((account) => {
                  const isCurrent = currentUser === account.id;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => {
                        window.localStorage.setItem("cv:username", account.id);
                        setCurrentUser(account.id);
                        setShowSignUpModal(false);
                      }}
                      className={`text-left p-3 border-2 transition-all cursor-pointer ${
                        isCurrent
                          ? "border-[var(--gm-accent)] bg-[var(--gm-accent-muted)] shadow-[3px_3px_0px_var(--gm-accent)]"
                          : "border-[var(--gm-border-strong)] bg-[var(--gm-surface)] hover:bg-[var(--gm-surface-hover)] shadow-[2px_2px_0px_var(--gm-border-strong)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-gm-xs text-[var(--gm-text)]">
                          {account.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-[var(--gm-text-muted)] mt-1">
                        {account.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--gm-border)]" />
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase">
                <span className="bg-[var(--gm-bg-elevated)] px-2 text-[var(--gm-text-subtle)] font-bold">
                  OR CREATE NEW CUSTOM ID
                </span>
              </div>
            </div>

            {/* Custom Username Input */}
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
                <label className="block text-[10px] font-mono font-bold uppercase text-[var(--gm-text-subtle)] mb-1">
                  2. Enter Custom Username / Handle:
                </label>
                <input
                  type="text"
                  required
                  value={signUpInput}
                  onChange={(e) => setSignUpInput(e.target.value)}
                  placeholder="e.g. Kaelen, Sakura, ShadowArchivist"
                  className="w-full border-2 border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-3.5 py-2.5 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] font-mono focus:outline-none focus:border-[var(--gm-accent)]"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignUpModal(false)}
                  className="border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-4 py-2 text-gm-xs font-mono uppercase text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-accent)] px-5 py-2 text-gm-xs font-mono font-bold uppercase text-[var(--gm-accent-fg)] shadow-[3px_3px_0px_var(--gm-border-strong)] hover:opacity-95 cursor-pointer"
                >
                  Create Handle &amp; Save ✦
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
