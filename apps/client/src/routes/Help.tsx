import * as React from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Command,
  Compass,
  ExternalLink,
  HardDrive,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  MessageSquare,
  Radar as RadarIcon,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  Unlock,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  PageContainer,
  Separator,
  cn,
} from "@chronicles-vault/ui";
import { FeaturesGuide } from "./FeaturesGuide";

function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1.5", className)} {...props}>{children}</div>;
}

function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-none tracking-tight text-[var(--cv-text)]", className)} {...props}>{children}</h3>;
}

function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3", className)} {...props}>{children}</div>;
}

export interface HelpProps {
  onNavigateWork?: (workId: string) => void;
  onOpenFile?: (fileId: string) => void;
  onBack?: () => void;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "radar" | "readers" | "vault" | "troubleshooting";
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-storage",
    question: "Where is my fiction data and reading progress stored?",
    answer:
      "All library records, reading relationships, progress anchors, notes, and local files are stored strictly on your device using IndexedDB and localStorage. Chronicles Vault is designed from the ground up to be local-first and privacy-respecting—no reading data is uploaded to remote servers without your explicit setup.",
    category: "general",
  },
  {
    id: "faq-vault-lost-password",
    question: "What happens if I forget my Private Vault passphrase?",
    answer:
      "Because Private Vault uses true zero-knowledge encryption (AES-GCM-256 with Argon2id / PBKDF2 key derivation), your passphrase is never sent to or stored on any server. If you lose your passphrase, the encrypted data cannot be decrypted by anyone, including the developers. We strongly recommend recording your passphrase in a secure password manager.",
    category: "vault",
  },
  {
    id: "faq-radar-detect",
    question: "How does the Radar tab capture work and why might a tab not show up?",
    answer:
      "Radar works by inspecting active reading tabs on supported webtoon, manga, and novel platforms, extracting the series identity and current chapter index. If a tab isn't automatically detected, check whether your site uses custom URL formats or use the 'Triage Capture' input at the top of the Radar page to paste the chapter URL directly.",
    category: "radar",
  },
  {
    id: "faq-reader-formats",
    question: "Which file formats are supported on the Local Shelf?",
    answer:
      "Local Shelf natively supports EPUB (.epub) with realistic 3D book turning and exact CFI progress, PDF (.pdf) with vector rendering, full-text search, and bookmarking, and Comic Book Zip (.cbz) archives with continuous vertical webtoon scroll or double-page spread manga modes.",
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
    id: "faq-auto-lock",
    question: "How does Private Vault auto-locking work?",
    answer:
      "Your decrypted master key is held solely in volatile session memory. If you leave your device idle for 15 minutes, or if your browser tab is hidden/backgrounded, the vault locks automatically and purges the key from memory. You can also press Ctrl+Shift+L at any moment to lock it instantly.",
    category: "vault",
  },
  {
    id: "faq-spoilers",
    question: "How does spoiler protection work in Memory?",
    answer:
      "Memories tagged with Minor or Major spoilers are protected with blur filters and hidden from the global gallery by default. You can reveal them individually or toggle 'Show spoiler memories' in the Memory Gallery when you are caught up with the story.",
    category: "troubleshooting",
  },
  {
    id: "faq-backup",
    question: "Can I export or backup my library data?",
    answer:
      "Yes. In the Settings route, you can generate a complete JSON export of your library, relationships, and reading history. Note that Private Vault items require entering your passphrase to export decrypted records.",
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
    description: "Jump immediately to Return Desk",
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

export function Help(_props: HelpProps) {
  const isPcMode =
    (import.meta.env?.VITE_PLATFORM_MODE as string | undefined) === "pc";
  const [activeTab, setActiveTab] = React.useState<
    "all-32-features" | "guide" | "radar" | "shelf" | "vault" | "shortcuts" | "faq"
  >(isPcMode ? "all-32-features" : "guide");
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

  return (
    <PageContainer maxWidth="wide" className="py-8 space-y-8 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="rounded-cv-2xl border border-[var(--cv-border)] bg-gradient-to-r from-[var(--cv-bg-elevated)] via-[var(--cv-surface)] to-[var(--cv-bg-elevated)] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-cv-full border border-[var(--cv-border)] bg-[var(--cv-surface-raised)] px-3 py-1 text-cv-xs font-semibold text-[var(--cv-accent-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>User Manual &amp; Knowledge Base</span>
            </div>
            <h1 className="text-cv-2xl sm:text-cv-3xl font-extrabold tracking-tight text-[var(--cv-text)]">
              Help &amp; Complete 32-Feature Guide
            </h1>
            <p className="text-cv-sm sm:text-cv-base text-[var(--cv-text-muted)] max-w-2xl leading-relaxed">
              New to Chronicles Vault? Explore all 32 tiny-to-tiny features with step-by-step
              instructions and screenshot slots, learn how Radar and offline readers work, and master
              Private Vault security.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/library";
              }}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>Go to Library</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setActiveTab("all-32-features");
              }}
              className="gap-2"
            >
              <Layers className="h-4 w-4" />
              <span>32 Features &amp; Steps</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-[var(--cv-border)]">
        {[
          { id: "all-32-features", label: "32 Tiny Features & Steps", icon: Layers },
          { id: "guide", label: "Getting Started", icon: Compass },
          { id: "radar", label: "Radar Tab Capture", icon: RadarIcon },
          { id: "shelf", label: "Local Shelf & Readers", icon: HardDrive },
          { id: "vault", label: "Private Vault Security", icon: Shield },
          { id: "shortcuts", label: "Keyboard Shortcuts", icon: Terminal },
          { id: "faq", label: "FAQ & Troubleshooting", icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 rounded-cv-lg px-3.5 py-2 text-cv-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                isActive
                  ? "bg-[var(--cv-accent)] text-white shadow-xs"
                  : "bg-[var(--cv-surface)] text-[var(--cv-text-muted)] hover:bg-[var(--cv-surface-raised)] hover:text-[var(--cv-text)]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 0: All 32 Tiny Features & Step-by-Step Guide (Default in PC App Help) */}
      {activeTab === "all-32-features" && (
        <div className="rounded-cv-xl border border-[var(--cv-border)] overflow-hidden">
          <FeaturesGuide />
        </div>
      )}

      {/* Tab 1: Getting Started Guide */}
      {activeTab === "guide" && (
        <div className="space-y-6 animate-in fade-in-30">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-[var(--cv-border)] bg-[var(--cv-bg-elevated)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cv-lg">
                  <Compass className="h-5 w-5 text-[var(--cv-accent-strong)]" />
                  <span>The 4-Step Journey to Fiction Mastery</span>
                </CardTitle>
                <p className="text-cv-xs text-[var(--cv-text-muted)]">
                  Track your progress through the essential features of Chronicles Vault. Click any
                  step to check it off.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    id: "step1",
                    num: "1",
                    title: "Explore Your Library",
                    desc: "View seeded works or add your own novel, manhwa, or manga to begin tracking your reading journey.",
                    link: "/",
                    linkText: "Open Library",
                  },
                  {
                    id: "step2",
                    num: "2",
                    title: "Check Return Desk",
                    desc: "See prioritized works awaiting your attention based on releases, cliffhangers, and reading streaks.",
                    link: "/return-desk",
                    linkText: "Visit Return Desk",
                  },
                  {
                    id: "step3",
                    num: "3",
                    title: "Try the Local Shelf",
                    desc: "Upload an EPUB, PDF, or CBZ file to experience distraction-free reading with exact position resume.",
                    link: "/shelf",
                    linkText: "Go to Shelf",
                  },
                  {
                    id: "step4",
                    num: "4",
                    title: "Initialize Your Private Vault",
                    desc: "Set up a zero-knowledge master passphrase to store private theories and unreleased chapter spoilers.",
                    link: "/vault",
                    linkText: "Unlock Vault",
                  },
                ].map((step) => (
                  <div
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    className={cn(
                      "flex items-start gap-3.5 p-3.5 rounded-cv-lg border transition-all cursor-pointer select-none",
                      completedSteps[step.id]
                        ? "border-[var(--cv-border-strong)] bg-[var(--cv-surface)]/70"
                        : "border-[var(--cv-border)] bg-[var(--cv-bg)] hover:border-[var(--cv-border-strong)]",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-cv-full border text-xs font-bold transition-colors mt-0.5",
                        completedSteps[step.id]
                          ? "border-[var(--cv-accent)] bg-[var(--cv-accent)] text-white"
                          : "border-[var(--cv-border)] text-[var(--cv-text-muted)]",
                      )}
                    >
                      {completedSteps[step.id] ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-semibold text-cv-sm text-[var(--cv-text)]">
                          {step.title}
                        </h2>
                        <a
                          href={step.link}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-medium text-[var(--cv-accent-strong)] hover:underline inline-flex items-center gap-1"
                        >
                          {step.linkText} <ChevronRight className="h-3 w-3" />
                        </a>
                      </div>
                      <p className="mt-1 text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="p-5 rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] space-y-3">
                <div className="flex items-center gap-2.5 text-[var(--cv-info)]">
                  <Zap className="h-5 w-5" />
                  <h2 className="font-semibold text-cv-base text-[var(--cv-text)]">
                    Local-First Philosophy
                  </h2>
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  Chronicles Vault has no mandatory cloud account, no centralized tracking of what
                  you read, and no risk of losing your library if a third-party server shuts down.
                  Everything lives in your device’s sandbox, fully functional even on a flight with
                  no Wi-Fi.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-cv-xs">
                  <Badge variant="default" className="border-[var(--cv-border)] font-mono">
                    IndexedDB v4
                  </Badge>
                  <Badge variant="default" className="border-[var(--cv-border)] font-mono">
                    AES-256-GCM
                  </Badge>
                  <Badge variant="default" className="border-[var(--cv-border)] font-mono">
                    Pure WebAssembly
                  </Badge>
                </div>
              </div>

              <div className="p-5 rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] space-y-3">
                <div className="flex items-center gap-2.5 text-[var(--cv-warning)]">
                  <ShieldAlert className="h-5 w-5" />
                  <h2 className="font-semibold text-cv-base text-[var(--cv-text)]">
                    Zero-Bypass Policy
                  </h2>
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  We respect content publishers and scanlation communities alike. Chronicles Vault
                  never rips DRM or circumvents publisher paywalls. We link directly to official web
                  portals and index files you legitimately own on your personal disk.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Radar Tab Capture */}
      {activeTab === "radar" && (
        <div className="space-y-6 animate-in fade-in-30">
          <div className="p-6 rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-cv-lg bg-[var(--cv-accent)]/15 text-[var(--cv-accent-strong)]">
                <RadarIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">
                  How Radar Browser Tab Capture Works
                </h2>
                <p className="text-cv-xs text-[var(--cv-text-muted)]">
                  Passive release sensing and background reading tab triage
                </p>
              </div>
            </div>

            <p className="text-cv-sm text-[var(--cv-text)] leading-relaxed">
              When you read serializations across multiple websites (Webtoons, MangaDex, Kakao,
              Tapas, Syosetu, Qidian), keeping track of chapter numbers is tedious. Radar acts as your
              personal fiction antenna.
            </p>

            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="p-4 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-cv-sm text-[var(--cv-text)]">
                  <Search className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                  <span>1. Tab Ingestion</span>
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  Extracts series title, chapter number, and reading source URL directly from active
                  or recently closed tabs.
                </p>
              </div>

              <div className="p-4 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-cv-sm text-[var(--cv-text)]">
                  <Layers className="h-4 w-4 text-[var(--cv-info)]" />
                  <span>2. Safe Triage Queue</span>
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  Captures land in a quarantine queue. They NEVER mutate your library until you click
                  ‘Confirm’ or ‘Merge’.
                </p>
              </div>

              <div className="p-4 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-cv-sm text-[var(--cv-text)]">
                  <RotateCcw className="h-4 w-4 text-[var(--cv-success)]" />
                  <span>3. Progress Update</span>
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  Updating an existing work records a progress event and advances your reading anchor
                  with zero duplicate entries.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  window.location.href = "/radar";
                }}
                className="gap-2"
              >
                <RadarIcon className="h-4 w-4" />
                <span>Go to Radar Feed</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Local Shelf & Readers */}
      {activeTab === "shelf" && (
        <div className="space-y-6 animate-in fade-in-30">
          <div className="p-6 rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-cv-lg bg-emerald-500/15 text-emerald-400">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">
                  Local Shelf &amp; Sandboxed Readers
                </h2>
                <p className="text-cv-xs text-[var(--cv-text-muted)]">
                  High-fidelity offline readers with zero telemetry and exact progress persistence
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-2">
              {/* EPUB */}
              <div className="p-5 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                    EPUB
                  </Badge>
                  <span className="text-[10px] font-mono text-[var(--cv-text-subtle)]">
                    .epub files
                  </span>
                </div>
                <h3 className="font-semibold text-cv-sm text-[var(--cv-text)]">
                  Book Turning &amp; Exact CFI
                </h3>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  Features realistic page-turn animation simulation, font size and margin tuning,
                  sepia and dark reading modes, and exact EPUB Canonical Fragment Identifier (CFI)
                  locator persistence.
                </p>
              </div>

              {/* PDF */}
              <div className="p-5 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="border-rose-500/30 text-rose-400 bg-rose-500/10">
                    PDF
                  </Badge>
                  <span className="text-[10px] font-mono text-[var(--cv-text-subtle)]">
                    .pdf files
                  </span>
                </div>
                <h3 className="font-semibold text-cv-sm text-[var(--cv-text)]">
                  Vector Rendering &amp; Search
                </h3>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  Smooth dual-page spread or single-page view, full-text client-side search with
                  match highlights, outline table of contents navigation, and persistent page
                  bookmarks.
                </p>
              </div>

              {/* CBZ */}
              <div className="p-5 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                    CBZ
                  </Badge>
                  <span className="text-[10px] font-mono text-[var(--cv-text-subtle)]">
                    .cbz / zip archives
                  </span>
                </div>
                <h3 className="font-semibold text-cv-sm text-[var(--cv-text)]">
                  Manga &amp; Webtoon Mode
                </h3>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  Supports right-to-left manga page-turn mode or continuous vertical scroll for
                  webtoon strips. In-memory zip extraction with automatic image orientation.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  window.location.href = "/shelf";
                }}
                className="gap-2"
              >
                <HardDrive className="h-4 w-4" />
                <span>Open Local Shelf</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Private Vault Security */}
      {activeTab === "vault" && (
        <div className="space-y-6 animate-in fade-in-30">
          <div className="p-6 rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-cv-lg bg-[var(--cv-warning)]/15 text-[var(--cv-warning)]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">
                  Zero-Knowledge Private Vault Architecture
                </h2>
                <p className="text-cv-xs text-[var(--cv-text-muted)]">
                  Military-grade AES-256-GCM authenticated encryption on your personal hardware
                </p>
              </div>
            </div>

            <p className="text-cv-sm text-[var(--cv-text)] leading-relaxed">
              Private Vault is engineered so that even if an unauthorized party gains access to your
              browser storage or files, your sensitive reading notes, private theories, and raw
              spoilers remain completely unreadable without your passphrase.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="p-4 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-cv-sm text-[var(--cv-text)]">
                  <KeyRound className="h-4 w-4 text-[var(--cv-warning)]" />
                  <span>Key Derivation (Argon2id / PBKDF2)</span>
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  Your master key is derived with 100,000 iterations of SHA-256 and a random 16-byte
                  salt, preventing rainbow table attacks and brute force cracking.
                </p>
              </div>

              <div className="p-4 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-cv-sm text-[var(--cv-text)]">
                  <Lock className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                  <span>AES-GCM-256 Authenticated Encryption</span>
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  Every note and memory is encrypted with a distinct 12-byte initialization vector (IV)
                  and a 128-bit authentication tag, detecting any tampering.
                </p>
              </div>

              <div className="p-4 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-cv-sm text-[var(--cv-text)]">
                  <Zap className="h-4 w-4 text-[var(--cv-danger)]" />
                  <span>Ephemeral Memory Only</span>
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  The CryptoKey never touches localStorage, sessionStorage, or IndexedDB. It exists
                  solely in volatile JavaScript memory and is erased on page refresh or lock.
                </p>
              </div>

              <div className="p-4 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-cv-sm text-[var(--cv-text)]">
                  <Command className="h-4 w-4 text-[var(--cv-success)]" />
                  <span>Auto-Lock on Inactivity &amp; Tab Switch</span>
                </div>
                <p className="text-cv-xs text-[var(--cv-text-muted)] leading-relaxed">
                  The vault locks after 15 minutes of inactivity or immediately when the tab is
                  minimized. You can also trigger an emergency lock with Ctrl+Shift+L.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  window.location.href = "/vault";
                }}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                <span>Open Private Vault</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Keyboard Shortcuts */}
      {activeTab === "shortcuts" && (
        <div className="space-y-6 animate-in fade-in-30">
          <div className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-cv-lg bg-[var(--cv-accent)]/15 text-[var(--cv-accent-strong)]">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">
                  Keyboard Shortcuts Reference
                </h2>
                <p className="text-cv-xs text-[var(--cv-text-muted)]">
                  Power-user hotkeys for swift navigation and privacy management
                </p>
              </div>
            </div>

            <div className="divide-y divide-[var(--cv-border)]">
              {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                <div
                  key={index}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <span className="text-cv-sm text-[var(--cv-text)]">{shortcut.description}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {shortcut.keys.map((key, kIndex) => (
                      <kbd
                        key={kIndex}
                        className="inline-flex h-6 items-center px-2 rounded-cv-sm border border-[var(--cv-border)] bg-[var(--cv-surface)] font-mono text-[11px] font-semibold text-[var(--cv-text)] shadow-2xs"
                      >
                        {key}
                      </kbd>
                    ))}
                    {shortcut.altKeys && (
                      <>
                        <span className="text-cv-xs text-[var(--cv-text-muted)] px-1">or</span>
                        {shortcut.altKeys.map((key, kIndex) => (
                          <kbd
                            key={kIndex}
                            className="inline-flex h-6 items-center px-2 rounded-cv-sm border border-[var(--cv-border)] bg-[var(--cv-surface)] font-mono text-[11px] font-semibold text-[var(--cv-text)] shadow-2xs"
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

      {/* Tab 6: FAQs & Troubleshooting */}
      {activeTab === "faq" && (
        <div className="space-y-6 animate-in fade-in-30">
          <div className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-cv-lg bg-[var(--cv-info)]/15 text-[var(--cv-info)]">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">
                  Frequently Asked Questions &amp; Troubleshooting
                </h2>
                <p className="text-cv-xs text-[var(--cv-text-muted)]">
                  Answers to common questions about storage, formatting, and security
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {FAQ_ITEMS.map((item) => {
                const isOpen = expandedFaq === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : item.id)}
                      className="w-full flex items-center justify-between p-4 text-left font-semibold text-cv-sm text-[var(--cv-text)] hover:bg-[var(--cv-surface-raised)] transition-colors cursor-pointer"
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-[var(--cv-text-subtle)] transition-transform duration-200",
                          isOpen && "rotate-180 text-[var(--cv-accent-strong)]",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-cv-xs leading-relaxed text-[var(--cv-text-muted)] border-t border-[var(--cv-border)] bg-[var(--cv-bg)]/50">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default Help;
