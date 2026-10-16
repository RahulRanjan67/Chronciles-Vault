import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  count?: number;
  description?: string;
  viewAllText?: string;
  onViewAll?: () => void;
  actionSlot?: React.ReactNode;
}

export function SectionHeader({
  title,
  count,
  description,
  viewAllText = 'View all',
  onViewAll,
  actionSlot,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[var(--cv-border)] pb-3 mb-4',
        className,
      )}
      {...props}
    >
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-cv-lg font-semibold tracking-tight text-[var(--cv-text)]">
            {title}
          </h2>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center rounded-cv-full bg-[var(--cv-surface)] px-2 py-0.5 text-cv-xs font-mono text-[var(--cv-text-muted)] border border-[var(--cv-border)]">
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-cv-xs text-[var(--cv-text-muted)]">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actionSlot}
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-cv-xs font-medium text-[var(--cv-accent-strong)] hover:text-[var(--cv-accent)] transition-colors cursor-pointer group"
          >
            <span>{viewAllText}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
