import * as React from 'react';
import {
  Archive as ArchiveIcon,
  RotateCcw,
  BookOpen,
  Calendar,
  ExternalLink,
  Filter,
} from 'lucide-react';
import {
  Button,
  Cover,
  EmptyState,
  PageContainer,
  relativeTime,
  toast,
} from '@chronicles-vault/ui';
import {
  ArchiveReason,
  ArchiveRecord,
  formatProgressAnchor,
  ReadingRelationship,
  Work,
} from '@chronicles-vault/domain';
import { WorkId } from '@chronicles-vault/shared';
import { clientRepository, useLibraryStore } from '@chronicles-vault/state';

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
        className: 'bg-[var(--cv-surface)] text-[var(--cv-text-muted)] border-[var(--cv-border)]',
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
            <ArchiveIcon className="h-6 w-6 text-[var(--cv-accent-strong)]" />
            <h1 className="text-cv-2xl sm:text-cv-3xl font-extrabold tracking-tight text-[var(--cv-text)]">
              Archive
            </h1>
            <span className="rounded-cv-full bg-[var(--cv-surface)] px-2.5 py-0.5 font-mono text-cv-xs text-[var(--cv-text-muted)] border border-[var(--cv-border)]">
              {archivedWorks.length}
            </span>
          </div>
          <p className="mt-1 text-cv-sm text-[var(--cv-text-muted)]">
            Completed journeys and retired series preserved out of your active daily view.
          </p>
        </div>

        {/* Filter by reason */}
        {archivedWorks.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--cv-text-subtle)]" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1.5 text-cv-xs text-[var(--cv-text)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent)]"
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
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="custom"
          icon={ArchiveIcon}
          title={archivedWorks.length === 0 ? "Archive is empty" : "No matching archived works"}
          description={
            archivedWorks.length === 0
              ? "Works marked as completed, dropped, or archived will be safely preserved here."
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
                className="group rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4 flex flex-col justify-between hover:border-[var(--cv-border-strong)] transition-all shadow-sm"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center rounded-cv-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase font-mono ${badge.className}`}
                    >
                      {badge.label}
                    </span>

                    {record?.archivedAt && (
                      <span className="flex items-center gap-1 text-[11px] text-[var(--cv-text-subtle)] font-mono">
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
                        className="font-bold text-cv-sm text-[var(--cv-text)] hover:text-[var(--cv-accent-strong)] cursor-pointer truncate transition-colors"
                      >
                        {work.title}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--cv-text-muted)]">
                        <span className="rounded-cv-sm bg-[var(--cv-surface)] px-1.5 py-0.2 border border-[var(--cv-border)] font-mono text-[10px]">
                          {work.contentType}
                        </span>
                        <span>·</span>
                        <span>{work.origin}</span>
                      </div>

                      {anchor && (
                        <div className="mt-2 flex items-center gap-1.5 text-cv-xs text-[var(--cv-accent-strong)] font-mono font-medium">
                          <BookOpen className="h-3 w-3" />
                          <span>Snapshot: {formatProgressAnchor(anchor)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Why Stopped Note */}
                  {record?.note && (
                    <div className="mt-3 pt-2.5 border-t border-[var(--cv-border)]">
                      <p className="text-cv-xs text-[var(--cv-text-muted)] italic leading-relaxed">
                        "{record.note}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-[var(--cv-border)] flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateWork?.(work.id)}
                    className="gap-1.5 text-cv-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View Record</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(work.id, work.title)}
                    className="gap-1.5 text-cv-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore to Library</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
