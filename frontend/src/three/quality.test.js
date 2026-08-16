import { resolveQuality, MOBILE_BREAKPOINT } from './quality';

const desktop = {
  deviceMemory: 8,
  hardwareConcurrency: 8,
  width: 1920,
  prefersReducedMotion: false,
  hasWebGL: true,
};

describe('resolveQuality', () => {
  test('gives a capable desktop the full experience', () => {
    expect(resolveQuality(desktop)).toBe('high');
  });

  test('reduced motion wins over every capability signal', () => {
    expect(resolveQuality({ ...desktop, prefersReducedMotion: true })).toBe('static');
  });

  test('no WebGL means static regardless of hardware', () => {
    expect(resolveQuality({ ...desktop, hasWebGL: false })).toBe('static');
  });

  test('a narrow viewport drops to low', () => {
    expect(resolveQuality({ ...desktop, width: 480 })).toBe('low');
  });

  test('the breakpoint itself is still high', () => {
    expect(resolveQuality({ ...desktop, width: MOBILE_BREAKPOINT })).toBe('high');
  });

  test('low memory drops to low', () => {
    expect(resolveQuality({ ...desktop, deviceMemory: 2 })).toBe('low');
  });

  test('few cores drops to low', () => {
    expect(resolveQuality({ ...desktop, hardwareConcurrency: 2 })).toBe('low');
  });

  test('assumes capable hardware when the browser reports nothing', () => {
    // Safari does not implement deviceMemory. Treating "unknown" as "weak"
    // would demote every Mac visitor.
    const unknown = { width: 1440, prefersReducedMotion: false, hasWebGL: true };
    expect(resolveQuality(unknown)).toBe('high');
  });
});
