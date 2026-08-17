import React, { useEffect, useRef } from 'react';
import { sceneState } from '../state/scene';
import '../styles/CursorHalo.css';

/** Elements that make the halo open up when the pointer is over them. */
const INTERACTIVE = 'a, button, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])';

/**
 * A two-part cursor: a dot pinned to the pointer and a ring that trails it.
 *
 * The ring uses mix-blend-mode: difference, so it inverts whatever it crosses
 * — bone type, project images, the 3D world — instead of needing a colour
 * that works everywhere.
 *
 * Position is read from the shared scene state, which already has a pointer
 * listener, and written straight to transforms in a rAF loop. Nothing here
 * touches React state, so moving the mouse never re-renders the page.
 */
function CursorHalo() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return undefined;

    // Pointer-driven decoration is meaningless without a pointer, and the
    // trailing ring is exactly the kind of motion reduced-motion users opt
    // out of.
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduced.matches) return undefined;

    document.body.classList.add('has-custom-cursor');

    let ringX = sceneState.pointerPx.x;
    let ringY = sceneState.pointerPx.y;
    let frame = 0;

    const tick = () => {
      const { x, y } = sceneState.pointerPx;

      // The ring lags; the dot does not. That difference is the whole effect.
      ringX += (x - ringX) * 0.16;
      ringY += (y - ringY) * 0.16;

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

      frame = requestAnimationFrame(tick);
    };

    const onOver = (e) => {
      const el = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null;
      ring.classList.toggle('is-open', Boolean(el));
    };

    const onDown = () => ring.classList.add('is-pressed');
    const onUp = () => ring.classList.remove('is-pressed');

    // Hidden until the pointer has actually moved, so it does not sit in the
    // top-left corner on load.
    const onFirstMove = () => {
      ring.classList.add('is-live');
      dot.classList.add('is-live');
      window.removeEventListener('pointermove', onFirstMove);
    };

    const onLeave = () => {
      ring.classList.remove('is-live');
      dot.classList.remove('is-live');
      window.addEventListener('pointermove', onFirstMove, { once: true });
    };

    if (sceneState.pointerSeen) onFirstMove();
    else window.addEventListener('pointermove', onFirstMove, { once: true });

    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointermove', onFirstMove);
      document.body.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <div className="cursor-ring" ref={ringRef} aria-hidden="true" />
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
    </>
  );
}

export default CursorHalo;
