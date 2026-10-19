import * as React from "react";
import {
  Bookmark,
  ChevronRight,
  ExternalLink,
  Globe,
  MoreVertical,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { Button, Badge, relativeTime } from "@grimoire/ui";
import type { RadarCaptureItem } from "@grimoire/state";
import type { MatchCandidate } from "@grimoire/domain";

export interface RadarItemCardProps {
  item: RadarCaptureItem;
  onMatchToWork?: (itemId: string) => void;
  onCreateNew?: (itemId: string) => void;
  onKeepTemporary?: (itemId: string) => void;
  onDiscard?: (itemId: string) => void;
  onOpenUrl?: (url: string) => void;
  onOpenWork?: (workId: string) => void;
  selected?: boolean;
  onToggleSelect?: (itemId: string) => void;
  suggestedMatch?: MatchCandidate | null;
}

const STATE_CLASSES: Record<RadarCaptureItem["state"], string> = {
  pending: "border-[var(--gm-warning)] text-[var(--gm-warning)]",
  matched: "border-[var(--gm-success)] text-[var(--gm-success)]",
  created: "border-[var(--gm-accent-strong)] text-[var(--gm-accent-strong)]",
  merged: "border-[var(--gm-info)] text-[var(--gm-info)]",
  discarded: "border-[var(--gm-danger)] text-[var(--gm-danger)]",
  temporary: "border-[var(--gm-text-subtle)] text-[var(--gm-text-subtle)]",
};

const CONFIDENCE_CLASSES = {
  high: "border-[var(--gm-success)] text-[var(--gm-success)]",
  medium: "border-[var(--gm-warning)] text-[var(--gm-warning)]",
  low: "border-[var(--gm-danger)] text-[var(--gm-danger)]",
  unknown: "border-[var(--gm-text-subtle)] text-[var(--gm-text-subtle)]",
} as const;
type ConfidenceLabel = keyof typeof CONFIDENCE_CLASSES;

const STATE_LABELS: Record<RadarCaptureItem["state"], string> = {
  pending: "Pending",
  matched: "Matched",
  created: "Created",
  merged: "Merged",
  discarded: "Discarded",
  temporary: "Temporary",
};

function getConfidenceLabel(confidence?: number): ConfidenceLabel {
  if (!confidence) return "unknown";
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

export function RadarItemCard({
  item,
  onMatchToWork,
  onCreateNew,
  onKeepTemporary,
  onDiscard,
  onOpenUrl,
  onOpenWork,
  selected = false,
  onToggleSelect,
  suggestedMatch,
}: RadarItemCardProps) {
  const [showActions, setShowActions] = React.useState(false);

  const handleOpenUrl = () => {
    onOpenUrl?.(item.url);
  };

  const handleMatchToWork = () => {
    onMatchToWork?.(item.id);
    setShowActions(false);
  };

  const handleCreateNew = () => {
    onCreateNew?.(item.id);
    setShowActions(false);
  };

  const handleKeepTemporary = () => {
    onKeepTemporary?.(item.id);
    setShowActions(false);
  };

  const handleDiscard = () => {
    onDiscard?.(item.id);
    setShowActions(false);
  };

  const isMatched = item.state === "matched" || item.matchedWorkId;
  const isPending = item.state === "pending";

  return (
    <div className="group relative rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 hover:border-[var(--gm-accent-muted)] transition-colors">
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Avoid remote favicon requests so browsing metadata is not sent to third-party servers. */}
        <div className="flex-shrink-0 w-10 h-10 rounded-cv bg-[var(--gm-surface)] border border-[var(--gm-border)] flex items-center justify-center overflow-hidden">
          <Globe className="h-5 w-5 text-[var(--gm-text-subtle)]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-gm-sm font-semibold text-[var(--gm-text)] truncate">
              {item.title}
            </h3>
            <Badge
              variant="muted"
              className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 ${STATE_CLASSES[item.state]}`}
            >
              {STATE_LABELS[item.state]}
            </Badge>
          </div>

          {/* URL */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              handleOpenUrl();
            }}
            className="text-gm-xs text-[var(--gm-accent-strong)] hover:underline truncate block mb-2"
          >
            {item.url}
          </a>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--gm-text-subtle)]">
            <span className="flex items-center gap-1">
              <span className="font-medium capitalize">{item.browserSource}</span>
            </span>
            <span>·</span>
            <span>{relativeTime(item.capturedAt)}</span>
            {item.batchLabel && (
              <>
                <span>·</span>
                <span className="text-[var(--gm-text-muted)]">{item.batchLabel}</span>
              </>
            )}
            {item.readerMetadata?.detectedFormat && (
              <>
                <span>·</span>
                <span className="capitalize">{item.readerMetadata.detectedFormat}</span>
              </>
            )}
          </div>

          {/* Match info */}
          {isMatched && item.matchedWorkTitle && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-gm-xs">
                <Bookmark className="h-3 w-3 text-[var(--gm-accent-strong)]" />
                <span className="text-[var(--gm-text)] font-medium">{item.matchedWorkTitle}</span>
              </div>
              {item.matchConfidence && (
                <Badge
                  variant="muted"
                  className={`text-[10px] px-1.5 py-0 ${CONFIDENCE_CLASSES[getConfidenceLabel(item.matchConfidence)]}`}
                >
                  {getConfidenceLabel(item.matchConfidence)} (
                  {Math.round(item.matchConfidence * 100)}%)
                </Badge>
              )}
            </div>
          )}

          {/* Confidence for pending items */}
          {isPending && item.matchConfidence !== undefined && item.matchConfidence > 0 && (
            <div className="mt-2">
              <Badge
                variant="muted"
                className={`text-[10px] px-1.5 py-0 ${CONFIDENCE_CLASSES[getConfidenceLabel(item.matchConfidence)]}`}
              >
                {getConfidenceLabel(item.matchConfidence)} match (
                {Math.round(item.matchConfidence * 100)}%)
              </Badge>
            </div>
          )}
          {isPending && suggestedMatch && (
            <p className="mt-2 text-gm-xs text-[var(--gm-text-muted)]">
              Suggested work:{" "}
              <span className="font-medium text-[var(--gm-text)]">{suggestedMatch.workTitle}</span>{" "}
              ({Math.round(suggestedMatch.score * 100)}% match) · confirm before linking
            </p>
          )}
        </div>

        {/* Action menu trigger */}
        <div className="flex flex-shrink-0 items-center gap-1">
          {onToggleSelect && (
            <Button
              variant={selected ? "secondary" : "ghost"}
              size="sm"
              aria-label={selected ? "Deselect capture" : "Select capture"}
              aria-pressed={selected}
              onClick={() => onToggleSelect(item.id)}
              className="h-8 w-auto px-2"
            >
              {selected && <Check className="h-4 w-4" />}
              {!selected && <span className="text-xs">Select</span>}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="h-8 w-8 p-0"
          >
            <MoreVertical className="h-4 w-4 text-[var(--gm-text-muted)]" />
          </Button>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="mt-3 pt-3 border-t border-[var(--gm-border)] flex flex-wrap gap-2">
          {isPending && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => item.matchedWorkId && onOpenWork?.(item.matchedWorkId)}
                className="gap-1.5 text-gm-xs"
                disabled={!item.matchedWorkId || !onOpenWork}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Match to Work</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNew}
                className="gap-1.5 text-gm-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New</span>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleKeepTemporary}
            className="gap-1.5 text-gm-xs text-[var(--gm-text-muted)]"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Keep Temporary</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscard}
            className="gap-1.5 text-gm-xs text-[var(--gm-danger)] hover:text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Discard</span>
          </Button>
        </div>
      )}

      {/* Quick action buttons for matched items */}
      {!showActions && isMatched && (
        <div className="mt-3 pt-3 border-t border-[var(--gm-border)] flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleOpenUrl} className="gap-1.5 text-gm-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMatchToWork}
            className="gap-1.5 text-gm-xs"
          >
            <span>View Work</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
