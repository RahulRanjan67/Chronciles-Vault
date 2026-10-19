import * as React from 'react';
import { Command, Search } from 'lucide-react';
import { usePerformanceProfile } from '../../hooks/usePerformanceProfile';
import { cn } from '../../utils/cn';
import { Toaster } from '../primitives/Toast';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  currentPath: string;
  onNavigate: (href: string) => void;
  children: React.ReactNode;
  isVaultUnlocked?: boolean | undefined;
  badgeCounts?: Record<string, number> | undefined;
  onOpenCommandPalette?: (() => void) | undefined;
  headerSlot?: React.ReactNode | undefined;
  logoSlot?: React.ReactNode | undefined;
  className?: string | undefined;
}

export function AppShell({
  currentPath,
  onNavigate,
  children,
  isVaultUnlocked = false,
  badgeCounts = {},
  onOpenCommandPalette,
  headerSlot,
  logoSlot,
  className,
}: AppShellProps) {
  const { resolvedProfile, backdropBlur } = usePerformanceProfile();
  return (
    <div
      data-perf-profile={resolvedProfile}
      className={cn('relative min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)] flex flex-col md:flex-row font-sans', className)}
    >
      {/* Desktop Sidebar (220px) */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isVaultUnlocked={isVaultUnlocked}
        badgeCounts={badgeCounts}
        logoSlot={logoSlot}
      />

      {/* Main Container - Exclusively styled with theme background image (sidebar excluded) */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 pb-[calc(var(--gm-bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0 relative bg-cover bg-center bg-fixed',
        )}
        style={{ backgroundImage: 'var(--gm-bg-image)' }}
      >
        {/* Backdrop tint preserving contrast and readability */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none',
            backdropBlur && 'backdrop-blur-[1px]',
          )}
          style={{ background: 'var(--gm-main-overlay)' }}
        />

        <div className="relative z-10 flex-1 flex flex-col min-w-0">
          {/* Mobile / Global Header */}
          <header
            className={cn(
              'h-[var(--gm-header-height)] border-b border-[var(--gm-border)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-[var(--gm-z-sticky)]',
              backdropBlur ? 'backdrop-blur-md' : 'bg-[var(--gm-bg-elevated)]',
            )}
            style={backdropBlur ? { backgroundColor: 'var(--gm-glass-bg)' } : undefined}
          >
            {/* Left on mobile: logo / title */}
            <div className="flex items-center gap-3 md:hidden">
              {logoSlot ? (
                logoSlot
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="flex items-center gap-2 cursor-pointer"
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
                    className="h-7 w-7 rounded-full object-cover shadow-xs ring-1 ring-[var(--gm-border)]"
                  />
                  <span className="font-bold text-gm-sm tracking-tight text-[var(--gm-text)]">Grimoire</span>
                </button>
              )}
            </div>

          {/* Center / Search bar trigger */}
          <div className="flex-1 min-w-0 max-w-3xl mx-2 sm:mx-4">
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="flex w-full h-9 items-center justify-between rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)]/70 px-3 sm:px-4 text-gm-sm text-[var(--gm-text-muted)] hover:border-[var(--gm-border-strong)] hover:text-[var(--gm-text)] transition-colors cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <Search className="h-4 w-4 shrink-0 text-[var(--gm-text-subtle)]" />
                  <span className="truncate">Search library, return desk, actions…</span>
                </div>
                <kbd className="hidden sm:inline-flex shrink-0 h-4 items-center gap-0.5 rounded-gm-sm border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] px-1.5 font-mono text-[10px] text-[var(--gm-text-subtle)]">
                  <Command className="h-2.5 w-2.5" /> K
                </kbd>
              </button>
            )}
          </div>

          {/* Right header slot */}
          <div className="flex items-center gap-2 shrink-0">
            {headerSlot}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
        </div>
      </div>

      {/* Mobile Bottom Nav (60px) */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        badgeCounts={badgeCounts}
        isVaultUnlocked={isVaultUnlocked}
      />

      {/* Global Toast System */}
      <Toaster />
    </div>
  );
}
