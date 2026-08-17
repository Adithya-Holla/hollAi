import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import CursorHalo from '../CursorHalo';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { sceneState } from '../../state/scene';
import { shouldPlayIntro, markIntroSeen } from '../../state/introGate';
import { resolveQualityFromEnvironment, detectWebGL } from '../../three/quality';
import '../../styles/SiteShell.css';
// Eager, not lazy: the Suspense fallback below is the black cover, and it must
// already be painted black before the intro chunk arrives or the site flashes
// into view first.
import '../../styles/Intro.css';

// Code-split: three + drei must never land in the main bundle.
const WorldCanvas = React.lazy(() => import('../../three/world/WorldCanvas'));
const IntroSequence = React.lazy(() => import('../../three/intro/IntroSequence'));

/**
 * Layout route for every public page.
 *
 * Mounts the world canvas, nav, and footer exactly once so navigation is a
 * camera move through a continuous space rather than a teardown and rebuild.
 * Admin routes deliberately sit outside this shell.
 */
function SiteShell() {
  const location = useLocation();
  useScrollProgress();

  const quality = useMemo(() => {
    const q = resolveQualityFromEnvironment();
    sceneState.quality = q;
    return q;
  }, []);

  const [introTearing, setIntroTearing] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(
    () =>
      window.location.pathname === '/' &&
      detectWebGL() &&
      shouldPlayIntro({
        storage: window.sessionStorage,
        search: window.location.search,
      })
  );

  // Mirrored into the scene state so the render loop can read it without a
  // React subscription.
  sceneState.introPlaying = introPlaying;

  // Stable identity. Passed inline this re-created itself on every render,
  // which changed a prop the intro's timeline effect depended on and made the
  // whole sequence restart mid-tear.
  const handleTearStart = useCallback(() => setIntroTearing(true), []);

  const handleIntroComplete = useCallback(() => {
    markIntroSeen(window.sessionStorage);
    sceneState.introDone = true;
    sceneState.introPlaying = false;
    setIntroPlaying(false);
  }, []);

  useEffect(() => {
    sceneState.route = location.pathname;
    sceneState.hoveredRow = -1;
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Nothing scrolls behind the cover while the cinematic runs.
  useEffect(() => {
    if (!introPlaying) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [introPlaying]);

  return (
    <div className="site-shell" data-intro={introPlaying ? 'playing' : 'done'}>
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="site-world" aria-hidden="true">
        {/* Fallback is null on purpose: every word of text paints before any
            3D arrives. */}
        <React.Suspense fallback={null}>
          <WorldCanvas route={location.pathname} />
        </React.Suspense>
      </div>

      {/* Column rules sit above the world and below the content. */}
      <div className="site-columns" aria-hidden="true" />

      <div className="site-content">
        <Navbar />
        <main id="main">
          {/* Pages need to know when the cinematic is still covering them, so
              entrance animations do not play out behind the black cover —
              and when the tear starts, so they can overlap it. */}
          <Outlet context={{ introPlaying, introTearing }} />
        </main>
        <Footer />
      </div>

      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <CursorHalo />

      {introPlaying && (
        <React.Suspense fallback={<div className="intro-layer" />}>
          <IntroSequence
            quality={quality}
            onComplete={handleIntroComplete}
            onTearStart={handleTearStart}
          />
        </React.Suspense>
      )}
    </div>
  );
}

export default SiteShell;
