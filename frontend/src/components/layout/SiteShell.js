import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { sceneState } from '../../state/scene';
import '../../styles/SiteShell.css';

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
