import { generateSeam, mulberry32 } from './seam';

const base = { segments: 24, seed: 7, amplitude: 0.18 };

describe('mulberry32', () => {
  test('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  test('different seeds diverge', () => {
    expect(mulberry32(1)()).not.toEqual(mulberry32(2)());
  });

  test('stays within [0, 1)', () => {
    const rand = mulberry32(1);
    for (let i = 0; i < 500; i += 1) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('generateSeam', () => {
  test('produces segments + 1 points', () => {
    expect(generateSeam(base)).toHaveLength(25);
  });

  // The corner anchoring tests are the load-bearing ones: if the seam misses
  // a corner, the two halves do not cover the viewport and the site is
  // visible before the tear.
  test('anchors exactly to the top-left corner', () => {
    expect(generateSeam(base)[0]).toEqual([-1, 1]);
  });

  test('anchors exactly to the bottom-right corner', () => {
    const pts = generateSeam(base);
    expect(pts[pts.length - 1]).toEqual([1, -1]);
  });

  test('anchors hold for any seed', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const pts = generateSeam({ ...base, seed });
      expect(pts[0]).toEqual([-1, 1]);
      expect(pts[pts.length - 1]).toEqual([1, -1]);
    }
  });

  test('is deterministic for a given seed', () => {
    expect(generateSeam(base)).toEqual(generateSeam(base));
  });

  test('a different seed produces a different tear', () => {
    expect(generateSeam(base)).not.toEqual(generateSeam({ ...base, seed: 8 }));
  });

  test('interior points deviate from the straight diagonal', () => {
    const pts = generateSeam(base);
    const straight = pts.slice(1, -1).every(([x, y], i) => {
      const t = (i + 1) / base.segments;
      return Math.abs(x - (-1 + 2 * t)) < 1e-9 && Math.abs(y - (1 - 2 * t)) < 1e-9;
    });
    expect(straight).toBe(false);
  });

  test('deviation never exceeds the amplitude', () => {
    generateSeam(base).forEach(([x, y], i) => {
      const t = i / base.segments;
      const dx = x - (-1 + 2 * t);
      const dy = y - (1 - 2 * t);
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(base.amplitude + 1e-9);
    });
  });

  test('stays within the plane bounds even at high amplitude', () => {
    generateSeam({ ...base, amplitude: 0.5 }).forEach(([x, y]) => {
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
      expect(Math.abs(y)).toBeLessThanOrEqual(1);
    });
  });

  test('progresses monotonically along the diagonal', () => {
    // A seam that doubles back on itself produces self-intersecting geometry.
    const pts = generateSeam(base);
    for (let i = 1; i < pts.length; i += 1) {
      const prev = pts[i - 1][0] - pts[i - 1][1];
      const cur = pts[i][0] - pts[i][1];
      expect(cur).toBeGreaterThan(prev);
    }
  });

  test('is usable with default arguments', () => {
    expect(generateSeam().length).toBeGreaterThan(2);
  });
});
