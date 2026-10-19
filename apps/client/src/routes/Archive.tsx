import * as React from 'react';
import {
  Archive as ArchiveIcon,
  RotateCcw,
  BookOpen,
  Calendar,
  ExternalLink,
  Filter,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Cover,
  EmptyState,
  PageContainer,
  relativeTime,
  toast,
} from '@grimoire/ui';
import {
  ArchiveReason,
  ArchiveRecord,
  formatProgressAnchor,
  ReadingRelationship,
  Work,
} from '@grimoire/domain';
import { WorkId } from '@grimoire/shared';
import { clientRepository, useLibraryStore } from '@grimoire/state';

export interface ArchiveProps {
  onNavigateWork?: (workId: string) => void;
}

interface ArchivedEntry {
  work: Work;
  record?: ArchiveRecord;
  relationship?: ReadingRelationship;
}

function getReasonBadge(reason?: ArchiveReason) {
  switch (reason) {
    case ArchiveReason.Completed:
      return {
        label: 'Completed',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case ArchiveReason.Dropped:
      return {
        label: 'Dropped',
        className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      };
    case ArchiveReason.Abandoned:
      return {
        label: 'Abandoned',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };
    case ArchiveReason.LostInterest:
      return {
        label: 'Lost Interest',
        className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      };
    case ArchiveReason.WaitingIndefinitely:
      return {
        label: 'Waiting Indefinitely',
        className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      };
    case ArchiveReason.SourceUnavailable:
      return {
        label: 'Source Dead',
        className: 'bg-red-500/15 text-red-400 border-red-500/30',
      };
    case ArchiveReason.Duplicate:
      return {
        label: 'Duplicate Merged',
        className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      };
    default:
      return {
        label: 'Archived',
        className: 'bg-[var(--gm-surface)] text-[var(--gm-text-muted)] border-[var(--gm-border)]',
      };
  }
}

export function Archive({ onNavigateWork }: ArchiveProps) {
  const [archivedWorks, setArchivedWorks] = React.useState<ArchivedEntry[]>([]);
  const [selectedFilter, setSelectedFilter] = React.useState<string>('all');

  const refreshList = React.useCallback(() => {
    const list = clientRepository.getArchivedWorks();
    setArchivedWorks(list);
  }, []);

  React.useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleRestore = (workId: string, title: string) => {
    try {
      clientRepository.restoreWork(workId as WorkId);
      useLibraryStore.getState().refresh();
      toast({
        title: 'Work restored',
        description: `"${title}" is active again in your library.`,
      });
      refreshList();
    } catch (err) {
      toast({
        title: 'Restore failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handlePurge = (workId: string, title: string) => {
    if (typeof window !== "undefined" && !window.confirm(`Permanently purge "${title}" from the archive? All records and memories for this work will be erased.`)) return;
    try {
      clientRepository.purgeWork(workId as WorkId);
      useLibraryStore.getState().refresh();
      toast({
        title: 'Work purged',
        description: `"${title}" was permanently removed.`,
      });
      refreshList();
    } catch (err) {
      toast({
        title: 'Purge failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleFlushArchive = () => {
    if (archivedWorks.length === 0) return;
    if (typeof window !== "undefined" && !window.confirm(`Flush entire archive (${archivedWorks.length} works)? All archived works and memories will be permanently purged from database.`)) return;
    try {
      for (const entry of archivedWorks) {
        clientRepository.purgeWork(entry.work.id as WorkId);
      }
      useLibraryStore.getState().refresh();
      toast({
        title: 'Archive flushed',
        description: `Permanently removed ${archivedWorks.length} archived works.`,
      });
      refreshList();
    } catch (err) {
      toast({
        title: 'Flush failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const filtered = React.useMemo(() => {
    if (selectedFilter === 'all') return archivedWorks;
    return archivedWorks.filter((item) => item.record?.reason === selectedFilter);
  }, [archivedWorks, selectedFilter]);

  return (
    <PageContainer maxWidth="wide">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ArchiveIcon className="h-6 w-6 text-[var(--gm-accent-strong)]" />
            <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)]">
              Archive
            </h1>
            <span className="rounded-gm-full bg-[var(--gm-surface)] px-2.5 py-0.5 font-mono text-gm-xs text-[var(--gm-text-muted)] border border-[var(--gm-border)]">
              {archivedWorks.length}
            </span>
          </div>
          <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)]">
            Completed journeys and retired series preserved out of your active daily view.
          </p>
        </div>

        {/* Filter by reason + Flush Archive */}
        {archivedWorks.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-[var(--gm-text-subtle)]" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-1.5 text-gm-xs text-[var(--gm-text)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent)]"
            >
              <option value="all">All Archive Reasons</option>
              <option value={ArchiveReason.Completed}>Completed</option>
              <option value={ArchiveReason.Dropped}>Dropped</option>
              <option value={ArchiveReason.Abandoned}>Abandoned</option>
              <option value={ArchiveReason.LostInterest}>Lost Interest</option>
              <option value={ArchiveReason.WaitingIndefinitely}>Waiting Indefinitely</option>
              <option value={ArchiveReason.SourceUnavailable}>Source Dead</option>
              <option value={ArchiveReason.Duplicate}>Duplicate Merged</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFlushArchive}
              className="gap-1.5 text-gm-xs text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)] border-[var(--gm-danger)]/40"
            >
              <Trash2 className="h-4 w-4" />
              <span>Flush Archive ({archivedWorks.length})</span>
            </Button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="custom"
          icon={ArchiveIcon}
          title={archivedWorks.length === 0 ? "No archives yet" : "No matching archived works"}
          description={
            archivedWorks.length === 0
              ? "No archives yet. Start by archiving a completed work."
              : "No archived works match the selected reason filter."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(({ work, record, relationship }) => {
            const badge = getReasonBadge(record?.reason);
            const anchor = record?.previousProgress ?? relationship?.currentAnchor ?? null;

            return (
              <div
                key={work.id}
                className="group rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 flex flex-col justify-between hover:border-[var(--gm-border-strong)] transition-all shadow-sm"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center rounded-gm-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase font-mono ${badge.className}`}
                    >
                      {badge.label}
                    </span>

                    {record?.archivedAt && (
                      <span className="flex items-center gap-1 text-[11px] text-[var(--gm-text-subtle)] font-mono">
                        <Calendar className="h-3 w-3" />
                        <span>{relativeTime(record.archivedAt)}</span>
                      </span>
                    )}
                  </div>

                  {/* Work Info */}
                  <div className="flex gap-3.5 items-start">
                    <Cover
                      title={work.title}
                      src={work.coverRef ?? null}
                      size="sm"
                      className="w-16 h-22 rounded-cv shadow shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3
                        onClick={() => onNavigateWork?.(work.id)}
                        className="font-bold text-gm-sm text-[var(--gm-text)] hover:text-[var(--gm-accent-strong)] cursor-pointer truncate transition-colors"
                      >
                        {work.title}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--gm-text-muted)]">
                        <span className="rounded-gm-sm bg-[var(--gm-surface)] px-1.5 py-0.2 border border-[var(--gm-border)] font-mono text-[10px]">
                          {work.contentType}
                        </span>
                        <span>·</span>
                        <span>{work.origin}</span>
                      </div>

                      {anchor && (
                        <div className="mt-2 flex items-center gap-1.5 text-gm-xs text-[var(--gm-accent-strong)] font-mono font-medium">
                          <BookOpen className="h-3 w-3" />
                          <span>Snapshot: {formatProgressAnchor(anchor)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Why Stopped Note */}
                  {record?.note && (
                    <div className="mt-3 pt-2.5 border-t border-[var(--gm-border)]">
                      <p className="text-gm-xs text-[var(--gm-text-muted)] italic leading-relaxed">
                        "{record.note}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-[var(--gm-border)] flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateWork?.(work.id)}
                    className="gap-1.5 text-gm-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View Record</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(work.id, work.title)}
                      className="gap-1.5 text-gm-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePurge(work.id, work.title)}
                      className="gap-1.5 text-gm-xs text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Purge</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
