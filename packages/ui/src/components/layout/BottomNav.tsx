import * as React from 'react';
import {
  Lock,
  MoreHorizontal,
  Unlock,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../primitives/Sheet';
import {
  BOTTOM_NAV_ITEMS,
  MORE_NAV_ITEMS,
  type BottomNavItem,
} from './bottom-nav-items';





export interface BottomNavProps extends React.HTMLAttributes<HTMLElement> {
  currentPath: string;
  onNavigate: (href: string) => void;
  badgeCounts?: Record<string, number> | undefined;
  isVaultUnlocked?: boolean | undefined;
}

export function BottomNav({
  currentPath,
  onNavigate,
  badgeCounts = {},
  isVaultUnlocked = false,
  className,
  ...props
}: BottomNavProps) {
  const [moreOpen, setMoreOpen] = React.useState(false);

  const isItemActive = (href: string) => {
    if (href === '/') return currentPath === '/' || currentPath === '/library';
    if (href === '/return-desk') return currentPath === '/return-desk' || currentPath === '/return';
    return currentPath.startsWith(href);
  };

  const isMoreActive =
    MORE_NAV_ITEMS.some((item) => isItemActive(item.href)) || isItemActive('/vault');

  const handleMoreNavigate = (href: string) => {
    setMoreOpen(false);
    onNavigate(href);
  };

  return (
    <>
      <nav
        className={cn(
          'md:hidden fixed bottom-0 inset-x-0 h-[var(--gm-bottom-nav-height)] z-[var(--gm-z-sticky)] border-t border-[var(--gm-border)] backdrop-blur-md px-1 flex items-center justify-around select-none pb-[env(safe-area-inset-bottom)]',
          className,
        )}
        style={{ backgroundColor: 'var(--gm-glass-bg)' }}
        {...props}
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          const count = badgeCounts[item.id];

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.href)}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center min-h-11 py-1 gap-1 transition-colors cursor-pointer',
                active
                  ? 'text-[var(--gm-accent-strong)]'
                  : 'text-[var(--gm-text-subtle)] hover:text-[var(--gm-text-muted)]',
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {count !== undefined && count > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gm-accent)] px-1 text-[9px] font-bold text-white shadow-xs">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight font-medium',
                  active ? 'font-semibold' : 'opacity-80',
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Overflow tab: the rest of the app's sections open in a bottom sheet */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={cn(
            'relative flex flex-1 flex-col items-center justify-center min-h-11 py-1 gap-1 transition-colors cursor-pointer',
            isMoreActive
              ? 'text-[var(--gm-accent-strong)]'
              : 'text-[var(--gm-text-subtle)] hover:text-[var(--gm-text-muted)]',
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span
            className={cn(
              'text-[10px] tracking-tight font-medium',
              isMoreActive ? 'font-semibold' : 'opacity-80',
            )}
          >
            More
          </span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent className="md:hidden pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 pb-1">
            {MORE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);
              const count = badgeCounts[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMoreNavigate(item.href)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1.5 rounded-gm-lg border px-2 py-3 min-h-20 text-center transition-colors cursor-pointer',
                    active
                      ? 'border-[var(--gm-accent)] bg-[var(--gm-surface)] text-[var(--gm-accent-strong)]'
                      : 'border-[var(--gm-border)] bg-[var(--gm-surface)]/50 text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface)] hover:text-[var(--gm-text)]',
                  )}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {count !== undefined && count > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gm-accent)] px-1 text-[9px] font-bold text-white shadow-xs">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                </button>
              );
            })}

            {/* Private Vault carries lock state, like the desktop Sidebar's entry */}
            <button
              type="button"
              onClick={() => handleMoreNavigate('/vault')}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1.5 rounded-gm-lg border px-2 py-3 min-h-20 text-center transition-colors cursor-pointer',
                isItemActive('/vault')
                  ? 'border-[var(--gm-accent)] bg-[var(--gm-surface)] text-[var(--gm-accent-strong)]'
                  : 'border-[var(--gm-border)] bg-[var(--gm-surface)]/50 text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface)] hover:text-[var(--gm-text)]',
              )}
            >
              {isVaultUnlocked ? (
                <Unlock className="h-5 w-5 text-[var(--gm-warning)]" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
              <span className="text-[11px] font-medium leading-tight">
                {isVaultUnlocked ? 'Vault · Unlocked' : 'Vault · Locked'}
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
