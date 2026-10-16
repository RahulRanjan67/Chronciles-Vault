import { useCallback, useEffect, useState } from 'react';

/**
 * Typed localStorage hook.
 * Persists state across sessions. Falls back gracefully
 * when localStorage is unavailable (SSR, private browsing).
 *
 * @param key localStorage key
 * @param initialValue Default value when key is absent
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(next));
          }
          return next;
        });
      } catch {
        // Ignore write errors (e.g. quota exceeded)
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch {
      // Ignore
    }
  }, [key, initialValue]);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const newVal = e.newValue !== null ? (JSON.parse(e.newValue) as T) : initialValue;
        setStoredValue(newVal);
      } catch {
        // Ignore parse errors
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
