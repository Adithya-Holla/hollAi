import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { sceneState } from '../../state/scene';
import '../../styles/SiteShell.css';

// Code-split: three + drei must never land in the main bundle.
const WorldCanvas = React.lazy(() => import('../../three/world/WorldCanvas'));

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

  useEffect(() => {
    sceneState.route = location.pathname;
    sceneState.hoveredRow = -1;
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="site-shell">
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
    </div>
  );
}

export default SiteShell;
