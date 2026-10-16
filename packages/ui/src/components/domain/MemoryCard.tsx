import { Bookmark, Lightbulb, type LucideIcon, MessageSquare, Quote, Sparkles } from 'lucide-react';
import { relativeTime } from '../../utils/format';
import { cn } from '../../utils/cn';

export type MemoryType = 'quote' | 'note' | 'theory' | 'reaction' | 'bookmark';

export interface MemoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string | undefined;
  type?: MemoryType | undefined;
  content: string;
  workTitle?: string | undefined;
  workId?: string | undefined;
  anchorLabel?: string | undefined;
  createdAt?: string | Date | undefined;
  onNavigateWork?: ((workId?: string) => void) | undefined;
}

const TYPE_CONFIG: Record<
  MemoryType,
  { label: string; icon: LucideIcon; color: string }
> = {
  quote: {
    label: 'Quote',
    icon: Quote,
    color: 'text-[var(--cv-accent-strong)]',
  },
  note: {
    label: 'Note',
    icon: MessageSquare,
    color: 'text-[var(--cv-info)]',
  },
  theory: {
    label: 'Theory',
    icon: Lightbulb,
    color: 'text-[var(--cv-warning)]',
  },
  reaction: {
    label: 'Reaction',
    icon: Sparkles,
    color: 'text-rose-400',
  },
  bookmark: {
    label: 'Bookmark',
    icon: Bookmark,
    color: 'text-[var(--cv-success)]',
  },
};

export function MemoryCard({
  type = 'quote',
  content,
  workTitle,
  workId,
  anchorLabel,
  createdAt,
  onNavigateWork,
  className,
  ...props
}: MemoryCardProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.quote;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'group flex flex-col justify-between rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4 shadow-sm transition-all hover:border-[var(--cv-border-strong)] hover:shadow-md',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-cv-xs text-[var(--cv-text-muted)]">
          <div className="flex items-center gap-1.5 font-medium">
            <Icon className={cn('h-3.5 w-3.5', config.color)} />
            <span>{config.label}</span>
          </div>
          {createdAt && (
            <span className="text-[11px] text-[var(--cv-text-subtle)]">
              {relativeTime(createdAt)}
            </span>
          )}
        </div>

        <blockquote className="text-cv-sm text-[var(--cv-text)] leading-relaxed italic line-clamp-4">
          &ldquo;{content}&rdquo;
        </blockquote>
      </div>

      {(workTitle || anchorLabel) && (
        <div className="mt-3 pt-2.5 border-t border-[var(--cv-border)] flex items-center justify-between text-cv-xs">
          {workTitle ? (
            <button
              type="button"
              onClick={() => onNavigateWork?.(workId)}
              className="truncate font-medium text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] transition-colors text-left"
            >
              {workTitle}
            </button>
          ) : (
            <div />
          )}

          {anchorLabel && (
            <span className="shrink-0 font-mono text-[11px] text-[var(--cv-accent-strong)]">
              {anchorLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
