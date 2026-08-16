/** Small, fast, seedable PRNG. A deterministic seam survives a reload. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Points describing a torn diagonal across a [-1, 1] plane, running from the
 * top-left corner to the bottom-right.
 *
 * Displacement is perpendicular to the diagonal and tapered to zero at both
 * ends, so the halves always meet the corners exactly — without that, the
 * cover would not fully hide the page and the site would be visible before
 * the tear. Because the displacement direction is perpendicular, it cannot
 * make the seam double back on itself.
 *
 * Two octaves of noise make the edge fibrous rather than merely wavy.
 */
export function generateSeam({ segments = 32, seed = 1, amplitude = 0.18 } = {}) {
  const rand = mulberry32(seed);
  const coarse = Array.from({ length: segments + 1 }, () => rand() * 2 - 1);
  const fine = Array.from({ length: segments + 1 }, () => rand() * 2 - 1);

  // Unit perpendicular to the (1, -1) diagonal.
  const px = Math.SQRT1_2;
  const py = Math.SQRT1_2;

  return Array.from({ length: segments + 1 }, (_, i) => {
    if (i === 0) return [-1, 1];
    if (i === segments) return [1, -1];

    const t = i / segments;
    const baseX = -1 + 2 * t;
    const baseY = 1 - 2 * t;

    const taper = Math.sin(Math.PI * t);
    const noise = coarse[i] * 0.7 + fine[i] * 0.3;
    const offset = noise * amplitude * taper;

    return [
      Math.min(1, Math.max(-1, baseX + px * offset)),
      Math.min(1, Math.max(-1, baseY + py * offset)),
    ];
  });
}
