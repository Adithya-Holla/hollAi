export const MOBILE_BREAKPOINT = 768;

/**
 * Resolves the render tier once at startup.
 *
 *   high   — full geometry spectacles, env reflections, area light, dpr [1,2]
 *   low    — shader spectacles, no area light, no light shaft, dpr [1,1.5]
 *   static — one frame, then frozen (or no canvas at all without WebGL)
 *
 * Deliberately does not read prefers-reduced-motion: the intro and ambient
 * scene always run at full motion regardless of the OS preference.
 *
 * Safari does not implement navigator.deviceMemory, so an absent value is
 * treated as capable rather than weak — otherwise every Mac would be demoted.
 */
export function resolveQuality({
  deviceMemory,
  hardwareConcurrency,
  width,
  hasWebGL,
}) {
  if (!hasWebGL) return 'static';
  if (width < MOBILE_BREAKPOINT) return 'low';
  if (typeof deviceMemory === 'number' && deviceMemory <= 4) return 'low';
  if (typeof hardwareConcurrency === 'number' && hardwareConcurrency <= 4) return 'low';
  return 'high';
}

export function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function resolveQualityFromEnvironment() {
  if (typeof window === 'undefined') return 'static';
  return resolveQuality({
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    width: window.innerWidth,
    hasWebGL: detectWebGL(),
  });
}
