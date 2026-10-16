import * as React from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Pause,
  Pin,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Cover,
  EmptyState,
  PageContainer,
  SectionHeader,
  toast,
} from "@chronicles-vault/ui";
import {
  useLibraryStore,
  useReadingQueueStore,
  useReturnDeskStore,
} from "@chronicles-vault/state";
import {
  formatProgressAnchor,
  MemoryType,
  PrivacyState,
  ReturnSignalType,
  SourceHealth,
  SpoilerLevel,
} from "@chronicles-vault/domain";
import {
  MemoryRefresherData,
  MemoryRefresherDrawer,
} from "../components/features/ReturnDesk/MemoryRefresherDrawer";
import { ReturnCard, ReturnCardData } from "../components/features/ReturnDesk/ReturnCard";
import { ResumeReadingModal } from "../components/features/Reader/ResumeReadingModal";
import { toUIHealth, toUIAnchor, toUIMemoryType } from "../utils/display-adapters";
import { openLocalDiskPath } from "../utils/local-media";
import type { HydratedWorkItem } from "@chronicles-vault/state";
import type { ReturnSignal } from "@chronicles-vault/domain";

export interface ReturnDeskProps {
  onNavigateWork?: (id: string) => void;
  onResumeReader?: (id: string, accessPathId?: string) => void;
}

type SectionItem = { signal: ReturnSignal; item: HydratedWorkItem };

function returnSignalLabel(type: ReturnSignalType): string {
  switch (type) {
    case ReturnSignalType.ContinueNow:
      return "Continue Now";
    case ReturnSignalType.CatchUp:
      return "Catch Up";
    case ReturnSignalType.BingeReady:
      return "Binge Ready";
    case ReturnSignalType.Stalled:
      return "Stalled";
    case ReturnSignalType.Waiting:
      return "Waiting";
    case ReturnSignalType.Rediscover:
      return "Rediscover";
    default: {
      const exhaustiveCheck: never = type;
      return exhaustiveCheck;
    }
  }
}

function getBestPath(item: HydratedWorkItem) {
  const preferredId = item.relationship?.preferredAccessPathId;
  const healthRank: Record<SourceHealth, number> = {
    [SourceHealth.Local]: 5,
    [SourceHealth.Healthy]: 4,
    [SourceHealth.Degraded]: 3,
    [SourceHealth.Stale]: 2,
    [SourceHealth.Unknown]: 1,
    [SourceHealth.Unavailable]: 0,
    [SourceHealth.Broken]: 0,
  };
  return (
    [...item.accessPaths].sort((left, right) => {
      const healthDifference = healthRank[right.health] - healthRank[left.health];
      if (healthDifference !== 0) return healthDifference;
      const leftPreferred = left.id === preferredId || left.isPreferred;
      const rightPreferred = right.id === preferredId || right.isPreferred;
      return Number(rightPreferred) - Number(leftPreferred);
    })[0] ?? null
  );
}

function toReturnCardData(sectionItem: SectionItem): ReturnCardData | null {
  const { signal, item: workItem } = sectionItem;
  const anchor = workItem.relationship?.currentAnchor ?? null;
  const uiAnchor = toUIAnchor(anchor) ?? { type: "custom" as const, label: "No progress recorded" };

  const preferredPath = getBestPath(workItem);
  const lastMemory = [...workItem.memories]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .find(
      (memory) =>
        memory.privacyState !== PrivacyState.Vault &&
        memory.spoilerLevel === SpoilerLevel.SpoilerFree &&
        Boolean(memory.body),
    );
  const sourceHealth = preferredPath ? toUIHealth(preferredPath.health) : "unknown";

  let sourceName = "No source";
  if (preferredPath) {
    if ("provider" in preferredPath && preferredPath.provider) {
      sourceName = preferredPath.provider as string;
    } else if (preferredPath.label) {
      sourceName = preferredPath.label;
    } else {
      sourceName = preferredPath.kind ?? "Source";
    }
  }

  return {
    id: workItem.work.id,
    title: workItem.work.title,
    coverSrc: workItem.work.coverRef ?? null,
    lastProgress: uiAnchor,
    lastReadDate: workItem.relationship?.lastActiveAt ?? workItem.work.updatedAt,
    newReleasesCount: signal.newMaterialCount ?? 0,
    newReleasesLabel:
      workItem.work.contentType === "anime" || workItem.work.contentType === "donghua"
        ? "episodes"
        : "chapters",
    memorySnippet: lastMemory?.body ?? undefined,
    sourceHealth,
    sourceName,
  };
}

function buildRefresherData(
  workId: string,
  allSections: SectionItem[],
): MemoryRefresherData | null {
  const found = allSections.find((s) => s.item.work.id === workId);
  if (!found) return null;

  const { item: workItem } = found;
  const anchor = workItem.relationship?.currentAnchor ?? null;
  const uiAnchor = toUIAnchor(anchor) ?? { type: "custom" as const, label: "No progress recorded" };
  const visibleMemories = workItem.memories
    .filter((memory) => memory.privacyState !== PrivacyState.Vault)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const favoritePanel = visibleMemories.find(
    (memory) => memory.type === MemoryType.FavoritePanel && memory.assets.length > 0,
  );
  const bestPath = getBestPath(workItem);

  return {
    workId: workItem.work.id,
    title: workItem.work.title,
    coverSrc: workItem.work.coverRef ?? null,
    lastProgress: uiAnchor,
    lastReadDate: workItem.relationship?.lastActiveAt ?? workItem.work.updatedAt,
    stoppedReason: workItem.relationship?.stoppedReason,
    stoppedNote: workItem.relationship?.stoppedNote,
    bestPath: bestPath
      ? {
          id: bestPath.id,
          label: bestPath.label ?? bestPath.kind,
          kind: bestPath.kind,
          health: toUIHealth(bestPath.health),
        }
      : null,
    favoritePanel: favoritePanel
      ? {
          fileId: favoritePanel.assets[0]!.fileId,
          thumbnailRef: favoritePanel.assets[0]!.thumbnailRef,
          spoilerLevel: favoritePanel.spoilerLevel,
        }
      : null,
    memories: visibleMemories
      .filter((memory) => memory !== favoritePanel)
      .slice(0, 8)
      .map((m) => ({
        id: m.id as string,
        type: toUIMemoryType(m.type),
        content: m.body ?? m.title ?? "",
        anchorLabel: m.progressAnchor ? formatProgressAnchor(m.progressAnchor) : undefined,
        createdAt: m.createdAt,
        spoilerLevel: m.spoilerLevel,
      })),
  };
}

export function ReturnDesk({ onNavigateWork, onResumeReader }: ReturnDeskProps) {
  const {
    heroSignal,
    heroWork,
    continueRail,
    catchUpList,
    bingeReadyList,
    stalledList,
    waitingList,
    rediscoverList,
    isRefresherOpen,
    selectedWorkItem,
    openRefresher,
    closeRefresher,
    refresh,
  } = useReturnDeskStore();

  const libraryItems = useLibraryStore((state) => state.items);
  const {
    items: queueItems,
    isPaused: isQueuePaused,
    addToQueue,
    removeFromQueue,
    moveQueueItem,
    togglePinQueueItem,
    setQueueTargetDate,
    setQueueEstimatedMinutes,
    toggleQueuePaused,
    getSuggestedWorks,
  } = useReadingQueueStore();

  const suggestedQueueWorks = React.useMemo(
    () => getSuggestedWorks(libraryItems),
    [getSuggestedWorks, libraryItems, queueItems],
  );

  const totalQueueMinutes = React.useMemo(
    () => queueItems.reduce((sum, entry) => sum + (entry.estimatedMinutes ?? 0), 0),
    [queueItems],
  );

  React.useEffect(() => {
    refresh();
  }, []);

  const allSections: SectionItem[] = [
    ...continueRail,
    ...catchUpList,
    ...bingeReadyList,
    ...stalledList,
    ...waitingList,
    ...rediscoverList,
  ];

  const handleContinue = (id: string, accessPathId?: string) => {
    const found = allSections.find((s) => s.item.work.id === id);
    const bestPath = found ? getBestPath(found.item) : null;
    const pathId = accessPathId ?? bestPath?.id;
    const anchor = found?.item.relationship?.currentAnchor;
    const label = anchor ? formatProgressAnchor(anchor) : "beginning";
    toast({
      title: "Resuming reading session",
      description: `Continuing from ${label}`,
      variant: "default",
    });
    if (onResumeReader) onResumeReader(id, pathId);
    else onNavigateWork?.(id);
  };

  const handleOpenRefresher = (id: string) => {
    openRefresher(id as Parameters<typeof openRefresher>[0]);
  };

  const refresherData = selectedWorkItem
    ? buildRefresherData(selectedWorkItem.work.id, allSections)
    : null;

  const isEmpty = allSections.length === 0 && queueItems.length === 0;

  return (
    <PageContainer maxWidth="wide">
      {/* Editorial Page Header */}
      <div className="mb-8">
        <h1 className="text-cv-2xl sm:text-cv-3xl font-extrabold tracking-tight text-[var(--cv-text)]">
          Return Desk
        </h1>
        <p className="mt-1.5 text-cv-sm text-[var(--cv-text-muted)] max-w-xl">
          Pick up exactly where you left off. Review updates and memory briefings before continuing.
        </p>
      </div>

      {isEmpty ? (
        <EmptyState variant="returnDesk" />
      ) : (
        <div className="space-y-10">
          {/* Hero — top priority work */}
          {heroSignal &&
            heroWork &&
            (() => {
              return (
                <section>
                  <SectionHeader title="Return Now" description={heroSignal.explanation} />
                  <div
                    className="relative rounded-cv-xl border border-[var(--cv-accent-muted)] bg-gradient-to-br from-[var(--cv-bg-elevated)] to-[var(--cv-surface)]/60 p-5 sm:p-6 flex flex-col sm:flex-row gap-5 cursor-pointer hover:border-[var(--cv-accent-strong)] transition-colors"
                    onClick={() => onNavigateWork?.(heroWork.work.id)}
                  >
                    <div className="flex-shrink-0 w-20 sm:w-24 aspect-[3/4] rounded-cv overflow-hidden bg-[var(--cv-surface)] border border-[var(--cv-border)]">
                      {heroWork.work.coverRef ? (
                        <img
                          src={heroWork.work.coverRef}
                          alt={heroWork.work.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--cv-text-subtle)] text-cv-xs text-center p-1 leading-tight">
                          {heroWork.work.title.slice(0, 20)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-accent-strong)] mb-1">
                        {returnSignalLabel(heroSignal.type)}
                      </p>
                      <h2 className="text-cv-xl sm:text-cv-2xl font-bold text-[var(--cv-text)] mb-2 line-clamp-2">
                        {heroWork.work.title}
                      </h2>
                      <p className="text-cv-sm text-[var(--cv-text-muted)] mb-4 line-clamp-2">
                        {heroSignal.explanation}
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContinue(heroWork.work.id);
                          }}
                          className="px-4 py-2 rounded-cv text-cv-sm font-semibold bg-[var(--cv-accent-strong)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Continue Reading →
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRefresher(heroWork.work.id);
                          }}
                          className="px-4 py-2 rounded-cv text-cv-sm font-semibold border border-[var(--cv-border)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:border-[var(--cv-accent-muted)] transition-colors cursor-pointer"
                        >
                          Memory Briefing
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })()}

          {/* Next Up Reading Queue */}
          <section className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-5 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">
                    Next Up Queue
                  </h2>
                  <Badge variant="default" className="font-mono text-[11px]">
                    {queueItems.length} queued
                  </Badge>
                  {totalQueueMinutes > 0 && (
                    <span className="inline-flex items-center gap-1 text-cv-xs font-mono text-[var(--cv-text-muted)]">
                      <Clock className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />~
                      {totalQueueMinutes} min total
                    </span>
                  )}
                  {isQueuePaused && (
                    <Badge variant="warning" className="text-[10px]">
                      Queue Paused
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-cv-xs text-[var(--cv-text-muted)]">
                  Curate your immediate reading order, pin priority titles, and set session time budgets.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleQueuePaused}
                className="gap-1.5 text-cv-xs self-start sm:self-auto"
              >
                {isQueuePaused ? (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Resume Queue</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause Queue</span>
                  </>
                )}
              </Button>
            </div>

            {queueItems.length === 0 ? (
              <div className="rounded-cv border border-dashed border-[var(--cv-border)] p-4 text-center text-cv-xs text-[var(--cv-text-muted)]">
                Your Next Up queue is empty. Add works from suggestions below to plan your upcoming reading sessions.
              </div>
            ) : (
              <div
                className={`divide-y divide-[var(--cv-border)] rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] ${
                  isQueuePaused ? "opacity-60" : ""
                }`}
              >
                {queueItems.map((entry, idx) => {
                  const hydrated = libraryItems.find((w) => w.work.id === entry.workId);
                  const title = hydrated?.work.title ?? entry.workId;
                  const anchorLabel = hydrated?.relationship?.currentAnchor
                    ? formatProgressAnchor(hydrated.relationship.currentAnchor)
                    : "Start from Ch. 1";

                  return (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-5 text-right font-mono text-cv-xs text-[var(--cv-text-subtle)]">
                          #{idx + 1}
                        </span>
                        <Cover
                          title={title}
                          src={hydrated?.work.coverRef ?? null}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onNavigateWork?.(entry.workId)}
                              className="truncate text-cv-sm font-semibold text-[var(--cv-text)] hover:text-[var(--cv-accent-strong)] transition-colors cursor-pointer text-left"
                            >
                              {title}
                            </button>
                            {entry.pinned && (
                              <Badge
                                variant="default"
                                className="bg-[var(--cv-accent)]/20 text-[var(--cv-accent-strong)] text-[10px] px-1.5 py-0"
                              >
                                Pinned
                              </Badge>
                            )}
                            {hydrated?.relationship?.shelfTier &&
                              hydrated.relationship.shelfTier !== "standard" && (
                                <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                                  {hydrated.relationship.shelfTier.replace("_", " ")}
                                </Badge>
                              )}
                          </div>
                          <p className="mt-0.5 font-mono text-cv-xs text-[var(--cv-text-muted)]">
                            {anchorLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <label className="inline-flex items-center gap-1 rounded-cv-sm border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] px-2 py-1 text-[11px] text-[var(--cv-text-muted)]">
                          <Clock className="h-3 w-3 text-[var(--cv-accent-strong)]" />
                          <input
                            type="number"
                            min={5}
                            max={600}
                            step={5}
                            value={entry.estimatedMinutes ?? 30}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setQueueEstimatedMinutes(
                                entry.workId,
                                Number.isFinite(val) && val > 0 ? val : null,
                              );
                            }}
                            aria-label={`Estimated reading minutes for ${title}`}
                            className="w-11 bg-transparent font-mono text-[11px] text-[var(--cv-text)] focus:outline-none"
                          />
                          <span>m</span>
                        </label>

                        <label className="inline-flex items-center gap-1 rounded-cv-sm border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] px-2 py-1 text-[11px] text-[var(--cv-text-muted)]">
                          <Calendar className="h-3 w-3 text-[var(--cv-accent-strong)]" />
                          <input
                            type="date"
                            value={entry.targetDate ?? ""}
                            onChange={(e) =>
                              setQueueTargetDate(
                                entry.workId,
                                e.target.value ? e.target.value : null,
                              )
                            }
                            aria-label={`Target reading date for ${title}`}
                            className="bg-transparent font-mono text-[11px] text-[var(--cv-text)] focus:outline-none"
                          />
                        </label>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => togglePinQueueItem(entry.workId)}
                            className={`p-1.5 rounded text-cv-xs cursor-pointer ${
                              entry.pinned
                                ? "text-[var(--cv-accent-strong)] bg-[var(--cv-accent)]/15"
                                : "text-[var(--cv-text-subtle)] hover:text-[var(--cv-text)]"
                            }`}
                            title={entry.pinned ? "Unpin from top" : "Pin to top of queue"}
                            aria-label={entry.pinned ? `Unpin ${title}` : `Pin ${title}`}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQueueItem(entry.workId, "up")}
                            disabled={idx === 0}
                            className="p-1.5 rounded text-[var(--cv-text-subtle)] hover:text-[var(--cv-text)] disabled:opacity-30 cursor-pointer"
                            title="Move up"
                            aria-label={`Move ${title} up`}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQueueItem(entry.workId, "down")}
                            disabled={idx === queueItems.length - 1}
                            className="p-1.5 rounded text-[var(--cv-text-subtle)] hover:text-[var(--cv-text)] disabled:opacity-30 cursor-pointer"
                            title="Move down"
                            aria-label={`Move ${title} down`}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContinue(entry.workId)}
                            className="h-7 px-2.5 text-cv-xs"
                          >
                            Read
                          </Button>
                          <button
                            type="button"
                            onClick={() => removeFromQueue(entry.workId)}
                            className="p-1.5 rounded text-[var(--cv-text-subtle)] hover:text-[var(--cv-danger)] cursor-pointer"
                            title="Remove from queue"
                            aria-label={`Remove ${title} from queue`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {suggestedQueueWorks.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--cv-border)]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--cv-text-subtle)] mb-2">
                  Suggested for Queue
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQueueWorks.map((candidate) => (
                    <button
                      key={candidate.work.id}
                      type="button"
                      onClick={() => {
                        addToQueue(candidate.work.id, { estimatedMinutes: 45 });
                        toast({
                          title: "Added to Next Up Queue",
                          description: candidate.work.title,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-cv-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1 text-cv-xs text-[var(--cv-text-muted)] hover:border-[var(--cv-accent-muted)] hover:text-[var(--cv-text)] transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-[var(--cv-accent-strong)]" />
                      <span className="truncate max-w-[180px]">{candidate.work.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Continue Rail */}
          {continueRail.length > 0 && (
            <section>
              <SectionHeader
                title="Continue Rail"
                count={continueRail.length}
                description="Currently active — pick up where you left off."
              />
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {continueRail.map((sectionItem) => {
                  const data = toReturnCardData(sectionItem);
                  if (!data) return null;
                  return (
                    <ReturnCard
                      key={sectionItem.item.work.id}
                      data={data}
                      onContinue={handleContinue}
                      onOpenMemoryRefresher={handleOpenRefresher}
                      onCardClick={(id) => onNavigateWork?.(id)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Catch-Up Queue */}
          {catchUpList.length > 0 && (
            <section>
              <SectionHeader
                title="Catch-Up Queue"
                count={catchUpList.length}
                description="New chapters accumulated since your last session."
              />
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {catchUpList.map((sectionItem) => {
                  const data = toReturnCardData(sectionItem);
                  if (!data) return null;
                  return (
                    <ReturnCard
                      key={sectionItem.item.work.id}
                      data={data}
                      onContinue={handleContinue}
                      onOpenMemoryRefresher={handleOpenRefresher}
                      onCardClick={(id) => onNavigateWork?.(id)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Binge-Ready */}
          {bingeReadyList.length > 0 && (
            <section>
              <SectionHeader
                title="Binge-Ready"
                count={bingeReadyList.length}
                description="Paused works that have accumulated enough chapters to binge."
              />
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {bingeReadyList.map((sectionItem) => {
                  const data = toReturnCardData(sectionItem);
                  if (!data) return null;
                  return (
                    <ReturnCard
                      key={sectionItem.item.work.id}
                      data={data}
                      onContinue={handleContinue}
                      onOpenMemoryRefresher={handleOpenRefresher}
                      onCardClick={(id) => onNavigateWork?.(id)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Stalled */}
          {stalledList.length > 0 && (
            <section>
              <SectionHeader
                title="Stalled & Backlog"
                count={stalledList.length}
                description="Inactive for a while. Refresh your memory before diving back in."
              />
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {stalledList.map((sectionItem) => {
                  const data = toReturnCardData(sectionItem);
                  if (!data) return null;
                  return (
                    <ReturnCard
                      key={sectionItem.item.work.id}
                      data={data}
                      onContinue={handleContinue}
                      onOpenMemoryRefresher={handleOpenRefresher}
                      onCardClick={(id) => onNavigateWork?.(id)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Waiting */}
          {waitingList.length > 0 && (
            <section>
              <SectionHeader
                title="Waiting for Updates"
                count={waitingList.length}
                description="Caught up with all available chapters."
              />
              <div className="flex flex-wrap gap-3">
                {waitingList.map(({ item: workItem }) => (
                  <button
                    key={workItem.work.id}
                    type="button"
                    onClick={() => onNavigateWork?.(workItem.work.id)}
                    className="px-4 py-2 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] text-cv-sm font-medium text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] hover:border-[var(--cv-accent-muted)] transition-colors cursor-pointer"
                  >
                    {workItem.work.title}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Rediscover */}
          {rediscoverList.length > 0 && (
            <section>
              <SectionHeader
                title="Rediscover"
                count={rediscoverList.length}
                description="Older works from your history, ready to revisit when you are."
              />
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {rediscoverList.map((sectionItem) => {
                  const data = toReturnCardData(sectionItem);
                  if (!data) return null;
                  return (
                    <ReturnCard
                      key={sectionItem.item.work.id}
                      data={data}
                      onContinue={handleContinue}
                      onOpenMemoryRefresher={handleOpenRefresher}
                      onCardClick={(id) => onNavigateWork?.(id)}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Memory Refresher Drawer */}
      <MemoryRefresherDrawer
        open={isRefresherOpen}
        onOpenChange={(open) => {
          if (!open) closeRefresher();
        }}
        data={refresherData}
        onContinue={handleContinue}
      />
    </PageContainer>
  );
}
