import { shouldPlayIntro, markIntroSeen, INTRO_KEY } from './introGate';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

describe('shouldPlayIntro', () => {
  test('plays on a first visit', () => {
    expect(shouldPlayIntro({ storage: fakeStorage(), search: '' })).toBe(true);
  });

  test('does not replay once the session flag is set', () => {
    const storage = fakeStorage({ [INTRO_KEY]: '1' });
    expect(shouldPlayIntro({ storage, search: '' })).toBe(false);
  });

  test('?intro forces a replay even when already seen', () => {
    const storage = fakeStorage({ [INTRO_KEY]: '1' });
    expect(shouldPlayIntro({ storage, search: '?intro' })).toBe(true);
  });

  test('still plays under reduced motion, as a static hold', () => {
    // Reduced motion removes the animation, not the imagery.
    const opts = { storage: fakeStorage(), search: '', prefersReducedMotion: true };
    expect(shouldPlayIntro(opts)).toBe(true);
  });

  test('survives storage being unavailable in private browsing', () => {
    const throwing = {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('SecurityError'); },
    };
    expect(shouldPlayIntro({ storage: throwing, search: '' })).toBe(true);
  });

  test('is not fooled by an unrelated query parameter', () => {
    const storage = fakeStorage({ [INTRO_KEY]: '1' });
    expect(shouldPlayIntro({ storage, search: '?utm_source=introvert' })).toBe(false);
  });
});

describe('markIntroSeen', () => {
  test('writes the session flag', () => {
    const storage = fakeStorage();
    markIntroSeen(storage);
    expect(storage.getItem(INTRO_KEY)).toBe('1');
  });

  test('does not throw when storage is blocked', () => {
    const throwing = {
      getItem: () => null,
      setItem: () => { throw new Error('nope'); },
    };
    expect(() => markIntroSeen(throwing)).not.toThrow();
  });
});
