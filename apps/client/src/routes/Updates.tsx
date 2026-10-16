import * as React from "react";
import { Check, CheckCheck, Clock, ExternalLink, EyeOff, RotateCcw, Sparkles } from "lucide-react";
import {
  UpdateCertainty,
  SourceHealth,
  applyUpdateCertaintyValidity,
  extractNumericProgress,
  selectFallbackAccessPath,
} from "@chronicles-vault/domain";
import {
  buildUpdateFeedId,
  useLibraryStore,
  useUpdatesStore,
} from "@chronicles-vault/state";
import type { HydratedWorkItem } from "@chronicles-vault/state";
import {
  Badge,
  Button,
  Cover,
  EmptyState,
  PageContainer,
  SourceHealthBadge,
  UpdateCertaintyBadge,
  relativeTime,
  toast,
} from "@chronicles-vault/ui";

const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

interface FeedUpdate {
  id: string;
  workId: string;
  workTitle: string;
  coverSrc: string | null;
  label: string;
  date: string;
  source: string;
  sourceHealth: "healthy" | "degraded" | "unavailable" | "stale" | "unknown" | "local";
  certainty: UpdateCertainty;
  accumulatedCount: number | null;
  sourceUrl: string | null;
}

function displaySourceHealth(health: SourceHealth | undefined): FeedUpdate["sourceHealth"] {
  if (health === SourceHealth.Broken) return "unavailable";
  return health ?? SourceHealth.Unknown;
}

function preferredSource(item: HydratedWorkItem) {
  const preferredId =
    item.relationship?.preferredAccessPathId ??
    item.accessPaths.find((path) => path.isPreferred)?.id ??
    null;
  return selectFallbackAccessPath(item.accessPaths, preferredId);
}

function updatesFromLibrary(items: HydratedWorkItem[], now: string): FeedUpdate[] {
  const evaluationTime = Date.parse(now);
  return items
    .filter((item) => !item.work.deletedAt && item.work.privacyState !== "vault")
    .flatMap((item) => {
      const source = preferredSource(item);
      const currentProgress = item.relationship?.currentAnchor
        ? extractNumericProgress(item.relationship.currentAnchor)
        : null;
      return item.updates.map((update) => {
        const evaluated = applyUpdateCertaintyValidity(update, now, STALE_AFTER_MS);
        const backlog =
          evaluated.numericIndex !== undefined && currentProgress !== null
            ? Math.max(0, Math.floor(evaluated.numericIndex - currentProgress))
            : null;
        const sourceUrl =
          update.sourceUrl ??
          (source?.kind === "web" ? source.url : source?.kind === "feed" ? source.feedUrl : null);
        const safeUrl = (() => {
          if (!sourceUrl) return null;
          try {
            const parsed = new URL(sourceUrl);
            return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
          } catch {
            return null;
          }
        })();
        return {
          id: buildUpdateFeedId(item.work.id, update.detectedAt, update.label),
          workId: item.work.id,
          workTitle: item.work.title,
          coverSrc: item.work.coverRef,
          label: update.label,
          date: update.detectedAt,
          source: source?.label ?? source?.provider ?? "Choose source",
          sourceHealth: displaySourceHealth(source?.health),
          certainty: evaluated.certainty,
          accumulatedCount: backlog,
          sourceUrl: safeUrl,
        };
      });
    })
    .filter(
      (update) =>
        Number.isFinite(Date.parse(update.date)) && Date.parse(update.date) <= evaluationTime,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface UpdatesProps {
  onNavigateWork?: (workId: string) => void;
}

export function Updates({ onNavigateWork }: UpdatesProps = {}) {
  const items = useLibraryStore((state) => state.items);
  const {
    seenIds,
    dismissedIds,
    snoozedUntil,
    markSeen,
    markAllSeen,
    dismissUpdate,
    restoreDismissed,
    snoozeUpdate,
    unsnoozeUpdate,
    isUpdateActive,
  } = useUpdatesStore();

  const [now] = React.useState(() => new Date().toISOString());
  const [filterView, setFilterView] = React.useState<"active" | "hidden">("active");

  const allUpdates = React.useMemo(() => updatesFromLibrary(items, now), [items, now]);

  const activeUpdates = React.useMemo(
    () => allUpdates.filter((u) => isUpdateActive(u.id)),
    [allUpdates, isUpdateActive, dismissedIds, snoozedUntil],
  );
  const hiddenUpdates = React.useMemo(
    () => allUpdates.filter((u) => !isUpdateActive(u.id)),
    [allUpdates, isUpdateActive, dismissedIds, snoozedUntil],
  );

  const unreadCount = React.useMemo(
    () => activeUpdates.filter((u) => !seenIds.includes(u.id)).length,
    [activeUpdates, seenIds],
  );

  const visibleUpdates = filterView === "active" ? activeUpdates : hiddenUpdates;

  const handleMarkAllSeen = () => {
    markAllSeen(activeUpdates.map((u) => u.id));
    toast({
      title: "All updates marked as seen",
      description: `${activeUpdates.length} update${activeUpdates.length === 1 ? "" : "s"} acknowledged.`,
    });
  };

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-[var(--cv-accent-strong)]" />
            <h1 className="text-cv-2xl font-extrabold tracking-tight text-[var(--cv-text)]">
              Updates Feed
            </h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-[var(--cv-accent)]/20 text-[var(--cv-accent-strong)] font-mono">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="mt-1 text-cv-sm text-[var(--cv-text-muted)]">
            Locally recorded releases and accumulated reading backlog. Source status reflects the
            latest locally stored health state; no websites are polled by this view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-0.5">
            <button
              type="button"
              onClick={() => setFilterView("active")}
              className={`rounded-cv-sm px-3 py-1 text-cv-xs font-medium transition-colors cursor-pointer ${
                filterView === "active"
                  ? "bg-[var(--cv-bg-elevated)] text-[var(--cv-text)] shadow-xs"
                  : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
              }`}
            >
              Active ({activeUpdates.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterView("hidden")}
              className={`rounded-cv-sm px-3 py-1 text-cv-xs font-medium transition-colors cursor-pointer ${
                filterView === "hidden"
                  ? "bg-[var(--cv-bg-elevated)] text-[var(--cv-text)] shadow-xs"
                  : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
              }`}
            >
              Snoozed / Dismissed ({hiddenUpdates.length})
            </button>
          </div>

          {filterView === "active" && unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllSeen}
              className="gap-1.5 text-cv-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all seen</span>
            </Button>
          )}
        </div>
      </div>

      {visibleUpdates.length === 0 ? (
        <EmptyState
          variant="custom"
          title={
            filterView === "active"
              ? "No active updates"
              : "No snoozed or dismissed updates"
          }
          description={
            filterView === "active"
              ? "Updates will appear here after they are recorded for a tracked Work."
              : "Updates you snooze or dismiss from your active feed can be restored here."
          }
        />
      ) : (
        <div className="divide-y divide-[var(--cv-border)] overflow-hidden rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] shadow-sm">
          {visibleUpdates.map((update) => {
            const isSeen = seenIds.includes(update.id);
            const isDismissed = dismissedIds.includes(update.id);
            const snoozeIso = snoozedUntil[update.id];

            return (
              <div
                key={update.id}
                className={`flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-[var(--cv-surface)]/50 sm:flex-row sm:items-center ${
                  !isSeen && filterView === "active"
                    ? "border-l-2 border-l-[var(--cv-accent-strong)] bg-[var(--cv-accent-muted)]/10"
                    : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Cover title={update.workTitle} src={update.coverSrc} size="xs" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {!isSeen && filterView === "active" && (
                        <span
                          className="h-2 w-2 rounded-full bg-[var(--cv-accent-strong)] shrink-0"
                          title="Unread update"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          markSeen(update.id);
                          onNavigateWork?.(update.workId);
                        }}
                        className="truncate text-cv-sm font-semibold text-[var(--cv-text)] hover:text-[var(--cv-accent-strong)] transition-colors cursor-pointer text-left"
                      >
                        {update.workTitle}
                      </button>
                      <UpdateCertaintyBadge certainty={update.certainty} />
                    </div>
                    <div className="mt-0.5 font-mono text-cv-xs text-[var(--cv-accent-strong)]">
                      {update.label}
                      {update.accumulatedCount !== null && update.accumulatedCount > 0 && (
                        <span className="ml-2 text-[var(--cv-text-muted)]">
                          {update.accumulatedCount} new since your progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap shrink-0 items-center gap-2.5 text-cv-xs text-[var(--cv-text-subtle)] sm:self-center">
                  <span>{update.source}</span>
                  <SourceHealthBadge health={update.sourceHealth} />
                  <span className="font-mono">{relativeTime(update.date)}</span>

                  {filterView === "active" ? (
                    <div className="flex items-center gap-1 ml-1">
                      {!isSeen && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                          onClick={() => markSeen(update.id)}
                          title="Mark as seen"
                          aria-label={`Mark ${update.workTitle} ${update.label} as seen`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                        onClick={() => {
                          snoozeUpdate(update.id);
                          toast({
                            title: "Update snoozed for 24h",
                            description: `${update.workTitle} · ${update.label}`,
                          });
                        }}
                        title="Snooze for 24 hours"
                        aria-label={`Snooze ${update.workTitle} ${update.label}`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[var(--cv-text-muted)] hover:text-[var(--cv-danger)]"
                        onClick={() => {
                          dismissUpdate(update.id);
                          toast({
                            title: "Update dismissed",
                            description: `${update.workTitle} · ${update.label}`,
                          });
                        }}
                        title="Dismiss update"
                        aria-label={`Dismiss ${update.workTitle} ${update.label}`}
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[11px]"
                      onClick={() => {
                        if (isDismissed) restoreDismissed(update.id);
                        if (snoozeIso) unsnoozeUpdate(update.id);
                        toast({
                          title: "Update restored to active feed",
                          description: `${update.workTitle} · ${update.label}`,
                        });
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Restore</span>
                    </Button>
                  )}

                  {update.sourceUrl && (
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[var(--cv-text-muted)]"
                    >
                      <a
                        href={update.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open update source"
                        onClick={() => markSeen(update.id)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
