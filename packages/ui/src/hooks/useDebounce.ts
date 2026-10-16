import { useEffect, useState } from 'react';

/**
 * Returns a debounced version of the provided value.
 * The debounced value only updates after the value
 * has stopped changing for `delayMs` milliseconds.
 *
 * @param value The value to debounce
 * @param delayMs Debounce delay in ms (default: 300)
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
