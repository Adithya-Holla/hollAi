import { useEffect, useRef, useState } from 'react';

/**
 * Scroll-reveal via IntersectionObserver.
 *
 * Replaces the hand-rolled getBoundingClientRect checks that used to run on
 * every scroll event: those re-rendered the page continuously while scrolling
 * and forced layout on each call.
 *
 * Falls back to visible when the API is unavailable, so content is never
 * hidden by a missing browser feature.
 */
export function useInView({ threshold = 0.2, once = true, rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, inView];
}

export default useInView;
