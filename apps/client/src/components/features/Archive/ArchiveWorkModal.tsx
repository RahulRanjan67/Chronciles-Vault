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
} from '@chronicles-vault/ui';
import {
  ArchiveReason,
  ArchiveRecord,
  formatProgressAnchor,
  ProgressAnchor,
} from '@chronicles-vault/domain';
import { WorkId } from '@chronicles-vault/shared';
import { useWorkDetailStore } from '@chronicles-vault/state';

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
          <div className="flex items-center gap-2 text-[var(--cv-accent-strong)]">
            <Archive className="h-5 w-5" />
            <DialogTitle className="text-cv-lg font-bold">Archive Work</DialogTitle>
          </div>
          <DialogDescription className="text-cv-xs text-[var(--cv-text-muted)]">
            Preserve <span className="font-semibold text-[var(--cv-text)]">"{workTitle}"</span> in your
            archive. All reading history, progress milestones, access paths, and memories remain completely intact.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Snapshot Banner */}
        {currentAnchor && (
          <div className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)]/60 px-3.5 py-2.5 flex items-center justify-between text-cv-xs">
            <span className="text-[var(--cv-text-muted)]">Preserved Progress Snapshot:</span>
            <span className="font-mono font-medium text-[var(--cv-accent-strong)]">
              {formatProgressAnchor(currentAnchor)}
            </span>
          </div>
        )}

        {/* Nuanced Reasons Grid */}
        <div className="space-y-2">
          <label className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-text-muted)]">
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
                  className={`flex items-start gap-2.5 p-3 text-left rounded-cv-lg border transition-all text-cv-xs ${
                    isSelected
                      ? 'border-[var(--cv-accent)] bg-[var(--cv-accent)]/10 text-[var(--cv-text)] ring-1 ring-[var(--cv-accent)] shadow-sm'
                      : 'border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] text-[var(--cv-text-muted)] hover:border-[var(--cv-border-strong)] hover:text-[var(--cv-text)]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isSelected ? 'text-[var(--cv-accent-strong)]' : 'text-[var(--cv-text-subtle)]'
                    }`}
                  />
                  <div>
                    <div className="font-medium text-[var(--cv-text)] leading-tight">{opt.label}</div>
                    <div className="text-[11px] text-[var(--cv-text-subtle)] mt-0.5 leading-snug">
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
              className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-text-muted)] flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
              Why Stopped / Parting Reflection
            </label>
            <span className="text-[11px] text-[var(--cv-text-subtle)]">Optional</span>
          </div>
          <textarea
            id="why-stopped-input"
            rows={3}
            value={whyStoppedNote}
            onChange={(e) => setWhyStoppedNote(e.target.value)}
            placeholder="Record why you put this work down, your concluding impression, or what would entice you to resume..."
            className="w-full rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3.5 py-2.5 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent)] resize-none"
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
