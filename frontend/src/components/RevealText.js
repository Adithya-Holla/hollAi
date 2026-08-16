import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * Per-character reveal that resolves each glyph out of blur rather than
 * fading it in. The blur is the point: it reads as a lens pulling focus,
 * where a stagger-fade reads as a typewriter.
 *
 * The wrapper carries the aria-label and the glyphs are hidden from the
 * accessibility tree, so a screen reader announces the word rather than
 * spelling it out.
 */
function RevealText({ text, delay = 0, charDelay = 22, className = '', as: Tag = 'span' }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const spans = node.querySelectorAll('[data-char]');

    if (reduced) {
      spans.forEach((span) => span.classList.add('is-in'));
      return undefined;
    }

    const timers = Array.from(spans).map((span, i) =>
      setTimeout(() => span.classList.add('is-in'), delay + i * charDelay)
    );

    return () => timers.forEach(clearTimeout);
  }, [delay, charDelay, reduced, text]);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={`${ch}-${i}`}
          data-char
          className="reveal-char"
          aria-hidden="true"
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </Tag>
  );
}

export default RevealText;
