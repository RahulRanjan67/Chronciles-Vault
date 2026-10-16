import * as React from 'react';
import {
  Lock,
  Unlock,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Separator } from '../primitives/Separator';
import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  type NavItem,
} from './sidebar-nav-items';

export type { NavItem };


export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  currentPath: string;
  onNavigate: (href: string) => void;
  isVaultUnlocked?: boolean | undefined;
  badgeCounts?: Record<string, number> | undefined;
  logoSlot?: React.ReactNode | undefined;
}

export function Sidebar({
  currentPath,
  onNavigate,
  isVaultUnlocked = false,
  badgeCounts = {},
  logoSlot,
  className,
  ...props
}: SidebarProps) {
  const isItemActive = (href: string) => {
    if (href === '/') return currentPath === '/' || currentPath === '/library';
    if (href === '/return-desk') return currentPath === '/return-desk' || currentPath === '/return';
    return currentPath.startsWith(href);
  };

  const renderNavList = (items: NavItem[]) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item.href);
        const count = badgeCounts[item.id];

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onNavigate(item.href)}
              className={cn(
                'group flex w-full items-center justify-between rounded-cv px-2.5 py-2 text-cv-sm font-medium transition-colors select-none text-left cursor-pointer',
                active
                  ? 'bg-[var(--cv-surface)] text-[var(--cv-text)] font-semibold shadow-xs'
                  : 'text-[var(--cv-text-muted)] hover:bg-[var(--cv-surface)]/60 hover:text-[var(--cv-text)]',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active
                      ? 'text-[var(--cv-accent-strong)]'
                      : 'text-[var(--cv-text-subtle)] group-hover:text-[var(--cv-text)]',
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'ml-auto inline-flex items-center justify-center rounded-cv-full px-1.5 py-0.2 text-[10px] font-mono font-medium',
                    active
                      ? 'bg-[var(--cv-accent)] text-white'
                      : 'bg-[var(--cv-surface-raised)] text-[var(--cv-text-muted)]',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col w-[var(--cv-sidebar-width)] shrink-0 border-r border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] h-screen select-none sticky top-0 z-[var(--cv-z-sticky)]',
        className,
      )}
      {...props}
    >
      {/* Brand / Logo Header */}
      <div className="h-[var(--cv-header-height)] px-4 flex items-center gap-2.5 border-b border-[var(--cv-border)]">
        {logoSlot ? (
          logoSlot
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer text-left group w-full"
          >
            <img
              src="/logo.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('.jpg')) {
                  target.src = '/logo.jpg';
                }
              }}
              alt="Chronicles Vault"
              className="h-8 w-8 rounded-full object-cover shadow-sm ring-1 ring-[var(--cv-border)] group-hover:ring-[var(--cv-accent)] transition-all shrink-0"
            />
            <span className="font-bold text-cv-sm tracking-tight text-[var(--cv-text)] group-hover:text-[var(--cv-accent-strong)] transition-colors truncate">
              Chronicles Vault
            </span>
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Tier 1 primary items */}
        <div>{renderNavList(PRIMARY_NAV_ITEMS)}</div>

        <Separator className="bg-[var(--cv-border)]" />

        {/* Tier 2 & 3 secondary items */}
        <div>{renderNavList(SECONDARY_NAV_ITEMS)}</div>
      </div>

      {/* Bottom utilities: Help, Vault & Settings */}
      <div className="p-3 border-t border-[var(--cv-border)] space-y-1">
        <button
          type="button"
          onClick={() => onNavigate('/help')}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-cv px-2.5 py-2 text-cv-sm font-medium transition-colors select-none text-left cursor-pointer',
            isItemActive('/help')
              ? 'bg-[var(--cv-surface)] text-[var(--cv-text)] font-semibold shadow-xs'
              : 'text-[var(--cv-text-muted)] hover:bg-[var(--cv-surface)]/60 hover:text-[var(--cv-text)]',
          )}
        >
          <HelpCircle
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              isItemActive('/help')
                ? 'text-[var(--cv-accent-strong)]'
                : 'text-[var(--cv-text-subtle)] group-hover:text-[var(--cv-text)]',
            )}
          />
          <span className="truncate">Help &amp; Guide</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onNavigate('/vault');
          }}
          className={cn(
            'group flex w-full items-center justify-between rounded-cv px-2.5 py-2 text-cv-sm font-medium transition-colors select-none text-left cursor-pointer',
            isItemActive('/vault')
              ? 'bg-[var(--cv-surface)] text-[var(--cv-text)]'
              : 'text-[var(--cv-text-muted)] hover:bg-[var(--cv-surface)]/60 hover:text-[var(--cv-text)]',
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {isVaultUnlocked ? (
              <Unlock className="h-4 w-4 text-[var(--cv-warning)] shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-[var(--cv-text-subtle)] group-hover:text-[var(--cv-text)] shrink-0" />
            )}
            <span className="truncate">Private Vault</span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--cv-text-subtle)]">
            {isVaultUnlocked ? 'Unlocked' : 'Locked'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/settings')}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-cv px-2.5 py-2 text-cv-sm font-medium transition-colors select-none text-left cursor-pointer',
            isItemActive('/settings')
              ? 'bg-[var(--cv-surface)] text-[var(--cv-text)]'
              : 'text-[var(--cv-text-muted)] hover:bg-[var(--cv-surface)]/60 hover:text-[var(--cv-text)]',
          )}
        >
          <Settings className="h-4 w-4 text-[var(--cv-text-subtle)] group-hover:text-[var(--cv-text)] shrink-0" />
          <span className="truncate">Settings</span>
        </button>
      </div>
    </aside>
  );
}
