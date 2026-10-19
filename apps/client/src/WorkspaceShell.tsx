import * as React from "react";
import { DoorOpen, KeyRound, Layers, Lock, LogOut, RefreshCw, Unlock, X } from "lucide-react";
import { AppShell, toast, ThemeSwitcher } from "@grimoire/ui";
import { matchRoute } from "./router";
import { TermsAndConditions } from "./components/features/TermsAndConditions/TermsAndConditions";
import {
  clientRepository,
  useLibraryStore,
  useRadarStore,
  useTrashStore,
  useUpdatesStore,
} from "@grimoire/state";
import { useVaultAutoLock, useVaultStore } from "@grimoire/vault";
import { APP_ROUTES, CommandPalette } from "./routes-config";
import { syncWithCrossPlatformHub } from "./utils/cross-platform-sync";
import { CredentialKeyringPanel } from "./components/features/Vault/CredentialKeyringPanel";

export interface WorkspaceShellProps {
  currentPath: string;
  onNavigate: (href: string) => void;
  onOpenSanctumHome: () => void;
  onOpenFeaturesGuide: () => void;
}

export function WorkspaceShell({
  currentPath,
  onNavigate,
  onOpenSanctumHome,
  onOpenFeaturesGuide,
}: WorkspaceShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [showPortalsModal, setShowPortalsModal] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const isVaultUnlocked = useVaultStore((state) => state.status === "unlocked");
  useVaultAutoLock({ timeoutMinutes: 30, lockOnVisibilityChange: false });

  const handleLogOut = React.useCallback(() => {
    try {
      localStorage.removeItem("cv:username");
      localStorage.removeItem("cv:auth_token");
      localStorage.removeItem("grimoire:active_profile");
      localStorage.removeItem("cv:current_room");
      localStorage.removeItem("cv:local_vault:v1");
      localStorage.removeItem("cv:archive_records:v1");
      localStorage.removeItem("cv:work_relations:v1");
      useVaultStore.getState().lock();
      clientRepository.clear();
      useLibraryStore.getState().refresh();
    } catch {}
    toast({
      title: "Logged Out",
      description: "Room exited, vault sealed, and identity unlinked.",
    });
    onOpenSanctumHome();
  }, [onOpenSanctumHome]);

  const handleCrossPlatformSync = async () => {
    setIsSyncing(true);
    try {
      const mode =
        (import.meta.env?.VITE_PLATFORM_MODE as "web" | "pc" | "mobile" | undefined) ?? "web";
      const platformId = mode === "pc" ? "pc-app" : mode === "mobile" ? "mobile-app" : "web";
      const result = await syncWithCrossPlatformHub(platformId, `${mode.toUpperCase()} Sanctum`);
      if (result?.ok) {
        toast({
          title: "Cross-Platform Sync Complete",
          description: `Merged ${result.stats.merged} works, added ${result.stats.added} (${result.stats.total} total across Web/PC/Mobile).`,
          variant: "success",
        });
      } else {
        toast({
          title: "Local Vault Saved (LAN Hub Offline)",
          description: "Start venv/sync_hub_server.py or PC App to sync across Web, PC & Mobile.",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Radar & Updates store for live badge counts
  const radarStore = useRadarStore();
  const libraryItems = useLibraryStore((state) => state.items);
  const seenIds = useUpdatesStore((state) => state.seenIds);
  const dismissedIds = useUpdatesStore((state) => state.dismissedIds);
  const snoozedUntil = useUpdatesStore((state) => state.snoozedUntil);
  const getUnreadCount = useUpdatesStore((state) => state.getUnreadCount);
  const updatesUnreadCount = React.useMemo(
    () => getUnreadCount(libraryItems),
    [getUnreadCount, libraryItems, seenIds, dismissedIds, snoozedUntil],
  );

  const resumeReader = React.useCallback(
    (workId: string, accessPathId?: string) => {
      const item = clientRepository.getItems().find((candidate) => candidate.work.id === workId);
      const accessPath = item?.accessPaths.find((path) => path.id === accessPathId);
      if (!accessPath || accessPath.kind !== "local_file" || !accessPath.fileId) {
        onNavigate(`/work/${encodeURIComponent(workId)}`);
        return;
      }
      void import("@grimoire/reader")
        .then(({ listLocalFiles }) => listLocalFiles())
        .then((files) => {
          const file = files.find(
            (candidate) =>
              candidate.id === accessPath.fileId &&
              (candidate.workId === null || candidate.workId === workId),
          );
          if (!file) {
            toast({
              title: "Local reading file is unavailable",
              description: "Opening the Work details so you can choose another source.",
              variant: "destructive",
            });
            onNavigate(`/work/${encodeURIComponent(workId)}`);
            return;
          }
          onNavigate(`/reader/${encodeURIComponent(file.id)}`);
        })
        .catch((error: unknown) => {
          toast({
            title: "Unable to open the local reader",
            description:
              error instanceof Error ? error.message : "Local file storage could not be read.",
            variant: "destructive",
          });
          onNavigate(`/work/${encodeURIComponent(workId)}`);
        });
    },
    [onNavigate],
  );

  // Global keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        useVaultStore.getState().lock();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const totalTrashCount = useTrashStore((state) => state.totalTrashCount);

  const matched = React.useMemo(() => {
    return matchRoute(currentPath, APP_ROUTES);
  }, [currentPath]);

  const Component = matched.component;

  return (
    <>
      {!termsAccepted && <TermsAndConditions onAccept={() => setTermsAccepted(true)} />}

      <AppShell
        currentPath={currentPath}
        onNavigate={onNavigate}
        isVaultUnlocked={isVaultUnlocked}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        badgeCounts={{
          radar: radarStore.pendingCount,
          updates: updatesUnreadCount,
          trash: totalTrashCount,
        }}
        headerSlot={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onNavigate("/vault")}
              className="inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-gm-sm border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 text-xs sm:text-sm font-semibold text-[var(--gm-text)] shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer min-w-[34px] sm:min-w-[38px]"
              title="Open Private Vault to reveal or conceal Hidden Works"
            >
              {isVaultUnlocked ? (
                <Unlock className="h-4 w-4 text-[var(--gm-warning)]" />
              ) : (
                <Lock className="h-4 w-4 text-[var(--gm-accent-strong)]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleCrossPlatformSync()}
              className="inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-gm-sm border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--gm-text)] shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
              title="Sync Works, Progress & Memories across Web, PC App & Mobile App"
            >
              <RefreshCw
                className={`h-4 w-4 text-[var(--gm-accent-strong)] ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden md:inline">Sync</span>
            </button>
            <button
              type="button"
              onClick={onOpenSanctumHome}
              className="inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-gm-sm border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--gm-text)] shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
              title="Exit Room and return to Sanctum Title Screen"
            >
              <DoorOpen className="h-4 w-4 text-[var(--gm-accent-strong)]" />
              <span className="hidden sm:inline">Exit Room</span>
            </button>
            <button
              type="button"
              onClick={onOpenFeaturesGuide}
              className="inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-gm-sm border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--gm-text)] shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
              title="Open 32-Feature Step-by-Step Encyclopedia"
            >
              <Layers className="h-4 w-4 text-[var(--gm-accent-strong)]" />
              <span className="hidden lg:inline">Guide</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPortalsModal(true)}
              className="inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-gm-sm border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--gm-text)] shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
              title="Reading Portals & Website Credential Manager"
            >
              <KeyRound className="h-4 w-4 text-[var(--gm-accent-strong)]" />
              <span className="hidden md:inline">Portals</span>
            </button>
            <ThemeSwitcher />
            <button
              type="button"
              onClick={handleLogOut}
              className="inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-gm-sm border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--gm-danger)] hover:bg-[var(--gm-danger)] hover:text-white shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
              title="Log Out and Seal Room Session"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden xl:inline">Log Out</span>
            </button>
          </div>
        }
      >
        <React.Suspense
          fallback={
            <div className="p-8 text-center text-[var(--gm-text-muted)]">Loading view…</div>
          }
        >
          <Component
            workId={matched.params.id}
            fileId={matched.params.fileId}
            onNavigateWork={(id: string) => onNavigate(`/work/${id}`)}
            onResumeReader={resumeReader}
            onOpenFile={(id: string) => onNavigate(`/reader/${encodeURIComponent(id)}`)}
            onBack={() => onNavigate(matched.path === "/reader/:fileId" ? "/shelf" : "/library")}
          />
        </React.Suspense>

        {commandPaletteOpen && (
          <React.Suspense fallback={null}>
            <CommandPalette
              open={commandPaletteOpen}
              onOpenChange={setCommandPaletteOpen}
              context={{
                navigate: onNavigate,
                toastMessage: (msg: string) => toast({ title: msg }),
              }}
            />
          </React.Suspense>
        )}

        {showPortalsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-gm-xl border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg)] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--gm-border)] mb-6">
                <div>
                  <h2 className="text-gm-lg font-extrabold text-[var(--gm-text)]">
                    Reading Portals &amp; Website Credential Manager
                  </h2>
                  <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                    Store logins, passwords, search URLs, and view auto-curated reading sites.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPortalsModal(false)}
                  className="rounded-cv p-1.5 text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface)] transition-colors cursor-pointer"
                  title="Close Portals Modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CredentialKeyringPanel />
            </div>
          </div>
        )}
      </AppShell>
    </>
  );
}

export default WorkspaceShell;
