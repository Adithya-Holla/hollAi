export const INTRO_KEY = 'hollai:intro';

/**
 * Decides whether the opening cinematic runs.
 *
 * Storage access throws in some private-browsing modes, so every read and
 * write is guarded — a storage failure must never cost the visitor the site.
 *
 * Reduced motion does NOT suppress the intro. It still plays, held static:
 * the imagery survives, the motion does not.
 */
export function shouldPlayIntro({ storage, search = '' }) {
  // Parsed rather than substring-matched, so ?utm_source=introvert is not a
  // replay trigger.
  try {
    if (new URLSearchParams(search).has('intro')) return true;
  } catch {
    /* malformed query string — fall through to the storage check */
  }

  try {
    return storage.getItem(INTRO_KEY) !== '1';
  } catch {
    return true;
  }
}

export function markIntroSeen(storage) {
  try {
    storage.setItem(INTRO_KEY, '1');
  } catch {
    /* private browsing — the intro simply replays on the next navigation */
  }
}

export function clearIntroSeen(storage) {
  try {
    storage.removeItem(INTRO_KEY);
  } catch {
    /* nothing to do — the replay link falls back to ?intro */
  }
}
