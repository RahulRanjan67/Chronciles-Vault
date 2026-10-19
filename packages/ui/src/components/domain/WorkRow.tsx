import * as React from 'react';
import { ArrowRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';
import { relativeTime } from '../../utils/format';
import { Button } from '../primitives/Button';
import { ContentTypeBadge, PersonalStateChip } from '../primitives/StatusChip';
import { Cover } from './Cover';
import { ProgressAnchor, ProgressDisplay } from './ProgressDisplay';
import { SourceHealthIndicator, SourceHealthType } from './SourceHealthIndicator';

export interface WorkRowProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string | undefined;
  title: string;
  coverSrc?: string | null | undefined;
  contentType?: string | undefined;
  personalState?: string | undefined;
  progressAnchor?: ProgressAnchor | null | undefined;
  sourceHealth?: SourceHealthType | undefined;
  updatedAt?: string | Date | undefined;
  onContinue?: (() => void) | undefined;
  onRowClick?: (() => void) | undefined;
  onMoreActions?: (() => void) | undefined;
}

export function WorkRow({
  id,
  title,
  coverSrc,
  contentType,
  personalState,
  progressAnchor,
  sourceHealth = 'healthy',
  updatedAt,
  onContinue,
  onRowClick,
  onMoreActions,
  className,
  ...props
}: WorkRowProps) {
  return (
    <div
      onClick={onRowClick}
      className={cn(
        'group flex items-center justify-between gap-4 rounded-cv border-b border-[var(--gm-border)] bg-transparent px-3 py-2.5 transition-colors hover:bg-[var(--gm-surface)]/60 cursor-pointer',
        className,
      )}
      {...props}
    >
      {/* Title & Cover & Format */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Cover title={title} src={coverSrc} size="xs" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-gm-sm font-medium text-[var(--gm-text)] group-hover:text-[var(--gm-accent-strong)] transition-colors">
              {title}
            </span>
            {contentType && <ContentTypeBadge type={contentType} className="hidden sm:inline-flex" />}
          </div>
          <div className="flex items-center gap-2 sm:hidden mt-0.5">
            <ProgressDisplay anchor={progressAnchor} className="text-[11px]" />
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="hidden sm:flex items-center w-36 shrink-0">
        <ProgressDisplay anchor={progressAnchor} />
      </div>

      {/* State */}
      <div className="hidden md:flex items-center w-28 shrink-0">
        {personalState && <PersonalStateChip state={personalState} />}
      </div>

      {/* Health */}
      <div className="hidden lg:flex items-center w-24 shrink-0">
        <SourceHealthIndicator health={sourceHealth} size="sm" />
      </div>

      {/* Updated time */}
      {updatedAt && (
        <div className="hidden xl:flex items-center w-24 shrink-0 text-gm-xs text-[var(--gm-text-subtle)] font-mono">
          {relativeTime(updatedAt)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onContinue && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-gm-xs gap-1 opacity-80 group-hover:opacity-100 hover:text-[var(--gm-accent-strong)]"
            onClick={(e) => {
              e.stopPropagation();
              onContinue();
            }}
          >
            <span className="hidden sm:inline">Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
        {onMoreActions && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)]"
            onClick={(e) => {
              e.stopPropagation();
              onMoreActions();
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
