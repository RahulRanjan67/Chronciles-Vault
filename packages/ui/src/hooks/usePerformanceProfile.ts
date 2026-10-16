import * as React from 'react';

export type PerformanceProfileMode = 'auto' | 'full' | 'balanced' | 'lite';
export type ResolvedPerformanceProfile = 'full' | 'balanced' | 'lite';

export interface PerformanceProfileCapabilities {
  readonly mode: PerformanceProfileMode;
  readonly resolvedProfile: ResolvedPerformanceProfile;
  readonly label: string;
  readonly description: string;
  readonly backdropBlur: boolean;
  readonly heavyShadows: boolean;
  readonly complexMotion: boolean;
  readonly prefetchEnabled: boolean;
  readonly virtualBufferItems: number;
  readonly pollingIntervalMinutes: number | null;
  readonly webtoonCanvasBuffer: number;
}

export interface PerformanceProfileOption {
  readonly id: PerformanceProfileMode;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
}

export const PERFORMANCE_PROFILES: readonly PerformanceProfileOption[] = [
  {
    id: 'auto',
    name: 'Auto (Hardware Adaptive)',
    tagline: 'System-detected',
    description:
      'Automatically selects Full, Balanced, or Lite based on CPU cores, memory, and OS reduced-motion preferences.',
  },
  {
    id: 'full',
    name: 'Full / High-End',
    tagline: '80-item buffer · 32px glass',
    description:
      'Maximum visual fidelity with deep glass blur, ambient glow shadows, 80-item virtual buffer, and continuous sync.',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    tagline: '40-item buffer · 16px glass',
    description:
      'Default profile for modern laptops and desktops. 16px modal blur, 40-item virtual buffer, and 30-minute background polling.',
  },
  {
    id: 'lite',
    name: 'Lite (Low Power)',
    tagline: '20-item buffer · Zero blur',
    description:
      'Disables backdrop blur, heavy shadows, route prefetching, and complex motion. Keeps only a 20-item virtual buffer.',
  },
] as const;

const STORAGE_KEY = 'cv:perf-profile';
const CHANGE_EVENT = 'cv-perf-profile-change';

export function detectHardwareProfile(): ResolvedPerformanceProfile {
  if (typeof window === 'undefined') {
    return 'balanced';
  }
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return 'lite';
    }
    const nav = window.navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency ?? 4;
    const memory = nav.deviceMemory;

    if (cores <= 2 || (typeof memory === 'number' && memory <= 2)) {
      return 'lite';
    }
    if (cores >= 8 && (memory === undefined || memory >= 8)) {
      return 'full';
    }
  } catch {
    // Fallback to balanced
  }
  return 'balanced';
}

export function resolvePerformanceProfile(
  mode: PerformanceProfileMode,
): ResolvedPerformanceProfile {
  if (mode === 'auto') {
    return detectHardwareProfile();
  }
  return mode;
}

export function getProfileCapabilities(
  mode: PerformanceProfileMode,
  resolvedOverride?: ResolvedPerformanceProfile,
): PerformanceProfileCapabilities {
  const resolved = resolvedOverride ?? resolvePerformanceProfile(mode);
  switch (resolved) {
    case 'lite':
      return {
        mode,
        resolvedProfile: 'lite',
        label: 'Lite',
        description: 'Flat opaque surfaces, 20-item virtual buffer, manual sync only, instant transitions.',
        backdropBlur: false,
        heavyShadows: false,
        complexMotion: false,
        prefetchEnabled: false,
        virtualBufferItems: 20,
        pollingIntervalMinutes: null,
        webtoonCanvasBuffer: 3,
      };
    case 'full':
      return {
        mode,
        resolvedProfile: 'full',
        label: 'Full',
        description: '32px glass blur, glow shadows, 80-item virtual buffer, 12-page canvas lookahead.',
        backdropBlur: true,
        heavyShadows: true,
        complexMotion: true,
        prefetchEnabled: true,
        virtualBufferItems: 80,
        pollingIntervalMinutes: 5,
        webtoonCanvasBuffer: 12,
      };
    case 'balanced':
    default:
      return {
        mode,
        resolvedProfile: 'balanced',
        label: 'Balanced',
        description: '16px glass blur, standard shadows, 40-item virtual buffer, 6-page canvas lookahead.',
        backdropBlur: true,
        heavyShadows: true,
        complexMotion: true,
        prefetchEnabled: true,
        virtualBufferItems: 40,
        pollingIntervalMinutes: 30,
        webtoonCanvasBuffer: 6,
      };
  }
}

function readStoredMode(): PerformanceProfileMode {
  if (typeof window === 'undefined') return 'auto';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'auto' || raw === 'full' || raw === 'balanced' || 'lite' === raw) {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'auto';
}

function applyProfileToDocument(resolved: ResolvedPerformanceProfile): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-perf-profile', resolved);
}

export function usePerformanceProfile() {
  const [mode, setModeState] = React.useState<PerformanceProfileMode>(readStoredMode);

  const resolvedProfile = React.useMemo(() => resolvePerformanceProfile(mode), [mode]);

  React.useEffect(() => {
    applyProfileToDocument(resolvedProfile);
  }, [resolvedProfile]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorageOrCustom = () => {
      const latest = readStoredMode();
      setModeState(latest);
      applyProfileToDocument(resolvePerformanceProfile(latest));
    };
    window.addEventListener('storage', handleStorageOrCustom);
    window.addEventListener(CHANGE_EVENT, handleStorageOrCustom);
    return () => {
      window.removeEventListener('storage', handleStorageOrCustom);
      window.removeEventListener(CHANGE_EVENT, handleStorageOrCustom);
    };
  }, []);

  const setProfileMode = React.useCallback((nextMode: PerformanceProfileMode) => {
    setModeState(nextMode);
    const resolved = resolvePerformanceProfile(nextMode);
    applyProfileToDocument(resolved);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, nextMode);
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
      } catch {
        // ignore
      }
    }
  }, []);

  const capabilities = React.useMemo(
    () => getProfileCapabilities(mode, resolvedProfile),
    [mode, resolvedProfile],
  );

  return {
    ...capabilities,
    setProfileMode,
    profiles: PERFORMANCE_PROFILES,
  };
}
