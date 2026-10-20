import {
  Archive,
  BookOpen,
  Compass,
  FilePlus,
  HardDrive,
  HelpCircle,
  KeyRound,
  LayoutGrid,
  Lock,
  MessageSquare,
  Plus,
  Radar,
  RotateCcw,
  Settings,
  Sparkles,
  Tag,
  TrendingUp,
  Unlock,
} from "lucide-react";
import React from "react";

export type CommandCategory = "Navigation" | "Actions" | "Vault";

export const COMMAND_CATEGORY_ORDER: readonly CommandCategory[] = ["Navigation", "Actions", "Vault"];

export interface CommandContext {
  navigate: (href: string) => void;
  toastMessage?: (msg: string) => void;
  vaultUnlocked: boolean;
  lockVault: () => void;
  requestCreateWork: () => void;
  cycleLibraryView: () => void;
  openLatestWork: () => void;
}

export interface CommandItem {
  id: string;
  title: string;
  category: CommandCategory;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  /** Only real, wired shortcuts are listed here. */
  shortcut?: string;
  /** Optional visibility rule; commands without it are always shown. */
  when?: (context: CommandContext) => boolean;
  action: (context: CommandContext) => void;
}

const goTo = (href: string) => (ctx: CommandContext) => ctx.navigate(href);

export const COMMAND_REGISTRY: CommandItem[] = [
  // Navigation
  { id: "nav-return", title: "Go to Up Next", category: "Navigation", icon: RotateCcw, keywords: ["up next", "return", "home", "continue", "desk", "queue"], action: goTo("/up-next") },
  { id: "nav-library", title: "Go to Library", category: "Navigation", icon: BookOpen, keywords: ["library", "books", "manga", "novels", "shelf"], action: goTo("/") },
  { id: "nav-keyring", title: "Go to Keyring & Portals", category: "Navigation", icon: KeyRound, keywords: ["keyring", "passwords", "websites", "portals", "credentials", "logins"], action: goTo("/keyring") },
  { id: "nav-lists", title: "Go to Curated & Personal Lists", category: "Navigation", icon: LayoutGrid, keywords: ["lists", "shelves", "curated", "collections", "discover"], action: goTo("/lists") },
  { id: "nav-radar", title: "Go to Radar", category: "Navigation", icon: Radar, keywords: ["radar", "tracking", "detection", "releases"], action: goTo("/radar") },
  { id: "nav-updates", title: "Go to Updates Feed", category: "Navigation", icon: Sparkles, keywords: ["updates", "new", "chapters", "feed"], action: goTo("/updates") },
  { id: "nav-memory", title: "Go to Memory", category: "Navigation", icon: MessageSquare, keywords: ["memory", "notes", "quotes", "thoughts"], action: goTo("/memory") },
  { id: "nav-shelf", title: "Go to Local Shelf", category: "Navigation", icon: HardDrive, keywords: ["local", "shelf", "epub", "cbz", "pdf", "files"], action: goTo("/shelf") },
  { id: "nav-archive", title: "Go to Archive", category: "Navigation", icon: Archive, keywords: ["archive", "completed", "dropped", "history"], action: goTo("/archive") },
  { id: "nav-categories", title: "Go to My Categories", category: "Navigation", icon: Tag, keywords: ["categories", "tags", "genres"], action: goTo("/categories") },
  { id: "nav-help", title: "Go to Help & Guide", category: "Navigation", icon: HelpCircle, keywords: ["help", "guide", "docs"], action: goTo("/help") },
  { id: "nav-settings", title: "Go to Settings", category: "Navigation", icon: Settings, keywords: ["settings", "preferences", "theme", "account"], action: goTo("/settings") },

  // Actions
  {
    id: "action-add-work",
    title: "Add New Work…",
    category: "Actions",
    icon: Plus,
    keywords: ["add", "new", "create", "track", "manga", "novel"],
    action: (ctx) => {
      ctx.requestCreateWork();
      ctx.navigate("/");
    },
  },
  {
    id: "action-add-progress",
    title: "Add Progress to Latest Work",
    category: "Actions",
    icon: TrendingUp,
    keywords: ["progress", "chapter", "log", "read", "update"],
    action: (ctx) => ctx.openLatestWork(),
  },
  {
    id: "action-capture-memory",
    title: "Capture Memory / Note",
    category: "Actions",
    icon: FilePlus,
    keywords: ["memory", "quote", "note", "capture", "thought"],
    action: goTo("/memory"),
  },
  {
    id: "action-change-view",
    title: "Change Library View",
    category: "Actions",
    icon: LayoutGrid,
    keywords: ["view", "grid", "compact", "table", "board", "layout"],
    action: (ctx) => {
      ctx.cycleLibraryView();
      ctx.navigate("/");
    },
  },

  // Vault
  { id: "vault-open", title: "Open Private Vault", category: "Vault", icon: Unlock, keywords: ["vault", "private", "unlock", "secure"], action: goTo("/vault") },
  {
    id: "vault-lock",
    title: "Lock Private Vault",
    category: "Vault",
    icon: Lock,
    shortcut: "Ctrl+Shift+L",
    keywords: ["vault", "lock", "security", "private", "forget"],
    when: (ctx) => ctx.vaultUnlocked,
    action: (ctx) => {
      ctx.lockVault();
      ctx.toastMessage?.("Vault locked");
    },
  },
];

/** Commands visible in the current context. */
export function availableCommands(context: CommandContext): CommandItem[] {
  return COMMAND_REGISTRY.filter((cmd) => !cmd.when || cmd.when(context));
}

/** Filters visible commands by title, category, or keyword. Empty query returns all visible commands. */
export function filterCommands(query: string, context: CommandContext): CommandItem[] {
  const visible = availableCommands(context);
  const q = query.toLowerCase().trim();
  if (!q) return visible;
  return visible.filter((cmd) => {
    if (cmd.title.toLowerCase().includes(q)) return true;
    if (cmd.category.toLowerCase().includes(q)) return true;
    return cmd.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
  });
}
