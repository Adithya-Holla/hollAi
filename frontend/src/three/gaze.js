import { mulberry32 } from './intro/seam';

/** Seconds a gaze rests on one point before moving to the next. */
const FIXATION = 2.1;
/** How long the jump between points takes. Real saccades are very fast. */
const SACCADE = 0.14;

/** Seconds between blinks, and how long one lasts. */
const BLINK_EVERY = 5.3;
const BLINK_TIME = 0.13;

/** Where the gaze rests during fixation `i`. Deterministic per seed. */
function restPoint(i, seed) {
  // Offset so index -1 is valid at t = 0.
  const rand = mulberry32(seed + (i + 1) * 7919);
  return { x: rand() * 2 - 1, y: rand() * 2 - 1 };
}

/**
 * Eye position at time `t`, normalised to roughly -1..1 on each axis.
 *
 * Eyes do not drift smoothly around — they hold still, flick to a new point,
 * and hold again. Modelling that (rather than a sine wave) is the difference
 * between something that looks alive and something that looks like it is
 * floating.
 *
 * Continuous by construction: a fixation starts from the previous fixation's
 * rest point, which is exactly where the gaze already was.
 */
export function gazeAt(t, { seed = 7, amplitude = 1, drift = 0.05 } = {}) {
  const safeT = Math.max(0, t);
  const i = Math.floor(safeT / FIXATION);
  const local = safeT - i * FIXATION;

  const from = restPoint(i - 1, seed);
  const to = restPoint(i, seed);

  const p = Math.min(local / SACCADE, 1);
  const eased = p * p * (3 - 2 * p);

  // Micro-drift during the hold, so a resting eye is never perfectly frozen.
  const dx = Math.sin(safeT * 2.7 + i) * drift;
  const dy = Math.cos(safeT * 2.1 + i * 1.7) * drift;

  return {
    x: (from.x + (to.x - from.x) * eased + dx) * amplitude,
    y: (from.y + (to.y - from.y) * eased + dy) * amplitude,
  };
}

/**
 * Vertical eye scale at time `t`: 1 when open, dipping to near zero for a
 * blink. Multiplying the eye's y-scale by this is enough to read as a blink
 * even without an eyelid to draw.
 */
export function blinkAt(t, { every = BLINK_EVERY, duration = BLINK_TIME } = {}) {
  const safeT = Math.max(0, t);
  const local = safeT % every;
  if (local > duration) return 1;

  // Down and back up across the blink.
  const p = local / duration;
  return 1 - Math.sin(Math.PI * p) * 0.94;
}
