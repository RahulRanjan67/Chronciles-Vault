import * as React from 'react';
import { ArrowRight, BookOpen, Clock, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { relativeTime } from '../../utils/format';
import { Button } from '../primitives/Button';
import { ProgressBar } from '../primitives/ProgressBar';
import { ContentTypeBadge, PersonalStateChip } from '../primitives/StatusChip';
import { Cover } from './Cover';
import { ProgressAnchor, ProgressDisplay } from './ProgressDisplay';
import { SourceHealthIndicator, SourceHealthType } from './SourceHealthIndicator';

export type WorkCardVariant = 'standard' | 'compact' | 'return' | 'search' | 'hero';

export interface WorkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string | undefined;
  title: string;
  coverSrc?: string | null | undefined;
  variant?: WorkCardVariant | undefined;
  contentType?: string | undefined;
  personalState?: string | undefined;
  progressAnchor?: ProgressAnchor | null | undefined;
  progressPercentage?: number | undefined;
  newMaterialCount?: number | undefined;
  newMaterialLabel?: string | undefined;
  lastReadAt?: string | Date | undefined;
  sourceHealth?: SourceHealthType | undefined;
  lastNote?: string | undefined;
  genres?: readonly string[] | undefined;
  onContinue?: (() => void) | undefined;
  onCardClick?: (() => void) | undefined;
}

export function WorkCard({
  id,
  title,
  coverSrc,
  variant = 'standard',
  contentType,
  personalState,
  progressAnchor,
  progressPercentage,
  newMaterialCount,
  newMaterialLabel,
  lastReadAt,
  sourceHealth = 'healthy',
  lastNote,
  genres = [],
  onContinue,
  onCardClick,
  className,
  ...props
}: WorkCardProps) {
  // RETURN DESK HERO CARD VARIANT
  if (variant === 'return') {
    return (
      <div
        onClick={onCardClick}
        className={cn(
          'group relative flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4 sm:p-5 shadow-sm transition-all hover:border-[var(--cv-border-strong)] hover:shadow-md cursor-pointer',
          className,
        )}
        {...props}
      >
        <Cover
          title={title}
          src={coverSrc}
          size="lg"
          className="self-center sm:self-start w-28 sm:w-36 shrink-0 shadow-md transition-transform duration-300 group-hover:scale-[1.02]"
        />

        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {contentType && <ContentTypeBadge type={contentType} />}
                {personalState && <PersonalStateChip state={personalState} />}
              </div>
              {lastReadAt && (
                <div className="flex items-center gap-1 text-[11px] text-[var(--cv-text-subtle)] font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{relativeTime(lastReadAt)}</span>
                </div>
              )}
            </div>

            <h3 className="text-cv-lg font-bold text-[var(--cv-text)] tracking-tight line-clamp-1 group-hover:text-[var(--cv-accent-strong)] transition-colors">
              {title}
            </h3>

            <div className="flex items-center gap-2 text-cv-xs">
              <span className="text-[var(--cv-text-muted)] font-medium">Last read:</span>
              <ProgressDisplay anchor={progressAnchor} emphasize />
            </div>

            {Boolean(newMaterialCount && newMaterialCount > 0) && (
              <div className="inline-flex items-center gap-1.5 rounded-cv-md bg-[var(--cv-accent-muted)] px-2.5 py-1 text-cv-xs font-semibold text-[var(--cv-accent-strong)] w-fit mt-0.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {newMaterialCount} new {newMaterialLabel ?? 'chapters'} since your visit
                </span>
              </div>
            )}

            {lastNote && (
              <p className="mt-1 text-cv-xs italic text-[var(--cv-text-muted)] line-clamp-2 bg-[var(--cv-surface)]/60 rounded-cv p-2 border border-[var(--cv-border)]">
                &ldquo;{lastNote}&rdquo;
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--cv-border)] flex items-center justify-between gap-3">
            <SourceHealthIndicator health={sourceHealth} size="sm" />

            <Button
              variant="default"
              size="sm"
              className="gap-1.5 ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onContinue?.();
              }}
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // HERO CINEMATIC VARIANT
  if (variant === 'hero') {
    return (
      <div
        onClick={onCardClick}
        className={cn(
          'relative overflow-hidden rounded-cv-2xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 sm:p-8 shadow-xl cursor-pointer group',
          className,
        )}
        {...props}
      >
        {/* Subtle blurred backdrop cover */}
        {coverSrc && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15 blur-2xl scale-125 pointer-events-none transition-opacity group-hover:opacity-25"
            style={{ backgroundImage: `url(${coverSrc})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--cv-bg-elevated)] via-[var(--cv-bg-elevated)]/80 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <Cover
            title={title}
            src={coverSrc}
            size="hero"
            className="shadow-2xl ring-1 ring-white/10 shrink-0"
          />

          <div className="flex flex-col justify-between flex-1 h-full min-w-0 text-center sm:text-left">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                {contentType && <ContentTypeBadge type={contentType} />}
                {personalState && <PersonalStateChip state={personalState} />}
                <SourceHealthIndicator health={sourceHealth} size="sm" />
              </div>

              <h2 className="text-cv-2xl sm:text-cv-3xl font-extrabold tracking-tight text-[var(--cv-text)] line-clamp-2">
                {title}
              </h2>

              {genres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {genres.slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className="rounded-cv-full bg-[var(--cv-surface)] px-2 py-0.5 text-[11px] text-[var(--cv-text-muted)]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                <ProgressDisplay anchor={progressAnchor} emphasize className="text-cv-sm" />
                {lastReadAt && (
                  <span className="text-cv-xs text-[var(--cv-text-subtle)]">
                    · Read {relativeTime(lastReadAt)}
                  </span>
                )}
              </div>

              {progressPercentage !== undefined && (
                <div className="mt-3 max-w-xs">
                  <ProgressBar value={progressPercentage} size="md" />
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Button
                variant="default"
                size="lg"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onContinue?.();
                }}
              >
                <BookOpen className="h-4 w-4" />
                <span>Continue Reading</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SEARCH HORIZONTAL VARIANT
  if (variant === 'search') {
    return (
      <div
        onClick={onCardClick}
        className={cn(
          'group flex items-center gap-3 rounded-cv-md border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-2.5 shadow-xs transition-all hover:bg-[var(--cv-surface)] hover:border-[var(--cv-border-strong)] cursor-pointer',
          className,
        )}
        {...props}
      >
        <Cover title={title} src={coverSrc} size="sm" />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-cv-sm font-semibold text-[var(--cv-text)] truncate group-hover:text-[var(--cv-accent-strong)] transition-colors">
              {title}
            </h4>
            {contentType && <ContentTypeBadge type={contentType} />}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-cv-xs text-[var(--cv-text-muted)]">
            <ProgressDisplay anchor={progressAnchor} />
            {personalState && <span>· {personalState}</span>}
          </div>
        </div>
        <SourceHealthIndicator health={sourceHealth} showLabel={false} size="sm" />
      </div>
    );
  }

  // COMPACT CARD VARIANT
  if (variant === 'compact') {
    return (
      <div
        onClick={onCardClick}
        className={cn(
          'group flex flex-col rounded-cv border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-2 shadow-xs transition-all hover:border-[var(--cv-border-strong)] cursor-pointer',
          className,
        )}
        {...props}
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-cv-sm">
          <Cover title={title} src={coverSrc} size="fill" className="h-full w-full" />
        </div>
        <h4 className="mt-2 text-cv-xs font-semibold text-[var(--cv-text)] line-clamp-1 group-hover:text-[var(--cv-accent-strong)] transition-colors">
          {title}
        </h4>
        <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--cv-text-muted)]">
          <ProgressDisplay anchor={progressAnchor} className="text-[11px]" />
          <SourceHealthIndicator health={sourceHealth} showLabel={false} size="sm" />
        </div>
      </div>
    );
  }

  // STANDARD CARD VARIANT (Default)
  return (
    <div
      onClick={onCardClick}
      className={cn(
        'group flex flex-col rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-3 shadow-xs transition-all hover:border-[var(--cv-border-strong)] hover:shadow-md cursor-pointer',
        className,
      )}
      {...props}
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-cv">
        <Cover
          title={title}
          src={coverSrc}
          size="fill"
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        {personalState && (
          <div className="absolute top-2 left-2 shadow-sm">
            <PersonalStateChip state={personalState} />
          </div>
        )}
        {newMaterialCount && newMaterialCount > 0 ? (
          <div className="absolute bottom-2 right-2 rounded-cv-full bg-[var(--cv-accent)] px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
            +{newMaterialCount}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {contentType && <ContentTypeBadge type={contentType} />}
          </div>
          <h3 className="text-cv-sm font-semibold text-[var(--cv-text)] line-clamp-2 leading-snug group-hover:text-[var(--cv-accent-strong)] transition-colors">
            {title}
          </h3>
        </div>

        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--cv-border)]">
          <div className="flex items-center justify-between text-cv-xs">
            <ProgressDisplay anchor={progressAnchor} />
            <SourceHealthIndicator health={sourceHealth} showLabel={false} size="sm" />
          </div>

          {progressPercentage !== undefined && (
            <ProgressBar value={progressPercentage} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}
