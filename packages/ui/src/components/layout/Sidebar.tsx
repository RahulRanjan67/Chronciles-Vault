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
    if (href === '/up-next' || href === '/return-desk') return currentPath === '/up-next' || currentPath === '/return-desk' || currentPath === '/return';
    if (href === '/keyring') return currentPath === '/keyring' || currentPath === '/portals';
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
                'group flex w-full items-center justify-between rounded-cv px-2.5 py-2 text-gm-sm font-medium transition-colors select-none text-left cursor-pointer',
                active
                  ? 'bg-[var(--gm-surface)] text-[var(--gm-text)] font-semibold shadow-xs'
                  : 'text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface)]/60 hover:text-[var(--gm-text)]',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active
                      ? 'text-[var(--gm-accent-strong)]'
                      : 'text-[var(--gm-text-subtle)] group-hover:text-[var(--gm-text)]',
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'ml-auto inline-flex items-center justify-center rounded-gm-full px-1.5 py-0.2 text-[10px] font-mono font-medium',
                    active
                      ? 'bg-[var(--gm-accent)] text-white'
                      : 'bg-[var(--gm-surface-raised)] text-[var(--gm-text-muted)]',
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
        'hidden md:flex flex-col w-[var(--gm-sidebar-width)] shrink-0 border-r border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] h-full overflow-hidden select-none z-[var(--gm-z-sticky)]',
        className,
      )}
      {...props}
    >
      {/* Brand / Logo Header */}
      <div className="h-[var(--gm-header-height)] px-4 flex items-center gap-2.5 border-b border-[var(--gm-border)]">
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
              alt="Grimoire"
              className="h-8 w-8 rounded-full object-cover shadow-sm ring-1 ring-[var(--gm-border)] group-hover:ring-[var(--gm-accent)] transition-all shrink-0"
            />
            <span className="font-bold text-gm-sm tracking-tight text-[var(--gm-text)] group-hover:text-[var(--gm-accent-strong)] transition-colors truncate">
              Grimoire
            </span>
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Tier 1 primary items */}
        <div>{renderNavList(PRIMARY_NAV_ITEMS)}</div>

        <Separator className="bg-[var(--gm-border)]" />

        {/* Tier 2 & 3 secondary items */}
        <div>{renderNavList(SECONDARY_NAV_ITEMS)}</div>
      </div>

      {/* Bottom utilities: Help, Vault & Settings */}
      {/* On large windows: maintain separate full destinations */}
      <div className="hidden xl:block p-3 border-t border-[var(--gm-border)] space-y-1 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('/help')}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-cv px-2.5 py-2 text-gm-sm font-medium transition-colors select-none text-left cursor-pointer',
            isItemActive('/help')
              ? 'bg-[var(--gm-surface)] text-[var(--gm-text)] font-semibold shadow-xs'
              : 'text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface)]/60 hover:text-[var(--gm-text)]',
          )}
          title="Help & Guide"
        >
          <HelpCircle
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              isItemActive('/help')
                ? 'text-[var(--gm-accent-strong)]'
                : 'text-[var(--gm-text-subtle)] group-hover:text-[var(--gm-text)]',
            )}
          />
          <span className="truncate">Help &amp; Guide</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/vault')}
          className={cn(
            'group flex w-full items-center justify-between rounded-cv px-2.5 py-2 text-gm-sm font-medium transition-colors select-none text-left cursor-pointer',
            isItemActive('/vault')
              ? 'bg-[var(--gm-surface)] text-[var(--gm-text)]'
              : 'text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface)]/60 hover:text-[var(--gm-text)]',
          )}
          title="Private Vault"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {isVaultUnlocked ? (
              <Unlock className="h-4 w-4 text-[var(--gm-warning)] shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-[var(--gm-text-subtle)] group-hover:text-[var(--gm-text)] shrink-0" />
            )}
            <span className="truncate">Private Vault</span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--gm-text-subtle)]">
            {isVaultUnlocked ? 'Unlocked' : 'Locked'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/settings')}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-cv px-2.5 py-2 text-gm-sm font-medium transition-colors select-none text-left cursor-pointer',
            isItemActive('/settings')
              ? 'bg-[var(--gm-surface)] text-[var(--gm-text)]'
              : 'text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface)]/60 hover:text-[var(--gm-text)]',
          )}
          title="Settings"
        >
          <Settings className="h-4 w-4 text-[var(--gm-text-subtle)] group-hover:text-[var(--gm-text)] shrink-0" />
          <span className="truncate">Settings</span>
        </button>
      </div>

      {/* On narrow screens / compact sidebar: configure utilities into icon buttons with hover tooltips */}
      <div className="xl:hidden p-2 border-t border-[var(--gm-border)] flex items-center justify-around gap-1 shrink-0 bg-[var(--gm-bg-elevated)]">
        <button
          type="button"
          onClick={() => onNavigate('/help')}
          className={cn(
            'p-2 rounded-gm-sm border border-[var(--gm-border)] transition-all cursor-pointer hover:bg-[var(--gm-surface)] hover:text-[var(--gm-text)]',
            isItemActive('/help') ? 'bg-[var(--gm-surface)] text-[var(--gm-accent-strong)] border-[var(--gm-accent-strong)] shadow-xs' : 'text-[var(--gm-text-subtle)]'
          )}
          title="Help & Guide"
          aria-label="Help & Guide"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/vault')}
          className={cn(
            'p-2 rounded-gm-sm border border-[var(--gm-border)] transition-all cursor-pointer hover:bg-[var(--gm-surface)] hover:text-[var(--gm-text)]',
            isItemActive('/vault') ? 'bg-[var(--gm-surface)] text-[var(--gm-accent-strong)] border-[var(--gm-accent-strong)] shadow-xs' : 'text-[var(--gm-text-subtle)]'
          )}
          title={isVaultUnlocked ? 'Private Vault (Unlocked)' : 'Private Vault (Locked)'}
          aria-label="Private Vault"
        >
          {isVaultUnlocked ? (
            <Unlock className="h-4 w-4 text-[var(--gm-warning)]" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/settings')}
          className={cn(
            'p-2 rounded-gm-sm border border-[var(--gm-border)] transition-all cursor-pointer hover:bg-[var(--gm-surface)] hover:text-[var(--gm-text)]',
            isItemActive('/settings') ? 'bg-[var(--gm-surface)] text-[var(--gm-accent-strong)] border-[var(--gm-accent-strong)] shadow-xs' : 'text-[var(--gm-text-subtle)]'
          )}
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
