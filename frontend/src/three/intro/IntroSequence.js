import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import gsap from 'gsap';
import Spectacles from './Spectacles';
import TearHalf from './TearPlane';
import '../../styles/Intro.css';

RectAreaLightUniformsLib.init();

/** The vertical fov the scene was framed at, and the aspect it assumes. */
const BASE_FOV = 40;
const BASE_ASPECT = 16 / 10;

/**
 * A fixed vertical fov reads as a fixed HORIZONTAL fov only at the aspect it
 * was tuned for. On a narrow portrait screen the same vertical fov keeps a
 * far smaller horizontal slice in frame, so the glasses — sized in fixed
 * world units — blow past the edges. This holds the horizontal fov roughly
 * constant instead, widening the vertical fov as the aspect narrows.
 */
function FitCamera() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const aspect = size.width / size.height;
    const baseVFov = (BASE_FOV * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(baseVFov / 2) * BASE_ASPECT);
    const vFov = 2 * Math.atan(Math.tan(hFov / 2) / aspect);
    camera.fov = Math.min(100, Math.max(BASE_FOV, (vFov * 180) / Math.PI));
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

/** The split begins drawing itself. */
export const TEAR_AT = 3.2;
/** How long the split takes to travel corner to corner. */
const SEAM_DRAW = 1.35;
/** A held beat at full length, then the halves start moving. */
const SPLIT_AT = TEAR_AT + SEAM_DRAW + 0.25;
export const TOTAL = SPLIT_AT + 1.4;
const TEAR_DEPTH = -1.6;

/** Resting opacity per eye layer once the emergence beat finishes. */
const EYE_OPACITY = { iris: 1, socket: 0.55 };

function IntroStage({ quality, reduced, onDone, onTear }) {
  const sweepRef = useRef();
  const eyeRef = useRef();
  const specsRef = useRef();
  const lowerRef = useRef();
  const upperRef = useRef();
  const lowerMat = useRef();
  const upperMat = useRef();

  /*
   * The callbacks are held in refs and the timeline effect does not depend on
   * them.
   *
   * They fire mid-sequence and set state upstream, so their identity can
   * change while the timeline is still running. With them in the dependency
   * array that rebuilt the timeline from zero and the whole cinematic played
   * a second time. The timeline must be built exactly once per mount.
   */
  const onDoneRef = useRef(onDone);
  const onTearRef = useRef(onTear);
  useEffect(() => {
    onDoneRef.current = onDone;
    onTearRef.current = onTear;
  });

  // Keyed rather than an array, so repeated ref callbacks overwrite instead
  // of accumulating duplicates across renders.
  const eyeMaterials = useMemo(() => new Map(), []);
  const collect = useCallback(
    (key, material, kind) => {
      if (material) eyeMaterials.set(key, { material, kind });
    },
    [eyeMaterials]
  );

  useEffect(() => {
    const sweep = sweepRef.current;
    const eyes = eyeRef.current;
    const specs = specsRef.current;
    if (!sweep || !eyes || !specs) return undefined;

    // Reduced motion: one lit frame, a hold, then hand over. Nothing animates.
    if (reduced) {
      sweep.intensity = 4;
      sweep.position.x = 0.15;
      eyeMaterials.forEach(({ material, kind }) => {
        material.opacity = EYE_OPACITY[kind];
      });
      onTearRef.current();
      const t = setTimeout(() => onDoneRef.current(), 1100);
      return () => clearTimeout(t);
    }

    const tl = gsap.timeline({ onComplete: () => onDoneRef.current() });

    // 0.0 – 0.6 · darkness. Nothing at all.

    // 0.6 – 1.9 · emergence
    specs.scale.setScalar(1.05);
    tl.to(specs.scale, { x: 1, y: 1, z: 1, duration: 1.35, ease: 'power2.out' }, 0.6);
    eyeMaterials.forEach(({ material, kind }) => {
      tl.to(material, { opacity: EYE_OPACITY[kind], duration: 1.1, ease: 'power1.inOut' }, 0.7);
    });

    // 1.9 – 3.0 · the sweep
    tl.to(sweep, { intensity: quality === 'high' ? 5 : 4, duration: 0.35, ease: 'power2.in' }, 1.9);
    tl.fromTo(
      sweep.position,
      { x: -2.4 },
      { x: 2.4, duration: 1.15, ease: 'power1.inOut' },
      1.9
    );
    tl.to(sweep, { intensity: 0, duration: 0.32, ease: 'power2.out' }, 2.73);

    // The one alive moment: the irises contract as the light crosses them.
    tl.to(eyes.scale, { x: 0.93, y: 0.93, duration: 0.16, ease: 'power2.out' }, 2.34);
    tl.to(eyes.scale, { x: 1, y: 1, duration: 0.34, ease: 'power2.inOut' }, 2.5);

    // 3.0 – 3.2 · hold. The stillness is what makes the tear land.

    /*
     * Fired when the halves actually start moving, not when the split starts
     * drawing. This both drops the layer's black background — so the site
     * shows through the widening gap — and opens the hero's gate, so the
     * wordmark reveals against the separation rather than during the draw.
     */
    tl.call(() => onTearRef.current(), undefined, SPLIT_AT);

    // 3.2 – 4.2 · the tear
    const lower = lowerRef.current;
    const upper = upperRef.current;

    /*
     * The split is now its own beat rather than a flash before the halves
     * move. It propagates across the screen over SEAM_DRAW seconds, holds a
     * moment at full length, and only then does anything separate.
     */
    if (lowerMat.current && upperMat.current) {
      const reveal = [lowerMat.current.uniforms.uReveal, upperMat.current.uniforms.uReveal];
      const heat = [lowerMat.current.uniforms.uHeat, upperMat.current.uniforms.uHeat];

      tl.fromTo(heat, { value: 0 }, { value: 1, duration: 0.3, ease: 'power1.out' }, TEAR_AT);
      tl.fromTo(
        reveal,
        { value: 0 },
        // Slightly past 1 so the leading point runs off the far corner
        // instead of stopping dead on it.
        { value: 1.06, duration: SEAM_DRAW, ease: 'power1.inOut' },
        TEAR_AT
      );
      // Fades out over the whole separation rather than snapping off.
      tl.to(heat, { value: 0, duration: 1.1, ease: 'power2.in' }, SPLIT_AT + 0.25);
    }

    if (lower && upper) {
      // Longer and gentler than before: power2.in over 1.4s reads as a
      // surface being pulled apart, where a hard power3.in read as a snap.
      tl.to(lower.position, { x: -1.25, y: -0.88, z: 0.5, duration: 1.4, ease: 'power2.in' }, SPLIT_AT);
      tl.to(lower.rotation, { z: -0.034, duration: 1.4, ease: 'power1.in' }, SPLIT_AT);
      tl.to(upper.position, { x: 1.25, y: 0.88, z: 0.5, duration: 1.4, ease: 'power2.in' }, SPLIT_AT);
      tl.to(upper.rotation, { z: 0.034, duration: 1.4, ease: 'power1.in' }, SPLIT_AT);
    }

    // The camera passes through the glasses as the cover peels away: they
    // rush toward the lens and out of frame rather than shrinking away.
    tl.to(specs.scale, { x: 2.6, y: 2.6, z: 2.6, duration: 1.4, ease: 'power2.in' }, SPLIT_AT);
    tl.to(specs.position, { z: 2.3, duration: 1.4, ease: 'power2.in' }, SPLIT_AT);

    if (process.env.NODE_ENV !== 'production') {
      window.__introTimeline = tl;
      // ?freeze=2.4 holds the sequence at a given second so a single beat can
      // be inspected. Development only.
      const freeze = new URLSearchParams(window.location.search).get('freeze');
      if (freeze !== null) {
        tl.pause();
        // suppressEvents=false so the tear callback still fires when seeking
        // past it.
        tl.seek(parseFloat(freeze) || 0, false);
      }
    }

    return () => {
      tl.kill();
      if (process.env.NODE_ENV !== 'production') delete window.__introTimeline;
    };
  }, [reduced, quality, eyeMaterials]);

  return (
    <>
      <group ref={specsRef}>
        <Spectacles
          quality={quality}
          sweepRef={sweepRef}
          eyeRef={eyeRef}
          collect={collect}
        />
      </group>
      {/*
       * The cover sits BEHIND the spectacles, not in front. An opaque cover
       * between the camera and the glasses hides them completely — the
       * darkness the glasses emerge from has to be behind them.
       */}
      <group position={[0, 0, TEAR_DEPTH]}>
        <TearHalf side={-1} groupRef={lowerRef} materialRef={lowerMat} depth={TEAR_DEPTH} />
        <TearHalf side={1} groupRef={upperRef} materialRef={upperMat} depth={TEAR_DEPTH} />
      </group>
    </>
  );
}

function IntroSequence({ onComplete, onTearStart, quality }) {
  // Always the full cinematic: the site does not honor prefers-reduced-motion
  // for the intro or the ambient scene.
  const reduced = false;
  const [tearing, setTearing] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  }, [onComplete]);

  const handleTear = useCallback(() => {
    setTearing(true);
    // The page below starts its own entrance now, so the hero reveal overlaps
    // the tear instead of queueing behind it.
    if (onTearStart) onTearStart();
  }, [onTearStart]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 900);
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish]);

  return (
    <>
      <div className={`intro-layer ${tearing ? 'is-tearing' : ''}`}>
        <Canvas
          dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
          camera={{ position: [0, 0, 2.0], fov: 40 }}
          gl={{ alpha: true, antialias: quality === 'high' }}
        >
          <FitCamera />
          <IntroStage
            quality={quality}
            reduced={reduced}
            onDone={finish}
            onTear={handleTear}
          />
        </Canvas>
      </div>
      <button
        className={`intro-skip ${showSkip ? 'is-shown' : ''}`}
        onClick={finish}
      >
        Skip
      </button>
    </>
  );
}

export default IntroSequence;
