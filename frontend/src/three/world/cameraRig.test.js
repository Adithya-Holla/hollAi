import { targetForRoute, RAILS } from './cameraRig';

describe('targetForRoute', () => {
  test('sits at the rail start when nothing is scrolled', () => {
    expect(targetForRoute('/', 0)).toEqual(RAILS['/'].from);
  });

  test('reaches the rail end at full scroll', () => {
    expect(targetForRoute('/', 1)).toEqual(RAILS['/'].to);
  });

  test('interpolates linearly at the midpoint', () => {
    const [, , z] = targetForRoute('/', 0.5);
    const expected = (RAILS['/'].from[2] + RAILS['/'].to[2]) / 2;
    expect(z).toBeCloseTo(expected);
  });

  test('Home dollies forward as the visitor scrolls', () => {
    // Forward is -z, so the target must decrease monotonically.
    const near = targetForRoute('/', 0)[2];
    const far = targetForRoute('/', 1)[2];
    expect(far).toBeLessThan(near);
  });

  test('Contact reverses the move and pulls back into the dark', () => {
    const start = targetForRoute('/contact', 0)[2];
    const end = targetForRoute('/contact', 1)[2];
    expect(end).toBeGreaterThan(start);
  });

  test('falls back to a still rail for an unknown route', () => {
    expect(() => targetForRoute('/nonexistent', 0.5)).not.toThrow();
    expect(targetForRoute('/nonexistent', 0.5)).toHaveLength(3);
  });

  test('every rail is a well-formed pair of 3D points', () => {
    Object.values(RAILS).forEach((rail) => {
      expect(rail.from).toHaveLength(3);
      expect(rail.to).toHaveLength(3);
      [...rail.from, ...rail.to].forEach((n) => expect(Number.isFinite(n)).toBe(true));
    });
  });
});
