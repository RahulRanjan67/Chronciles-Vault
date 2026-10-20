import * as React from 'react';
import { Command, Search } from 'lucide-react';
import { usePerformanceProfile } from '../../hooks/usePerformanceProfile';
import { cn } from '../../utils/cn';
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div
      data-perf-profile={resolvedProfile}
      className={cn('relative h-screen overflow-hidden bg-[var(--gm-bg)] text-[var(--gm-text)] flex flex-col md:flex-row font-sans', className)}
    >
      {/* Desktop Sidebar (220px) — Fixed height, independent internal scroll */}
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
          'flex-1 flex flex-col min-w-0 h-full overflow-hidden pb-[calc(var(--gm-bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0 relative bg-cover bg-center bg-fixed',
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

        <div className="relative z-10 flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Mobile / Global Header */}
          <header
            className={cn(
              'h-[var(--gm-header-height)] shrink-0 border-b border-[var(--gm-border)] px-4 sm:px-6 flex items-center justify-between z-[var(--gm-z-sticky)]',
              backdropBlur ? 'backdrop-blur-md' : 'bg-[var(--gm-bg-elevated)]',
            )}
            style={backdropBlur ? { backgroundColor: 'var(--gm-glass-bg)' } : undefined}
          >
            {/* Left on mobile: tapping Grimoire opens left sidebar menu */}
            <div className="flex items-center gap-3 md:hidden">
              {logoSlot ? (
                logoSlot
              ) : (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex items-center gap-2 cursor-pointer group select-none"
                  title="Open Grimoire Menu"
                  aria-label="Open Grimoire Menu"
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
                    className="h-7 w-7 rounded-full object-cover shadow-xs ring-1 ring-[var(--gm-border)] group-hover:ring-[var(--gm-accent)] transition-all"
                  />
                  <span className="font-bold text-gm-sm tracking-tight text-[var(--gm-text)] group-hover:text-[var(--gm-accent-strong)] flex items-center gap-1 transition-colors">
                    Grimoire
                    <span className="text-[10px] text-[var(--gm-accent-strong)] font-mono">▾</span>
                  </span>
                </button>
              )}
            </div>

            {/* Center / Search bar trigger */}
            <div className="flex-1 min-w-0 max-w-3xl mx-1.5 sm:mx-4">
              {onOpenCommandPalette && (
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="flex w-full h-7 sm:h-9 items-center justify-between rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)]/70 px-2 sm:px-4 text-xs sm:text-gm-sm text-[var(--gm-text-muted)] hover:border-[var(--gm-border-strong)] hover:text-[var(--gm-text)] transition-colors cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[var(--gm-text-subtle)]" />
                    <span className="truncate hidden sm:inline">Search library, up next, actions…</span>
                    <span className="truncate sm:hidden">Search…</span>
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

          {/* Main Content Area — Scrolls independently from sidebar */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Slide-Over Left Sidebar Drawer (Opens on tapping Grimoire on narrow screens) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative w-[280px] max-w-[85vw] h-full bg-[var(--gm-bg-elevated)] border-r border-[var(--gm-border)] flex flex-col z-10 shadow-2xl">
            <div className="h-[var(--gm-header-height)] px-4 flex items-center justify-between border-b border-[var(--gm-border)]">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Grimoire" className="h-7 w-7 rounded-full object-cover" />
                <span className="font-bold text-gm-sm text-[var(--gm-text)]">Grimoire Sanctum</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-gm-sm border border-[var(--gm-border)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] cursor-pointer text-xs font-mono"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                currentPath={currentPath}
                onNavigate={(href) => {
                  setMobileMenuOpen(false);
                  onNavigate(href);
                }}
                isVaultUnlocked={isVaultUnlocked}
                badgeCounts={badgeCounts}
                className="!flex !w-full !border-r-0 !h-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav (60px) */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        badgeCounts={badgeCounts}
        isVaultUnlocked={isVaultUnlocked}
      />
    </div>
  );
}
