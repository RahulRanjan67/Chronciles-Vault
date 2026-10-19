import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TwoPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarWidth?: string;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  sidebarTitle?: string;
}

export function TwoPane({
  sidebar,
  children,
  sidebarWidth = '320px',
  defaultCollapsed = false,
  collapsible = true,
  sidebarTitle,
  className,
  ...props
}: TwoPaneProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <div
      className={cn(
        'relative flex flex-col md:flex-row h-full min-h-[calc(100vh-var(--gm-header-height))] w-full overflow-hidden',
        className,
      )}
      {...props}
    >
      {/* Secondary Sidebar / Left Pane */}
      <div
        className={cn(
          'border-b md:border-b-0 md:border-r border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]/60 transition-all duration-300 flex flex-col shrink-0 overflow-y-auto',
          collapsed ? 'md:w-0 md:overflow-hidden md:p-0' : '',
        )}
        style={{ width: collapsed ? undefined : sidebarWidth }}
      >
        {sidebarTitle && !collapsed && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gm-border)]">
            <h3 className="text-gm-sm font-semibold text-[var(--gm-text)]">
              {sidebarTitle}
            </h3>
          </div>
        )}
        <div className={cn('p-4 flex-1', collapsed && 'hidden md:block')}>
          {sidebar}
        </div>
      </div>

      {/* Collapse Toggle Button (Desktop) */}
      {collapsible && (
        <button
          type="button"
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'hidden md:flex absolute top-4 z-20 h-6 w-6 items-center justify-center rounded-full border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface)] shadow-md transition-all cursor-pointer',
          )}
          style={{
            left: collapsed ? '8px' : `calc(${sidebarWidth} - 12px)`,
          }}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      {/* Main Detail / Right Pane */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {children}
      </div>
    </div>
  );
}
