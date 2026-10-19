import * as React from 'react';
import {
  Archive as ArchiveIcon,
  BookPlus,
  CheckSquare,
  ListPlus,
  Lock,
  Shield,
  Square,
  Star,
  Tag,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { Badge, Button, Input, PageContainer, toast } from '@grimoire/ui';
import {
  clientRepository,
  useLibraryStore,
  useListsStore,
  selectFilteredWorks,
  LibraryViewMode,
} from '@grimoire/state';
import {
  IndexedDbVaultRepository,
  createVaultKey,
  useVaultStore,
  vaultSession,
} from '@grimoire/vault';
import {
  ArchiveReason,
  PersonalState,
  PrivacyState,
  formatProgressAnchor,
  type ShelfPriorityTier,
} from '@grimoire/domain';
import type { WorkId } from '@grimoire/shared';
import {
  LibraryFilterState,
  LibraryFilters,
} from '../components/features/Library/LibraryFilters';
import { VirtualWorkGrid, WorkItemData } from '../components/features/Library/VirtualWorkGrid';
import { CreateWorkModal } from '../components/features/Library/CreateWorkModal';
import { ResumeReadingModal } from '../components/features/Reader/ResumeReadingModal';
import { consumeCreateWorkRequest, subscribeCreateWorkRequest } from '../utils/palette-requests';
import { toUIHealth, toUIAnchor } from '../utils/display-adapters';
import { openLocalDiskPath } from '../utils/local-media';

export interface LibraryProps {
  onNavigateWork?: (id: string) => void;
}

/** Map a HydratedWorkItem to the display-layer WorkItemData shape */
function toWorkItemData(item: ReturnType<typeof selectFilteredWorks>[number]): WorkItemData {
  const anchor = item.relationship?.currentAnchor ?? null;
  const uiAnchor = toUIAnchor(anchor);
  const updates = item.updates;
  const latestUpdateIndex =
    updates.length > 0 ? Math.max(...updates.map((u) => u.numericIndex ?? 0)) : null;
  const rawIndex =
    anchor && 'chapterNumber' in anchor
      ? (anchor as { chapterNumber?: number }).chapterNumber
      : anchor && 'chapter' in anchor
      ? (anchor as { chapter?: number }).chapter
      : null;
  const currentIndex = typeof rawIndex === 'number' ? rawIndex : null;
  const newMaterialCount =
    latestUpdateIndex !== null && currentIndex !== null && latestUpdateIndex > currentIndex
      ? latestUpdateIndex - currentIndex
      : 0;

  const preferredPath = item.accessPaths.find((p) => p.isPreferred) ?? item.accessPaths[0];
  const isVaultWork = item.work.privacyState === PrivacyState.Vault;

  return {
    id: item.work.id,
    title: isVaultWork ? `🔓 [VAULT] ${item.work.title}` : item.work.title,
    coverSrc: item.work.coverRef ?? null,
    contentType: item.work.contentType,
    personalState: item.relationship?.personalState ?? 'planned',
    progressAnchor: uiAnchor,
    newMaterialCount: newMaterialCount > 0 ? newMaterialCount : 0,
    sourceHealth: preferredPath ? toUIHealth(preferredPath.health) : 'unknown',
    updatedAt: item.relationship?.lastActiveAt ?? item.work.updatedAt,
    genres: item.work.genres,
  };
}

export function Library({ onNavigateWork }: LibraryProps) {
  const storeState = useLibraryStore();
  const myLists = useListsStore((state) => state.myLists);
  const addWorkToList = useListsStore((state) => state.addWorkToList);
  const isVaultUnlocked = useVaultStore((state) => state.status === 'unlocked');
  const filteredItems = selectFilteredWorks(storeState, { includeVaultWorks: isVaultUnlocked });
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [resumeTarget, setResumeTarget] = React.useState<ReturnType<typeof selectFilteredWorks>[number] | null>(null);

  /* Bulk Operations State */
  const [bulkMode, setBulkMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkTagInput, setBulkTagInput] = React.useState('');

  /* Opens the create-work modal when the command palette requests it,
     including requests made before this route mounted. */
  React.useEffect(() => {
    storeState.refresh();
    if (consumeCreateWorkRequest()) setCreateModalOpen(true);
    return subscribeCreateWorkRequest(() => {
      if (consumeCreateWorkRequest()) setCreateModalOpen(true);
    });
  }, []);

  /* Bridge between LibraryFilterState (used by LibraryFilters component)
     and the Zustand store's richer filter state */
  const [localFilters, setLocalFilters] = React.useState<LibraryFilterState>({
    search: '',
    contentType: 'all',
    status: 'all',
    sortBy: 'lastRead',
    viewMode: 'grid',
  });

  /* Sync local filter changes into the Zustand store */
  React.useEffect(() => {
    storeState.setSearchQuery(localFilters.search);
  }, [localFilters.search]);

  React.useEffect(() => {
    storeState.setContentType(
      localFilters.contentType as Parameters<typeof storeState.setContentType>[0],
    );
  }, [localFilters.contentType]);

  React.useEffect(() => {
    storeState.setPersonalState(
      localFilters.status as Parameters<typeof storeState.setPersonalState>[0],
    );
  }, [localFilters.status]);

  React.useEffect(() => {
    if (localFilters.sortBy === 'titleAsc') {
      storeState.setSortBy('title');
      storeState.setSortOrder('asc');
    } else if (localFilters.sortBy === 'titleDesc') {
      storeState.setSortBy('title');
      storeState.setSortOrder('desc');
    } else if (localFilters.sortBy === 'updatedAt') {
      storeState.setSortBy('updatedAt');
      storeState.setSortOrder('desc');
    } else if (localFilters.sortBy === 'progress') {
      storeState.setSortBy('progress');
      storeState.setSortOrder('desc');
    } else {
      storeState.setSortBy('lastActive');
      storeState.setSortOrder('desc');
    }
  }, [localFilters.sortBy]);

  React.useEffect(() => {
    storeState.setViewMode(localFilters.viewMode as LibraryViewMode);
  }, [localFilters.viewMode]);

  const workItemData = React.useMemo(() => filteredItems.map(toWorkItemData), [filteredItems]);
  const totalCount = storeState.items.filter((i) => !i.work.deletedAt).length;

  const toggleSelectWork = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleWorkClick = (id: string) => {
    if (bulkMode) {
      toggleSelectWork(id);
      return;
    }
    onNavigateWork?.(id);
  };

  const handleContinue = (id: string) => {
    const item = filteredItems.find((i) => i.work.id === id);
    if (!item) {
      onNavigateWork?.(id);
      return;
    }

    const paths = item.accessPaths ?? [];
    const openableWeb = paths.filter((p) => (p.kind === 'web' || p.kind === 'feed') && 'url' in p && Boolean(p.url));
    const openableLocal = paths.filter(
      (p) =>
        p.kind === 'local_file' &&
        (('fileId' in p && Boolean(p.fileId)) || ('filePath' in p && Boolean(p.filePath))),
    );
    const totalOpenable = [...openableWeb, ...openableLocal];

    /* If there is ONLY ONE openable link: directly open in new tab or launch local video */
    if (totalOpenable.length === 1) {
      const only = totalOpenable[0]!;
      if ('url' in only && only.url) {
        window.open(only.url as string, '_blank', 'noopener,noreferrer');
        toast({
          title: 'Opening Reading Link',
          description: `Opening ${only.label ?? 'source'} in a new tab.`,
          variant: 'success',
        });
        return;
      }
      if (only.kind === 'local_file' && 'filePath' in only && only.filePath) {
        void openLocalDiskPath(only.filePath as string, only.label ?? 'local video');
        return;
      }
    }

    /* If multiple access links: pop up centered window */
    setResumeTarget(item);
  };

  const handleBulkStatus = (state: PersonalState) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      clientRepository.updatePersonalState(id as WorkId, state);
    }
    storeState.refresh();
    toast({
      title: 'Bulk status updated',
      description: `Updated ${selectedIds.length} work(s) to ${state}.`,
    });
  };

  const handleBulkShelfTier = (tier: ShelfPriorityTier) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      clientRepository.updateRelationship(id as WorkId, { shelfTier: tier });
    }
    storeState.refresh();
    toast({
      title: 'Bulk shelf tier updated',
      description: `Set ${selectedIds.length} work(s) to ${tier.replace('_', ' ')}.`,
    });
  };

  const handleBulkTag = () => {
    const clean = bulkTagInput.trim().replace(/^#/, '');
    if (!clean || selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const existing = clientRepository.getItem(id as WorkId);
      if (!existing) continue;
      const merged = Array.from(new Set([...existing.work.tags, clean]));
      clientRepository.updateWork(id as WorkId, { tags: merged });
    }
    storeState.refresh();
    setBulkTagInput('');
    toast({
      title: 'Tag applied',
      description: `Added #${clean} to ${selectedIds.length} work(s).`,
    });
  };

  const handleBulkAddToList = (listId: string) => {
    if (!listId || selectedIds.length === 0) return;
    for (const id of selectedIds) {
      addWorkToList(listId, id as WorkId);
    }
    const targetList = myLists.find((l) => l.id === listId);
    toast({
      title: 'Added to list',
      description: `Added ${selectedIds.length} work(s) to "${targetList?.title ?? 'list'}".`,
    });
  };

  const handleBulkPrivacy = (privacyState: PrivacyState) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      clientRepository.updateWork(id as WorkId, { privacyState });
    }
    storeState.refresh();
    toast({
      title: 'Privacy updated',
      description: `Marked ${selectedIds.length} work(s) as ${privacyState}.`,
    });
  };

  const handleBulkArchive = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    for (const id of selectedIds) {
      clientRepository.archiveWork(id as WorkId, ArchiveReason.Abandoned, 'Bulk archived from Library');
    }
    storeState.refresh();
    setSelectedIds([]);
    toast({
      title: 'Works archived',
      description: `Moved ${count} work(s) to Archive.`,
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (typeof window !== "undefined" && !window.confirm(`Move ${count} selected work(s) to Trash Bin?`)) return;
    for (const id of selectedIds) {
      clientRepository.deleteWork(id as WorkId);
    }
    storeState.refresh();
    setSelectedIds([]);
    toast({
      title: 'Moved to Trash Bin',
      description: `Moved ${count} work(s) to Trash Bin. Recoverable for 30 days.`,
    });
  };

  const handleBulkPurge = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (typeof window !== "undefined" && !window.confirm(`Permanently purge ${count} selected work(s) and all linked memories? This action cannot be reversed.`)) return;
    for (const id of selectedIds) {
      clientRepository.purgeWork(id as WorkId);
    }
    storeState.refresh();
    setSelectedIds([]);
    toast({
      title: 'Works permanently purged',
      description: `Erased ${count} work(s) from database.`,
      variant: 'destructive',
    });
  };

  return (
    <PageContainer maxWidth="wide">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)]">
            Library
          </h1>
          <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)]">Your personal collection across every medium.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button
            variant={bulkMode ? 'secondary' : 'outline'}
            onClick={() => {
              setBulkMode((prev) => !prev);
              setSelectedIds([]);
            }}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            <span>{bulkMode ? 'Exit Select' : 'Select Works'}</span>
          </Button>
          <Button
            variant="default"
            onClick={() => setCreateModalOpen(true)}
            className="gap-2"
          >
            <BookPlus className="h-4 w-4" />
            <span>Add Work</span>
          </Button>
        </div>
      </div>

      {/* Bulk Operations Bar */}
      {bulkMode && (
        <div className="mb-6 rounded-gm-xl border border-[var(--gm-accent-muted)] bg-[var(--gm-bg-elevated)] p-4 shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="font-mono">
                {selectedIds.length} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-gm-xs"
                onClick={() => setSelectedIds(filteredItems.map((i) => i.work.id))}
              >
                Select All ({filteredItems.length})
              </Button>
              {selectedIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-gm-xs"
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setBulkMode(false);
                setSelectedIds([]);
              }}
              className="text-gm-xs text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>

          {/* Selectable pill strip for quick multi-selection */}
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto py-1">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.work.id);
              return (
                <button
                  key={item.work.id}
                  type="button"
                  onClick={() => toggleSelectWork(item.work.id)}
                  className={`inline-flex items-center gap-1.5 rounded-gm-full border px-2.5 py-1 text-gm-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[var(--gm-accent-strong)] bg-[var(--gm-accent)]/20 text-[var(--gm-text)] font-medium'
                      : 'border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="h-3 w-3 text-[var(--gm-accent-strong)] shrink-0" />
                  ) : (
                    <Square className="h-3 w-3 shrink-0" />
                  )}
                  <span className="truncate max-w-[160px]">{item.work.title}</span>
                </button>
              );
            })}
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--gm-border)] text-gm-xs">
            <select
              disabled={selectedIds.length === 0}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatus(e.target.value as PersonalState);
                  e.target.value = '';
                }
              }}
              aria-label="Bulk status change"
              className="h-8 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 text-gm-xs text-[var(--gm-text)] disabled:opacity-40"
            >
              <option value="">Set Status…</option>
              <option value="reading">Reading</option>
              <option value="planned">Plan to Read</option>
              <option value="paused">Paused</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>

            <select
              disabled={selectedIds.length === 0}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkShelfTier(e.target.value as ShelfPriorityTier);
                  e.target.value = '';
                }
              }}
              aria-label="Bulk shelf tier change"
              className="h-8 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 text-gm-xs text-[var(--gm-text)] disabled:opacity-40"
            >
              <option value="">Shelf Tier…</option>
              <option value="standard">Standard</option>
              <option value="favorite">★ Favorite</option>
              <option value="highlight">✦ Highlight</option>
              <option value="priority_watch">⚡ Priority Watch</option>
            </select>

            {myLists.length > 0 && (
              <select
                disabled={selectedIds.length === 0}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAddToList(e.target.value);
                    e.target.value = '';
                  }
                }}
                aria-label="Bulk add to personal list"
                className="h-8 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 text-gm-xs text-[var(--gm-text)] disabled:opacity-40"
              >
                <option value="">Add to List…</option>
                {myLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
            )}

            <select
              disabled={selectedIds.length === 0}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkPrivacy(e.target.value as PrivacyState);
                  e.target.value = '';
                }
              }}
              aria-label="Bulk privacy change"
              className="h-8 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2 text-gm-xs text-[var(--gm-text)] disabled:opacity-40"
            >
              <option value="">Privacy…</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>

            <div className="flex items-center gap-1">
              <Input
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                placeholder="Add #tag…"
                disabled={selectedIds.length === 0}
                className="h-8 w-28 text-gm-xs"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.length === 0 || !bulkTagInput.trim()}
                onClick={handleBulkTag}
                className="h-8 gap-1 text-gm-xs"
              >
                <Tag className="h-3 w-3" />
                <span>Tag</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                variant="ghost"
                disabled={selectedIds.length === 0}
                onClick={handleBulkArchive}
                className="h-8 gap-1 text-gm-xs text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
                title="Move selected to archive"
              >
                <ArchiveIcon className="h-3.5 w-3.5" />
                <span>Archive</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={selectedIds.length === 0}
                onClick={handleBulkDelete}
                className="h-8 gap-1 text-gm-xs text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)]"
                title="Move selected to Return Desk"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={selectedIds.length === 0}
                onClick={handleBulkPurge}
                className="h-8 gap-1 text-gm-xs text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)]"
                title="Permanently remove selected works from database"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Purge</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mb-6">
        <LibraryFilters
          filters={localFilters}
          onFilterChange={setLocalFilters}
          onReset={() => {
            setLocalFilters({
              search: '',
              contentType: 'all',
              status: 'all',
              sortBy: 'lastRead',
              viewMode: localFilters.viewMode,
            });
            storeState.resetFilters();
          }}
        />
      </div>

      {/* Board View or Grid/Table/List */}
      {localFilters.viewMode === 'board' ? (
        <LibraryBoardView
          items={filteredItems}
          onWorkClick={handleWorkClick}
          onContinue={handleContinue}
        />
      ) : (
        <VirtualWorkGrid
          items={workItemData}
          viewMode={localFilters.viewMode as 'grid' | 'compact' | 'table' | 'list'}
          onWorkClick={handleWorkClick}
          onContinue={handleContinue}
          emptyStateSlot={
            totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <BookPlus className="h-12 w-12 text-[var(--gm-text-muted)]" />
                <div>
                  <p className="text-gm-lg font-semibold text-[var(--gm-text)]">
                    Your library is empty
                  </p>
                  <p className="text-gm-sm text-[var(--gm-text-muted)] mt-1">
                    Add your first work to get started.
                  </p>
                </div>
                <Button variant="default" onClick={() => setCreateModalOpen(true)}>
                  Add First Work
                </Button>
              </div>
            ) : undefined
          }
        />
      )}

      {/* Create Work Modal */}
      <CreateWorkModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onWorkCreated={(work) => {
          storeState.refresh();
          toast({
            title: 'Work added',
            description: `"${work.title}" has been added to your library.`,
          });
          onNavigateWork?.(work.id);
        }}
      />

      {/* Centered Access Links / Resume Reading Modal */}
      {resumeTarget && (
        <ResumeReadingModal
          open={Boolean(resumeTarget)}
          onOpenChange={(open) => {
            if (!open) setResumeTarget(null);
          }}
          work={resumeTarget.work}
          relationship={resumeTarget.relationship}
          accessPaths={resumeTarget.accessPaths}
          onOpenFile={(fileId) => {
            window.location.href = `/reader/${encodeURIComponent(fileId)}`;
          }}
          onNavigateShelf={() => {
            window.location.href = '/shelf';
          }}
        />
      )}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Board (Kanban) view — grouped by PersonalState
// ---------------------------------------------------------------------------

type BoardItem = ReturnType<typeof selectFilteredWorks>[number];

interface LibraryBoardViewProps {
  items: BoardItem[];
  onWorkClick?: (id: string) => void;
  onContinue?: (id: string) => void;
}

const BOARD_COLUMNS: Array<{ state: string; label: string; colorVar: string }> = [
  { state: 'reading', label: 'Reading', colorVar: 'var(--gm-accent-strong)' },
  { state: 'planned', label: 'Planned', colorVar: 'var(--gm-text-muted)' },
  { state: 'waiting', label: 'Waiting', colorVar: '#f59e0b' },
  { state: 'stalled', label: 'Stalled', colorVar: '#ef4444' },
  { state: 'completed', label: 'Completed', colorVar: '#22c55e' },
  { state: 'paused', label: 'Paused', colorVar: 'var(--gm-text-subtle)' },
];

function LibraryBoardView({ items, onWorkClick, onContinue }: LibraryBoardViewProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {BOARD_COLUMNS.map((col) => {
          const columnItems = items.filter(
            (i) => (i.relationship?.personalState ?? 'planned') === col.state,
          );
          return (
            <div key={col.state} className="w-72 flex-shrink-0 flex flex-col gap-2">
              <div
                className="flex items-center gap-2 px-1 pb-1 border-b-2"
                style={{ borderColor: col.colorVar }}
              >
                <span
                  className="text-gm-xs font-bold uppercase tracking-wider"
                  style={{ color: col.colorVar }}
                >
                  {col.label}
                </span>
                <span className="ml-auto text-gm-xs text-[var(--gm-text-muted)] font-medium bg-[var(--gm-surface)] rounded-full px-2 py-0.5">
                  {columnItems.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 min-h-24">
                {columnItems.length === 0 ? (
                  <div className="text-gm-xs text-[var(--gm-text-subtle)] px-1 py-4 text-center italic">
                    No works
                  </div>
                ) : (
                  columnItems.map((item) => (
                    <BoardCard
                      key={item.work.id}
                      item={item}
                      onWorkClick={onWorkClick}
                      onContinue={onContinue}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({
  item,
  onWorkClick,
  onContinue,
}: {
  item: BoardItem;
  onWorkClick?: (id: string) => void;
  onContinue?: (id: string) => void;
}) {
  const anchor = item.relationship?.currentAnchor;
  const progressLabel = anchor ? formatProgressAnchor(anchor) : null;
  const preferredPath = item.accessPaths.find((p) => p.isPreferred) ?? item.accessPaths[0];
  const health = preferredPath ? toUIHealth(preferredPath.health) : 'unknown';

  const healthColor =
    health === 'healthy' ? '#22c55e'
    : health === 'degraded' ? '#f59e0b'
    : health === 'unavailable' ? '#ef4444'
    : health === 'local' ? 'var(--gm-accent-strong)'
    : 'var(--gm-text-subtle)';

  return (
    <button
      type="button"
      onClick={() => onWorkClick?.(item.work.id)}
      className="w-full text-left rounded-cv bg-[var(--gm-bg-elevated)] border border-[var(--gm-border)] p-3 hover:border-[var(--gm-accent-muted)] transition-colors group cursor-pointer"
    >
      <p className="text-gm-sm font-semibold text-[var(--gm-text)] line-clamp-2 group-hover:text-[var(--gm-accent-strong)] transition-colors">
        {item.work.title}
      </p>
      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-gm-xs text-[var(--gm-text-muted)]">
          {item.work.contentType}
          {progressLabel ? ` · ${progressLabel}` : ''}
        </span>
        <span
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: healthColor }}
          title={health}
        />
      </div>
      {onContinue && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContinue(item.work.id);
          }}
          className="mt-2 w-full text-center text-gm-xs font-medium text-[var(--gm-accent-strong)] hover:underline cursor-pointer"
        >
          Continue →
        </button>
      )}
    </button>
  );
}
