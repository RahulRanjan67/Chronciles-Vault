import * as React from "react";
import { Home, Layers, RefreshCw } from "lucide-react";
import { AppShell, toast, ThemeSwitcher } from "@chronicles-vault/ui";
import { matchRoute } from "./router";
import { TermsAndConditions } from "./components/features/TermsAndConditions/TermsAndConditions";
import {
  clientRepository,
  useLibraryStore,
  useRadarStore,
  useUpdatesStore,
} from "@chronicles-vault/state";
import { useVaultAutoLock, useVaultStore } from "@chronicles-vault/vault";
import { OfflineStatusBadge } from "./components/layout/OfflineStatusBadge";
import { APP_ROUTES, CommandPalette } from "./routes-config";
import { syncWithCrossPlatformHub } from "./utils/cross-platform-sync";

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
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const isVaultUnlocked = useVaultStore((state) => state.status === "unlocked");
  useVaultAutoLock({ timeoutMinutes: 15, lockOnVisibilityChange: true });

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
      void import("@chronicles-vault/reader")
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
        }}
        headerSlot={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCrossPlatformSync()}
              className="inline-flex items-center gap-1.5 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 py-1 text-cv-xs font-medium text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:border-[var(--cv-border-strong)] transition-colors cursor-pointer"
              title="Sync Works, Progress & Memories across Web, PC App & Mobile App"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[var(--cv-accent-strong)] ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden md:inline">Sync Room</span>
            </button>
            <button
              type="button"
              onClick={onOpenSanctumHome}
              className="inline-flex items-center gap-1.5 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 py-1 text-cv-xs font-medium text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:border-[var(--cv-border-strong)] transition-colors cursor-pointer"
              title="Return to Sanctum Room Homepage"
            >
              <Home className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
              <span className="hidden sm:inline">Room Home</span>
            </button>
            <button
              type="button"
              onClick={onOpenFeaturesGuide}
              className="inline-flex items-center gap-1.5 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 py-1 text-cv-xs font-medium text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:border-[var(--cv-border-strong)] transition-colors cursor-pointer"
              title="Open Complete 32-Feature Step-by-Step Encyclopedia"
            >
              <Layers className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
              <span className="hidden lg:inline">Features Guide</span>
            </button>
            <OfflineStatusBadge />
            <ThemeSwitcher />
          </div>
        }
      >
        <React.Suspense
          fallback={
            <div className="p-8 text-center text-[var(--cv-text-muted)]">Loading view…</div>
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
      </AppShell>
    </>
  );
}

export default WorkspaceShell;
