import * as React from 'react';
import { BookOpen, Compass, Inbox, LucideIcon, MessageSquare, Radar, Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../primitives/Button';

export type EmptyStateVariant =
  | 'library'
  | 'returnDesk'
  | 'radar'
  | 'memory'
  | 'search'
  | 'custom';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  illustrationSlot?: React.ReactNode;
}

const DEFAULTS: Record<
  EmptyStateVariant,
  { icon: LucideIcon; title: string; description: string }
> = {
  library: {
    icon: BookOpen,
    title: 'Your library is empty',
    description: 'Add your first manga, novel, or series to start tracking your reading journey.',
  },
  returnDesk: {
    icon: Compass,
    title: 'Nothing to return to right now',
    description: 'You are completely caught up! Check Radar for newly detected releases or browse your library.',
  },
  radar: {
    icon: Radar,
    title: 'No captured items',
    description: 'Use the browser extension to capture tabs and bookmarks. They will appear here for triage.',
  },
  memory: {
    icon: MessageSquare,
    title: 'No memories captured yet',
    description: 'Save memorable quotes, theories, and notes as you read to build your reading intelligence vault.',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search terms, removing filters, or searching by an alternate title.',
  },
  custom: {
    icon: Inbox,
    title: 'Nothing here yet',
    description: 'Items will appear here once available.',
  },
};

export function EmptyState({
  variant = 'custom',
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustrationSlot,
  className,
  children,
  ...props
}: EmptyStateProps) {
  const defaults = DEFAULTS[variant] ?? DEFAULTS.custom;
  const finalTitle = title ?? defaults.title;
  const finalDesc = description ?? defaults.description;
  const Icon = icon ?? defaults.icon;

  return (
    <div
      className={cn(
        'flex min-h-[320px] flex-col items-center justify-center rounded-gm-xl border border-dashed border-[var(--gm-border)] p-8 text-center bg-[var(--gm-bg-elevated)]/40',
        className,
      )}
      {...props}
    >
      {illustrationSlot ? (
        <div className="mb-4">{illustrationSlot}</div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-gm-full border border-[var(--gm-border)] bg-[var(--gm-surface)] shadow-xs">
          <Icon className="h-6 w-6 text-[var(--gm-accent-strong)]" />
        </div>
      )}

      <h3 className="text-gm-base font-semibold text-[var(--gm-text)] tracking-tight">
        {finalTitle}
      </h3>
      <p className="mt-1.5 max-w-sm text-gm-sm text-[var(--gm-text-muted)] leading-relaxed">
        {finalDesc}
      </p>

      {(actionLabel || secondaryActionLabel || children) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="default" size="default" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="default" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
