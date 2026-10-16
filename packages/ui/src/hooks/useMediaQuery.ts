import { useEffect, useState } from 'react';

/**
 * Returns whether the given media query matches.
 * Automatically updates on viewport changes.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ─── Responsive breakpoint hooks ────────────────────────────────

/** < 640px — mobile only */
export const useIsMobile = () => useMediaQuery('(max-width: 639px)');

/** ≥ 640px */
export const useIsSm = () => useMediaQuery('(min-width: 640px)');

/** ≥ 768px — tablet+ */
export const useIsMd = () => useMediaQuery('(min-width: 768px)');

/** ≥ 1024px — desktop */
export const useIsLg = () => useMediaQuery('(min-width: 1024px)');

/** ≥ 1280px */
export const useIsXl = () => useMediaQuery('(min-width: 1280px)');

/** ≥ 1536px */
export const useIs2xl = () => useMediaQuery('(min-width: 1536px)');

/** true when sidebar should be shown (desktop layout) */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/** true when two-pane layout is available */
export const useIsTwoPane = () => useMediaQuery('(min-width: 768px)');
