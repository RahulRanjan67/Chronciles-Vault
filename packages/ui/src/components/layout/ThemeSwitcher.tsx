import * as React from 'react';
import { BookOpen, Check, ChevronDown, Feather, Flower2, Palette, Sparkles, Moon } from 'lucide-react';
import { THEMES, type ThemeConfig, type ThemeId, useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/DropdownMenu';

export interface ThemeSwitcherProps {
  className?: string | undefined;
  compact?: boolean | undefined;
}

export function ThemeSwitcher({ className, compact = false }: ThemeSwitcherProps) {
  const { themeId, setTheme, theme } = useTheme();

  const getThemeIcon = (id: ThemeId) => {
    switch (id) {
      case 'parchment-ink':
        return <BookOpen className="h-4 w-4 text-[#d97706]" />;
      case 'xianxia-realm':
        return <Flower2 className="h-4 w-4 text-[#c026d3]" />;
      case 'ink':
        return <Feather className="h-4 w-4 text-[#09090b]" />;
      case 'midnight-arcana':
        return <Moon className="h-4 w-4 text-[#6366f1]" />;
      default:
        return <Palette className="h-4 w-4 text-[var(--gm-accent-strong)]" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Switch Theme: currently ${theme.name}`}
          className={cn(
            'inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-gm-sm border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-[var(--gm-text)] shadow-[2px_2px_0px_var(--gm-border-strong)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--gm-accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gm-border-focus)] cursor-pointer select-none',
            className,
          )}
        >
          <div className="flex items-center gap-1.5">
            {getThemeIcon(themeId)}
            {!compact && (
              <span className="hidden sm:inline font-medium tracking-tight">
                {theme.name}
              </span>
            )}
          </div>

          <div
            className="h-2.5 w-2.5 rounded-full border border-[var(--gm-border-strong)] shrink-0"
            style={{ backgroundColor: theme.previewAccent }}
            aria-hidden="true"
          />

          <ChevronDown className="h-2.5 w-2.5 text-[var(--gm-text-subtle)]" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-68 p-1.5 shadow-xl rounded-none border-2 border-[var(--gm-border-strong)]">
        <DropdownMenuLabel className="px-2 py-1 text-[11px] font-mono font-bold tracking-wider uppercase text-[var(--gm-text-subtle)]">
          [ 04 · Atmosphere & Theme ]
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="space-y-1 py-1">
          {THEMES.map((item: ThemeConfig) => {
            const isActive = themeId === item.id;
            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={cn(
                  'flex items-center justify-between rounded-none px-2.5 py-2 cursor-pointer transition-colors border',
                  isActive
                    ? 'bg-[var(--gm-surface)] border-[var(--gm-border-strong)] text-[var(--gm-text)] font-bold'
                    : 'border-transparent text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface)]/60 hover:text-[var(--gm-text)]',
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">{getThemeIcon(item.id)}</div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gm-xs font-bold truncate leading-tight">
                        {item.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {/* Swatch preview */}
                  <div className="flex items-center gap-0.5">
                    <span
                      className="inline-block h-3.5 w-3.5 border border-[var(--gm-border-strong)]"
                      style={{ backgroundColor: item.previewAccent }}
                      title="Accent"
                    />
                    <span
                      className="inline-block h-3.5 w-3.5 border border-[var(--gm-border-strong)]"
                      style={{ backgroundColor: item.previewSecondary }}
                      title="Secondary"
                    />
                  </div>
                  {isActive && (
                    <Check className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
