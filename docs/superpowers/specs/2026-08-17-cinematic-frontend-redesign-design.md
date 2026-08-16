# hollAI — Cinematic Frontend Redesign

**Date:** 2026-08-17
**Branch:** `worktree-security-and-admin-cms`
**Scope:** Frontend only. `backend/` is not touched. No API contract changes.

---

## 1. Intent

Transform the visual and interactive experience of the existing hollAI portfolio
into a dark, cinematic, restrained interface with a **Ninja × Gangster × Noir ×
Modern Engineer** identity.

This is a **redesign, not a rebuild**. Routes, data contracts, page content, and
backend behavior are preserved. The admin CMS keeps working.

The target impression: *you did not open a portfolio, you entered a world.*

### Explicit non-goals

- No backend changes.
- No new routes, no removed routes.
- No replaced or invented content. Existing copy stays.
- No generic AI-portfolio visual language: no purple/blue gradients, no floating
  blobs, no glassmorphism, no random spheres or cubes, no particle fields, no
  neon, no glowing cards.

---

## 2. Current state (as inspected)

| Aspect | Finding |
|---|---|
| Stack | CRA 5 (`react-scripts` 5.0.1), React 19, `react-router-dom` 7 |
| Styling | Tailwind 2 via `postcss7-compat`, barely used; ~3,900 lines of hand-written per-page CSS |
| Theming | `App.js` owns `isDarkMode`, threaded as props into all 5 public pages; defaults dark; persisted to `localStorage` |
| Layout | Every page individually renders `<Navbar/>`, `<main>`, `<Footer/>` — nav remounts on every navigation |
| Data | `HomePage`, `ProjectsPage`, `CertificationsPage`, `ContactPage` each hardcode `https://hollai-backend-b31l.onrender.com`; `src/config/api.js` exports `buildApiUrl()` but is unused by public pages |
| Home visuals | CSS rain / bats / clouds / thunderbolt (dark) and butterflies / sun-rays (light) |
| 3D / animation deps | None installed |
| Admin | `/admin/login` and protected `/admin` with Projects + Certifications CRUD and Dropbox image upload |

### Data contracts to preserve

**Project:** `_id`, `title`, `description`, `technologies[]`, `imageUrl`,
`githubUrl`, `liveUrl`, `featured`.

**Certification:** `_id`, `title`, `organization`, `issueDate`, `description`,
`skills[]`, `imageUrl`, `credentialURL`, `featured`.

**Contact form:** `POST /api/emails/contact` with `{ name, email, subject, message }`.

---

## 3. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Light mode | **Removed.** Dark only. | A noir identity cannot be honestly expressed in two palettes. Removes `ThemeToggle`, the `isDarkMode` prop threading, and every `dark-mode`/`light-mode` branch. |
| Branch | Continue on `worktree-security-and-admin-cms` | User choice. Redesign lands alongside admin CMS work. |
| Libraries | `three`, `@react-three/fiber`, `@react-three/drei`, `gsap` | ~250KB gzipped, code-split behind `React.lazy`. drei's helpers are the difference between cinematic and a demo. |
| Intro replay | Once per session (`sessionStorage`) | Full drama on first arrival; never punishes a returning visitor or a Home→Projects→Home navigation. |
| Typography | Archivo (display) + JetBrains Mono (metadata) | Severe, engineered, industrial — matches the "modern engineer" half of the brief. |
| Red accent | Scalpel: 3 uses sitewide | Tear seam, active nav indicator, hover/focus. The eye learns red means *now*. |
| 3D architecture | One persistent canvas at shell level | The only option that makes route changes feel like camera moves rather than page loads. |
| Spectacles technique | Real geometry + real light | The brief requires the reflection be physically connected to the glasses. Only shading it makes that literally true. SDF-shader variant is the low-power fallback. |
| Admin styling | Tokens and dark palette only | It is a working tool. No cinematic layer, no 3D, no intro. |

---

## 4. Design tokens

`src/styles/tokens.css`, consumed by every stylesheet.

### Palette

```
--void      #000000   intro ground, page ground
--ink       #0A0A0B   surfaces
--charcoal  #141416   raised surfaces
--graphite  #1E1E21   rules, borders, hairlines
--smoke     #6B6B70   muted text, metadata
--bone      #E8E6E1   primary text — never pure white
--signal    #C4161C   red — deep lacquer, not neon
```

`--bone` is deliberately off-white: pure `#FFF` on pure black is harsh and reads
cheap at large sizes.

### Type

- **Display:** Archivo variable, self-hosted `woff2` at `public/fonts/`.
- **Metadata:** JetBrains Mono, self-hosted `woff2`.
- Both preloaded in `index.html`, `font-display: swap`, with a metric-matched
  system fallback stack (`size-adjust`) so nothing shifts on load.
- Scale is `clamp()`-based; display sizes carry `-0.04em` tracking, mono labels
  carry `+0.18em`.

### Global overlays

Two `position: fixed; pointer-events: none` layers, both pure CSS:

1. **Grain** — SVG `feTurbulence`, ~3.5% opacity. Not decoration: dark gradients
   band visibly on 8-bit displays, and grain is what separates premium from muddy.
2. **Vignette** — a single radial gradient.

Neither costs a frame.

---

## 5. Architecture

### 5.1 Shell

New `src/components/layout/SiteShell.js` becomes a **layout route**. It mounts
the persistent world canvas, nav, and footer once, with `<Outlet/>` between them.

```
<Route element={<SiteShell/>}>
  <Route path="/"               element={<HomePage/>} />
  <Route path="/about"          element={<AboutPage/>} />
  <Route path="/projects"       element={<ProjectsPage/>} />
  <Route path="/certifications" element={<CertificationsPage/>} />
  <Route path="/contact"        element={<ContactPage/>} />
</Route>
<Route path="/admin/login" element={<AdminLoginPage/>} />
<Route path="/admin"       element={<ProtectedRoute><AdminPage/></ProtectedRoute>} />
```

Paths are unchanged. Admin routes sit outside the shell — no canvas, no intro.

Each page component drops its own `<Navbar/>` and `<Footer/>` and returns only
its content.

### 5.2 Scene state — the render-avoidance strategy

`src/state/scene.js` exports a plain module-level mutable object:

```js
{ scrollY, progress, pointer: {x, y}, route, introDone, quality }
```

A single passive `scroll` listener and a single `pointermove` listener write to
it. R3F components read it inside `useFrame`. **Scrolling triggers zero React
re-renders.** This satisfies the brief's "avoid unnecessary React renders"
requirement structurally rather than by scattering `memo`.

React state is used only for things that genuinely change the tree: intro
completion, data loading, nav open/closed.

### 5.3 Quality tiering

`src/three/quality.js` resolves a tier once at startup from device memory,
hardware concurrency, viewport width, and a WebGL capability probe:

- **`high`** — full geometry spectacles, env map, area light, dpr `[1, 2]`.
- **`low`** — SDF-shader spectacles, no env map, no area light, dpr `[1, 1.5]`,
  simplified world (no light shaft).
- **`static`** — `prefers-reduced-motion`, or no WebGL support.
  - With WebGL: the canvas renders **exactly one frame** and then stops
    (`frameloop="never"` after the first render). Nothing animates, but the
    spectacles and the world are still *seen*.
  - Without WebGL: no canvas is mounted at all; the site is pure DOM and CSS.

---

## 6. The opening cinematic

`src/three/intro/IntroSequence.js`. Its own `<Canvas alpha>` at `z-index: 200`
that **unmounts itself on completion**, leaving one WebGL context in steady state.

GSAP timeline, ~4.2s total:

| Time | Beat | Detail |
|---|---|---|
| 0 – 0.6s | **Darkness** | Pure black. No content, no nav, no spinner. Assets preload here. |
| 0.6 – 1.9s | **Emergence** | Eyes fade up as soft emissive discs behind the lenses. One dim grazing key catches only the *edge* of the frames. The face is never modeled — it is implied by what the light fails to hit. Camera breathes at 0.3° amplitude. |
| 1.9 – 3.0s | **The sweep** | A narrow rect area light travels across the lens plane. Lenses are real geometry with a gloss material and env map, so the highlight stretches, bends at the curvature, and flares off the top rim. Irises contract 6% as it passes — the one alive moment. |
| 3.0 – 3.2s | **Hold** | Stillness. This beat is what makes the tear land. |
| 3.2 – 4.2s | **The tear** | Two meshes split along a jagged diagonal seam whose vertices are generated once from 1D value noise, so the edge is fibrous rather than a straight cut. Halves separate on slightly different vectors with 1.5° counter-rotation and a small Z push — physical sheets peeling, not panels sliding. A shader paints a hot rim along the torn edge: white core into `--signal` falloff, dying as the gap widens. Canvas is alpha, so the real site shows through. |

**Overlap is mandatory.** Nav fades in at 4.0s and the hero reveal begins at
3.9s — *before* the tear finishes — so the sequence never reads as a queue of
discrete steps.

### Gating

- `sessionStorage['hollai:intro']` — skip if set.
- `?intro` query param forces replay.
- A quiet "replay intro" affordance in the footer.

### Degraded paths

- **`prefers-reduced-motion` (WebGL available):** the intro canvas renders a
  single frame of the spectacles — lit, sweep already at rest — holds 700ms, then
  cross-fades to content over 400ms. The imagery survives; the motion does not.
- **`prefers-reduced-motion` (no WebGL):** content renders immediately, no intro.
- **`low` tier:** SDF-shader spectacles; the tear becomes a two-panel clip-path
  animation with the same noise-derived seam, run in CSS.
- **`static` tier:** content renders immediately, no intro.

---

## 7. The world

`src/three/world/WorldCanvas.js` — persistent, `z-index: 0`,
`pointer-events: none`. DOM scrolls above it at `z-index: 1`.

### Base scene (all routes)

- Black floor plane, rough metal material, subtle anisotropic reflection.
- Exponential fog.
- One strong low directional key from screen-left.
- One red rim from behind at ~4% intensity.

That is the entire base scene. No spheres, no cubes, no particle fields.

### Per-route additions

| Route | Addition |
|---|---|
| `/` | Scroll-driven forward dolly, camera z from 6 → −14. A light shaft faked with a few soft additive planes — the cheap approximation the brief calls for instead of real volumetrics. |
| `/projects` | Floor recedes into a corridor; each project section pushes the camera one bay deeper. Hovering a row shifts the key light toward it. |
| `/about`, `/certifications` | Base scene, near-still camera. Cheap by design. |
| `/contact` | **Inverted.** Camera pulls back, fog density climbs until the world is gone and only the final statement sits on black. The ending echoes the opening. |

### Lifecycle

- Geometries, materials, and render targets disposed on scene swap.
- `frameloop="demand"` when nothing is animating.
- Rendering paused on `visibilitychange` and when the canvas is scrolled out of view.

---

## 8. Hero

```
WELCOME TO          mono, 11px, +0.18em, --smoke
HOLLAI              Archivo 900, clamp(4rem, 14vw, 13rem), -0.04em, --bone
```

**Reveal** is per-character but deliberately not a stagger-fade. Each glyph
starts at 8px blur, 1.06 scale, 0.4em below its resting position, resolving
sharp on a 22ms per-character delay. A mask-based light sweep crosses the
wordmark once, timed to land just after the tear's red rim dies.

`AI` is rendered **outlined rather than filled** — same weight, same size.
Distinction without inventing a logo.

The existing tagline, both existing buttons (My Projects / Contact Me), and the
existing scroll-down control are kept and restyled.

---

## 9. Pages

### `/projects` — case files

The strongest page. Each project is a full-width row, not a card:

```
01                          ← large mono index
PROJECT TITLE               ← Archivo 900
Short description
REACT · NODE · MONGODB      ← mono chips
[ Code ]  [ Demo ]          ← existing githubUrl / liveUrl links
```

The image sits offset and is revealed by a clip-path wipe on scroll. Hover
parallaxes the image ±8px, opens title tracking by 0.01em, and shifts the 3D key
light toward that row. `featured` still drives ordering and emphasis. Missing
`imageUrl` falls back to a typographic plate, replacing the current icon
placeholder.

### `/about` — dossier

The accordion stays fully functional (single-open, keyboard accessible,
`aria-expanded`/`aria-controls` preserved) but is restyled: numbered sections,
mono headers, hairline rules instead of boxes. The flip card becomes a duotone
portrait resolving out of grain on scroll. **All five sections' copy is
unchanged**, including the education details.

### `/certifications` — records

A list, not cards. Large index numbers, organization in mono, issue date
right-aligned, skills as chips, `View Credential` preserved. Featured entries
get a heavier rule and a larger index. The existing `formatDate` behavior is
retained.

### `/contact` — final scene

Email, phone, and location as three large type blocks with the existing
copy-to-clipboard behavior intact. The form keeps its exact submit logic,
endpoint, validation, and status messages, restyled to underline-only inputs.
The world fades to black behind it.

### Nav and footer

`HOLLAI` left, four uppercase links right, hairline rule. Hidden during the
intro, fading in at 4.0s. Translucent and unobtrusive while scrolling. Active
route marked with a `--signal` indicator. Mobile reuses the existing burger and
overlay logic as a full-screen takeover with the existing scroll-lock effect.

---

## 10. Data plumbing cleanup

`HomePage`, `ProjectsPage`, `CertificationsPage`, and `ContactPage` each hardcode
the Render URL while `src/config/api.js` sits unused. Since all four are being
edited anyway, they will be pointed at the existing `buildApiUrl()` helper.

No API change, no behavior change — this only stops four copies of the same URL
from drifting apart. Approved by the user.

---

## 11. Responsiveness

Not a shrunken desktop layout. Per breakpoint:

| Breakpoint | Treatment |
|---|---|
| ≥1280px | Full experience. Case-file rows with offset images. |
| 768–1279px | Camera FOV widened, hero scale reduced, project images inline rather than offset. |
| <768px | `low` quality tier. Intro concept preserved with SDF spectacles and CSS tear. World reduced to floor + fog, no light shaft. Case files stack: index, title, image, meta. Nav becomes full-screen takeover. |
| <380px | Hero clamps to 4rem. Mono metadata drops to 10px. |

Verified down to 360px width.

---

## 12. Performance

- 3D layer behind `React.lazy` + `Suspense`. The shell and **all text content
  paint without it**.
- dpr `[1, 2]` desktop, `[1, 1.5]` mobile. `powerPreference: 'high-performance'`.
- **No WebGL postprocessing pass.** Vignette and grain are CSS.
- Fonts subset to latin, preloaded.
- Intro canvas unmounts after completion — one context in steady state.
- `frameloop="demand"` when idle; render paused on hidden tab.

---

## 13. Accessibility

- `prefers-reduced-motion` honored throughout, not only in the intro. All
  scroll-reveals become immediate; camera choreography is disabled; the world
  renders one static frame.
- All content reachable and readable with every animation disabled.
- The intro is skippable: any key press, click, or `Escape` jumps to the end.
- Focus states use `--signal` and are never removed.
- The accordion, form, nav, and copy-to-clipboard keep their existing ARIA and
  keyboard behavior.
- Contrast: `--bone` on `--void` and `--smoke` on `--ink` both verified against
  WCAG AA at their used sizes.

---

## 14. Known risk

CRA 5 does not expose webpack config, and `@react-three/drei` has historically
required `resolve.fullySpecified: false` for its `.mjs` entry points.

**Mitigation order:**
1. Plain install and build. If it works, nothing more is needed.
2. If it fails, add `@craco/craco` as a config override — no eject, no change to
   the rest of the build pipeline.
3. Only if that fails, import the two or three needed drei helpers directly from
   source paths and drop the package.

This is the one place the redesign could add a dependency the user did not
explicitly approve. It will be surfaced if reached.

---

## 15. Verification

- `npm run build` completes clean.
- All seven routes render: `/`, `/about`, `/projects`, `/certifications`,
  `/contact`, `/admin/login`, `/admin`.
- **Admin login and Projects/Certifications CRUD still work**, including image
  upload.
- Intro plays once, is skipped on second navigation, and replays via `?intro`.
- `prefers-reduced-motion` path shows all content with no motion.
- Layout holds at 360px, 768px, 1280px, 1920px.
- CPU-throttled (6×) pass on Home and Projects without frame collapse.
- No WebGL context leak across repeated route navigation.

---

## 16. File inventory

**New (~14):** `styles/tokens.css`, `styles/typography.css`, `styles/overlays.css`,
`components/layout/SiteShell.js`, `state/scene.js`, `three/quality.js`,
`three/intro/IntroSequence.js`, `three/intro/Spectacles.js`,
`three/intro/TearPlane.js`, `three/intro/seam.js`,
`three/world/WorldCanvas.js`, `three/world/BaseScene.js`,
`three/world/cameraRig.js`, `hooks/useScrollProgress.js`, plus font files.

**Modified (~12):** `App.js`, `index.css`, `index.html`, all five public pages
and their stylesheets, `Navbar.js` + CSS, `Footer.js` + CSS, `package.json`.

**Deleted (2):** `components/ThemeToggle.js`, `styles/ThemeToggle.css`.

**Untouched:** everything under `backend/`, `components/admin/*`,
`components/ProtectedRoute.js`, `utils/authClient.js`, `config/api.js`.
