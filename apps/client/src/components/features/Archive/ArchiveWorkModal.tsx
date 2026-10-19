import * as React from 'react';
import {
  Archive,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  FileQuestion,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@grimoire/ui';
import {
  ArchiveReason,
  ArchiveRecord,
  formatProgressAnchor,
  ProgressAnchor,
} from '@grimoire/domain';
import { WorkId } from '@grimoire/shared';
import { useWorkDetailStore } from '@grimoire/state';

export interface ArchiveWorkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workId: string;
  workTitle: string;
  currentAnchor?: ProgressAnchor | null;
  onArchived?: (record: ArchiveRecord) => void;
}

interface ReasonOption {
  value: ArchiveReason;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ARCHIVE_REASONS: ReasonOption[] = [
  {
    value: ArchiveReason.Completed,
    label: 'Completed',
    description: 'Successfully reached the conclusion or caught up with final release',
    icon: CheckCircle2,
  },
  {
    value: ArchiveReason.Dropped,
    label: 'Dropped',
    description: 'Actively decided to stop reading due to disinterest or quality',
    icon: XCircle,
  },
  {
    value: ArchiveReason.Abandoned,
    label: 'Abandoned',
    description: 'Set aside indefinitely with no immediate plan to pick back up',
    icon: Compass,
  },
  {
    value: ArchiveReason.LostInterest,
    label: 'Lost Interest',
    description: 'Drifted away naturally without negative sentiment',
    icon: Clock,
  },
  {
    value: ArchiveReason.WaitingIndefinitely,
    label: 'Waiting Indefinitely',
    description: 'On long hiatus, author hiatus, or stalled fan/official translation',
    icon: FileQuestion,
  },
  {
    value: ArchiveReason.SourceUnavailable,
    label: 'Source Dead',
    description: 'Host websites or files are permanently offline or broken',
    icon: AlertTriangle,
  },
  {
    value: ArchiveReason.Duplicate,
    label: 'Duplicate',
    description: 'Superseded by another canonical record or created erroneously',
    icon: Layers,
  },
];

export function ArchiveWorkModal({
  open,
  onOpenChange,
  workId,
  workTitle,
  currentAnchor,
  onArchived,
}: ArchiveWorkModalProps) {
  const { archiveWork } = useWorkDetailStore();
  const [selectedReason, setSelectedReason] = React.useState<ArchiveReason>(ArchiveReason.Completed);
  const [whyStoppedNote, setWhyStoppedNote] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedReason(ArchiveReason.Completed);
      setWhyStoppedNote('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleArchive = () => {
    if (!workId) return;
    setIsSubmitting(true);
    try {
      const record = archiveWork(
        workId as WorkId,
        selectedReason,
        whyStoppedNote.trim() || undefined,
      );
      toast({
        title: 'Work archived',
        description: `Preserved "${workTitle}" with historical snapshot.`,
      });
      if (record && onArchived) {
        onArchived(record);
      }
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Archive failed',
        description: err instanceof Error ? err.message : 'Unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[var(--gm-accent-strong)]">
            <Archive className="h-5 w-5" />
            <DialogTitle className="text-gm-lg font-bold">Archive Work</DialogTitle>
          </div>
          <DialogDescription className="text-gm-xs text-[var(--gm-text-muted)]">
            Preserve <span className="font-semibold text-[var(--gm-text)]">"{workTitle}"</span> in your
            archive. All reading history, progress milestones, access paths, and memories remain completely intact.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Snapshot Banner */}
        {currentAnchor && (
          <div className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)]/60 px-3.5 py-2.5 flex items-center justify-between text-gm-xs">
            <span className="text-[var(--gm-text-muted)]">Preserved Progress Snapshot:</span>
            <span className="font-mono font-medium text-[var(--gm-accent-strong)]">
              {formatProgressAnchor(currentAnchor)}
            </span>
          </div>
        )}

        {/* Nuanced Reasons Grid */}
        <div className="space-y-2">
          <label className="text-gm-xs font-semibold uppercase tracking-wider text-[var(--gm-text-muted)]">
            Archive Reason
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ARCHIVE_REASONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedReason === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedReason(opt.value)}
                  className={`flex items-start gap-2.5 p-3 text-left rounded-gm-lg border transition-all text-gm-xs ${
                    isSelected
                      ? 'border-[var(--gm-accent)] bg-[var(--gm-accent)]/10 text-[var(--gm-text)] ring-1 ring-[var(--gm-accent)] shadow-sm'
                      : 'border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] text-[var(--gm-text-muted)] hover:border-[var(--gm-border-strong)] hover:text-[var(--gm-text)]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isSelected ? 'text-[var(--gm-accent-strong)]' : 'text-[var(--gm-text-subtle)]'
                    }`}
                  />
                  <div>
                    <div className="font-medium text-[var(--gm-text)] leading-tight">{opt.label}</div>
                    <div className="text-[11px] text-[var(--gm-text-subtle)] mt-0.5 leading-snug">
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* "Why Stopped" Reflection Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="why-stopped-input"
              className="text-gm-xs font-semibold uppercase tracking-wider text-[var(--gm-text-muted)] flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
              Why Stopped / Parting Reflection
            </label>
            <span className="text-[11px] text-[var(--gm-text-subtle)]">Optional</span>
          </div>
          <textarea
            id="why-stopped-input"
            rows={3}
            value={whyStoppedNote}
            onChange={(e) => setWhyStoppedNote(e.target.value)}
            placeholder="Record why you put this work down, your concluding impression, or what would entice you to resume..."
            className="w-full rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3.5 py-2.5 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent)] resize-none"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleArchive}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <Archive className="h-4 w-4" />
            <span>Archive Work</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
