import { useCallback, useEffect, useState } from 'react';

export type ThemeId = 'parchment-ink' | 'midnight-arcana' | 'xianxia-realm' | 'ink';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  previewBg: string;
  previewAccent: string;
  previewSecondary: string;
  previewSurface: string;
  previewBorder: string;
  isDark: boolean;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'parchment-ink',
    name: 'Antique Parchment',
    tagline: '300-Year-Old Aged Amber Pages',
    previewBg: '#f4ebd9',
    previewAccent: '#d97706',
    previewSecondary: '#b45309',
    previewSurface: '#ede0c8',
    previewBorder: 'rgba(180, 83, 9, 0.45)',
    isDark: false,
  },
  {
    id: 'midnight-arcana',
    name: 'Midnight Arcana',
    tagline: 'Obsidian Night Blues & Violets',
    previewBg: '#090d16',
    previewAccent: '#6366f1',
    previewSecondary: '#8b5cf6',
    previewSurface: '#1e1b4b',
    previewBorder: 'rgba(99, 102, 241, 0.40)',
    isDark: true,
  },
  {
    id: 'xianxia-realm',
    name: 'Blossom Ascendant',
    tagline: 'Pink-Purple Xianxia Spectrum',
    previewBg: '#fdf2f8',
    previewAccent: '#c026d3',
    previewSecondary: '#a21caf',
    previewSurface: '#fae8ff',
    previewBorder: 'rgba(192, 38, 211, 0.36)',
    isDark: false,
  },
  {
    id: 'ink',
    name: 'Sumi-e Charcoal Ink',
    tagline: 'Simple Black & White Washi',
    previewBg: '#e8e6e1',
    previewAccent: '#09090b',
    previewSecondary: '#dc2626',
    previewSurface: '#dedad2',
    previewBorder: 'rgba(9, 9, 11, 0.45)',
    isDark: false,
  },
];

export const THEME_STORAGE_KEY = 'grimoire-theme';

export function applyTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') return;
  const legacyMap: Record<string, ThemeId> = {
    'prism-arcana': 'parchment-ink',
    'night-theme': 'midnight-arcana',
    'midnight-arcana-legacy': 'midnight-arcana',
  };
  const normalizedId: ThemeId =
    (legacyMap[themeId as string] as ThemeId | undefined) ?? (themeId as ThemeId);
  const theme = THEMES.find((t) => t.id === normalizedId) ?? THEMES[0]!;
  document.documentElement.setAttribute('data-theme', theme.id);
  if (theme.isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
}

export function useTheme() {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return 'parchment-ink';
    try {
      const storedRaw = window.localStorage.getItem(THEME_STORAGE_KEY) as string | null;
      const legacyStoredMap: Record<string, ThemeId> = {
        'prism-arcana': 'parchment-ink',
        'night-theme': 'midnight-arcana',
      };
      const stored =
        storedRaw !== null
          ? ((legacyStoredMap[storedRaw] as ThemeId | undefined) ?? (storedRaw as ThemeId))
          : null;
      if (stored && THEMES.some((t) => t.id === stored)) {
        return stored;
      }
    } catch {
      // Ignore localStorage access failures
    }
    return 'parchment-ink';
  });

  const setTheme = useCallback((id: ThemeId) => {
    const legacyMap: Record<string, ThemeId> = {
      'prism-arcana': 'parchment-ink',
      'night-theme': 'midnight-arcana',
      'midnight-arcana-legacy': 'midnight-arcana',
    };
    const normalized = (legacyMap[id as string] as ThemeId | undefined) ?? id;
    setThemeIdState(normalized);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch {
      // Ignore write errors
    }
    applyTheme(normalized);
    window.dispatchEvent(new CustomEvent('gm-theme-change', { detail: normalized }));
  }, []);

  useEffect(() => {
    applyTheme(themeId);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as ThemeId;
        if (THEMES.some((t) => t.id === newTheme)) {
          setThemeIdState(newTheme);
          applyTheme(newTheme);
        }
      }
    };

    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeId>;
      if (customEvent.detail && THEMES.some((t) => t.id === customEvent.detail)) {
        setThemeIdState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('gm-theme-change', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('gm-theme-change', handleCustom);
    };
  }, [themeId]);

  const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;

  return {
    theme: currentTheme,
    themeId,
    setTheme,
    themes: THEMES,
  };
}
