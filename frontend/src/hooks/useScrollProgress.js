import { useEffect } from 'react';
import { setScroll, setPointer } from '../state/scene';

/**
 * Attaches the app's only scroll and pointer listeners and writes into the
 * module-level scene state.
 *
 * Deliberately returns nothing. Reading these values through React would
 * defeat the entire point — the render loop reads them directly inside
 * useFrame, so the tree never re-renders on scroll.
 */
export function useScrollProgress() {
  useEffect(() => {
    let frame = 0;

    const readScroll = () => {
      frame = 0;
      setScroll(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
    };

    // Coalesce bursts of scroll events into one read per frame.
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(readScroll);
    };

    const onPointer = (e) => {
      setPointer(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    };

    readScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);
}

export default useScrollProgress;
