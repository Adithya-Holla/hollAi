import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
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

  const [introPlaying, setIntroPlaying] = useState(
    () =>
      window.location.pathname === '/' &&
      detectWebGL() &&
      shouldPlayIntro({
        storage: window.sessionStorage,
        search: window.location.search,
      })
  );

  const handleIntroComplete = useCallback(() => {
    markIntroSeen(window.sessionStorage);
    sceneState.introDone = true;
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
          <WorldCanvas />
        </React.Suspense>
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

      {introPlaying && (
        <React.Suspense fallback={<div className="intro-layer" />}>
          <IntroSequence quality={quality} onComplete={handleIntroComplete} />
        </React.Suspense>
      )}
    </div>
  );
}

export default SiteShell;
