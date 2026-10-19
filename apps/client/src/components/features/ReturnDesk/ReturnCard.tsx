import * as React from 'react';
import { ArrowRight, BookOpen, Clock, Lightbulb, MessageSquare, Sparkles } from 'lucide-react';
import {
  Button,
  Cover,
  ProgressAnchor,
  ProgressDisplay,
  relativeTime,
  SourceHealthIndicator,
  SourceHealthType,
  cn,
} from '@grimoire/ui';

export interface ReturnCardData {
  id: string;
  title: string;
  coverSrc?: string | null;
  lastProgress: ProgressAnchor;
  lastReadDate: string | Date;
  newReleasesCount?: number;
  newReleasesLabel?: string;
  memorySnippet?: string;
  sourceHealth: SourceHealthType;
  sourceName?: string;
}

export interface ReturnCardProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ReturnCardData;
  onContinue: (id: string) => void;
  onOpenMemoryRefresher?: (id: string) => void;
  onCardClick?: (id: string) => void;
}

export function ReturnCard({
  data,
  onContinue,
  onOpenMemoryRefresher,
  onCardClick,
  className,
  ...props
}: ReturnCardProps) {
  const {
    id,
    title,
    coverSrc,
    lastProgress,
    lastReadDate,
    newReleasesCount = 0,
    newReleasesLabel = 'chapters',
    memorySnippet,
    sourceHealth,
    sourceName,
  } = data;

  return (
    <div
      onClick={() => onCardClick?.(id)}
      className={cn(
        'group relative flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 sm:p-5 shadow-sm transition-all duration-[var(--gm-duration-base)] hover:border-[var(--gm-border-strong)] hover:shadow-md cursor-pointer',
        className,
      )}
      {...props}
    >
      {/* 3:4 Cover */}
      <Cover
        title={title}
        src={coverSrc}
        size="lg"
        className="w-28 sm:w-36 self-center sm:self-start shadow-md transition-transform duration-300 group-hover:scale-[1.02]"
      />

      {/* Main Details */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex flex-col gap-2">
          {/* Header Row: Title and relative time */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-gm-base sm:text-gm-lg font-bold text-[var(--gm-text)] tracking-tight line-clamp-1 group-hover:text-[var(--gm-accent-strong)] transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-[var(--gm-text-subtle)] font-mono shrink-0">
              <Clock className="h-3 w-3" />
              <span>{relativeTime(lastReadDate)}</span>
            </div>
          </div>

          {/* Progress Display */}
          <div className="flex items-center gap-2 text-gm-xs">
            <span className="text-[var(--gm-text-muted)]">Progress:</span>
            <ProgressDisplay anchor={lastProgress} emphasize />
          </div>

          {/* New Releases Banner */}
          {newReleasesCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-gm-md bg-[var(--gm-accent-muted)] px-2.5 py-1 text-gm-xs font-semibold text-[var(--gm-accent-strong)] w-fit mt-0.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>
                {newReleasesCount} new {newReleasesLabel} since your visit
              </span>
            </div>
          )}

          {/* Memory refresher snippet */}
          {memorySnippet && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMemoryRefresher?.(id);
              }}
              className="mt-1 flex items-start gap-2 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)]/60 p-2.5 text-left text-gm-xs text-[var(--gm-text-muted)] transition-colors hover:border-[var(--gm-border-strong)] hover:text-[var(--gm-text)] cursor-pointer"
            >
              <Lightbulb className="h-3.5 w-3.5 text-[var(--gm-warning)] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[var(--gm-text-subtle)] uppercase text-[10px] block mb-0.5">
                  Last Memory Note
                </span>
                <p className="italic line-clamp-2">&ldquo;{memorySnippet}&rdquo;</p>
              </div>
            </button>
          )}
        </div>

        {/* Footer Actions & Source Health */}
        <div className="mt-4 pt-3 border-t border-[var(--gm-border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gm-xs text-[var(--gm-text-subtle)] hidden sm:inline">Source:</span>
            <SourceHealthIndicator health={sourceHealth} label={sourceName} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            {onOpenMemoryRefresher && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gm-xs gap-1 hidden sm:inline-flex"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMemoryRefresher(id);
                }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Refresher</span>
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onContinue(id);
              }}
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
