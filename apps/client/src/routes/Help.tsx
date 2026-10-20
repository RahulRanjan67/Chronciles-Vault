import * as React from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Command,
  Compass,
  DoorOpen,
  HardDrive,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  Radar as RadarIcon,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
  Clock,
  Calendar,
  AlertCircle,
  ExternalLink,
  Mail,
  CheckCircle,
  Timer,
  Globe,
  Flame,
} from "lucide-react";
import {
  Badge,
  Button,
  PageContainer,
  cn,
} from "@grimoire/ui";
import { FeaturesGuide } from "./FeaturesGuide";

// ─── Local Card primitives ────────────────────────────────────────────────────
function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}
function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1.5", className)} {...props}>{children}</div>;
}
function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-none tracking-tight text-[var(--gm-text)]", className)} {...props}>{children}</h3>;
}
function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3", className)} {...props}>{children}</div>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
export interface HelpProps {
  onNavigateWork?: (workId: string) => void;
  onOpenFile?: (fileId: string) => void;
  onBack?: () => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "radar" | "readers" | "vault" | "troubleshooting" | "cadence";
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-storage",
    question: "Where is my fiction data and reading progress stored?",
    answer:
      "All library records, reading relationships, progress anchors, notes, and local files are stored strictly on your device using IndexedDB and localStorage. Grimoire is designed from the ground up to be local-first and privacy-respecting—no reading data is uploaded to remote servers without your explicit setup.",
    category: "general",
  },
  {
    id: "faq-sync-cross-device",
    question: "How does cross-device synchronization work between Web, PC Studio (.exe), and Mobile?",
    answer:
      "Grimoire supports local Wi-Fi / LAN synchronization and private Cloudflare D1 cloud sync. Your reading library, custom categories, reading history, and progress anchors synchronize seamlessly using smart conflict-free merging. Website credentials and Private Vault records are strictly excluded from remote sync to maintain zero-knowledge privacy.",
    category: "general",
  },
  {
    id: "faq-official-covers",
    question: "How does official cover auto-fetching work?",
    answer:
      "When you add a work or enter your room with imported titles, Grimoire automatically queries AniList, Open Library, and MangaUpdates in the background to fetch official high-resolution covers. Background fetches are completely silent—if a cover isn't found, no error alerts appear. You can also manually click 'Fetch Official Cover' on any Work Detail page, which will notify you if a cover is retrieved.",
    category: "general",
  },
  {
    id: "faq-cadence-manual",
    question: "How do I configure release update timers per access path when a website can't be scraped automatically?",
    answer:
      "When a website uses Cloudflare bot defense or proprietary reader apps, automated scraping fails. In Grimoire, navigate to the work's 'Access Paths' tab and click 'Set Timer' on any web access link. Select your expected chapter interval (e.g., Daily, Every 3 Days, Weekly on release days, or Bi-Weekly). Grimoire calculates the exact target date and displays a timer badge. When the target date arrives, a '⚠️ Chapter Check Due Now!' notification appears with a 1-click button to open the webpage and reset the cadence timer once verified.",
    category: "cadence",
  },
  {
    id: "faq-hiatus-timers",
    question: "How do I mark a work for Hiatus or Dropped, and how do Hiatus Awakening Timers work?",
    answer:
      "On the Work Detail page, select 'Paused' or 'Dropped' in the Status dropdown. A modal will prompt you for the reason (e.g., 'Author on medical hiatus', 'Season 1 ended') and allow you to set a Hiatus Awakening Timer (14, 30, 60, or 90 days). During this time, the story won't clutter your daily active queue. When the awakening date arrives, a prominent '🔔 HIATUS AWAKENING RECHECK DUE!' alert appears on the work and Return Desk. You can click 'Check Webpage' to see if chapters resumed, and either click 'Mark Off Hiatus (Resumed)' to immediately put it back in your active reading rotation, or extend the timer by another 30 days.",
    category: "cadence",
  },
  {
    id: "faq-multi-catalogs",
    question: "Which metadata catalogs can I search in Discover?",
    answer:
      "In the Discover tab, you can search across multiple world-class fiction databases: AniList (Anime, Manga, Manhwa, Light Novels), MangaUpdates / Baka-Updates (the premier database for Manga, Manhwa, Manhua, and Web Novels), Goodreads (global book reviews, member ratings, author quotes, and user bookshelves), Google Books (publication editions), MangaDex (scanlation releases), and Open Library (Western novels and literature), plus deep search gateways for NovelUpdates, Webnovel, IMDb, and Rotten Tomatoes.",
    category: "general",
  },
  {
    id: "faq-vault-single",
    question: "How many Private Vaults can I create, and what if I lose my master passphrase?",
    answer:
      "Each user profile has exactly one hardware-accelerated Private Vault protected by an AES-GCM 256-bit cryptographic key derived via PBKDF2. Because encryption happens on-device with zero-knowledge architecture, your master passphrase never leaves your machine. If you forget your passphrase, encrypted vault items cannot be recovered by anyone, so keep your passphrase in a secure password manager.",
    category: "vault",
  },
  {
    id: "faq-auto-lock",
    question: "How does Private Vault auto-locking and panic lock work?",
    answer:
      "Your decrypted master key is held solely in volatile session memory. If you leave your device idle for 30 minutes, the vault locks automatically and purges the key from memory. You can also press Ctrl+Shift+L at any moment to trigger an instantaneous Panic Lock that immediately clears sensitive items from the screen and purges memory keys.",
    category: "vault",
  },
  {
    id: "faq-reader-formats",
    question: "Which file formats are supported on the Local Shelf?",
    answer:
      "Local Shelf natively supports EPUB (.epub) with realistic 3D book turning and exact CFI progress, PDF (.pdf) with high-fidelity vector rendering and bookmarks, Comic Book Zip (.cbz) archives with continuous vertical webtoon scroll or double-page spread manga modes, Plain Text (.txt) with dark/clean typography and chapter parsing, Audiobooks (.mp3, .m4a, .wav) with variable playback speed and sleep timer, and Video (.mp4, .webm) with subtitle support.",
    category: "readers",
  },
  {
    id: "faq-offline",
    question: "Can I read offline while disconnected or traveling?",
    answer:
      "Yes! Any files uploaded to your Local Shelf are cached in browser IndexedDB storage and render entirely within your client. You can read, highlight, and bookmark completely offline without an active internet connection.",
    category: "readers",
  },
  {
    id: "faq-relations-graph",
    question: "How do I map novel, manhwa, and anime adaptations together?",
    answer:
      "Open any Work Detail page and switch to the 'Relations' tab. Click '+ Link Work' to connect another story from your library as an 'Adaptation', 'Source Novel', 'Prequel', or 'Sequel'. You can add chapter transition notes (e.g. 'Manhwa Season 1 ends at Web Novel Chapter 65') to easily navigate across formats as you read.",
    category: "general",
  },
  {
    id: "faq-keyring-portals",
    question: "How does the Reading Keyring & Frequent Websites Portal work?",
    answer:
      "Under 'Keyring & Portals' (/keyring), you can store encrypted website login credentials, custom search URLs, and quick launch links for your favorite reading portals. Grimoire also automatically detects and pins 'Frequent Websites' whenever 5 or more works in your library originate from that platform.",
    category: "general",
  },
  {
    id: "faq-radar-detect",
    question: "How does the Radar tab capture work and why might a tab not show up?",
    answer:
      "Radar works by inspecting active reading tabs on supported webtoon, manga, and novel platforms, extracting the series identity and current chapter index. If a tab isn't automatically detected, check whether your site uses custom URL formats or use the 'Triage Capture' input at the top of the Radar page to paste the chapter URL directly.",
    category: "radar",
  },
  {
    id: "faq-spoilers",
    question: "How does spoiler protection work in Memory?",
    answer:
      "Memories tagged with Minor or Major spoilers are protected with blur filters and hidden from the global gallery by default. You can reveal them individually or toggle 'Show spoiler memories' in the Memory Gallery when you are caught up with the story.",
    category: "general",
  },
  {
    id: "faq-backup",
    question: "Can I export or backup my library data and what is a .gca file?",
    answer:
      "Yes. In Settings, you can create a complete Grimoire Chronicles Archive (.gca) bundle or standard JSON export containing your library items, relationships, memories, and reading history. You can restore this archive on any PC or phone via the 'Import .gca File' option.",
    category: "general",
  },
  {
    id: "faq-contact-support",
    question: "What is the official Grimoire project email for support or user inquiries?",
    answer:
      "For bug reports, community inquiries, or feedback, you can reach out to the core project team at: 1234567890rahulranjan@gmail.com",
    category: "general",
  },
];

const KEYBOARD_SHORTCUTS = [
  {
    keys: ["Ctrl", "K"],
    altKeys: ["Cmd", "K"],
    description: "Open Global Command Palette to search anywhere or run actions",
  },
  {
    keys: ["Ctrl", "Shift", "L"],
    altKeys: ["Cmd", "Shift", "L"],
    description: "Instantly lock Private Vault and purge memory keys",
  },
  {
    keys: ["Esc"],
    description: "Close modals, clear active search, or dismiss popovers",
  },
  {
    keys: ["G", "then", "L"],
    description: "Jump immediately to Library",
  },
  {
    keys: ["G", "then", "R"],
    description: "Jump immediately to Up Next",
  },
  {
    keys: ["G", "then", "D"],
    description: "Jump to Radar browser capture",
  },
  {
    keys: ["G", "then", "M"],
    description: "Jump to Memory",
  },
  {
    keys: ["G", "then", "H"],
    description: "Jump to Help & Guide",
  },
  {
    keys: ["ArrowLeft", "/", "ArrowRight"],
    description: "Navigate previous or next page in the Local Reader",
  },
  {
    keys: ["F"],
    description: "Toggle reader fullscreen mode",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function Help(_props: HelpProps) {
  const [activeTab, setActiveTab] = React.useState<"features" | "cadence" | "shortcuts" | "faq">("features");
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>("faq-storage");
  const [completedSteps, setCompletedSteps] = React.useState<Record<string, boolean>>({
    step1: true,
    step2: false,
    step3: false,
    step4: false,
  });

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const TABS = [
    { id: "features" as const, label: "Features Guide", icon: Layers },
    { id: "cadence" as const, label: "Update Timers & Hiatus", icon: Clock },
    { id: "shortcuts" as const, label: "Keyboard Shortcuts", icon: Terminal },
    { id: "faq" as const, label: "FAQ", icon: HelpCircle },
  ];

  return (
    <PageContainer maxWidth="wide" className="py-6 space-y-6 animate-in fade-in-50 duration-300">

      {/* ── Clean Header ─────────────────────────────────────────── */}
      <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--gm-accent-strong)] bg-[var(--gm-accent-muted)] px-2 py-0.5 rounded-cv">
              Knowledge Base &amp; Guide
            </span>
            <h1 className="text-gm-xl sm:text-gm-2xl font-bold tracking-tight text-[var(--gm-text)]">
              Grimoire Manual
            </h1>
            <p className="text-gm-xs text-[var(--gm-text-muted)] max-w-xl">
              Complete reference for architectural features, keyboard hotkeys, and local-first privacy security.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = "/home"; }}
              className="gap-1.5 text-gm-xs"
              title="Exit current room to Sanctum Title Screen"
            >
              <DoorOpen className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
              <span className="hidden sm:inline">Exit Room</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => { window.location.href = "/library"; }}
              className="gap-1.5 text-gm-xs"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Library</span>
            </Button>
          </div>
        </div>

        {/* Persistent Official Contact & Support Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 mt-4 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] text-gm-xs">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[var(--gm-accent-strong)]" />
            <span className="font-semibold text-[var(--gm-text)]">Official Support &amp; User Feedback:</span>
          </div>
          <a href="mailto:1234567890rahulranjan@gmail.com" className="font-mono text-emerald-500 font-bold hover:underline">
            1234567890rahulranjan@gmail.com
          </a>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex gap-2 pt-4 mt-4 border-t border-[var(--gm-border)] overflow-x-auto pb-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-cv px-3.5 py-1.5 text-gm-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                  isActive
                    ? "border-[var(--gm-accent)] bg-[var(--gm-accent)] text-white shadow-sm"
                    : "border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface-raised)] hover:text-[var(--gm-text)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1 — Features & Step-by-Step Guide
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "features" && (
        <div className="rounded-gm-xl border border-[var(--gm-border)] overflow-hidden">
          <FeaturesGuide
            onNavigate={(href) => { window.location.href = href; }}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2 — Update Timers & Hiatus Lifecycle Guide
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "cadence" && (
        <div className="space-y-6 animate-in fade-in-30">
          {/* Header Card */}
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-cv bg-[var(--gm-accent-muted)] text-[var(--gm-accent-strong)]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-gm-base font-bold text-[var(--gm-text)]">
                  Manual Release Cadence &amp; Hiatus Awakening Timers
                </h2>
                <p className="text-gm-xs text-[var(--gm-text-muted)]">
                  Stay on top of weekly novel and manhwa releases even when websites block automated web scrapers.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Why Manual Cadence Timers */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-5 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] space-y-3">
              <div className="flex items-center gap-2 font-bold text-gm-sm text-[var(--gm-text)]">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span>The Web Scraping Bottleneck</span>
              </div>
              <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                Many modern reader portals employ heavy anti-bot security (Cloudflare Turnstile, CAPTCHAs, or proprietary mobile apps). Automated background crawlers either trigger IP bans or fail completely. Grimoire solves this by giving you full control with <strong>Manual Cadence Timers</strong>.
              </p>
              <div className="p-3 rounded-cv bg-[var(--gm-surface)] border border-[var(--gm-border)] text-[11px] font-mono text-[var(--gm-accent-strong)]">
                ✓ Zero CAPTCHA headaches · Safe from IP bans · 100% reliable
              </div>
            </div>

            <div className="p-5 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] space-y-3">
              <div className="flex items-center gap-2 font-bold text-gm-sm text-[var(--gm-text)]">
                <Timer className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                <span>How Cadence Timers Work</span>
              </div>
              <ol className="text-gm-xs text-[var(--gm-text-muted)] space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Navigate to any work&apos;s <strong>Access Paths</strong> tab.</li>
                <li>Click <strong>&quot;Set Timer&quot;</strong> on any web access link.</li>
                <li>Select your cadence: <strong>Daily (1d)</strong>, <strong>Every 3 Days</strong>, <strong>Weekly (7d)</strong>, or <strong>Bi-Weekly (14d)</strong>.</li>
                <li>When the scheduled date arrives, Grimoire shows a glowing <strong>&quot;⚠️ Chapter Check Due Now!&quot;</strong> banner with a 1-click link to open the page.</li>
              </ol>
            </div>
          </div>

          {/* Section 2: Hiatus Awakening Timers */}
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 space-y-4">
            <div className="flex items-center gap-2.5 font-bold text-gm-sm text-[var(--gm-text)]">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>Hiatus &amp; Dropped Story Lifecycle</span>
            </div>
            <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
              When an author takes a seasonal break, health leave, or a webtoon concludes Season 1, don&apos;t let it linger in your daily reading queue. Grimoire provides an intelligent <strong>Hiatus Awakening</strong> lifecycle:
            </p>

            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <div className="p-4 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Step 1: Mark Status
                </span>
                <h4 className="font-bold text-gm-xs text-[var(--gm-text)]">Set Paused or Dropped</h4>
                <p className="text-[11px] text-[var(--gm-text-muted)] leading-snug">
                  Choose &apos;Paused&apos; or &apos;Dropped&apos; in the Status dropdown. Grimoire will prompt you to enter the reason (e.g. &apos;Season 1 finale break&apos;).
                </p>
              </div>

              <div className="p-4 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-purple-500/15 text-purple-500 border border-purple-500/30">
                  Step 2: Schedule Timer
                </span>
                <h4 className="font-bold text-gm-xs text-[var(--gm-text)]">Hiatus Awakening Timer</h4>
                <p className="text-[11px] text-[var(--gm-text-muted)] leading-snug">
                  Pick an awakening interval: 14, 30, 60, or 90 days. The work is safely dormant without cluttering your daily &apos;Up Next&apos; queue.
                </p>
              </div>

              <div className="p-4 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  Step 3: Recheck Alert
                </span>
                <h4 className="font-bold text-gm-xs text-[var(--gm-text)]">Awaken &amp; Recheck</h4>
                <p className="text-[11px] text-[var(--gm-text-muted)] leading-snug">
                  When the date arrives, Grimoire surfaces a &apos;🔔 Hiatus Awakening Recheck Due&apos; banner. Check the source with 1 click and tap &apos;Mark Off Hiatus (Resumed)&apos; to return it to active reading!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3 — Keyboard Shortcuts
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "shortcuts" && (
        <div className="space-y-6 animate-in fade-in-30">
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-cv bg-[var(--gm-accent-muted)] text-[var(--gm-accent-strong)]">
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-gm-base font-bold text-[var(--gm-text)]">Keyboard Shortcuts Reference</h2>
                <p className="text-gm-xs text-[var(--gm-text-muted)]">
                  Instant hotkeys for reading, navigation, search &amp; emergency vault lock
                </p>
              </div>
            </div>

            <div className="divide-y divide-[var(--gm-border)]">
              {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                <div key={index} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-gm-sm text-[var(--gm-text)]">{shortcut.description}</span>
                  <div className="flex items-center gap-1 shrink-0 flex-wrap">
                    {shortcut.keys.map((key, kIndex) => (
                      <kbd
                        key={kIndex}
                        className="inline-flex h-6 items-center px-2 rounded-gm-sm border border-[var(--gm-border)] bg-[var(--gm-surface)] font-mono text-[11px] font-semibold text-[var(--gm-text)] shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                    {shortcut.altKeys && (
                      <>
                        <span className="text-gm-xs text-[var(--gm-text-muted)] px-1">or</span>
                        {shortcut.altKeys.map((key, kIndex) => (
                          <kbd
                            key={kIndex}
                            className="inline-flex h-6 items-center px-2 rounded-gm-sm border border-[var(--gm-border)] bg-[var(--gm-surface)] font-mono text-[11px] font-semibold text-[var(--gm-text)] shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3 — FAQ & Local Architecture
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "faq" && (
        <div className="space-y-6 animate-in fade-in-30">

          {/* Architecture pillars */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] space-y-2">
              <div className="flex items-center gap-2 font-bold text-gm-sm text-[var(--gm-text)]">
                <Zap className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                <span>Local-First Sandbox</span>
              </div>
              <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                Zero mandatory cloud sync. Library records, notes, and local books reside 100% inside your device&apos;s IndexedDB and localStorage sandbox.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="default" className="font-mono text-[10px]">Local-First Storage</Badge>
              </div>
            </div>

            <div className="p-4 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] space-y-2">
              <div className="flex items-center gap-2 font-bold text-gm-sm text-[var(--gm-text)]">
                <Shield className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                <span>Zero-Knowledge Vault</span>
              </div>
              <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                Your passphrase is processed entirely on-device and is never transmitted or stored anywhere outside your vault.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="default" className="font-mono text-[10px]">Ctrl+Shift+L Lock</Badge>
              </div>
            </div>

            <div className="p-4 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] space-y-2">
              <div className="flex items-center gap-2 font-bold text-gm-sm text-[var(--gm-text)]">
                <ShieldAlert className="h-4 w-4 text-[var(--gm-warning)]" />
                <span>Zero-Bypass Policy</span>
              </div>
              <p className="text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                Grimoire indexes DRM-free files you legitimately own on your disk. It deep-links directly to official publisher web portals.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="default" className="font-mono text-[10px]">No DRM circumvention</Badge>
              </div>
            </div>
          </div>

          {/* FAQ accordion */}
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-cv bg-[var(--gm-accent-muted)] text-[var(--gm-accent-strong)]">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-gm-base font-bold text-[var(--gm-text)]">Frequently Asked Questions</h2>
                <p className="text-gm-xs text-[var(--gm-text-muted)]">
                  Data storage, file formats, backups, and security clarifications
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {FAQ_ITEMS.map((item) => {
                const isOpen = expandedFaq === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)]/60 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : item.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left font-semibold text-gm-xs sm:text-gm-sm text-[var(--gm-text)] hover:bg-[var(--gm-surface)] transition-colors cursor-pointer"
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-[var(--gm-text-subtle)] transition-transform duration-200 ml-2",
                          isOpen && "rotate-180 text-[var(--gm-accent-strong)]",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-gm-xs leading-relaxed text-[var(--gm-text-muted)] border-t border-[var(--gm-border)] pt-3 bg-[var(--gm-bg)]/40">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Getting started 4-step checklist (bonus in FAQ tab) */}
          <Card className="border-[var(--gm-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gm-sm">
                <Compass className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                <span>Quick 4-Step Getting Started Checklist</span>
              </CardTitle>
              <p className="text-gm-xs text-[var(--gm-text-muted)]">
                Track your first steps into Grimoire. Click any step to mark it.
              </p>
            </CardHeader>
            <CardContent>
              {[
                {
                  id: "step1",
                  num: "1",
                  title: "Explore Your Library",
                  desc: "Browse your library or add your own novel, manhwa, or manga.",
                  link: "/",
                  linkText: "Open Library",
                },
                {
                  id: "step2",
                  num: "2",
                  title: "Check Up Next",
                  desc: "See prioritized works awaiting attention based on releases and reading streaks.",
                  link: "/up-next",
                  linkText: "Up Next",
                },
                {
                  id: "step3",
                  num: "3",
                  title: "Try the Local Shelf",
                  desc: "Upload an EPUB, PDF, or CBZ file for distraction-free reading.",
                  link: "/shelf",
                  linkText: "Local Shelf",
                },
                {
                  id: "step4",
                  num: "4",
                  title: "Initialize Private Vault",
                  desc: "Set a zero-knowledge passphrase to store private theories and spoilers.",
                  link: "/vault",
                  linkText: "Private Vault",
                },
              ].map((step) => (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-cv border transition-all cursor-pointer select-none",
                    completedSteps[step.id]
                      ? "border-[var(--gm-accent)]/30 bg-[var(--gm-accent-muted)]/30"
                      : "border-[var(--gm-border)] bg-[var(--gm-bg)] hover:border-[var(--gm-border-strong)]",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors mt-0.5",
                      completedSteps[step.id]
                        ? "border-[var(--gm-accent)] bg-[var(--gm-accent)] text-white"
                        : "border-[var(--gm-border)] text-[var(--gm-text-muted)]",
                    )}
                  >
                    {completedSteps[step.id] ? <CheckCircle2 className="h-3 w-3" /> : step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gm-xs text-[var(--gm-text)]">{step.title}</span>
                      <a
                        href={step.link}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-medium text-[var(--gm-accent-strong)] hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        {step.linkText} <ChevronRight className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[var(--gm-text-muted)] leading-snug">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

export default Help;
