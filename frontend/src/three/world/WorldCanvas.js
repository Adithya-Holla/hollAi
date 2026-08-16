import React, { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import BaseScene from './BaseScene';
import { resolveQualityFromEnvironment, detectWebGL } from '../quality';
import { sceneState } from '../../state/scene';

/**
 * The one persistent canvas. Mounted by SiteShell and never unmounted, so
 * navigating between routes is a camera move rather than a context teardown.
 */
function WorldCanvas() {
  const quality = useMemo(() => {
    const q = resolveQualityFromEnvironment();
    sceneState.quality = q;
    return q;
  }, []);

  const hasWebGL = useMemo(() => detectWebGL(), []);

  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden
  );

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // No WebGL at all: mount nothing. The site is pure DOM and CSS, and every
  // page remains complete without it.
  if (!hasWebGL) return null;

  // Static tier: render one frame, then freeze. The world is seen, but the
  // camera never moves.
  if (quality === 'static') {
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
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}

export default WorldCanvas;
