import { useEffect, useRef, useState } from 'react';

export interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  /** Once true, stop observing (used for lazy load) */
  once?: boolean;
}

/**
 * Efficient IntersectionObserver hook.
 * Returns [ref, isIntersecting] pair.
 *
 * @example
 * const [ref, visible] = useIntersectionObserver({ once: true });
 * return <img ref={ref} src={visible ? src : undefined} />;
 */
export function useIntersectionObserver<T extends Element = Element>(
  options: IntersectionObserverOptions = {}
): [React.RefObject<T | null>, boolean] {
  const { root = null, rootMargin = '0px', threshold = 0, once = false } = options;
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: treat as visible
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsIntersecting(false);
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, once]);

  return [ref, isIntersecting];
}
