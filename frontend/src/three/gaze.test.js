import { gazeAt, blinkAt } from './gaze';

describe('gazeAt', () => {
  test('is deterministic for a given seed', () => {
    expect(gazeAt(3.4)).toEqual(gazeAt(3.4));
  });

  test('a different seed looks somewhere else', () => {
    expect(gazeAt(3.4, { seed: 1 })).not.toEqual(gazeAt(3.4, { seed: 2 }));
  });

  test('stays within the amplitude, drift included', () => {
    for (let t = 0; t < 60; t += 0.05) {
      const { x, y } = gazeAt(t, { amplitude: 1 });
      expect(Math.abs(x)).toBeLessThanOrEqual(1.1);
      expect(Math.abs(y)).toBeLessThanOrEqual(1.1);
    }
  });

  test('amplitude scales the result', () => {
    const a = gazeAt(4.2, { amplitude: 1, drift: 0 });
    const b = gazeAt(4.2, { amplitude: 0.5, drift: 0 });
    expect(b.x).toBeCloseTo(a.x * 0.5, 6);
    expect(b.y).toBeCloseTo(a.y * 0.5, 6);
  });

  // The load-bearing one: a naive implementation snaps at every fixation
  // boundary, which reads as the eyes teleporting.
  test('never jumps, including across fixation boundaries', () => {
    let prev = gazeAt(0);
    for (let t = 0.01; t < 40; t += 0.01) {
      const cur = gazeAt(t);
      const step = Math.hypot(cur.x - prev.x, cur.y - prev.y);
      expect(step).toBeLessThan(0.2);
      prev = cur;
    }
  });

  test('actually moves — it is not a constant', () => {
    const samples = [0, 2.5, 5, 7.5, 10].map((t) => gazeAt(t, { drift: 0 }));
    const unique = new Set(samples.map((s) => `${s.x.toFixed(4)},${s.y.toFixed(4)}`));
    expect(unique.size).toBeGreaterThan(3);
  });

  test('holds still between flicks', () => {
    // Mid-fixation, well clear of a saccade, movement should be tiny.
    const a = gazeAt(1.0);
    const b = gazeAt(1.2);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(0.06);
  });

  test('flicks quickly when it does move', () => {
    // Straddling a fixation boundary, movement should be far larger.
    const a = gazeAt(2.09);
    const b = gazeAt(2.29);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(0.1);
  });

  test('handles negative time without producing NaN', () => {
    const { x, y } = gazeAt(-5);
    expect(Number.isFinite(x)).toBe(true);
    expect(Number.isFinite(y)).toBe(true);
  });
});

describe('blinkAt', () => {
  test('is fully open for most of the cycle', () => {
    expect(blinkAt(2)).toBe(1);
    expect(blinkAt(4)).toBe(1);
  });

  test('closes to nearly nothing at the middle of a blink', () => {
    expect(blinkAt(0.065, { every: 5.3, duration: 0.13 })).toBeLessThan(0.15);
  });

  test('opens and closes continuously, never inverting', () => {
    for (let t = 0; t < 30; t += 0.005) {
      const v = blinkAt(t);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  test('repeats on its period', () => {
    expect(blinkAt(0.05)).toBeCloseTo(blinkAt(5.3 + 0.05), 6);
  });
});
