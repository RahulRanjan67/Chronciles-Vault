import * as React from 'react';
import {
  GitMerge,
  ArrowRight,
  Layers,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Link as LinkIcon,
  Star,
  Search,
} from 'lucide-react';
import {
  Button,
  Cover,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SourceHealthIndicator,
  toast,
} from '@chronicles-vault/ui';
import {
  DuplicateCandidate,
  formatProgressAnchor,
  Work,
} from '@chronicles-vault/domain';
import { WorkId } from '@chronicles-vault/shared';
import {
  clientRepository,
  HydratedWorkItem,
  useWorkDetailStore,
} from '@chronicles-vault/state';
import { toUIHealth } from '../../../utils/display-adapters';

export interface MergeWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetWorkId: string;
  onMergeSuccess?: (mergedWork: Work) => void;
}

export function MergeWizardModal({
  open,
  onOpenChange,
  targetWorkId,
  onMergeSuccess,
}: MergeWizardModalProps) {
  const { findDuplicates, executeMerge } = useWorkDetailStore();

  const [targetItem, setTargetItem] = React.useState<HydratedWorkItem | null>(null);
  const [candidates, setCandidates] = React.useState<DuplicateCandidate[]>([]);
  const [selectedSecondaryId, setSelectedSecondaryId] = React.useState<string | null>(null);
  const [secondaryItem, setSecondaryItem] = React.useState<HydratedWorkItem | null>(null);
  const [progressChoice, setProgressChoice] = React.useState<'target' | 'secondary' | 'highest'>('highest');
  const [searchFilter, setSearchFilter] = React.useState('');
  const [isMerging, setIsMerging] = React.useState(false);

  // Load target work and duplicate candidates on open
  React.useEffect(() => {
    if (open && targetWorkId) {
      const item = clientRepository.getItem(targetWorkId as WorkId) ?? null;
      setTargetItem(item);
      const found = findDuplicates(targetWorkId as WorkId);
      setCandidates(found);
      if (found.length > 0 && found[0]) {
        setSelectedSecondaryId(found[0].work.id);
      } else {
        setSelectedSecondaryId(null);
      }
    }
  }, [open, targetWorkId]);

  // Load secondary work item when selected
  React.useEffect(() => {
    if (selectedSecondaryId) {
      const sec = clientRepository.getItem(selectedSecondaryId as WorkId) ?? null;
      setSecondaryItem(sec);
    } else {
      setSecondaryItem(null);
    }
  }, [selectedSecondaryId]);

  // All other available library works for manual selection
  const allOtherWorks = React.useMemo(() => {
    return clientRepository
      .getItems()
      .filter((i) => i.work.id !== targetWorkId && !i.work.deletedAt)
      .filter((i) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return (
          i.work.title.toLowerCase().includes(q) ||
          i.work.aliases.some((a) => a.toLowerCase().includes(q))
        );
      });
  }, [targetWorkId, searchFilter]);

  if (!targetItem) {
    return null;
  }

  const targetWork = targetItem.work;
  const targetAnchor = targetItem.relationship?.currentAnchor ?? null;
  const secWork = secondaryItem?.work ?? null;
  const secAnchor = secondaryItem?.relationship?.currentAnchor ?? null;

  const handleExecuteMerge = () => {
    if (!selectedSecondaryId || !targetWorkId) return;
    setIsMerging(true);
    try {
      const merged = executeMerge(targetWorkId as WorkId, selectedSecondaryId as WorkId, {
        progressChoice,
        whyMergedNote: `Merged into ${targetWork.title}`,
      });
      toast({
        title: 'Merge completed',
        description: `Successfully consolidated ${secWork?.title ?? 'secondary work'} into ${targetWork.title}.`,
      });
      if (onMergeSuccess) {
        onMergeSuccess(merged);
      }
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Merge failed',
        description: err instanceof Error ? err.message : 'Unknown merge error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[var(--cv-accent-strong)]">
            <GitMerge className="h-5 w-5" />
            <DialogTitle className="text-cv-lg font-bold">Merge Duplicates Wizard</DialogTitle>
          </div>
          <DialogDescription className="text-cv-xs text-[var(--cv-text-muted)]">
            Non-destructively consolidate duplicate fiction entries into one canonical record. All access
            paths, captured memories, and reading history are preserved.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Duplicate Candidates & Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-text-muted)] flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
              Candidate Duplicates
            </label>
            <div className="relative w-48">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--cv-text-subtle)]" />
              <input
                type="text"
                placeholder="Filter works..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-cv-xs rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent)]"
              />
            </div>
          </div>

          {candidates.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {candidates.map((c) => {
                const isSelected = selectedSecondaryId === c.work.id;
                const matchPct = Math.round(c.confidence * 100);
                return (
                  <button
                    key={c.work.id}
                    type="button"
                    onClick={() => setSelectedSecondaryId(c.work.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-cv-lg border text-cv-xs transition-all ${
                      isSelected
                        ? 'border-[var(--cv-accent)] bg-[var(--cv-accent)]/15 text-[var(--cv-text)] ring-1 ring-[var(--cv-accent)] font-medium'
                        : 'border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] text-[var(--cv-text-muted)] hover:border-[var(--cv-border-strong)]'
                    }`}
                  >
                    <span>{c.work.title}</span>
                    <span className="rounded-cv-full bg-[var(--cv-accent)]/20 px-1.5 py-0.2 text-[10px] font-mono text-[var(--cv-accent-strong)] font-semibold">
                      {matchPct}% Match
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Dropdown selector for all library works */}
          <div className="flex items-center gap-2 text-cv-xs">
            <span className="text-[var(--cv-text-muted)]">Select Work to Merge:</span>
            <select
              value={selectedSecondaryId ?? ''}
              onChange={(e) => setSelectedSecondaryId(e.target.value || null)}
              className="flex-1 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 py-1.5 text-cv-xs text-[var(--cv-text)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent)]"
            >
              <option value="">-- Choose a work to merge into this record --</option>
              {allOtherWorks.map((item) => (
                <option key={item.work.id} value={item.work.id}>
                  {item.work.title} ({item.work.contentType} · {item.accessPaths.length} sources)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Side-by-Side Comparison */}
        {secondaryItem ? (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target (Canonical) Column */}
              <div className="rounded-cv-xl border-2 border-[var(--cv-accent)]/50 bg-[var(--cv-bg-elevated)] p-4 flex flex-col justify-between relative shadow-sm">
                <div className="absolute -top-2.5 left-4 bg-[var(--cv-accent)] text-white font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-cv-sm shadow-sm">
                  Primary (Target Keeper)
                </div>
                <div className="flex gap-3.5 items-start mt-1">
                  <Cover
                    title={targetWork.title}
                    src={targetWork.coverRef ?? null}
                    size="sm"
                    className="w-16 h-22 rounded-cv shadow shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-cv-sm text-[var(--cv-text)] truncate">
                      {targetWork.title}
                    </h4>
                    <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                      {targetWork.contentType} · {targetWork.origin}
                    </p>
                    {targetAnchor && (
                      <div className="mt-2 flex items-center gap-1.5 text-cv-xs text-[var(--cv-accent-strong)] font-mono font-medium">
                        <BookOpen className="h-3 w-3" />
                        <span>{formatProgressAnchor(targetAnchor)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Sources */}
                <div className="mt-4 pt-3 border-t border-[var(--cv-border)]">
                  <div className="text-cv-xs font-semibold text-[var(--cv-text-muted)] mb-2 flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    <span>Access Paths ({targetItem.accessPaths.length})</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {targetItem.accessPaths.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-cv bg-[var(--cv-surface)] px-2.5 py-1 text-cv-xs flex items-center justify-between border border-[var(--cv-border)]"
                      >
                        <span className="truncate max-w-[180px] text-[var(--cv-text)] font-mono text-[11px]">
                          {p.label || ('url' in p ? p.url : 'Local Source')}
                        </span>
                        <SourceHealthIndicator health={toUIHealth(p.health)} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Memories */}
                <div className="mt-3 pt-2 border-t border-[var(--cv-border)] flex items-center justify-between text-cv-xs">
                  <span className="text-[var(--cv-text-muted)] flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    <span>Memories:</span>
                  </span>
                  <span className="font-semibold text-[var(--cv-text)]">
                    {targetItem.memories.length} notes & quotes
                  </span>
                </div>
              </div>

              {/* Secondary (To be Merged) Column */}
              <div className="rounded-cv-xl border border-dashed border-[var(--cv-border-strong)] bg-[var(--cv-surface)]/30 p-4 flex flex-col justify-between relative">
                <div className="absolute -top-2.5 left-4 bg-[var(--cv-text-muted)] text-white font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-cv-sm shadow-sm">
                  Secondary (Will be Absorbed)
                </div>
                <div className="flex gap-3.5 items-start mt-1">
                  <Cover
                    title={secWork?.title ?? 'Secondary'}
                    src={secWork?.coverRef ?? null}
                    size="sm"
                    className="w-16 h-22 rounded-cv shadow shrink-0 opacity-90"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-cv-sm text-[var(--cv-text)] truncate">
                      {secWork?.title}
                    </h4>
                    <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                      {secWork?.contentType} · {secWork?.origin}
                    </p>
                    {secAnchor && (
                      <div className="mt-2 flex items-center gap-1.5 text-cv-xs text-[var(--cv-accent-strong)] font-mono font-medium">
                        <BookOpen className="h-3 w-3" />
                        <span>{formatProgressAnchor(secAnchor)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Sources */}
                <div className="mt-4 pt-3 border-t border-[var(--cv-border)]">
                  <div className="text-cv-xs font-semibold text-[var(--cv-text-muted)] mb-2 flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    <span>Access Paths to Transfer ({secondaryItem.accessPaths.length})</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {secondaryItem.accessPaths.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-cv bg-[var(--cv-surface)] px-2.5 py-1 text-cv-xs flex items-center justify-between border border-[var(--cv-border)]"
                      >
                        <span className="truncate max-w-[180px] text-[var(--cv-text)] font-mono text-[11px]">
                          {p.label || ('url' in p ? p.url : 'Local Source')}
                        </span>
                        <SourceHealthIndicator health={toUIHealth(p.health)} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secondary Memories */}
                <div className="mt-3 pt-2 border-t border-[var(--cv-border)] flex items-center justify-between text-cv-xs">
                  <span className="text-[var(--cv-text-muted)] flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    <span>Memories to Transfer:</span>
                  </span>
                  <span className="font-semibold text-[var(--cv-text)]">
                    +{secondaryItem.memories.length} notes & quotes
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Progress Resolver */}
            <div className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4">
              <label className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-text-muted)] block mb-2.5">
                Progress Conflict Resolver
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-cv-xs">
                <button
                  type="button"
                  onClick={() => setProgressChoice('highest')}
                  className={`p-3 rounded-cv-lg border text-left transition-all ${
                    progressChoice === 'highest'
                      ? 'border-[var(--cv-accent)] bg-[var(--cv-accent)]/10 text-[var(--cv-text)] ring-1 ring-[var(--cv-accent)]'
                      : 'border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]'
                  }`}
                >
                  <div className="font-semibold text-[var(--cv-text)]">Furthest Anchor (Recommended)</div>
                  <div className="text-[11px] text-[var(--cv-text-subtle)] mt-1">
                    Automatically preserve whichever record has read further ahead.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProgressChoice('target')}
                  className={`p-3 rounded-cv-lg border text-left transition-all ${
                    progressChoice === 'target'
                      ? 'border-[var(--cv-accent)] bg-[var(--cv-accent)]/10 text-[var(--cv-text)] ring-1 ring-[var(--cv-accent)]'
                      : 'border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]'
                  }`}
                >
                  <div className="font-semibold text-[var(--cv-text)]">Keep Target's Progress</div>
                  <div className="text-[11px] text-[var(--cv-accent-strong)] font-mono mt-1">
                    {targetAnchor ? formatProgressAnchor(targetAnchor) : 'Not started'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProgressChoice('secondary')}
                  className={`p-3 rounded-cv-lg border text-left transition-all ${
                    progressChoice === 'secondary'
                      ? 'border-[var(--cv-accent)] bg-[var(--cv-accent)]/10 text-[var(--cv-text)] ring-1 ring-[var(--cv-accent)]'
                      : 'border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]'
                  }`}
                >
                  <div className="font-semibold text-[var(--cv-text)]">Keep Secondary's Progress</div>
                  <div className="text-[11px] text-[var(--cv-accent-strong)] font-mono mt-1">
                    {secAnchor ? formatProgressAnchor(secAnchor) : 'Not started'}
                  </div>
                </button>
              </div>
            </div>

            {/* Non-destructive guarantee callout */}
            <div className="rounded-cv-lg border border-[var(--cv-accent)]/30 bg-[var(--cv-accent)]/5 p-3 flex items-start gap-2.5 text-cv-xs">
              <CheckCircle className="h-4 w-4 text-[var(--cv-accent-strong)] shrink-0 mt-0.5" />
              <div className="text-[var(--cv-text-muted)] leading-relaxed">
                <span className="font-semibold text-[var(--cv-text)]">Non-destructive merge guarantee:</span>{' '}
                All {secondaryItem.accessPaths.length} access paths and {secondaryItem.memories.length}{' '}
                memories from "{secWork?.title}" will be transferred to "{targetWork.title}". The secondary
                record will be preserved as an archived duplicate record.
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center rounded-cv-lg border border-dashed border-[var(--cv-border)] bg-[var(--cv-surface)]/20">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-[var(--cv-text-subtle)] opacity-40" />
            <p className="text-cv-sm text-[var(--cv-text-muted)]">
              No candidate selected. Choose a duplicate candidate above to preview the merge.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isMerging}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExecuteMerge}
            disabled={!secondaryItem || isMerging}
            className="gap-1.5"
          >
            <GitMerge className="h-4 w-4" />
            <span>Execute Merge</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
