import * as React from "react";
import { Inbox, Radar as RadarIcon, RefreshCw, Trash2, CheckCheck, Upload } from "lucide-react";
import {
  Button,
  EmptyState,
  PageContainer,
  SectionHeader,
  toast,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@grimoire/ui";
import {
  useRadarStore,
  selectFilteredRadarItems,
  selectGroupedByWork,
  type CaptureState,
  parseRadarImport,
  useLibraryStore,
} from "@grimoire/state";
import {
  PrivacyState,
  CaptureState as DomainCaptureState,
  createCapture,
  triageCaptureItem,
} from "@grimoire/domain";
import { RadarItemCard, RadarFilters, type RadarFilterState } from "../components/features/Radar";
import { CreateWorkModal } from "../components/features/Library/CreateWorkModal";

export interface RadarProps {
  onNavigateWork?: (id: string) => void;
}

export function Radar({ onNavigateWork }: RadarProps) {
  const {
    items,
    pendingCount,
    storageError,
    state,
    browserSource,
    sortBy,
    sortOrder,
    groupByWork,
    setState,
    setBrowserSource,
    setSortBy,
    setSortOrder,
    setGroupByWork,
    resetFilters,
    matchToWork,
    createNewWork,
    keepTemporary,
    discardItem,
    bulkDiscard,
    refresh,
  } = useRadarStore();
  const library = useLibraryStore();
  const availableWorks = React.useMemo(
    () =>
      library.items.filter(
        (item) => !item.work.deletedAt && item.work.privacyState !== PrivacyState.Vault,
      ),
    [library.items],
  );
  const triageSuggestions = React.useMemo(() => {
    const works = availableWorks.map((item) => item.work);
    return new Map(
      items.map((item) => {
        if (item.state !== "pending") return [item.id, null] as const;
        const capture = createCapture({
          batchId: null,
          url: item.url,
          normalizedUrl: item.normalizedUrl ?? null,
          title: item.title,
          faviconRef: null,
          browser: item.browserSource,
          windowLabel: item.batchLabel ?? null,
          capturedAt: item.capturedAt,
          possibleWorkId: null,
          confidenceScore: null,
          state: DomainCaptureState.Pending,
        });
        return [item.id, triageCaptureItem(capture, works)] as const;
      }),
    );
  }, [availableWorks, items]);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [selectedCaptureId, setSelectedCaptureId] = React.useState<string | null>(null);
  const [selectedWorkId, setSelectedWorkId] = React.useState("");
  const [creatingCaptureId, setCreatingCaptureId] = React.useState<string | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = React.useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  // Bridge between RadarFilterState and the Zustand store
  const [localFilters, setLocalFilters] = React.useState<RadarFilterState>({
    state,
    browserSource,
    sortBy,
    sortOrder,
    groupByWork,
  });

  // Sync local filter changes into the Zustand store
  React.useEffect(() => {
    setState(localFilters.state);
  }, [localFilters.state, setState]);

  React.useEffect(() => {
    setBrowserSource(localFilters.browserSource);
  }, [localFilters.browserSource, setBrowserSource]);

  React.useEffect(() => {
    setSortBy(localFilters.sortBy);
  }, [localFilters.sortBy, setSortBy]);

  React.useEffect(() => {
    setSortOrder(localFilters.sortOrder);
  }, [localFilters.sortOrder, setSortOrder]);

  React.useEffect(() => {
    setGroupByWork(localFilters.groupByWork);
  }, [localFilters.groupByWork, setGroupByWork]);

  // Update local filters when store changes (e.g., reset)
  React.useEffect(() => {
    setLocalFilters({
      state,
      browserSource,
      sortBy,
      sortOrder,
      groupByWork,
    });
  }, [state, browserSource, sortBy, sortOrder, groupByWork]);

  const filteredItems = React.useMemo(
    () => selectFilteredRadarItems(useRadarStore.getState()),
    [items, state, browserSource, sortBy, sortOrder],
  );

  const groupedItems = React.useMemo(() => selectGroupedByWork(filteredItems), [filteredItems]);

  const handleRefresh = () => {
    refresh();
    toast({
      title: "Radar refreshed",
      description: `${useRadarStore.getState().items.length} locally staged items loaded.`,
      variant: "default",
    });
  };

  const handleMatchToWork = (itemId: string) => {
    const item = items.find((capture) => capture.id === itemId);
    if (!item) return;
    setSelectedCaptureId(itemId);
    setSelectedWorkId(item.matchedWorkId ?? triageSuggestions.get(itemId)?.bestMatch?.workId ?? "");
    setIsMatchDialogOpen(true);
  };

  const confirmMatch = () => {
    const work = availableWorks.find((candidate) => candidate.work.id === selectedWorkId);
    if (!selectedCaptureId || !work) {
      toast({
        title: "Choose a work",
        description: "Select a work in your library before confirming the match.",
        variant: "default",
      });
      return;
    }
    matchToWork(selectedCaptureId, work.work.id, work.work.title);
    setIsMatchDialogOpen(false);
    toast({
      title: "Capture matched",
      description: `Linked to "${work.work.title}".`,
      variant: "success",
    });
  };

  const handleCreateNew = (itemId: string) => {
    setCreatingCaptureId(itemId);
  };

  const handleKeepTemporary = (itemId: string) => {
    keepTemporary(itemId);
    toast({
      title: "Kept as temporary",
      description: "Item saved as a temporary reference.",
      variant: "default",
    });
  };

  const handleDiscard = (itemId: string) => {
    discardItem(itemId);
    toast({
      title: "Item discarded",
      description: "Item moved to discarded.",
      variant: "default",
    });
  };

  const handleBulkDiscard = () => {
    if (selectedIds.size === 0) return;
    const discardedCount = selectedIds.size;
    bulkDiscard(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast({
      title: "Items discarded",
      description: `${discardedCount} items moved to discarded.`,
      variant: "default",
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error("Radar import exceeds the 4 MB size limit.");
      const batch = parseRadarImport(await file.text());
      const result = useRadarStore.getState().importBatch(batch);
      const saveError = useRadarStore.getState().storageError;
      if (saveError) throw new Error(`Captures could not be saved locally: ${saveError}`);
      toast({
        title: "Capture batch imported",
        description: `${result.imported} added to triage; ${result.duplicates} duplicate${result.duplicates === 1 ? "" : "s"} skipped.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description:
          error instanceof Error ? error.message : "Unable to import the selected Radar file.",
        variant: "default",
      });
    } finally {
      input.value = "";
    }
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWorkCreated = (work: {
    id: string;
    title: string;
    contentType?: string;
    personalState?: string;
  }) => {
    const capture = items.find((item) => item.id === creatingCaptureId);
    if (!capture) {
      toast({
        title: "Capture unavailable",
        description: "The source capture no longer exists.",
        variant: "default",
      });
      return;
    }
    createNewWork(capture.id, work.id, work.title);
    setCreatingCaptureId(null);
    toast({
      title: "Work created",
      description: `"${work.title}" was added to your library.`,
      variant: "success",
    });
  };

  const toggleSelection = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const isEmpty = filteredItems.length === 0;
  const hasPendingItems = pendingCount > 0;

  return (
    <PageContainer maxWidth="wide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <RadarIcon className="h-6 w-6 text-[var(--gm-accent-strong)]" />
            <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)]">
              Radar
            </h1>
            {hasPendingItems && (
              <Badge variant="default" className="text-[10px] px-2 py-0.5">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)]">
            Intake queue for browser tabs and bookmarks captured via the Radar extension.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDiscard}
              className="gap-1.5 text-[var(--gm-danger)] hover:text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Discard ({selectedIds.size})</span>
            </Button>
          )}
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Clear Selection</span>
            </Button>
          )}
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleImport}
            aria-label="Import a Radar capture batch"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => importInputRef.current?.click()}
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Capture Batch</span>
          </Button>
          <Button variant="default" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {storageError && (
        <div
          role="alert"
          className="mb-4 rounded-cv border border-[var(--gm-danger)] bg-[var(--gm-danger-muted)] p-3 text-gm-sm text-[var(--gm-text)]"
        >
          Radar storage could not be read or written: {storageError}
        </div>
      )}

      {items.length === 0 && (
        <div className="mb-6 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 text-gm-sm text-[var(--gm-text-muted)]">
          Capture tabs or bookmark folders in the Radar browser companion, export a batch, then
          import its JSON file here. Captures remain local and require your review.
        </div>
      )}

      {/* Batch Summary Banner */}
      {items.length > 0 && (
        <div className="mb-6 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-cv bg-[var(--gm-accent-muted)] text-[var(--gm-accent-strong)]">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-gm-sm font-semibold text-[var(--gm-text)]">
                {items.length} captured items
              </h3>
              <p className="text-gm-xs text-[var(--gm-text-muted)]">
                {pendingCount} pending review · {items.filter((i) => i.state === "matched").length}{" "}
                linked to works
              </p>
            </div>
          </div>
          <p className="text-gm-xs text-[var(--gm-text-muted)]">
            No works are created or tabs closed without your action.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <RadarFilters
          filters={localFilters}
          onFilterChange={setLocalFilters}
          onReset={() => {
            resetFilters();
            setSelectedIds(new Set());
          }}
        />
      </div>

      {/* Empty State */}
      {isEmpty ? (
        <EmptyState variant="radar" actionLabel="Refresh Radar" onAction={handleRefresh} />
      ) : (
        <div className="space-y-6">
          {/* Grouped by Work View */}
          {groupByWork ? (
            <div className="space-y-6">
              {/* Unmatched items */}
              {groupedItems.has(null) && groupedItems.get(null)!.length > 0 && (
                <section>
                  <SectionHeader
                    title="Unmatched Items"
                    count={groupedItems.get(null)!.length}
                    description="Items not yet linked to a work in your library."
                  />
                  <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                    {groupedItems.get(null)!.map((item) => (
                      <RadarItemCard
                        key={item.id}
                        item={item}
                        suggestedMatch={triageSuggestions.get(item.id)?.bestMatch ?? null}
                        onMatchToWork={handleMatchToWork}
                        onCreateNew={handleCreateNew}
                        onKeepTemporary={handleKeepTemporary}
                        onDiscard={handleDiscard}
                        onOpenUrl={handleOpenUrl}
                        onOpenWork={onNavigateWork}
                        selected={selectedIds.has(item.id)}
                        onToggleSelect={toggleSelection}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Matched items grouped by work */}
              {Array.from(groupedItems.entries())
                .filter(([workId]) => workId !== null)
                .map(([workId, workItems]) => {
                  const firstItem = workItems[0];
                  if (!firstItem) return null;
                  return (
                    <section key={workId}>
                      <SectionHeader
                        title={firstItem.matchedWorkTitle || "Unknown Work"}
                        count={workItems.length}
                        description={`${workItems.length} captured item${workItems.length > 1 ? "s" : ""} linked to this work.`}
                      />
                      <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                        {workItems.map((item) => (
                          <RadarItemCard
                            key={item.id}
                            item={item}
                            suggestedMatch={triageSuggestions.get(item.id)?.bestMatch ?? null}
                            onMatchToWork={handleMatchToWork}
                            onCreateNew={handleCreateNew}
                            onKeepTemporary={handleKeepTemporary}
                            onDiscard={handleDiscard}
                            onOpenUrl={handleOpenUrl}
                            onOpenWork={onNavigateWork}
                            selected={selectedIds.has(item.id)}
                            onToggleSelect={toggleSelection}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
            </div>
          ) : (
            /* Flat List View */
            <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
              {filteredItems.map((item) => (
                <RadarItemCard
                  key={item.id}
                  item={item}
                  suggestedMatch={triageSuggestions.get(item.id)?.bestMatch ?? null}
                  onMatchToWork={handleMatchToWork}
                  onCreateNew={handleCreateNew}
                  onKeepTemporary={handleKeepTemporary}
                  onDiscard={handleDiscard}
                  onOpenUrl={handleOpenUrl}
                  onOpenWork={onNavigateWork}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={toggleSelection}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match capture to a work</DialogTitle>
            <DialogDescription>
              Select the existing library work this captured page belongs to.
            </DialogDescription>
          </DialogHeader>
          {availableWorks.length === 0 ? (
            <p className="text-gm-sm text-[var(--gm-text-muted)]">
              There are no eligible works in your library yet.
            </p>
          ) : (
            <Select value={selectedWorkId} onValueChange={setSelectedWorkId}>
              <SelectTrigger aria-label="Choose a work">
                <SelectValue placeholder="Choose a work" />
              </SelectTrigger>
              <SelectContent>
                {availableWorks.map(({ work }) => (
                  <SelectItem key={work.id} value={work.id}>
                    {work.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMatch} disabled={availableWorks.length === 0}>
              Match capture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateWorkModal
        open={creatingCaptureId !== null}
        onOpenChange={(open) => {
          if (!open) setCreatingCaptureId(null);
        }}
        initialTitle={items.find((item) => item.id === creatingCaptureId)?.title ?? ""}
        initialSourceUrl={items.find((item) => item.id === creatingCaptureId)?.url ?? ""}
        onWorkCreated={handleWorkCreated}
      />
    </PageContainer>
  );
}
