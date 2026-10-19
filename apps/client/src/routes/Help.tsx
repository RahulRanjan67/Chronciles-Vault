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
  category: "general" | "radar" | "readers" | "vault" | "troubleshooting";
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
    id: "faq-vault-lost-password",
    question: "What happens if I forget my Private Vault passphrase?",
    answer:
      "Because Grimoire uses hardware-accelerated zero-knowledge encryption — your passphrase never leaves your device. The vault data is encrypted locally before being stored. If you lose your passphrase, the encrypted data cannot be recovered by anyone. We strongly recommend recording your passphrase in a secure password manager.",
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
  const [activeTab, setActiveTab] = React.useState<"features" | "shortcuts" | "faq">("features");
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
          TAB 2 — Keyboard Shortcuts
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
