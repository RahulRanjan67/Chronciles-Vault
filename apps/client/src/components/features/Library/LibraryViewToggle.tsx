import * as React from 'react';
import { Grid2X2, Kanban, LayoutGrid, List, Table } from 'lucide-react';
import { SimpleTooltip, cn } from '@grimoire/ui';

export type LibraryViewMode = 'grid' | 'compact' | 'table' | 'board' | 'list';

export interface LibraryViewToggleProps {
  view: LibraryViewMode;
  onViewChange: (view: LibraryViewMode) => void;
  className?: string;
}

export function LibraryViewToggle({
  view,
  onViewChange,
  className,
}: LibraryViewToggleProps) {
  const views: { id: LibraryViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'grid', label: 'Cover Grid', icon: LayoutGrid },
    { id: 'compact', label: 'Compact Grid', icon: Grid2X2 },
    { id: 'table', label: 'Dense Table', icon: Table },
    { id: 'board', label: 'Board (Kanban)', icon: Kanban },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)]/60 p-0.5',
        className,
      )}
    >
      {views.map((v) => {
        const Icon = v.icon;
        const active = view === v.id;

        return (
          <SimpleTooltip key={v.id} content={v.label} side="top">
            <button
              type="button"
              onClick={() => onViewChange(v.id)}
              aria-label={v.label}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-gm-sm transition-colors cursor-pointer',
                active
                  ? 'bg-[var(--gm-bg-elevated)] text-[var(--gm-accent-strong)] shadow-xs'
                  : 'text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface-raised)]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          </SimpleTooltip>
        );
      })}
    </div>
  );
}
