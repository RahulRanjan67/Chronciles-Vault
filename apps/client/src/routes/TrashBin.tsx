import * as React from 'react';
import {
  Trash2,
  RotateCcw,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  FileText,
  ListFilter,
  CheckCircle2,
} from 'lucide-react';
import {
  Button,
  Cover,
  EmptyState,
  PageContainer,
  relativeTime,
  toast,
} from '@grimoire/ui';
import { WorkId, MemoryId } from '@grimoire/shared';
import {
  useTrashStore,
  TrashFilter,
  clientRepository,
  useLibraryStore,
} from '@grimoire/state';

export interface TrashBinProps {
  onNavigateWork?: (workId: string) => void;
}

function calculateDaysRemaining(deletedAt: string | null | undefined, retentionDays = 30): number {
  if (!deletedAt) return retentionDays;
  const deletedTime = new Date(deletedAt).getTime();
  const expiresAt = deletedTime + retentionDays * 24 * 60 * 60 * 1000;
  const diffMs = expiresAt - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function TrashBin({ onNavigateWork }: TrashBinProps) {
  const {
    deletedWorks,
    deletedMemories,
    deletedLists,
    totalTrashCount,
    activeFilter,
    setActiveFilter,
    refreshTrash,
    restoreWork,
    purgeWork,
    restoreMemory,
    purgeMemory,
    restoreList,
    purgeList,
    emptyAllTrash,
    autoPurgeExpired,
  } = useTrashStore();

  const [confirmEmptyOpen, setConfirmEmptyOpen] = React.useState(false);
  const [purgeTarget, setPurgeTarget] = React.useState<{
    type: 'work' | 'memory' | 'list';
    id: string;
    title: string;
  } | null>(null);

  React.useEffect(() => {
    refreshTrash();
  }, [refreshTrash]);

  const handleRestoreWork = (workId: string, title: string) => {
    try {
      restoreWork(workId as WorkId);
      toast({
        title: 'Work Restored',
        description: `"${title}" has been returned to your active library.`,
      });
    } catch {
      toast({
        title: 'Restoration Failed',
        description: 'Unable to restore work from trash.',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreMemory = (memoryId: string, title?: string | null) => {
    try {
      restoreMemory(memoryId as MemoryId);
      toast({
        title: 'Memory Restored',
        description: `Memory "${title || 'Untitled'}" restored to its chronicle.`,
      });
    } catch {
      toast({
        title: 'Restoration Failed',
        description: 'Unable to restore memory.',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreList = (listId: string, title: string) => {
    try {
      restoreList(listId);
      toast({
        title: 'List Restored',
        description: `Curated list "${title}" has been restored.`,
      });
    } catch {
      toast({
        title: 'Restoration Failed',
        description: 'Unable to restore list.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmPurge = () => {
    if (!purgeTarget) return;
    try {
      if (purgeTarget.type === 'work') {
        purgeWork(purgeTarget.id as WorkId);
      } else if (purgeTarget.type === 'memory') {
        purgeMemory(purgeTarget.id as MemoryId);
      } else if (purgeTarget.type === 'list') {
        purgeList(purgeTarget.id);
      }
      toast({
        title: 'Permanently Erased',
        description: `"${purgeTarget.title}" has been permanently erased.`,
      });
    } catch {
      toast({
        title: 'Purge Failed',
        description: 'Could not permanently erase item.',
        variant: 'destructive',
      });
    } finally {
      setPurgeTarget(null);
    }
  };

  const handleEmptyAll = () => {
    try {
      emptyAllTrash();
      toast({
        title: 'Trash Bin Cleared',
        description: 'All banished works, memories, and lists permanently deleted.',
      });
    } catch {
      toast({
        title: 'Failed to empty trash',
        description: 'An error occurred while purging items.',
        variant: 'destructive',
      });
    } finally {
      setConfirmEmptyOpen(false);
    }
  };

  const handleAutoPurge = () => {
    try {
      autoPurgeExpired(30);
      toast({
        title: 'Maintenance Complete',
        description: 'All items deleted over 30 days ago have been cleared.',
      });
    } catch {
      toast({
        title: 'Auto-purge failed',
        description: 'Failed to purge expired records.',
        variant: 'destructive',
      });
    }
  };

  const worksCount = deletedWorks.length;
  const memoriesCount = deletedMemories.length;
  const listsCount = deletedLists.length;

  return (
    <PageContainer className="py-8 max-w-6xl mx-auto space-y-8 px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Safe Recovery Sanctum</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--gm-text)] flex items-center gap-3">
              Trash Bin
              <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-[var(--gm-surface-raised)] text-[var(--gm-text-muted)] border border-[var(--gm-border)]">
                {totalTrashCount} {totalTrashCount === 1 ? 'item' : 'items'}
              </span>
            </h1>
            <p className="text-sm text-[var(--gm-text-muted)] max-w-2xl leading-relaxed">
              Items banished to the Trash Bin are held safely for 30 days before permanent erasure.
              Accidental deletions can be restored with all notes, progress, and metadata intact.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoPurge}
              className="text-xs h-9 border-[var(--gm-border)] hover:bg-[var(--gm-surface-hover)]"
              title="Purge items banished over 30 days ago"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5 text-[var(--gm-accent)]" />
              Purge Expired (&gt;30d)
            </Button>
            {totalTrashCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmEmptyOpen(true)}
                className="text-xs h-9 bg-rose-600/90 hover:bg-rose-700 text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Empty Bin
              </Button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-[var(--gm-border)] overflow-x-auto">
          {(
            [
              { key: 'all', label: 'All Items', count: totalTrashCount },
              { key: 'works', label: 'Works', count: worksCount },
              { key: 'memories', label: 'Memories & Notes', count: memoriesCount },
              { key: 'lists', label: 'Curated Lists', count: listsCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as TrashFilter)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeFilter === tab.key
                  ? 'bg-[var(--gm-accent)] text-[var(--gm-accent-fg)] shadow-sm'
                  : 'bg-[var(--gm-surface-raised)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeFilter === tab.key
                    ? 'bg-black/20 text-white'
                    : 'bg-[var(--gm-surface)] text-[var(--gm-text-muted)]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {totalTrashCount === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-surface)]/50 backdrop-blur-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-[var(--gm-text)]">
              Trash Bin is Pristine
            </h3>
            <p className="text-sm text-[var(--gm-text-muted)] max-w-md mx-auto">
              No banished works, memories, or curated lists are currently awaiting recovery.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section: Works */}
          {(activeFilter === 'all' || activeFilter === 'works') && worksCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--gm-text-muted)] px-1 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[var(--gm-accent)]" />
                  Deleted Works ({worksCount})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deletedWorks.map((item) => {
                  const daysLeft = calculateDaysRemaining(item.work.deletedAt);
                  return (
                    <div
                      key={item.work.id}
                      className="group relative rounded-xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 flex flex-col justify-between hover:border-[var(--gm-accent)]/50 transition-all shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-22 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--gm-surface-raised)] border border-[var(--gm-border)]">
                          <Cover
                            src={item.work.coverRef ?? null}
                            title={item.work.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <h4 className="text-sm font-semibold text-[var(--gm-text)] truncate">
                            {item.work.title}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--gm-text-muted)]">
                            <span className="px-1.5 py-0.5 rounded bg-[var(--gm-surface-raised)] uppercase text-[10px] tracking-wider">
                              {item.work.contentType}
                            </span>
                            <span>•</span>
                            <span title={item.work.deletedAt || ''}>
                              Deleted {item.work.deletedAt ? relativeTime(item.work.deletedAt) : 'recently'}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-amber-500/90 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{daysLeft} days remaining before purge</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--gm-border)]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPurgeTarget({
                              type: 'work',
                              id: item.work.id,
                              title: item.work.title,
                            })
                          }
                          className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete Forever
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreWork(item.work.id, item.work.title)}
                          className="h-8 text-xs border-[var(--gm-border)] hover:bg-[var(--gm-surface-hover)] text-emerald-400 hover:text-emerald-300"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Memories & Notes */}
          {(activeFilter === 'all' || activeFilter === 'memories') && memoriesCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--gm-text-muted)] px-1 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[var(--gm-accent)]" />
                  Deleted Memories &amp; Notes ({memoriesCount})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deletedMemories.map((entry) => {
                  const daysLeft = calculateDaysRemaining(entry.memory.deletedAt);
                  return (
                    <div
                      key={entry.memory.id}
                      className="rounded-xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 flex flex-col justify-between space-y-3 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--gm-surface-raised)] text-[var(--gm-accent)] truncate max-w-[200px]">
                            {entry.workTitle}
                          </span>
                          <span className="text-[11px] text-[var(--gm-text-muted)]">
                            {entry.memory.deletedAt ? relativeTime(entry.memory.deletedAt) : 'recently'}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-[var(--gm-text)]">
                          {entry.memory.title || 'Untitled Memory'}
                        </h4>
                        {entry.memory.body && (
                          <p className="text-xs text-[var(--gm-text-muted)] line-clamp-2 italic">
                            "{entry.memory.body}"
                          </p>
                        )}
                        <div className="text-[11px] font-medium text-amber-500/90 flex items-center gap-1 pt-1">
                          <Clock className="w-3 h-3" />
                          <span>{daysLeft} days remaining before purge</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--gm-border)]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPurgeTarget({
                              type: 'memory',
                              id: entry.memory.id,
                              title: entry.memory.title || 'Untitled Memory',
                            })
                          }
                          className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete Forever
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreMemory(entry.memory.id, entry.memory.title)}
                          className="h-8 text-xs border-[var(--gm-border)] hover:bg-[var(--gm-surface-hover)] text-emerald-400 hover:text-emerald-300"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Curated Lists */}
          {(activeFilter === 'all' || activeFilter === 'lists') && listsCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--gm-text-muted)] px-1 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ListFilter className="w-4 h-4 text-[var(--gm-accent)]" />
                  Deleted Curated Lists ({listsCount})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deletedLists.map((list) => {
                  const daysLeft = calculateDaysRemaining(list.deletedAt);
                  return (
                    <div
                      key={list.id}
                      className="rounded-xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 flex flex-col justify-between space-y-3 shadow-sm"
                    >
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-[var(--gm-text)] truncate">
                          {list.title}
                        </h4>
                        {list.description && (
                          <p className="text-xs text-[var(--gm-text-muted)] line-clamp-2">
                            {list.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-[var(--gm-text-muted)]">
                          <span>{list.items.length} works</span>
                          <span>•</span>
                          <span>
                            Deleted {list.deletedAt ? relativeTime(list.deletedAt) : 'recently'}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-amber-500/90 flex items-center gap-1 pt-1">
                          <Clock className="w-3 h-3" />
                          <span>{daysLeft} days remaining</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--gm-border)]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPurgeTarget({
                              type: 'list',
                              id: list.id,
                              title: list.title,
                            })
                          }
                          className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete Forever
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreList(list.id, list.title)}
                          className="h-8 text-xs border-[var(--gm-border)] hover:bg-[var(--gm-surface-hover)] text-emerald-400 hover:text-emerald-300"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal: Single Item Permanent Purge */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--gm-text)]">
                  Permanently Erase Item?
                </h3>
                <p className="text-xs text-[var(--gm-text-muted)]">
                  This action is irreversible.
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--gm-text-muted)] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-[var(--gm-text)]">
                "{purgeTarget.title}"
              </span>
              ? All reading bookmarks, associated memories, and metadata will be permanently eradicated.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPurgeTarget(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmPurge}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Empty All Trash */}
      {confirmEmptyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[var(--gm-bg-elevated)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--gm-text)]">
                  Empty Entire Trash Bin?
                </h3>
                <p className="text-xs text-[var(--gm-text-muted)]">
                  Irreversible operation across all items
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--gm-text-muted)] leading-relaxed">
              You are about to permanently purge{' '}
              <span className="font-semibold text-rose-400">
                {totalTrashCount} item(s)
              </span>{' '}
              from your recovery sanctum. None of these works, memories, or curated lists will be recoverable after this step.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmEmptyOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmptyAll}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Yes, Empty All Trash
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
export default TrashBin;
