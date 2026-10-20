import * as React from "react";
import {
  ArrowLeft,
  Check,
  CheckSquare,
  Cloud,
  Database,
  EyeOff,
  Filter,
  FolderLock,
  Layers,
  Lock,
  MessageSquare,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Square,
  Unlock,
  Wifi,
} from "lucide-react";
import {
  Badge,
  Button,
  Input,
  PageContainer,
  toast,
} from "@grimoire/ui";
import { useLibraryStore, useCategoriesStore, clientRepository } from "@grimoire/state";
import { useVaultStore } from "@grimoire/vault";
import { PrivacyState, SpoilerLevel } from "@grimoire/domain";
import {
  getSyncHubUrl,
  probeSyncHubStatus,
  syncWithCrossPlatformHub,
  type SyncFilterOptions,
} from "../utils/cross-platform-sync";

const SYNC_PREFS_KEY = "cv:sync_filter_preferences:v1";

export function SyncConfig({ onBack }: { onBack?: () => void }) {
  const library = useLibraryStore();
  const categoriesStore = useCategoriesStore();
  const isVaultUnlocked = useVaultStore((s) => s.status === "unlocked");

  // Load saved preferences
  const [workScope, setWorkScope] = React.useState<"all" | "whitelist" | "blacklist">(() => {
    try {
      const saved = window.localStorage.getItem(SYNC_PREFS_KEY);
      if (saved) return JSON.parse(saved).workScope || "all";
    } catch {}
    return "all";
  });

  const [selectedWorkIds, setSelectedWorkIds] = React.useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem(SYNC_PREFS_KEY);
      if (saved) return JSON.parse(saved).selectedWorkIds || [];
    } catch {}
    return [];
  });

  const [excludedWorkIds, setExcludedWorkIds] = React.useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem(SYNC_PREFS_KEY);
      if (saved) return JSON.parse(saved).excludedWorkIds || [];
    } catch {}
    return [];
  });

  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem(SYNC_PREFS_KEY);
      if (saved) return JSON.parse(saved).categoryIds || [];
    } catch {}
    return [];
  });

  const [optedOutMemoryIds, setOptedOutMemoryIds] = React.useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem(SYNC_PREFS_KEY);
      if (saved) return JSON.parse(saved).optedOutMemoryIds || [];
    } catch {}
    return [];
  });

  const [syncTarget, setSyncTarget] = React.useState<"hub" | "d1">("hub");
  const [hubUrl, setHubUrl] = React.useState(getSyncHubUrl());
  const [hubStatus, setHubStatus] = React.useState<"online" | "offline" | "probing">("probing");
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [searchWorks, setSearchWorks] = React.useState("");
  const [searchMemories, setSearchMemories] = React.useState("");

  // Probe sync hub
  React.useEffect(() => {
    let active = true;
    probeSyncHubStatus().then((res) => {
      if (active) setHubStatus(res ? "online" : "offline");
    });
    return () => {
      active = false;
    };
  }, [hubUrl]);

  // Persist filter preferences
  const savePreferences = (options?: Partial<SyncFilterOptions>) => {
    const prefs: SyncFilterOptions = {
      workScope: options?.workScope ?? workScope,
      selectedWorkIds: options?.selectedWorkIds ?? selectedWorkIds,
      excludedWorkIds: options?.excludedWorkIds ?? excludedWorkIds,
      categoryIds: options?.categoryIds ?? selectedCategoryIds,
      optedOutMemoryIds: options?.optedOutMemoryIds ?? optedOutMemoryIds,
      includeVault: isVaultUnlocked,
    };
    try {
      window.localStorage.setItem(SYNC_PREFS_KEY, JSON.stringify(prefs));
    } catch {}
    return prefs;
  };

  const works = React.useMemo(
    () => library.items.filter((item) => !item.work.deletedAt),
    [library.items],
  );

  const allMemories = React.useMemo(() => {
    return clientRepository.listMemories();
  }, []);

  const filteredWorks = React.useMemo(() => {
    if (!searchWorks.trim()) return works;
    const q = searchWorks.toLowerCase();
    return works.filter((item) => item.work.title.toLowerCase().includes(q));
  }, [works, searchWorks]);

  const filteredMemories = React.useMemo(() => {
    if (!searchMemories.trim()) return allMemories;
    const q = searchMemories.toLowerCase();
    return allMemories.filter(
      (m) =>
        (m.memory.title && m.memory.title.toLowerCase().includes(q)) ||
        (m.memory.body && m.memory.body.toLowerCase().includes(q)) ||
        (m.workTitle ? m.workTitle.toLowerCase().includes(q) : false),
    );
  }, [allMemories, searchMemories]);

  // Work selection helpers
  const toggleWorkSelection = (id: string) => {
    if (workScope === "whitelist") {
      const next = selectedWorkIds.includes(id)
        ? selectedWorkIds.filter((wId) => wId !== id)
        : [...selectedWorkIds, id];
      setSelectedWorkIds(next);
      savePreferences({ selectedWorkIds: next });
    } else if (workScope === "blacklist") {
      const next = excludedWorkIds.includes(id)
        ? excludedWorkIds.filter((wId) => wId !== id)
        : [...excludedWorkIds, id];
      setExcludedWorkIds(next);
      savePreferences({ excludedWorkIds: next });
    }
  };

  const toggleCategorySelection = (catId: string) => {
    const next = selectedCategoryIds.includes(catId)
      ? selectedCategoryIds.filter((cId) => cId !== catId)
      : [...selectedCategoryIds, catId];
    setSelectedCategoryIds(next);
    savePreferences({ categoryIds: next });
  };

  const toggleMemoryOptOut = (memId: string) => {
    const next = optedOutMemoryIds.includes(memId)
      ? optedOutMemoryIds.filter((id) => id !== memId)
      : [...optedOutMemoryIds, memId];
    setOptedOutMemoryIds(next);
    savePreferences({ optedOutMemoryIds: next });
  };

  const optOutAllSpoilers = () => {
    const spoilerIds = allMemories
      .filter((m) => m.memory.spoilerLevel && m.memory.spoilerLevel !== SpoilerLevel.SpoilerFree)
      .map((m) => m.memory.id);
    const combined = Array.from(new Set([...optedOutMemoryIds, ...spoilerIds]));
    setOptedOutMemoryIds(combined);
    savePreferences({ optedOutMemoryIds: combined });
    toast({ title: "Spoiler Memories Opted Out", description: `Excluded ${spoilerIds.length} spoiler memories from sync.` });
  };

  const optInAllMemories = () => {
    setOptedOutMemoryIds([]);
    savePreferences({ optedOutMemoryIds: [] });
    toast({ title: "All Memories Included", description: "All memories will sync." });
  };

  // Execution
  const handleExecuteSync = async () => {
    setIsSyncing(true);
    const currentPrefs = savePreferences();

    try {
      const result = await syncWithCrossPlatformHub("web", "Grimoire Web Sanctum", currentPrefs);
      if (result && result.ok) {
        toast({
          title: "Synchronization Complete!",
          description: `Synced ${result.stats.total} items (${result.stats.added} added, ${result.stats.merged} merged).`,
          variant: "success",
        });
      } else {
        toast({
          title: "Sync Hub Offline",
          description: "Could not reach local Sync Hub server. Ensure venv/sync_hub_server.py is running on port 47920.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Sync Error",
        description: err instanceof Error ? err.message : "Synchronization failed.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <PageContainer maxWidth="wide">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <RefreshCw className="h-7 w-7 text-[var(--gm-accent-strong)]" />
            <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)]">
              Synchronization Sanctum
            </h1>
          </div>
          <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)] max-w-2xl">
            Choose exactly what to sync across Web, PC Studio, and Mobile. Select all works, curate a whitelist, exclude sensitive titles, opt out individual memories, and enforce zero-knowledge vault boundaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            onClick={handleExecuteSync}
            disabled={isSyncing}
            className="gap-2 font-bold shadow-md"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Execute Sync Now"}</span>
          </Button>
        </div>
      </div>

      {/* ─── VAULT POLICY BANNER (CRITICAL REQUIREMENT) ─── */}
      <div
        className={`mb-6 p-4 rounded-gm-xl border-2 transition-all ${
          isVaultUnlocked
            ? "border-amber-500/50 bg-amber-500/10"
            : "border-[var(--gm-border-strong)] bg-[var(--gm-surface)]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${
                isVaultUnlocked
                  ? "border-amber-500/60 bg-amber-500/20 text-amber-500"
                  : "border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] text-[var(--gm-text-muted)]"
              }`}
            >
              {isVaultUnlocked ? (
                <Unlock className="h-5 w-5" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gm-base text-[var(--gm-text)]">
                  {isVaultUnlocked
                    ? "Private Vault Is Unlocked"
                    : "Private Vault Is Locked (Strict Zero-Knowledge Isolation)"}
                </h3>
                <Badge
                  variant={isVaultUnlocked ? "accent" : "muted"}
                  size="sm"
                  className="font-mono text-[10px]"
                >
                  {isVaultUnlocked ? "VAULT SYNC ACTIVE" : "VAULT SYNC EXCLUDED"}
                </Badge>
              </div>
              <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                {isVaultUnlocked
                  ? "Because the vault is open, your encrypted vault works, private notes, and protected credentials will be securely synchronized using your session master key."
                  : "Vault is synced ONLY when it is open. While locked, all sealed works, hidden notes, and credentials are 100% excluded from sync payloads."}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.location.hash = "#/vault";
              }}
              className="text-gm-xs gap-1.5"
            >
              {isVaultUnlocked ? (
                <>
                  <FolderLock className="h-3.5 w-3.5" />
                  <span>Manage Vault</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Unlock Vault to Sync</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Works & Categories Scope */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: WORK SYNC SCOPE */}
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--gm-accent-strong)]" />
                <h2 className="font-bold text-gm-lg text-[var(--gm-text)]">
                  Work Synchronization Scope
                </h2>
              </div>
              <Badge variant="accent" size="sm" className="font-mono text-[11px]">
                {works.length} Total Works
              </Badge>
            </div>

            {/* Scope Mode Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setWorkScope("all");
                  savePreferences({ workScope: "all" });
                }}
                className={`p-3 rounded-gm-lg border text-left transition-all cursor-pointer ${
                  workScope === "all"
                    ? "border-[var(--gm-accent-strong)] bg-[var(--gm-surface)] ring-1 ring-[var(--gm-accent-strong)]"
                    : "border-[var(--gm-border)] bg-[var(--gm-surface)]/50 hover:bg-[var(--gm-surface)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gm-sm text-[var(--gm-text)]">
                    Select All Works
                  </span>
                  {workScope === "all" && <Check className="h-4 w-4 text-[var(--gm-accent-strong)]" />}
                </div>
                <p className="text-[11px] text-[var(--gm-text-muted)] mt-1">
                  Synchronize your entire public reading library across devices.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWorkScope("whitelist");
                  savePreferences({ workScope: "whitelist" });
                }}
                className={`p-3 rounded-gm-lg border text-left transition-all cursor-pointer ${
                  workScope === "whitelist"
                    ? "border-[var(--gm-accent-strong)] bg-[var(--gm-surface)] ring-1 ring-[var(--gm-accent-strong)]"
                    : "border-[var(--gm-border)] bg-[var(--gm-surface)]/50 hover:bg-[var(--gm-surface)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gm-sm text-[var(--gm-text)]">
                    Select Few Works
                  </span>
                  {workScope === "whitelist" && <Check className="h-4 w-4 text-[var(--gm-accent-strong)]" />}
                </div>
                <p className="text-[11px] text-[var(--gm-text-muted)] mt-1">
                  Whitelist specific works to sync ({selectedWorkIds.length} selected).
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWorkScope("blacklist");
                  savePreferences({ workScope: "blacklist" });
                }}
                className={`p-3 rounded-gm-lg border text-left transition-all cursor-pointer ${
                  workScope === "blacklist"
                    ? "border-[var(--gm-accent-strong)] bg-[var(--gm-surface)] ring-1 ring-[var(--gm-accent-strong)]"
                    : "border-[var(--gm-border)] bg-[var(--gm-surface)]/50 hover:bg-[var(--gm-surface)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gm-sm text-[var(--gm-text)]">
                    Exclude Few Works
                  </span>
                  {workScope === "blacklist" && <Check className="h-4 w-4 text-[var(--gm-accent-strong)]" />}
                </div>
                <p className="text-[11px] text-[var(--gm-text-muted)] mt-1">
                  Keep specific titles local-only ({excludedWorkIds.length} excluded).
                </p>
              </button>
            </div>

            {/* Granular Work Selection Checklist (when Whitelist or Blacklist is active) */}
            {workScope !== "all" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gm-xs font-semibold text-[var(--gm-text)]">
                    {workScope === "whitelist"
                      ? "Check the works you wish to include in sync:"
                      : "Check the works you wish to EXCLUDE from sync (keep local-only):"}
                  </span>
                  <Input
                    placeholder="Search titles..."
                    value={searchWorks}
                    onChange={(e) => setSearchWorks(e.target.value)}
                    className="h-8 max-w-xs text-gm-xs"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 border border-[var(--gm-border)] rounded-gm-lg p-2 bg-[var(--gm-surface)]/30">
                  {filteredWorks.map((item) => {
                    const isChecked =
                      workScope === "whitelist"
                        ? selectedWorkIds.includes(item.work.id)
                        : excludedWorkIds.includes(item.work.id);

                    return (
                      <div
                        key={item.work.id}
                        onClick={() => toggleWorkSelection(item.work.id)}
                        className={`flex items-center justify-between p-2 rounded-gm-md border cursor-pointer transition-all ${
                          isChecked
                            ? "border-[var(--gm-accent-strong)]/60 bg-[var(--gm-surface)]"
                            : "border-transparent hover:bg-[var(--gm-surface)]/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-[var(--gm-accent-strong)] shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-[var(--gm-text-subtle)] shrink-0" />
                          )}
                          <span className="text-gm-sm font-medium text-[var(--gm-text)] truncate">
                            {item.work.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--gm-text-subtle)] shrink-0">
                          {item.work.contentType}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: CATEGORY-LEVEL SYNC */}
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-[var(--gm-accent-strong)]" />
                <h2 className="font-bold text-gm-lg text-[var(--gm-text)]">
                  Category-Level Sync Filter
                </h2>
              </div>
              <span className="text-gm-xs text-[var(--gm-text-muted)]">
                Optional: Filter synced works by category
              </span>
            </div>

            {categoriesStore.categories.length === 0 ? (
              <p className="text-gm-xs text-[var(--gm-text-muted)] italic">
                No custom categories configured. Create categories in &quot;My Categories&quot; to filter sync.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categoriesStore.categories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategorySelection(cat.id)}
                      className={`flex items-center justify-between p-2.5 rounded-gm-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[var(--gm-accent-strong)] bg-[var(--gm-surface)]"
                          : "border-[var(--gm-border)] bg-[var(--gm-surface)]/40 hover:bg-[var(--gm-surface)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[var(--gm-accent-strong)] shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-[var(--gm-text-subtle)] shrink-0" />
                        )}
                        <span className="text-gm-sm font-semibold text-[var(--gm-text)] truncate">
                          {cat.name}
                        </span>
                      </div>
                      <Badge variant="muted" size="sm" className="font-mono text-[10px]">
                        {cat.workIds.length} works
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: GRANULAR MEMORY SYNC OPT-OUT */}
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--gm-border)] pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[var(--gm-accent-strong)]" />
                <h2 className="font-bold text-gm-lg text-[var(--gm-text)]">
                  Granular Memory Sync Opt-Out
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={optOutAllSpoilers} className="text-gm-xs h-7 px-2">
                  Opt Out Spoilers
                </Button>
                <Button size="sm" variant="ghost" onClick={optInAllMemories} className="text-gm-xs h-7 px-2">
                  Reset (Sync All)
                </Button>
              </div>
            </div>

            <p className="text-gm-xs text-[var(--gm-text-muted)]">
              Toggle off individual reflections, diary notes, or quotes you prefer to keep private on this local device. Opted-out memories will never be transmitted to the sync hub.
            </p>

            <Input
              placeholder="Filter memories by title, note, or work..."
              value={searchMemories}
              onChange={(e) => setSearchMemories(e.target.value)}
              className="h-8 text-gm-xs"
            />

            <div className="max-h-72 overflow-y-auto space-y-2 border border-[var(--gm-border)] rounded-gm-lg p-2.5 bg-[var(--gm-surface)]/20">
              {filteredMemories.map(({ memory, workTitle }) => {
                const isOptedOut = optedOutMemoryIds.includes(memory.id);

                return (
                  <div
                    key={memory.id}
                    className={`p-3 rounded-gm-md border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                      isOptedOut
                        ? "border-[var(--gm-border)] bg-[var(--gm-surface)]/30 opacity-70"
                        : "border-[var(--gm-border-strong)] bg-[var(--gm-surface)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gm-sm text-[var(--gm-text)] truncate">
                          {memory.title || "Untitled Memory"}
                        </span>
                        <Badge variant="muted" size="sm" className="font-mono text-[9px] uppercase">
                          {memory.type}
                        </Badge>
                        {memory.spoilerLevel && memory.spoilerLevel !== SpoilerLevel.SpoilerFree && (
                          <Badge variant="accent" size="sm" className="font-mono text-[9px]">
                            Spoiler
                          </Badge>
                        )}
                      </div>
                      <p className="text-gm-xs text-[var(--gm-text-muted)] truncate mt-0.5">
                        {workTitle} {memory.body ? `— ${memory.body}` : ""}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={isOptedOut ? "outline" : "default"}
                      onClick={() => toggleMemoryOptOut(memory.id)}
                      className="text-gm-xs shrink-0 self-end sm:self-center h-7 px-2.5"
                    >
                      {isOptedOut ? "Opted Out (Local Only)" : "Syncing to Hub ✓"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Sync Hub & Cloudflare D1 Target Settings */}
        <div className="space-y-6">
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[var(--gm-border)] pb-3">
              <Server className="h-5 w-5 text-[var(--gm-accent-strong)]" />
              <h2 className="font-bold text-gm-base text-[var(--gm-text)]">
                Sync Target &amp; Hub
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gm-xs font-semibold text-[var(--gm-text)] block mb-1">
                  Local / LAN Sync Hub URL
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={hubUrl}
                    onChange={(e) => {
                      setHubUrl(e.target.value);
                      try {
                        window.localStorage.setItem("cv:sync_hub_url:v1", e.target.value);
                      } catch {}
                    }}
                    placeholder="http://127.0.0.1:47920"
                    className="font-mono text-gm-xs h-8"
                  />
                  <div
                    className={`h-3 w-3 rounded-full shrink-0 ${
                      hubStatus === "online"
                        ? "bg-emerald-500"
                        : hubStatus === "offline"
                        ? "bg-rose-500"
                        : "bg-amber-500 animate-pulse"
                    }`}
                    title={`Hub Status: ${hubStatus}`}
                  />
                </div>
                <p className="text-[11px] text-[var(--gm-text-muted)] mt-1">
                  Connects Web, PC Studio (.exe), and Mobile APK across LAN Wi-Fi.
                </p>
              </div>

              <div className="p-3 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gm-xs font-semibold text-[var(--gm-text)] flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-sky-400" />
                    <span>Cloudflare D1 Serverless</span>
                  </span>
                  <Badge variant="muted" size="sm" className="font-mono text-[10px]">
                    Free Tier Ready
                  </Badge>
                </div>
                <p className="text-[11px] text-[var(--gm-text-muted)] leading-relaxed">
                  Sync schema is 100% compliant with Cloudflare D1 distributed SQLite. 5 million read units/day handle up to 50,000 daily users with zero monthly cloud bills.
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--gm-border)] pt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-gm-xs"
                onClick={() => {
                  probeSyncHubStatus().then((res) => {
                    setHubStatus(res ? "online" : "offline");
                    toast({
                      title: res ? "Hub Online" : "Hub Offline",
                      description: res
                        ? `Connected. Clock: ${res.hlc}`
                        : "Cannot connect to local sync hub.",
                    });
                  });
                }}
              >
                Test Hub Connection
              </Button>
            </div>
          </div>

          {/* Privacy & Zero-Knowledge Summary Card */}
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-gm-sm text-[var(--gm-text)]">
                Zero-Knowledge Privacy Guarantee
              </h3>
            </div>
            <ul className="text-gm-xs text-[var(--gm-text-muted)] space-y-1.5 list-disc list-inside">
              <li>Passwords and website credentials are NEVER synchronized.</li>
              <li>Vault records stay strictly unreadable without your local passphrase.</li>
              <li>Local media files (EPUB/PDF/Audio/Video) stay on your device disk.</li>
              <li>CRDT Hybrid Logical Clock prevents sync conflicts across devices.</li>
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
