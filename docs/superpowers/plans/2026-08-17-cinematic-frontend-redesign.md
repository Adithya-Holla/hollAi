# Cinematic Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the hollAI portfolio frontend into a dark, cinematic, restrained experience — black-to-eyes-to-tear opening, a persistent scroll-driven 3D world, and editorial page layouts — without changing routes, data contracts, content, or the backend.

**Architecture:** A layout route (`SiteShell`) mounts one persistent R3F canvas behind the DOM and mounts nav/footer once. Scroll and pointer feed a module-level mutable store that 3D components read inside `useFrame`, so scrolling causes zero React re-renders. The intro is a separate, self-unmounting canvas layered above everything. All 3D is `React.lazy`-loaded so text paints without it.

**Tech Stack:** React 19, react-router-dom 7, CRA 5, `three`, `@react-three/fiber`, `@react-three/drei`, `gsap`, `@fontsource-variable/archivo`, `@fontsource-variable/jetbrains-mono`.

**Spec:** `docs/superpowers/specs/2026-08-17-cinematic-frontend-redesign-design.md`

## Global Constraints

- **Backend untouched.** Nothing under `backend/` is read or modified. No API contract changes.
- **Routes unchanged.** Exactly these seven: `/`, `/about`, `/projects`, `/certifications`, `/contact`, `/admin/login`, `/admin`.
- **Content preserved.** No copy is rewritten, shortened, or replaced with placeholders. This includes all five About accordion sections and the education details.
- **Admin keeps working.** `/admin/login` and `/admin` (Projects + Certifications CRUD, Dropbox image upload) must remain functional. They get tokens and dark palette only — no canvas, no intro, no 3D.
- **Data contracts fixed.** Project: `_id, title, description, technologies[], imageUrl, githubUrl, liveUrl, featured`. Certification: `_id, title, organization, issueDate, description, skills[], imageUrl, credentialURL, featured`. Contact: `POST /api/emails/contact` with `{ name, email, subject, message }`.
- **Palette, verbatim:** `--void #000000`, `--ink #0A0A0B`, `--charcoal #141416`, `--graphite #1E1E21`, `--smoke #6B6B70`, `--bone #E8E6E1`, `--signal #C4161C`.
- **Red is used in exactly three places sitewide:** the tear seam, the active nav indicator, hover/focus states. Nowhere else.
- **Banned visual language:** purple/blue gradients, glassmorphism, floating blobs, random spheres or cubes, particle fields, neon, glowing cards, large rounded cards, excessive shadows.
- **No WebGL postprocessing pass.** Vignette and grain are CSS only.
- **`prefers-reduced-motion` honored throughout**, not only in the intro.
- **Light mode is removed permanently.** No `isDarkMode` prop, no `dark-mode`/`light-mode` class branching anywhere.

---

## File Structure

**New:**

| File | Responsibility |
|---|---|
| `src/styles/tokens.css` | Palette, spacing, type scale as custom properties |
| `src/styles/typography.css` | `@font-face` wiring, display/mono classes, tracking |
| `src/styles/overlays.css` | Fixed grain + vignette layers |
| `src/components/layout/SiteShell.js` | Layout route: canvas + nav + `<Outlet/>` + footer |
| `src/state/scene.js` | Module-level mutable scene state + pure `computeProgress` |
| `src/state/introGate.js` | Pure `shouldPlayIntro` decision |
| `src/three/quality.js` | Pure `resolveQuality` device tiering |
| `src/three/intro/seam.js` | Pure noise-based torn-edge point generation |
| `src/three/intro/IntroSequence.js` | Intro canvas, GSAP timeline, self-unmount |
| `src/three/intro/Spectacles.js` | Frame + lens geometry, eyes, sweep light |
| `src/three/intro/TearPlane.js` | Two torn halves + seam-rim shader |
| `src/three/world/WorldCanvas.js` | Persistent canvas, dpr, frameloop, lifecycle |
| `src/three/world/BaseScene.js` | Floor, fog, key light, red rim |
| `src/three/world/cameraRig.js` | Per-route camera choreography from scroll |
| `src/hooks/useScrollProgress.js` | Attaches listeners, writes to scene state |
| `src/hooks/useReducedMotion.js` | Media-query hook |

**Modified:** `src/App.js`, `src/index.css`, `public/index.html`, all five public pages + their stylesheets, `Navbar.js` + CSS, `Footer.js` + CSS, `AdminPage.css`, `package.json`.

**Deleted:** `src/components/ThemeToggle.js`, `src/styles/ThemeToggle.css`.

---

## Task 1: Design tokens, fonts, and global overlays

Purely additive. Nothing is removed yet, so the site keeps working throughout.

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/typography.css`, `src/styles/overlays.css`
- Modify: `frontend/package.json`, `src/index.css`, `src/index.js`

**Interfaces:**
- Consumes: nothing
- Produces: CSS custom properties `--void --ink --charcoal --graphite --smoke --bone --signal`, `--font-display`, `--font-mono`, and type-scale vars `--step--1` through `--step-6`; utility classes `.t-display`, `.t-mono`, `.t-body`; overlay elements `.grain`, `.vignette`

- [ ] **Step 1: Install the font packages**

Run from `frontend/`:

```bash
npm install @fontsource-variable/archivo @fontsource-variable/jetbrains-mono
```

These vendor the `woff2` files into `node_modules` and are bundled by webpack — self-hosted, no external requests, no layout shift from a third-party CDN.

- [ ] **Step 2: Create `src/styles/tokens.css`**

```css
:root {
  /* Palette — see spec §4. Do not add colors to this list. */
  --void: #000000;
  --ink: #0A0A0B;
  --charcoal: #141416;
  --graphite: #1E1E21;
  --smoke: #6B6B70;
  --bone: #E8E6E1;
  --signal: #C4161C;

  /* Fluid type scale */
  --step--1: clamp(0.69rem, 0.67rem + 0.10vw, 0.75rem);
  --step-0:  clamp(0.88rem, 0.84rem + 0.18vw, 1.00rem);
  --step-1:  clamp(1.05rem, 0.97rem + 0.39vw, 1.33rem);
  --step-2:  clamp(1.26rem, 1.11rem + 0.73vw, 1.78rem);
  --step-3:  clamp(1.51rem, 1.27rem + 1.23vw, 2.37rem);
  --step-4:  clamp(1.81rem, 1.43rem + 1.94vw, 3.16rem);
  --step-5:  clamp(2.18rem, 1.59rem + 2.94vw, 4.21rem);
  --step-6:  clamp(2.61rem, 1.73rem + 4.40vw, 5.61rem);

  /* Rhythm */
  --gutter: clamp(1.25rem, 4vw, 4rem);
  --measure: 62ch;
  --rule: 1px solid var(--graphite);

  /* Motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root { --ease-out: linear; --ease-in-out: linear; }
}
```

- [ ] **Step 3: Create `src/styles/typography.css`**

```css
@import '@fontsource-variable/archivo/index.css';
@import '@fontsource-variable/jetbrains-mono/index.css';

:root {
  --font-display: 'Archivo Variable', 'Arial Narrow', Arial, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, 'Cascadia Mono', Consolas, monospace;
}

.t-display {
  font-family: var(--font-display);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 0.92;
  text-transform: uppercase;
  color: var(--bone);
}

.t-mono {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: var(--step--1);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--smoke);
}

.t-body {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--step-0);
  letter-spacing: 0;
  line-height: 1.65;
  text-transform: none;
  color: var(--smoke);
  max-width: var(--measure);
}
```

- [ ] **Step 4: Create `src/styles/overlays.css`**

The grain is not decoration — dark gradients band visibly on 8-bit displays and this is what prevents it.

```css
.grain,
.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 90;
}

.grain {
  opacity: 0.035;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
}

.vignette {
  background: radial-gradient(
    ellipse at 50% 45%,
    transparent 40%,
    rgba(0, 0, 0, 0.55) 100%
  );
}
```

- [ ] **Step 5: Wire them into `src/index.css`**

Replace the three `@tailwind` lines at the top with the token imports, keeping the rest of the file intact. Tailwind stays installed because `Footer.js` still uses a few utility classes; it is removed in Task 13.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/tokens.css';
@import './styles/typography.css';
@import './styles/overlays.css';

/* ...existing rules below unchanged... */
```

Then change the `body` rule's `font-family` to `var(--font-display)` and add `background: var(--void); color: var(--bone);`.

- [ ] **Step 6: Verify the build compiles and fonts resolve**

```bash
cd frontend && npm run build
```

Expected: build succeeds. Then `npm start`, open `/`, and confirm in DevTools that `getComputedStyle(document.body).fontFamily` reports Archivo and that no network request goes to `fonts.googleapis.com`.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/styles frontend/src/index.css
git commit -m "Add design tokens, self-hosted fonts, and grain/vignette overlays"
```

---

## Task 2: Pure state and decision modules

All four modules here are pure and fully unit-testable. Building them first means the 3D tasks have tested foundations to sit on.

**Files:**
- Create: `src/state/scene.js`, `src/state/introGate.js`, `src/three/quality.js`, `src/hooks/useReducedMotion.js`
- Test: `src/state/scene.test.js`, `src/state/introGate.test.js`, `src/three/quality.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `sceneState` — mutable object `{ scrollY, progress, pointer: {x, y}, route, introDone, quality }`
  - `computeProgress(scrollY, docHeight, viewportHeight) -> number` clamped 0..1
  - `setPointer(clientX, clientY, w, h)` writes normalized −1..1 into `sceneState.pointer`
  - `shouldPlayIntro({ storage, search, prefersReducedMotion }) -> boolean`
  - `markIntroSeen(storage)`
  - `resolveQuality({ deviceMemory, hardwareConcurrency, width, prefersReducedMotion, hasWebGL }) -> 'high' | 'low' | 'static'`
  - `useReducedMotion() -> boolean`

- [ ] **Step 1: Write the failing tests for `computeProgress` and `setPointer`**

Create `src/state/scene.test.js`:

```js
import { sceneState, computeProgress, setPointer, resetScene } from './scene';

describe('computeProgress', () => {
  test('returns 0 at the top of the page', () => {
    expect(computeProgress(0, 3000, 1000)).toBe(0);
  });

  test('returns 1 when scrolled to the bottom', () => {
    expect(computeProgress(2000, 3000, 1000)).toBe(1);
  });

  test('returns 0.5 at the midpoint of scrollable distance', () => {
    expect(computeProgress(1000, 3000, 1000)).toBeCloseTo(0.5);
  });

  test('clamps values beyond the end (rubber-band overscroll)', () => {
    expect(computeProgress(9999, 3000, 1000)).toBe(1);
  });

  test('clamps negative scroll (iOS bounce)', () => {
    expect(computeProgress(-200, 3000, 1000)).toBe(0);
  });

  test('returns 0 when the page is not scrollable', () => {
    expect(computeProgress(0, 800, 1000)).toBe(0);
  });
});

describe('setPointer', () => {
  beforeEach(() => resetScene());

  test('maps the viewport centre to the origin', () => {
    setPointer(500, 400, 1000, 800);
    expect(sceneState.pointer.x).toBeCloseTo(0);
    expect(sceneState.pointer.y).toBeCloseTo(0);
  });

  test('maps the top-left corner to (-1, 1)', () => {
    setPointer(0, 0, 1000, 800);
    expect(sceneState.pointer.x).toBeCloseTo(-1);
    expect(sceneState.pointer.y).toBeCloseTo(1);
  });

  test('mutates in place rather than replacing the pointer object', () => {
    const before = sceneState.pointer;
    setPointer(100, 100, 1000, 800);
    expect(sceneState.pointer).toBe(before);
  });
});
```

That last test matters: `useFrame` closures capture `sceneState.pointer` by reference, so replacing the object would silently break every consumer.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx react-scripts test --watchAll=false src/state/scene.test.js
```

Expected: FAIL — `Cannot find module './scene'`.

- [ ] **Step 3: Implement `src/state/scene.js`**

```js
/**
 * Module-level mutable scene state.
 *
 * Deliberately NOT React state. Scroll and pointer updates happen at frame
 * rate; routing them through setState would re-render the tree ~60x/sec.
 * 3D components read this object inside useFrame, which runs outside React.
 *
 * Consumers hold a reference to `sceneState.pointer`, so it is mutated in
 * place and never reassigned.
 */
export const sceneState = {
  scrollY: 0,
  progress: 0,
  pointer: { x: 0, y: 0 },
  route: '/',
  introDone: false,
  quality: 'high',
};

export function computeProgress(scrollY, docHeight, viewportHeight) {
  const scrollable = docHeight - viewportHeight;
  if (scrollable <= 0) return 0;
  const raw = scrollY / scrollable;
  return Math.min(1, Math.max(0, raw));
}

export function setScroll(scrollY, docHeight, viewportHeight) {
  sceneState.scrollY = scrollY;
  sceneState.progress = computeProgress(scrollY, docHeight, viewportHeight);
}

export function setPointer(clientX, clientY, width, height) {
  sceneState.pointer.x = (clientX / width) * 2 - 1;
  sceneState.pointer.y = -((clientY / height) * 2 - 1);
}

export function resetScene() {
  sceneState.scrollY = 0;
  sceneState.progress = 0;
  sceneState.pointer.x = 0;
  sceneState.pointer.y = 0;
  sceneState.route = '/';
  sceneState.introDone = false;
  sceneState.quality = 'high';
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd frontend && npx react-scripts test --watchAll=false src/state/scene.test.js
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Write the failing tests for `shouldPlayIntro`**

Create `src/state/introGate.test.js`:

```js
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

  test('still plays (as a static hold) under reduced motion', () => {
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
});

describe('markIntroSeen', () => {
  test('writes the session flag', () => {
    const storage = fakeStorage();
    markIntroSeen(storage);
    expect(storage.getItem(INTRO_KEY)).toBe('1');
  });

  test('does not throw when storage is blocked', () => {
    const throwing = { getItem: () => null, setItem: () => { throw new Error('nope'); } };
    expect(() => markIntroSeen(throwing)).not.toThrow();
  });
});
```

Note the reduced-motion case returns `true` on purpose: per spec §6, reduced motion still *shows* the spectacles, it just holds them still instead of animating.

- [ ] **Step 6: Run the tests to verify they fail**

```bash
cd frontend && npx react-scripts test --watchAll=false src/state/introGate.test.js
```

Expected: FAIL — `Cannot find module './introGate'`.

- [ ] **Step 7: Implement `src/state/introGate.js`**

```js
export const INTRO_KEY = 'hollai:intro';

/**
 * Storage access throws in some private-browsing modes, so every read and
 * write is guarded. A storage failure must never cost the visitor the site.
 */
export function shouldPlayIntro({ storage, search = '' }) {
  if (search.includes('intro')) return true;
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
    /* private browsing — the intro simply replays next navigation */
  }
}
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
cd frontend && npx react-scripts test --watchAll=false src/state/introGate.test.js
```

Expected: PASS, 7 tests.

- [ ] **Step 9: Write the failing tests for `resolveQuality`**

Create `src/three/quality.test.js`:

```js
import { resolveQuality } from './quality';

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

  test('low memory drops to low', () => {
    expect(resolveQuality({ ...desktop, deviceMemory: 2 })).toBe('low');
  });

  test('few cores drops to low', () => {
    expect(resolveQuality({ ...desktop, hardwareConcurrency: 2 })).toBe('low');
  });

  test('assumes capable hardware when the browser reports nothing', () => {
    const unknown = { width: 1440, prefersReducedMotion: false, hasWebGL: true };
    expect(resolveQuality(unknown)).toBe('high');
  });
});
```

That last case matters: Safari does not expose `deviceMemory`, and treating "unknown" as "weak" would degrade every Mac visitor.

- [ ] **Step 10: Run the tests to verify they fail**

```bash
cd frontend && npx react-scripts test --watchAll=false src/three/quality.test.js
```

Expected: FAIL — `Cannot find module './quality'`.

- [ ] **Step 11: Implement `src/three/quality.js`**

```js
export const MOBILE_BREAKPOINT = 768;

/**
 * Resolves the render tier once at startup.
 *
 * Safari does not implement navigator.deviceMemory, so an absent value is
 * treated as capable rather than weak — otherwise every Mac would be demoted.
 */
export function resolveQuality({
  deviceMemory,
  hardwareConcurrency,
  width,
  prefersReducedMotion,
  hasWebGL,
}) {
  if (prefersReducedMotion || !hasWebGL) return 'static';
  if (width < MOBILE_BREAKPOINT) return 'low';
  if (typeof deviceMemory === 'number' && deviceMemory <= 4) return 'low';
  if (typeof hardwareConcurrency === 'number' && hardwareConcurrency <= 4) return 'low';
  return 'high';
}

export function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') || canvas.getContext('webgl')
    );
  } catch {
    return false;
  }
}

export function resolveQualityFromEnvironment() {
  return resolveQuality({
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    width: window.innerWidth,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hasWebGL: detectWebGL(),
  });
}
```

- [ ] **Step 12: Run the tests to verify they pass**

```bash
cd frontend && npx react-scripts test --watchAll=false src/three/quality.test.js
```

Expected: PASS, 7 tests.

- [ ] **Step 13: Implement `src/hooks/useReducedMotion.js`**

No test — this is a thin wrapper over a browser API with no logic of its own.

```js
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 14: Run the full suite**

```bash
cd frontend && npx react-scripts test --watchAll=false
```

Expected: PASS, 23 tests across 3 files.

- [ ] **Step 15: Commit**

```bash
git add frontend/src/state frontend/src/three/quality.js frontend/src/three/quality.test.js frontend/src/hooks
git commit -m "Add scene state, intro gating, and device quality tiering with tests"
```

---

## Task 3: Remove light mode and introduce the shell layout route

The structural change. After this, nav and footer mount once and never remount on navigation — the prerequisite for a continuous world.

**Files:**
- Create: `src/components/layout/SiteShell.js`, `src/hooks/useScrollProgress.js`
- Modify: `src/App.js`, all five public pages, `src/components/Navbar.js`
- Delete: `src/components/ThemeToggle.js`, `src/styles/ThemeToggle.css`
- Test: `src/App.test.js`

**Interfaces:**
- Consumes: `sceneState`, `setScroll`, `setPointer` from Task 2
- Produces: `<SiteShell/>` layout component; `useScrollProgress()` side-effect hook. Pages now export components taking **no props**.

- [ ] **Step 1: Write the failing route smoke tests**

Create `src/App.test.js`. These assert the contract that must survive the whole redesign: every route renders, and no route throws.

```js
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SiteShell from './components/layout/SiteShell';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  );
});

function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<SiteShell />}>
          <Route path={path} element={element} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

test('the shell renders navigation once around the outlet', () => {
  renderAt('/', <HomePage />);
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
});

test('the shell exposes every public route link', () => {
  renderAt('/', <HomePage />);
  ['About', 'Projects', 'Certifications', 'Contact'].forEach((label) => {
    expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument();
  });
});

test('pages render without theme props', () => {
  renderAt('/about', <AboutPage />);
  expect(screen.getByText(/Who I Am/i)).toBeInTheDocument();
});

test('About retains all five sections after the redesign', () => {
  renderAt('/about', <AboutPage />);
  ['Who I Am', 'My Expertise', 'My Approach', 'My Education', "Let's Connect"].forEach((h) => {
    expect(screen.getByText(h)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx react-scripts test --watchAll=false src/App.test.js
```

Expected: FAIL — `Cannot find module './components/layout/SiteShell'`.

- [ ] **Step 3: Implement `src/hooks/useScrollProgress.js`**

```js
import { useEffect } from 'react';
import { setScroll, setPointer } from '../state/scene';

/**
 * Attaches the only scroll and pointer listeners in the app and writes into
 * the module-level scene state. Deliberately returns nothing — reading these
 * values through React would defeat the entire point.
 */
export function useScrollProgress() {
  useEffect(() => {
    let frame = 0;

    const readScroll = () => {
      frame = 0;
      setScroll(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(readScroll);
    };

    const onPointer = (e) => {
      setPointer(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    };

    readScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);
}
```

- [ ] **Step 4: Implement `src/components/layout/SiteShell.js`**

The canvas slot is left empty here and filled in Task 4, so this task can be verified on its own.

```js
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { sceneState } from '../../state/scene';
import '../../styles/SiteShell.css';

function SiteShell() {
  const location = useLocation();
  useScrollProgress();

  useEffect(() => {
    sceneState.route = location.pathname;
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="site-shell">
      <div className="site-world" aria-hidden="true">
        {/* WorldCanvas mounts here in Task 4 */}
      </div>

      <div className="site-content">
        <Navbar />
        <main id="main">
          <Outlet />
        </main>
        <Footer />
      </div>

      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </div>
  );
}

export default SiteShell;
```

- [ ] **Step 5: Create `src/styles/SiteShell.css`**

```css
.site-shell {
  min-height: 100vh;
  background: var(--void);
}

/* The world sits behind everything and never receives pointer events. */
.site-world {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.site-content {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 6: Rewrite `src/App.js`**

```js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SiteShell from './components/layout/SiteShell';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import CertificationsPage from './pages/CertificationsPage';
import ContactPage from './pages/ContactPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<SiteShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/certifications" element={<CertificationsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
```

Admin routes stay outside the shell — no canvas, no intro, no grain.

- [ ] **Step 7: Strip theme props and duplicated chrome from all five pages**

In each of `HomePage.js`, `AboutPage.js`, `ProjectsPage.js`, `CertificationsPage.js`, `ContactPage.js`:

1. Change the signature from `function XPage({ isDarkMode, toggleTheme })` to `function XPage()`.
2. Delete the `import Navbar` and `import Footer` lines and their `<Navbar .../>` / `<Footer />` elements.
3. Replace the root `<div className={\`x-page ${isDarkMode ? 'dark-mode' : 'light-mode'}\`}>` with `<div className="x-page">`.
4. In `HomePage.js` only, delete the entire `cs-background-animation` block — both the `isDarkMode` branches, the 100 rain drops, clouds, bats, thunderbolts, butterflies, and sun-rays (lines ~80–131). This is the largest single deletion in the redesign.

Leave all data fetching, refs, handlers, and copy untouched.

- [ ] **Step 8: Update `Navbar.js` for the new identity and remove the toggle**

```js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';
import { FaBars, FaTimes } from 'react-icons/fa';

const LINKS = [
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/certifications', label: 'Certifications' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Close the takeover whenever navigation actually happens.
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  return (
    <>
      <nav className="navbar-container">
        <div className="logo">
          <Link to="/">HOLLAI</Link>
        </div>

        <button
          className="burger-menu"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`menu-container ${isOpen ? 'active' : ''}`}>
          <ul className="nav-links">
            {LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className={location.pathname === to ? 'active' : ''}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default Navbar;
```

Two real fixes here beyond styling: the old `toggleMenu` was called on the logo link (which *opened* the menu when clicking Home), and the menu now closes on actual route change rather than on click.

- [ ] **Step 9: Delete the theme toggle**

```bash
git rm frontend/src/components/ThemeToggle.js frontend/src/styles/ThemeToggle.css
```

- [ ] **Step 10: Purge remaining theme branches from the stylesheets**

In `HomePage.css`, `AboutPage.css`, `ProjectsPage.css`, `CertificationsPage.css`, `ContactPage.css`, `Navbar.css`, `Footer.css`: delete every `.light-mode ...` rule and unwrap every `.dark-mode ...` selector to its bare form. Delete the rain, cloud, bat, thunderbolt, butterfly, and sun-ray keyframes and rules from `HomePage.css`.

Confirm nothing is left behind:

```bash
cd frontend && grep -rn "light-mode\|dark-mode\|isDarkMode\|toggleTheme\|ThemeToggle" src/
```

Expected: no matches.

- [ ] **Step 11: Run the tests to verify they pass**

```bash
cd frontend && npx react-scripts test --watchAll=false
```

Expected: PASS — the 4 new App tests plus the 23 from Task 2.

- [ ] **Step 12: Verify every route manually, including admin**

```bash
cd frontend && npm start
```

Visit all seven routes. Confirm: nav appears exactly once per page, no console errors, and **`/admin/login` still logs in and `/admin` still lists, creates, edits, and deletes projects and certifications**. This is the regression that matters most.

- [ ] **Step 13: Commit**

```bash
git add -A frontend/src
git commit -m "Remove light mode and mount nav/footer once via a shell layout route"
```

---

## Task 4: Persistent world canvas and base scene

**Files:**
- Create: `src/three/world/WorldCanvas.js`, `src/three/world/BaseScene.js`, `src/three/world/cameraRig.js`
- Modify: `src/components/layout/SiteShell.js`, `frontend/package.json`

**Interfaces:**
- Consumes: `sceneState` (Task 2), `resolveQualityFromEnvironment` (Task 2), `.site-world` slot (Task 3)
- Produces: `<WorldCanvas/>` default export (lazy-loaded); `<BaseScene/>`; `useCameraRig(camera, route)` frame hook

- [ ] **Step 1: Install the 3D dependencies**

```bash
cd frontend && npm install three @react-three/fiber @react-three/drei gsap
```

- [ ] **Step 2: Verify CRA can bundle them before writing any scene code**

This is the known risk from spec §14 — find out now, not after three tasks of work.

```bash
cd frontend && npm run build
```

If the build fails with `Can't import the named export ... from non EcmaScript module` or a `fullySpecified` error, follow the mitigation ladder in spec §14 **in order**: install `@craco/craco`, add a `craco.config.js` setting `webpackConfig.module.rules.push({ test: /\.m?js$/, resolve: { fullySpecified: false } })`, and switch the `start`/`build`/`test` scripts to `craco`. Stop and report if even that fails.

- [ ] **Step 3: Implement `src/three/world/cameraRig.js`**

Per-route camera choreography, driven entirely by `sceneState`.

```js
import { sceneState } from '../../state/scene';

/** Where the camera sits at progress 0 and progress 1, per route. */
const RAILS = {
  '/':               { from: [0, 1.4, 6], to: [0, 1.1, -14] },
  '/projects':       { from: [0, 1.5, 4], to: [0, 1.5, -22] },
  '/about':          { from: [0, 1.5, 5], to: [0, 1.5, 1] },
  '/certifications': { from: [0, 1.5, 5], to: [0, 1.5, 1] },
  '/contact':        { from: [0, 1.4, 0], to: [0, 1.8, 12] }, // pulls back into the dark
};

const DEFAULT_RAIL = RAILS['/about'];
const DAMPING = 0.06;
const PARALLAX = 0.35;

export function targetForRoute(route, progress) {
  const rail = RAILS[route] || DEFAULT_RAIL;
  const [fx, fy, fz] = rail.from;
  const [tx, ty, tz] = rail.to;
  return [
    fx + (tx - fx) * progress,
    fy + (ty - fy) * progress,
    fz + (tz - fz) * progress,
  ];
}

/**
 * Called every frame. Lerps toward the rail target rather than snapping, so
 * scrolling feels weighted without hijacking the browser's native scroll.
 */
export function advanceCamera(camera, delta) {
  const [x, y, z] = targetForRoute(sceneState.route, sceneState.progress);
  const k = 1 - Math.pow(1 - DAMPING, delta * 60);

  camera.position.x += (x + sceneState.pointer.x * PARALLAX - camera.position.x) * k;
  camera.position.y += (y + sceneState.pointer.y * PARALLAX * 0.4 - camera.position.y) * k;
  camera.position.z += (z - camera.position.z) * k;
  camera.lookAt(0, 1.0, camera.position.z - 6);
}
```

- [ ] **Step 4: Implement `src/three/world/BaseScene.js`**

Spec §7: floor, fog, one key, one red rim. Nothing else — no spheres, no cubes, no particles.

```js
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { advanceCamera } from './cameraRig';
import { sceneState } from '../../state/scene';

function ShaftPlane({ z, opacity }) {
  return (
    <mesh position={[-2.2, 2.4, z]} rotation={[0, 0, 0.42]}>
      <planeGeometry args={[1.1, 12]} />
      <meshBasicMaterial
        color="#3a3a42"
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={2 /* AdditiveBlending */}
      />
    </mesh>
  );
}

/**
 * The light shaft is faked with a few soft additive planes rather than real
 * volumetrics — the cheap approximation the brief asks for.
 */
function LightShaft() {
  return (
    <group>
      <ShaftPlane z={-3} opacity={0.05} />
      <ShaftPlane z={-3.4} opacity={0.035} />
      <ShaftPlane z={-3.8} opacity={0.02} />
    </group>
  );
}

function BaseScene({ quality }) {
  const keyRef = useRef();
  const { camera } = useThree();

  useFrame((_, delta) => {
    advanceCamera(camera, delta);
    if (keyRef.current) {
      // The key drifts slightly with the pointer so the floor's specular moves.
      keyRef.current.position.x += (-6 + sceneState.pointer.x * 1.5 - keyRef.current.position.x) * 0.04;
    }
  });

  return (
    <>
      <fogExp2 attach="fog" args={['#000000', 0.055]} />
      <ambientLight intensity={0.04} />

      {/* Key: low and hard from screen-left. This is what carves the space. */}
      <directionalLight ref={keyRef} position={[-6, 3, 2]} intensity={1.5} color="#cfd2d8" />

      {/* Red rim from behind, deliberately almost invisible. */}
      <directionalLight position={[2, 1.5, -8]} intensity={0.22} color="#C4161C" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[80, 90]} />
        <meshStandardMaterial color="#08080A" roughness={0.42} metalness={0.85} />
      </mesh>

      {quality === 'high' && <LightShaft />}
    </>
  );
}

export default BaseScene;
```

- [ ] **Step 5: Implement `src/three/world/WorldCanvas.js`**

```js
import React, { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import BaseScene from './BaseScene';
import { resolveQualityFromEnvironment } from '../quality';
import { sceneState } from '../../state/scene';

function WorldCanvas() {
  const quality = useMemo(() => {
    const q = resolveQualityFromEnvironment();
    sceneState.quality = q;
    return q;
  }, []);

  const [visible, setVisible] = useState(!document.hidden);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (quality === 'static') {
    // One frame, then frozen. The world is seen but nothing moves.
    return (
      <Canvas
        frameloop="demand"
        dpr={1}
        camera={{ position: [0, 1.4, 6], fov: 42 }}
        gl={{ antialias: false, powerPreference: 'low-power' }}
      >
        <BaseScene quality="low" />
      </Canvas>
    );
  }

  return (
    <Canvas
      frameloop={visible ? 'always' : 'never'}
      dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
      camera={{ position: [0, 1.4, 6], fov: 42 }}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance' }}
    >
      <BaseScene quality={quality} />
    </Canvas>
  );
}

export default WorldCanvas;
```

- [ ] **Step 6: Lazy-mount it in `SiteShell.js`**

Replace the empty `.site-world` slot. The `Suspense` fallback is `null` — all text must paint before any 3D arrives.

```js
const WorldCanvas = React.lazy(() => import('../../three/world/WorldCanvas'));

// ...inside the component:
<div className="site-world" aria-hidden="true">
  <React.Suspense fallback={null}>
    <WorldCanvas />
  </React.Suspense>
</div>
```

- [ ] **Step 7: Verify the world renders and the page stays readable**

```bash
cd frontend && npm start
```

Confirm: a dark floor recedes into fog behind the content; scrolling Home moves the camera forward; page text is fully legible over it; DevTools shows exactly **one** `<canvas>`; navigating between all five pages does not create a second WebGL context (`document.querySelectorAll('canvas').length` stays at 1).

- [ ] **Step 8: Run the tests**

```bash
cd frontend && npx react-scripts test --watchAll=false
```

Expected: PASS. The lazy boundary keeps three out of jsdom, so no mocking is needed.

- [ ] **Step 9: Commit**

```bash
git add -A frontend/src frontend/package.json frontend/package-lock.json
git commit -m "Add persistent world canvas with fog, floor, and scroll-driven camera rig"
```

---

## Task 5: Torn seam geometry

Pure geometry maths, so it gets real tests before any shader work.

**Files:**
- Create: `src/three/intro/seam.js`
- Test: `src/three/intro/seam.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `generateSeam({ width, height, segments, seed, amplitude }) -> Array<[number, number]>` — points running corner to corner across the plane, and `mulberry32(seed) -> () => number`

- [ ] **Step 1: Write the failing tests**

```js
import { generateSeam, mulberry32 } from './seam';

const base = { width: 2, height: 2, segments: 24, seed: 7, amplitude: 0.18 };

describe('mulberry32', () => {
  test('is deterministic for a given seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
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

  test('anchors exactly to the top-left corner', () => {
    const [first] = generateSeam(base);
    expect(first).toEqual([-1, 1]);
  });

  test('anchors exactly to the bottom-right corner', () => {
    const pts = generateSeam(base);
    expect(pts[pts.length - 1]).toEqual([1, -1]);
  });

  test('is deterministic for a given seed', () => {
    expect(generateSeam(base)).toEqual(generateSeam(base));
  });

  test('a different seed produces a different tear', () => {
    expect(generateSeam(base)).not.toEqual(generateSeam({ ...base, seed: 8 }));
  });

  test('every interior point deviates from the straight diagonal', () => {
    const pts = generateSeam(base);
    const interior = pts.slice(1, -1);
    const straight = interior.every(([x, y], i) => {
      const t = (i + 1) / base.segments;
      return Math.abs(x - (-1 + 2 * t)) < 1e-9 && Math.abs(y - (1 - 2 * t)) < 1e-9;
    });
    expect(straight).toBe(false);
  });

  test('deviation never exceeds the amplitude', () => {
    const pts = generateSeam(base);
    pts.forEach(([x, y], i) => {
      const t = i / base.segments;
      const dx = x - (-1 + 2 * t);
      const dy = y - (1 - 2 * t);
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(base.amplitude + 1e-9);
    });
  });

  test('stays within the plane bounds', () => {
    generateSeam({ ...base, amplitude: 0.5 }).forEach(([x, y]) => {
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
      expect(Math.abs(y)).toBeLessThanOrEqual(1);
    });
  });
});
```

The corner-anchoring tests are the important ones: if the seam does not meet the corners exactly, the two halves will not cover the viewport and the site will be visible before the tear.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx react-scripts test --watchAll=false src/three/intro/seam.test.js
```

Expected: FAIL — `Cannot find module './seam'`.

- [ ] **Step 3: Implement `src/three/intro/seam.js`**

```js
/** Small, fast, seedable PRNG. Deterministic seams survive a page reload. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Points describing a torn diagonal from the top-left corner to the
 * bottom-right corner of a [-1, 1] plane.
 *
 * Displacement is perpendicular to the diagonal and tapers to zero at both
 * ends, so the halves always meet the corners exactly — otherwise the cover
 * would not fully hide the page. Octave-summed noise makes the edge fibrous
 * rather than merely wavy.
 */
export function generateSeam({ segments = 32, seed = 1, amplitude = 0.18 } = {}) {
  const rand = mulberry32(seed);
  const coarse = Array.from({ length: segments + 1 }, () => rand() * 2 - 1);
  const fine = Array.from({ length: segments + 1 }, () => rand() * 2 - 1);

  // Perpendicular to the (1, -1) diagonal, normalized.
  const px = Math.SQRT1_2;
  const py = Math.SQRT1_2;

  return Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments;
    const baseX = -1 + 2 * t;
    const baseY = 1 - 2 * t;

    if (i === 0) return [-1, 1];
    if (i === segments) return [1, -1];

    // Taper to zero at both ends so the corners stay anchored.
    const taper = Math.sin(Math.PI * t);
    const noise = coarse[i] * 0.7 + fine[i] * 0.3;
    const offset = noise * amplitude * taper;

    const x = baseX + px * offset;
    const y = baseY + py * offset;

    return [
      Math.min(1, Math.max(-1, x)),
      Math.min(1, Math.max(-1, y)),
    ];
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd frontend && npx react-scripts test --watchAll=false src/three/intro/seam.test.js
```

Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/three/intro/seam.js frontend/src/three/intro/seam.test.js
git commit -m "Add deterministic noise-based torn seam generation with tests"
```

---

## Task 6: The spectacles

**Files:**
- Create: `src/three/intro/Spectacles.js`

**Interfaces:**
- Consumes: `quality` tier (Task 2)
- Produces: `<Spectacles quality sweepRef eyeRef/>` — exposes `sweepRef` (the moving rect light) and `eyeRef` (a group holding both irises) so the Task 7 timeline can drive them

- [ ] **Step 1: Build the geometry and materials**

The frames are swept tube geometry and the lenses are real gloss meshes, so the Task 7 light sweep is genuinely *shaded* rather than drawn — the requirement from spec §3.

```js
import React, { useMemo } from 'react';
import * as THREE from 'three';

const LENS_W = 0.62;
const LENS_H = 0.34;
const GAP = 0.20;

/** Rounded-rectangle path for one lens, swept into the frame tube. */
function lensCurve(cx) {
  const shape = new THREE.Shape();
  const w = LENS_W / 2;
  const h = LENS_H / 2;
  const r = 0.07;
  shape.moveTo(cx - w + r, -h);
  shape.lineTo(cx + w - r, -h);
  shape.quadraticCurveTo(cx + w, -h, cx + w, -h + r);
  shape.lineTo(cx + w, h - r);
  shape.quadraticCurveTo(cx + w, h, cx + w - r, h);
  shape.lineTo(cx - w + r, h);
  shape.quadraticCurveTo(cx - w, h, cx - w, h - r);
  shape.lineTo(cx - w, -h + r);
  shape.quadraticCurveTo(cx - w, -h, cx - w + r, -h);
  return shape;
}

function Frame({ cx }) {
  const geometry = useMemo(() => {
    const pts = lensCurve(cx).getPoints(64).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const curve = new THREE.CatmullRomCurve3(pts, true);
    return new THREE.TubeGeometry(curve, 180, 0.018, 10, true);
  }, [cx]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#141416" roughness={0.28} metalness={1} />
    </mesh>
  );
}

function Lens({ cx }) {
  const geometry = useMemo(
    () => new THREE.ShapeGeometry(lensCurve(cx), 24),
    [cx]
  );

  return (
    <mesh geometry={geometry} position={[0, 0, -0.002]}>
      {/* Very dark, very glossy: almost black until light rakes across it. */}
      <meshPhysicalMaterial
        color="#050507"
        roughness={0.08}
        metalness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.05}
        transparent
        opacity={0.94}
      />
    </mesh>
  );
}

function Eye({ cx }) {
  return (
    <group position={[cx, 0, -0.14]}>
      <mesh>
        <circleGeometry args={[0.045, 24]} />
        <meshBasicMaterial color="#C9CBD2" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0, -0.005]}>
        <circleGeometry args={[0.085, 24]} />
        <meshBasicMaterial color="#2A2A30" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function Spectacles({ quality, sweepRef, eyeRef, bridgeVisible = true }) {
  const cx = (LENS_W + GAP) / 2;

  return (
    <group>
      {/* Eyes sit behind the lenses and are mostly occluded — points of light,
          not anime eyes. */}
      <group ref={eyeRef}>
        <Eye cx={-cx} />
        <Eye cx={cx} />
      </group>

      <Frame cx={-cx} />
      <Frame cx={cx} />
      <Lens cx={-cx} />
      <Lens cx={cx} />

      {bridgeVisible && (
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[GAP, 0.016, 0.016]} />
          <meshStandardMaterial color="#141416" roughness={0.28} metalness={1} />
        </mesh>
      )}

      {/* Grazing key: catches only the frame edge. The face is never modeled —
          it is implied by what the light fails to hit. */}
      <directionalLight position={[-3, 0.6, 1.4]} intensity={0.55} color="#aeb4c0" />
      <ambientLight intensity={0.02} />

      {/* The sweep. Driven by the Task 7 timeline. */}
      {quality === 'high' ? (
        <rectAreaLight
          ref={sweepRef}
          position={[-2.4, 0.35, 0.9]}
          width={0.35}
          height={2.4}
          intensity={0}
          color="#dfe6f2"
        />
      ) : (
        <pointLight ref={sweepRef} position={[-2.4, 0.35, 0.9]} intensity={0} color="#dfe6f2" />
      )}
    </group>
  );
}

export default Spectacles;
```

`rectAreaLight` needs its LUTs initialized once; Task 7 does that at module scope.

- [ ] **Step 2: Verify the spectacles read correctly in isolation**

Temporarily render `<Spectacles/>` inside the world canvas with the sweep intensity hardcoded to `6`, then `npm start`.

Confirm by eye: the frames catch a thin rim of light; the lenses stay near-black but show a stretched highlight that bends at the rounded corners; the eyes read as two dim points, not glowing orbs; **no face geometry is visible anywhere.**

If the lenses look flat, raise `clearcoat` toward 1 and drop `roughness` toward 0.05 — do not add emissive.

Revert the temporary mount before committing.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/three/intro/Spectacles.js
git commit -m "Add spectacles geometry with gloss lenses and grazing key light"
```

---

## Task 7: The opening sequence

**Files:**
- Create: `src/three/intro/IntroSequence.js`, `src/three/intro/TearPlane.js`, `src/styles/Intro.css`
- Modify: `src/components/layout/SiteShell.js`

**Interfaces:**
- Consumes: `generateSeam` (Task 5), `<Spectacles/>` (Task 6), `shouldPlayIntro`/`markIntroSeen` (Task 2), `useReducedMotion` (Task 2)
- Produces: `<IntroSequence onComplete/>` — calls `onComplete()` exactly once and unmounts itself

- [ ] **Step 1: Implement `src/three/intro/TearPlane.js`**

Two halves built from the seam, with a shader-painted hot rim along the torn edge.

```js
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { generateSeam } from './seam';

/**
 * Builds one half of the cover: the seam path plus the corners on one side.
 * `side` -1 takes the lower-left corner, +1 takes the upper-right.
 */
function halfGeometry(seam, side) {
  const shape = new THREE.Shape();
  const [sx, sy] = seam[0];
  shape.moveTo(sx, sy);
  seam.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  if (side < 0) {
    shape.lineTo(-1, -1);
  } else {
    shape.lineTo(1, 1);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 1);
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Distance to the diagonal gives a cheap approximation of distance to the
 * torn edge — accurate enough at this amplitude, and far cheaper than
 * sampling the polyline per fragment.
 */
const fragmentShader = `
  uniform float uGap;
  uniform vec3  uSignal;
  varying vec3 vPos;

  void main() {
    float d = abs(vPos.x + vPos.y) * 0.7071;
    float rim = 1.0 - smoothstep(0.0, 0.05, d);
    float heat = rim * uGap;

    vec3 core = mix(uSignal, vec3(1.0), pow(rim, 3.0));
    vec3 color = core * heat;

    gl_FragColor = vec4(color, max(1.0 - uGap * 0.15, 0.0) + heat);
  }
`;

function TearHalf({ side, materialRef, groupRef }) {
  const seam = useMemo(() => generateSeam({ segments: 40, seed: 1337, amplitude: 0.16 }), []);
  const geometry = useMemo(() => halfGeometry(seam, side), [seam, side]);

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} scale={[4, 4, 1]}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          uniforms={{
            uGap: { value: 0 },
            uSignal: { value: new THREE.Color('#C4161C') },
          }}
        />
      </mesh>
    </group>
  );
}

export default TearHalf;
```

- [ ] **Step 2: Create `src/styles/Intro.css`**

```css
.intro-layer {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--void);
}

.intro-layer.tearing {
  background: transparent;
}

.intro-skip {
  position: fixed;
  right: var(--gutter);
  bottom: var(--gutter);
  z-index: 201;
  border: 0;
  background: none;
  color: var(--smoke);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.4s var(--ease-out), color 0.2s linear;
}

.intro-skip.shown { opacity: 0.6; }
.intro-skip:hover,
.intro-skip:focus-visible { color: var(--signal); opacity: 1; }
```

- [ ] **Step 3: Implement `src/three/intro/IntroSequence.js`**

```js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import gsap from 'gsap';
import Spectacles from './Spectacles';
import TearHalf from './TearPlane';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import '../../styles/Intro.css';

RectAreaLightUniformsLib.init();

function IntroStage({ quality, reduced, onDone }) {
  const sweepRef = useRef();
  const eyeRef = useRef();
  const lowerRef = useRef();
  const upperRef = useRef();
  const lowerMat = useRef();
  const upperMat = useRef();
  const specsRef = useRef();

  useEffect(() => {
    // Reduced motion: one lit frame, hold, then hand over. No animation.
    if (reduced) {
      if (sweepRef.current) sweepRef.current.intensity = 5;
      const t = setTimeout(onDone, 1100);
      return () => clearTimeout(t);
    }

    const tl = gsap.timeline({ onComplete: onDone });

    // 0.0-0.6  darkness
    tl.set({}, {}, 0.6);

    // 0.6-1.9  emergence
    tl.fromTo(eyeRef.current, { visible: true }, {}, 0.6);
    tl.fromTo(
      specsRef.current.scale,
      { x: 1.04, y: 1.04, z: 1.04 },
      { x: 1, y: 1, z: 1, duration: 1.3, ease: 'power2.out' },
      0.6
    );
    tl.fromTo(
      eyeRef.current.children.map((c) => c.children[0].material),
      { opacity: 0 },
      { opacity: 0.85, duration: 1.1, ease: 'power1.inOut' },
      0.7
    );

    // 1.9-3.0  the sweep
    tl.fromTo(
      sweepRef.current,
      { intensity: 0 },
      { intensity: 7, duration: 0.35, ease: 'power2.in' },
      1.9
    );
    tl.fromTo(
      sweepRef.current.position,
      { x: -2.4 },
      { x: 2.4, duration: 1.1, ease: 'power1.inOut' },
      1.9
    );
    tl.to(sweepRef.current, { intensity: 0, duration: 0.3, ease: 'power2.out' }, 2.7);
    // The one alive moment: irises contract as the light passes.
    tl.to(eyeRef.current.scale, { x: 0.94, y: 0.94, duration: 0.18 }, 2.35);
    tl.to(eyeRef.current.scale, { x: 1, y: 1, duration: 0.3 }, 2.53);

    // 3.0-3.2  hold. This stillness is what makes the tear land.

    // 3.2-4.2  the tear
    tl.to(lowerRef.current.position, { x: -1.1, y: -0.75, z: 0.4, duration: 1, ease: 'power3.in' }, 3.2);
    tl.to(lowerRef.current.rotation, { z: -0.026, duration: 1, ease: 'power2.in' }, 3.2);
    tl.to(upperRef.current.position, { x: 1.1, y: 0.75, z: 0.4, duration: 1, ease: 'power3.in' }, 3.2);
    tl.to(upperRef.current.rotation, { z: 0.026, duration: 1, ease: 'power2.in' }, 3.2);
    tl.to([lowerMat.current.uniforms.uGap, upperMat.current.uniforms.uGap],
      { value: 1, duration: 0.15, ease: 'power2.out' }, 3.2);
    tl.to([lowerMat.current.uniforms.uGap, upperMat.current.uniforms.uGap],
      { value: 0, duration: 0.8, ease: 'power2.in' }, 3.35);
    tl.to([specsRef.current.scale], { x: 1.4, y: 1.4, duration: 1, ease: 'power3.in' }, 3.2);

    return () => tl.kill();
  }, [reduced, onDone]);

  return (
    <>
      <group ref={specsRef} position={[0, 0, 0]}>
        <Spectacles quality={quality} sweepRef={sweepRef} eyeRef={eyeRef} />
      </group>
      <group position={[0, 0, 1.2]}>
        <TearHalf side={-1} groupRef={lowerRef} materialRef={lowerMat} />
        <TearHalf side={1} groupRef={upperRef} materialRef={upperMat} />
      </group>
    </>
  );
}

function IntroSequence({ onComplete, quality }) {
  const reduced = useReducedMotion();
  const [tearing, setTearing] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 900);
    const tearAt = setTimeout(() => setTearing(true), reduced ? 0 : 3200);
    const onKey = (e) => { if (e.key === 'Escape' || e.key === ' ') finish(); };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      clearTimeout(tearAt);
      window.removeEventListener('keydown', onKey);
    };
  }, [reduced, finish]);

  return (
    <>
      <div className={`intro-layer ${tearing ? 'tearing' : ''}`}>
        <Canvas
          dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
          camera={{ position: [0, 0, 2.6], fov: 40 }}
          gl={{ alpha: true, antialias: quality === 'high' }}
        >
          <IntroStage quality={quality} reduced={reduced} onDone={finish} />
        </Canvas>
      </div>
      <button className={`intro-skip ${showSkip ? 'shown' : ''}`} onClick={finish}>
        Skip
      </button>
    </>
  );
}

export default IntroSequence;
```

- [ ] **Step 4: Mount it in `SiteShell.js`, gated and self-unmounting**

```js
const IntroSequence = React.lazy(() => import('../../three/intro/IntroSequence'));

// ...inside the component:
const [introPlaying, setIntroPlaying] = useState(
  () => location.pathname === '/' &&
        resolveQualityFromEnvironment() !== 'static' &&
        shouldPlayIntro({ storage: window.sessionStorage, search: window.location.search })
);

const handleIntroComplete = useCallback(() => {
  markIntroSeen(window.sessionStorage);
  sceneState.introDone = true;
  setIntroPlaying(false);
}, []);

// ...in the JSX, after the overlays:
{introPlaying && (
  <React.Suspense fallback={<div className="intro-layer" />}>
    <IntroSequence quality={sceneState.quality} onComplete={handleIntroComplete} />
  </React.Suspense>
)}
```

Add `data-intro={introPlaying ? 'playing' : 'done'}` to the shell root, and in `SiteShell.css` hide the nav while it plays:

```css
.site-shell[data-intro='playing'] .navbar-container { opacity: 0; pointer-events: none; }
.navbar-container { transition: opacity 0.6s var(--ease-out); }
```

- [ ] **Step 5: Verify the full sequence by eye**

`npm start`, open `/?intro`. Watch for, in order: 0.6s of true black with no spinner → eyes emerging → the highlight travelling across and bending at the lens corners → a clear beat of stillness → the two halves peeling apart with a red-into-white seam → the site behind them.

Confirm the nav fades in as the tear finishes rather than after it, and that pressing `Escape` at any point jumps straight to the site.

If the halves reveal a gap at the screen corners, the seam is not anchored — go back to Task 5 Step 3.

- [ ] **Step 6: Verify the gating and the degraded paths**

- Reload `/` — the intro must **not** replay.
- Open a new tab to `/` — it **must** play (session storage is per-tab).
- Navigate Home → Projects → Home — it must not replay.
- Enable "Reduce motion" in the OS and load `/?intro` — the spectacles hold still for ~1s, then the site appears. No tear, no sweep.
- Throttle to a mobile profile and confirm the low-tier path runs without dropping frames.

- [ ] **Step 7: Run the tests**

```bash
cd frontend && npx react-scripts test --watchAll=false
```

Expected: PASS. Jsdom renders the shell with `introPlaying` false (no WebGL → `static`), so the intro never mounts in tests.

- [ ] **Step 8: Commit**

```bash
git add -A frontend/src
git commit -m "Add opening cinematic: darkness, eyes, lens sweep, and diagonal tear"
```

---

## Task 8: The hero

**Files:**
- Create: `src/components/RevealText.js`
- Modify: `src/pages/HomePage.js`, `src/styles/HomePage.css`

**Interfaces:**
- Consumes: `sceneState.introDone`, tokens from Task 1
- Produces: `<RevealText text delay className/>` — splits into per-character spans and animates blur/scale/offset to sharp

- [ ] **Step 1: Implement `src/components/RevealText.js`**

Not a stagger-fade. Each glyph resolves from blur, which is what makes it read as focus-pulling rather than as a typewriter.

```js
import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

function RevealText({ text, delay = 0, className = '', charDelay = 22 }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const spans = node.querySelectorAll('[data-char]');
    if (reduced) {
      spans.forEach((s) => s.classList.add('is-in'));
      return;
    }
    const timers = Array.from(spans).map((span, i) =>
      setTimeout(() => span.classList.add('is-in'), delay + i * charDelay)
    );
    return () => timers.forEach(clearTimeout);
  }, [delay, charDelay, reduced, text]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          data-char
          className="reveal-char"
          aria-hidden="true"
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

export default RevealText;
```

`aria-label` on the wrapper plus `aria-hidden` on the glyphs keeps screen readers reading the word, not the letters.

- [ ] **Step 2: Add the reveal and hero styles to `HomePage.css`**

```css
.reveal-char {
  display: inline-block;
  filter: blur(8px);
  opacity: 0;
  transform: translateY(0.4em) scale(1.06);
  transition:
    filter 0.7s var(--ease-out),
    opacity 0.7s var(--ease-out),
    transform 0.7s var(--ease-out);
}

.reveal-char.is-in {
  filter: blur(0);
  opacity: 1;
  transform: none;
}

.hero {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 var(--gutter);
  gap: 1.5rem;
}

.hero-eyebrow { /* .t-mono is applied in the markup */ }

.hero-text {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(4rem, 14vw, 13rem);
  letter-spacing: -0.04em;
  line-height: 0.86;
  text-transform: uppercase;
  color: var(--bone);
  margin: 0;
}

/* AI is outlined rather than filled — distinction without a logo. */
.hero-text .highlight {
  color: transparent;
  -webkit-text-stroke: 2px var(--bone);
}

@media (max-width: 767px) {
  .hero-text .highlight { -webkit-text-stroke-width: 1.5px; }
}

.hero-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }

.hero-button {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--bone);
  text-decoration: none;
  padding: 0.9rem 1.6rem;
  border: var(--rule);
  transition: border-color 0.3s var(--ease-out), color 0.3s var(--ease-out);
}

.hero-button:hover,
.hero-button:focus-visible {
  border-color: var(--signal);
  color: var(--signal);
}
```

- [ ] **Step 3: Rewrite the hero markup in `HomePage.js`**

Keep both existing buttons, the tagline, and the scroll control. Only presentation changes.

```jsx
<section className="hero">
  <span className="t-mono hero-eyebrow">Welcome to</span>
  <h1 className="hero-text">
    <RevealText text="HOLL" delay={300} />
    <span className="highlight"><RevealText text="AI" delay={388} /></span>
  </h1>
  <p className="t-body tagline">Lets Explore My Workspace</p>
  <div className="hero-buttons">
    <Link to="/projects" className="hero-button">My Projects</Link>
    <Link to="/contact" className="hero-button">Contact Me</Link>
  </div>
  <button className="scroll-down-button" onClick={scrollToProjects} aria-label="Scroll to projects">
    <FaChevronDown />
  </button>
</section>
```

Delete the now-unused `heroVisible` state and its `useEffect`; `RevealText` owns the timing. Keep `scrollToProjects` and `projectsRef` exactly as they are.

- [ ] **Step 4: Add the light sweep across the wordmark**

Append to `HomePage.css`:

```css
.hero-text {
  background-image: linear-gradient(
    100deg,
    transparent 40%,
    rgba(255, 255, 255, 0.85) 50%,
    transparent 60%
  );
  background-size: 300% 100%;
  background-position: 200% 0;
  -webkit-background-clip: text;
  background-clip: text;
  animation: hero-sweep 1.1s var(--ease-in-out) 1.2s 1 both;
}

@keyframes hero-sweep {
  to { background-position: -100% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-text { animation: none; background-image: none; }
}
```

- [ ] **Step 5: Verify the hero**

`npm start` and reload `/?intro`. The wordmark must begin resolving *before* the tear finishes, and the sweep must land shortly after the seam's red dies. If it feels sequential, lower the `delay` on `RevealText`.

Confirm the outlined `AI` is legible at 360px width and that a screen reader announces "HOLLAI", not individual letters.

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src
git commit -m "Rebuild hero with per-character blur reveal and outlined AI wordmark"
```

---

## Task 9: Projects as case files

The strongest page after the intro.

**Files:**
- Modify: `src/pages/ProjectsPage.js`, `src/styles/ProjectsPage.css`
- Create: `src/components/CaseFileRow.js`, `src/hooks/useInView.js`

**Interfaces:**
- Consumes: project data contract (Global Constraints), `buildApiUrl` from `src/config/api.js`
- Produces: `<CaseFileRow project index/>`; `useInView(options) -> [ref, inView]`

- [ ] **Step 1: Implement `src/hooks/useInView.js`**

Replaces the hand-rolled scroll listeners currently in `AboutPage.js`. `IntersectionObserver` does not fire on every scroll event, so it is both cheaper and more reliable.

```js
import { useEffect, useRef, useState } from 'react';

export function useInView({ threshold = 0.2, once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once]);

  return [ref, inView];
}
```

- [ ] **Step 2: Implement `src/components/CaseFileRow.js`**

```js
import React from 'react';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
import { useInView } from '../hooks/useInView';

function CaseFileRow({ project, index }) {
  const [ref, inView] = useInView({ threshold: 0.25 });
  const number = String(index + 1).padStart(2, '0');

  return (
    <article ref={ref} className={`case-file ${inView ? 'is-in' : ''}`}>
      <div className="case-index t-mono">{number}</div>

      <div className="case-body">
        <h2 className="case-title">{project.title}</h2>
        <p className="t-body case-description">{project.description}</p>

        {project.technologies && project.technologies.length > 0 && (
          <ul className="case-tech">
            {project.technologies.map((tech) => (
              <li key={tech} className="t-mono">{tech}</li>
            ))}
          </ul>
        )}

        <div className="case-links">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="t-mono case-link">
              <FaGithub aria-hidden="true" /> Code
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="t-mono case-link">
              <FaExternalLinkAlt aria-hidden="true" /> Demo
            </a>
          )}
        </div>
      </div>

      <div className="case-visual">
        {project.imageUrl ? (
          <img src={project.imageUrl} alt={project.title} loading="lazy" />
        ) : (
          /* Typographic plate rather than a generic icon placeholder. */
          <div className="case-plate t-mono" aria-hidden="true">{number} / HOLLAI</div>
        )}
      </div>
    </article>
  );
}

export default CaseFileRow;
```

- [ ] **Step 3: Rewrite `ProjectsPage.js` to use it**

Keep the fetch, the loading and error states, and the `featured` split. Featured projects render first with `variant="featured"`; numbering runs continuously across both groups.

```jsx
import { buildApiUrl } from '../config/api';
// ...
const response = await fetch(buildApiUrl('/projects'));
// ...
const ordered = [...featuredProjects, ...otherProjects];
// ...
<div className="case-files">
  {ordered.map((project, i) => (
    <CaseFileRow key={project._id} project={project} index={i} />
  ))}
</div>
```

- [ ] **Step 4: Replace `ProjectsPage.css` with the case-file layout**

```css
.projects-container { padding: 12rem var(--gutter) 8rem; }

.projects-title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--step-6);
  letter-spacing: -0.04em;
  text-transform: uppercase;
  color: var(--bone);
  margin: 0 0 0.5rem;
}

.case-files { display: flex; flex-direction: column; }

.case-file {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr) minmax(0, 0.9fr);
  gap: 2.5rem;
  align-items: start;
  padding: 4.5rem 0;
  border-top: var(--rule);
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.9s var(--ease-out), transform 0.9s var(--ease-out);
}

.case-file.is-in { opacity: 1; transform: none; }

.case-index { font-size: var(--step-2); color: var(--graphite); line-height: 1; }

.case-title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--step-4);
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: var(--bone);
  margin: 0 0 1rem;
  transition: letter-spacing 0.5s var(--ease-out);
}

.case-file:hover .case-title { letter-spacing: -0.02em; }

.case-tech {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  padding: 0;
  margin: 1.5rem 0;
}

.case-links { display: flex; gap: 1.5rem; margin-top: 1.5rem; }

.case-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--bone);
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 1px solid var(--graphite);
  transition: color 0.25s var(--ease-out), border-color 0.25s var(--ease-out);
}

.case-link:hover,
.case-link:focus-visible { color: var(--signal); border-color: var(--signal); }

.case-visual { overflow: hidden; }

.case-visual img {
  width: 100%;
  display: block;
  filter: grayscale(1) contrast(1.1);
  clip-path: inset(0 0 100% 0);
  transition: clip-path 1s var(--ease-out), transform 0.7s var(--ease-out), filter 0.5s var(--ease-out);
}

.case-file.is-in .case-visual img { clip-path: inset(0 0 0 0); }
.case-file:hover .case-visual img { transform: translateY(-8px); filter: grayscale(0.4) contrast(1.05); }

.case-plate {
  aspect-ratio: 16 / 10;
  display: grid;
  place-items: center;
  border: var(--rule);
  color: var(--graphite);
  font-size: var(--step-1);
}

@media (max-width: 1023px) {
  .case-file { grid-template-columns: 4rem 1fr; gap: 1.5rem; }
  .case-visual { grid-column: 1 / -1; }
}

@media (prefers-reduced-motion: reduce) {
  .case-file { opacity: 1; transform: none; transition: none; }
  .case-visual img { clip-path: none; transition: none; }
}
```

- [ ] **Step 4a: Wire the hover into the 3D key light**

In `CaseFileRow`, add `onPointerEnter={() => { sceneState.hoveredRow = index; }}` and `onPointerLeave={() => { sceneState.hoveredRow = -1; }}`. Add `hoveredRow: -1` to `sceneState` in `src/state/scene.js` and to `resetScene()`. In `BaseScene`, when `sceneState.route === '/projects'` and `hoveredRow >= 0`, bias the key light's `position.y` toward `2.2` instead of `3`.

- [ ] **Step 5: Verify**

`npm start`, visit `/projects`. Confirm: rows reveal as they enter view; images wipe in from the top; hover lifts the image and desaturates less; `featured` projects come first; numbering is continuous; **every existing GitHub and Demo link still points at the same URL**; the layout stacks cleanly at 768px and 360px.

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src
git commit -m "Redesign Projects as numbered case files with scroll reveals"
```

---

## Task 10: About as a dossier

**Files:**
- Modify: `src/pages/AboutPage.js`, `src/styles/AboutPage.css`

- [ ] **Step 1: Replace the hand-rolled scroll tracking with `useInView`**

Delete `isInViewport`, `handleScroll`, `visibleElements`, the three refs, and both `useEffect` blocks. Replace with three `useInView()` calls. This removes a `scroll` listener that currently re-renders the page on every scroll event — the same problem the scene store exists to avoid.

Keep `activeSection`, `toggleSection`, `isFlipped`, `toggleFlip`, and every `aria-*` attribute exactly as they are.

- [ ] **Step 2: Number the accordion sections**

Wrap each header's `<h2>` with a mono index. The five sections keep their exact titles and copy:

```jsx
<div className="accordion-header ...">
  <span className="t-mono accordion-index">01</span>
  <h2>Who I Am</h2>
  <span className="accordion-icon">{activeSection === 'whoIAm' ? '−' : '+'}</span>
</div>
```

Indices `01` through `05` for Who I Am, My Expertise, My Approach, My Education, Let's Connect.

- [ ] **Step 3: Restyle `AboutPage.css` as rules rather than boxes**

Replace card backgrounds, border-radius, and box-shadows with hairline `border-top: var(--rule)` on each `.accordion-item`. Headers use `--font-display` at `var(--step-2)`, uppercase, `--bone`. Body copy uses `.t-body`. The `+`/`−` icon becomes `--smoke`, turning `--signal` on hover.

The portrait becomes duotone and resolves out of grain:

```css
.about-image {
  filter: grayscale(1) contrast(1.15) brightness(0.9);
  transition: filter 0.8s var(--ease-out), opacity 0.8s var(--ease-out);
}

.about-image-container.element-visible .about-image { opacity: 1; }
.flip-card:hover .about-image { filter: grayscale(0.5) contrast(1.05) brightness(1); }
```

Keep the flip-card transform intact — it is existing, working functionality.

- [ ] **Step 4: Verify**

Confirm all five sections are present with unchanged copy (including the PES University, Creative PU College, and Rosary High School details), the accordion still opens one at a time, `Enter` still toggles, the flip card still flips, and `aria-expanded` still updates.

- [ ] **Step 5: Commit**

```bash
git add -A frontend/src
git commit -m "Redesign About as a numbered dossier and replace scroll listeners with IntersectionObserver"
```

---

## Task 11: Certifications as records

**Files:**
- Modify: `src/pages/CertificationsPage.js`, `src/styles/CertificationsPage.css`

- [ ] **Step 1: Collapse the two sections into one continuous record list**

Keep the `featured` split for *ordering and emphasis* only — featured entries render first with a `record--featured` class, and numbering runs continuously. Keep `formatDate` unchanged. Point the fetch at `buildApiUrl('/certifications')`.

```jsx
<ol className="records">
  {[...featuredCertifications, ...otherCertifications].map((cert, i) => (
    <li key={cert._id} className={`record ${cert.featured ? 'record--featured' : ''}`}>
      <span className="record-index t-mono">{String(i + 1).padStart(2, '0')}</span>
      <div className="record-body">
        <h2 className="record-title">{cert.title}</h2>
        <p className="t-mono record-org">{cert.organization}</p>
        {cert.description && <p className="t-body record-desc">{cert.description}</p>}
        {cert.skills && cert.skills.length > 0 && (
          <ul className="record-skills">
            {cert.skills.map((s) => <li key={s} className="t-mono">{s}</li>)}
          </ul>
        )}
      </div>
      <div className="record-meta">
        <time className="t-mono" dateTime={cert.issueDate}>{formatDate(cert.issueDate)}</time>
        {cert.credentialURL && (
          <a href={cert.credentialURL} target="_blank" rel="noopener noreferrer" className="t-mono record-link">
            View Credential
          </a>
        )}
      </div>
    </li>
  ))}
</ol>
```

- [ ] **Step 2: Style as a records table**

Grid of `4rem | 1fr | auto`, hairline `border-top` per record, date right-aligned. `.record--featured` gets `border-top-color: var(--smoke)` and a larger index (`var(--step-3)`). No cards, no shadows, no radius. Stack to two columns below 768px.

- [ ] **Step 3: Verify**

All certifications appear once, featured first, dates format identically to before, and every `View Credential` link resolves to the same URL.

- [ ] **Step 4: Commit**

```bash
git add -A frontend/src
git commit -m "Redesign Certifications as a numbered records list"
```

---

## Task 12: Contact as the final scene

**Files:**
- Modify: `src/pages/ContactPage.js`, `src/styles/ContactPage.css`, `src/three/world/BaseScene.js`

- [ ] **Step 1: Deepen the fog on the contact route**

In `BaseScene`, add to the `useFrame` body:

```js
// Contact returns toward darkness — the ending echoes the opening.
const targetFog = sceneState.route === '/contact'
  ? 0.055 + sceneState.progress * 0.14
  : 0.055;
if (scene.fog) scene.fog.density += (targetFog - scene.fog.density) * 0.05;
```

Pull `scene` from `useThree()` alongside `camera`.

- [ ] **Step 2: Restyle the contact info as large type blocks**

Keep `copyToClipboard`, `copiedStates`, both `mailto:`/`tel:` links, the location text, and both social links exactly as they are. Replace `.info-card` boxes with hairline-separated blocks: label in `.t-mono`, value in `--font-display` at `var(--step-3)`.

- [ ] **Step 3: Restyle the form to underline-only inputs**

`handleSubmit`, the endpoint (switched to `buildApiUrl('/emails/contact')`), `formData`, `formStatus`, the disabled state, and all status messages stay byte-identical in behavior.

```css
.feedback-form input,
.feedback-form textarea {
  width: 100%;
  background: transparent;
  border: 0;
  border-bottom: var(--rule);
  border-radius: 0;
  padding: 1rem 0;
  color: var(--bone);
  font-family: var(--font-display);
  font-size: var(--step-1);
  transition: border-color 0.3s var(--ease-out);
}

.feedback-form input::placeholder,
.feedback-form textarea::placeholder { color: var(--smoke); }

.feedback-form input:focus,
.feedback-form textarea:focus {
  outline: none;
  border-bottom-color: var(--signal);
}
```

- [ ] **Step 4: Verify the form still sends**

Fill and submit the form against the live backend. Confirm the success message appears, the fields clear, the status resets after 3s, and the failure path still shows the error message. **This is real functionality — do not mark the task done without an actual successful send.**

- [ ] **Step 5: Commit**

```bash
git add -A frontend/src
git commit -m "Redesign Contact as the closing scene with deepening fog"
```

---

## Task 13: Nav, footer, admin, and Tailwind removal

**Files:**
- Modify: `src/components/Navbar.js` + `src/styles/Navbar.css`, `src/components/Footer.js` + `src/styles/Footer.css`, `src/styles/AdminPage.css`, `src/index.css`, `frontend/package.json`, `frontend/postcss.config.js`, `frontend/tailwind.config.js`

- [ ] **Step 1: Style the nav to the new identity**

`HOLLAI` left in `--font-display` 900, links right in `.t-mono`. Hairline `border-bottom`. Active route gets a 1px `--signal` underline — one of the three sanctioned red uses. Background goes from transparent to `rgba(10, 10, 11, 0.72)` with `backdrop-filter: blur(12px)` once `scrollY > 40`, driven by a class toggled from a `scroll` listener that only fires on threshold crossing (not every event).

Mobile: full-screen `--void` takeover, links at `var(--step-4)`, staggered in. Reuse the existing scroll-lock effect.

- [ ] **Step 2: Rewrite the footer and remove its Tailwind classes**

`Footer.js` currently uses `bg-gray-800 text-white py-4 container mx-auto flex justify-between items-center text-2xl font-bold`. Replace all of them with real CSS classes. Add the intro replay affordance:

```jsx
<button
  className="t-mono footer-replay"
  onClick={() => { sessionStorage.removeItem('hollai:intro'); window.location.href = '/?intro'; }}
>
  Replay intro
</button>
```

- [ ] **Step 3: Remove Tailwind entirely**

It was only ever used by the footer. With those classes gone it is dead weight in every build.

```bash
cd frontend && npm uninstall tailwindcss @tailwindcss/postcss7-compat autoprefixer postcss postcss-flexbugs-fixes postcss-normalize postcss-preset-env
rm tailwind.config.js postcss.config.js
```

Delete the three `@tailwind` lines from `src/index.css`.

Verify nothing else referenced it:

```bash
cd frontend && grep -rnE "\b(bg-|text-|py-|px-|mx-|flex |justify-|items-|font-bold|container)" src/ --include=*.js
```

Expected: no Tailwind utility classes remain. Then `npm run build` must still succeed.

- [ ] **Step 4: Give admin the dark palette only**

In `AdminPage.css` and the admin login styles, swap hardcoded colors for tokens: surfaces `--ink`/`--charcoal`, borders `--graphite`, text `--bone`/`--smoke`, primary actions `--signal`. **No canvas, no intro, no grain, no 3D.** Layout, forms, and behavior are untouched.

- [ ] **Step 5: Verify admin end to end**

Log in at `/admin/login`. Create, edit, and delete a project. Create, edit, and delete a certification. Upload an image. Everything must work exactly as before.

- [ ] **Step 6: Commit**

```bash
git add -A frontend
git commit -m "Restyle nav, footer, and admin to the new tokens; remove Tailwind"
```

---

## Task 14: Performance, responsiveness, and accessibility pass

**Files:**
- Modify: `public/index.html`, any file needing fixes found here

- [ ] **Step 1: Fix the stale metadata in `public/index.html`**

The description still reads "Web site created using create-react-app". Replace with a real description. Add `<meta name="theme-color" content="#000000">` (already correct) and preconnect nothing — fonts are local.

- [ ] **Step 2: Measure the production bundle**

```bash
cd frontend && npm run build
```

Record the main chunk and the lazy 3D chunk sizes from the build output. The 3D chunk **must** be separate from the main chunk — if `three` appears in the main bundle, the `React.lazy` boundary is broken and must be fixed before proceeding.

- [ ] **Step 3: Verify the reduced-motion path across every page**

Enable OS "Reduce motion". Visit all five public routes. Confirm: no camera movement, no scroll-reveal transitions, no hero sweep, no tear — and **all content is present and readable**. This is the acceptance bar, not a nice-to-have.

- [ ] **Step 4: Verify responsive behavior at four widths**

Check 360px, 768px, 1280px, and 1920px on every public route. Confirm no horizontal overflow at any width:

```js
// paste in the console on each route
document.documentElement.scrollWidth <= document.documentElement.clientWidth
```

Expected: `true` everywhere.

- [ ] **Step 5: Verify there is no WebGL context leak**

Navigate Home → About → Projects → Certifications → Contact → Home ten times, then run:

```js
document.querySelectorAll('canvas').length
```

Expected: `1`. Anything higher means the intro canvas or a scene is not unmounting.

- [ ] **Step 6: Run a CPU-throttled pass**

DevTools Performance, 6× CPU throttle, record a scroll through Home and Projects. Frame rate must stay above 30fps. If it does not, lower the `low`-tier dpr cap to `1` and drop the light shaft on `high` before touching anything else.

- [ ] **Step 7: Verify keyboard and screen-reader access**

Tab through every page. Confirm focus is always visible (`--signal`), the nav takeover traps nothing, the accordion is operable with `Enter`, the form is completable by keyboard, and the intro is skippable with `Escape`.

- [ ] **Step 8: Run the full test suite and build**

```bash
cd frontend && npx react-scripts test --watchAll=false && npm run build
```

Expected: all tests PASS, build succeeds with no warnings that reference missing modules.

- [ ] **Step 9: Final route check including admin**

All seven routes render. `/admin/login` authenticates. `/admin` performs full CRUD on projects and certifications with image upload.

- [ ] **Step 10: Commit**

```bash
git add -A frontend
git commit -m "Fix metadata and complete performance, responsive, and accessibility pass"
```

---

## Self-Review Notes

**Spec coverage:** §4 tokens → Task 1. §5.1 shell → Task 3. §5.2 scene state → Task 2. §5.3 quality → Task 2. §6 intro → Tasks 5, 6, 7. §7 world → Task 4 (+ §7 contact fog → Task 12). §8 hero → Task 8. §9 pages → Tasks 9–13. §10 API plumbing → Tasks 9, 11, 12. §11 responsive → Tasks 9, 13, 14. §12 performance → Tasks 4, 14. §13 accessibility → Tasks 7, 8, 14. §14 CRA risk → Task 4 Step 2. §15 verification → Task 14.

**Known deviation from the spec's file inventory:** the spec listed `useScrollProgress.js` but not `useInView.js`, `useReducedMotion.js`, `RevealText.js`, or `CaseFileRow.js`. These four emerged from decomposing the work and are additive; the spec's inventory was an estimate, not a contract.

**Tailwind removal** is not in the spec. It is included because Task 13 removes the only remaining consumer (the footer's utility classes), and leaving an unused CSS framework in the build would be dead weight. Flag to the user if they would rather keep it.
