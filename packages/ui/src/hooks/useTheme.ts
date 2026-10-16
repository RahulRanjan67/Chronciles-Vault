import { useCallback, useEffect, useState } from 'react';

export type ThemeId = 'prism-arcana' | 'parchment-ink' | 'xianxia-realm' | 'ink' | 'midnight-arcana';

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
    id: 'prism-arcana',
    name: 'Prism Arcana',
    tagline: 'Prism White & Royal Indigo',
    previewBg: '#f4f7ff',
    previewAccent: '#4f46e5',
    previewSecondary: '#059669',
    previewSurface: '#ffffff',
    previewBorder: 'rgba(79, 70, 229, 0.34)',
    isDark: false,
  },
  {
    id: 'parchment-ink',
    name: 'Antique Parchment',
    tagline: '300-Year-Old Pages',
    previewBg: '#f5e6d3',
    previewAccent: '#d97706',
    previewSecondary: '#b45309',
    previewSurface: '#faf0e6',
    previewBorder: 'rgba(180, 83, 9, 0.38)',
    isDark: false,
  },
  {
    id: 'xianxia-realm',
    name: 'Blossom Ascendant',
    tagline: 'Pink-Purple Xianxia Realm',
    previewBg: '#fdf2f8',
    previewAccent: '#e11d48',
    previewSecondary: '#db2777',
    previewSurface: '#fce7f3',
    previewBorder: 'rgba(219, 39, 119, 0.36)',
    isDark: false,
  },
  {
    id: 'ink',
    name: 'Ink',
    tagline: 'Pure White & Stark Black',
    previewBg: '#ffffff',
    previewAccent: '#09090b',
    previewSecondary: '#dc2626',
    previewSurface: '#f4f4f5',
    previewBorder: 'rgba(9, 9, 11, 0.45)',
    isDark: false,
  },
  {
    id: 'midnight-arcana',
    name: 'Midnight Arcana',
    tagline: 'Dark Blues & Violets',
    previewBg: '#0f172a',
    previewAccent: '#6366f1',
    previewSecondary: '#8b5cf6',
    previewSurface: '#1e293b',
    previewBorder: 'rgba(99, 102, 241, 0.40)',
    isDark: true,
  },
];

export const THEME_STORAGE_KEY = 'chronicles-vault-theme';

export function applyTheme(themeId: ThemeId) {
  if (typeof document === 'undefined') return;
  const legacyMap: Record<string, ThemeId> = {
    'night-theme': 'midnight-arcana',
    'midnight-arcana-legacy': 'prism-arcana',
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
    if (typeof window === 'undefined') return 'prism-arcana';
    try {
      const storedRaw = window.localStorage.getItem(THEME_STORAGE_KEY) as string | null;
      const legacyStoredMap: Record<string, ThemeId> = {
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
    return 'prism-arcana';
  });

  const setTheme = useCallback((id: ThemeId) => {
    const legacyMap: Record<string, ThemeId> = {
      'night-theme': 'midnight-arcana',
      'midnight-arcana-legacy': 'prism-arcana',
    };
    const normalized = (legacyMap[id as string] as ThemeId | undefined) ?? id;
    setThemeIdState(normalized);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch {
      // Ignore write errors
    }
    applyTheme(normalized);
    window.dispatchEvent(new CustomEvent('cv-theme-change', { detail: normalized }));
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
    window.addEventListener('cv-theme-change', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cv-theme-change', handleCustom);
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
