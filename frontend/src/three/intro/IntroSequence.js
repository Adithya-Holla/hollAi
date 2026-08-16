import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import gsap from 'gsap';
import Spectacles from './Spectacles';
import TearHalf from './TearPlane';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import '../../styles/Intro.css';

RectAreaLightUniformsLib.init();

export const TEAR_AT = 3.2;
export const TOTAL = 4.2;
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
      onTear();
      const t = setTimeout(onDone, 1100);
      return () => clearTimeout(t);
    }

    const tl = gsap.timeline({ onComplete: onDone });

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
    tl.call(onTear, undefined, TEAR_AT);

    // 3.2 – 4.2 · the tear
    const lower = lowerRef.current;
    const upper = upperRef.current;
    if (lower && upper) {
      tl.to(lower.position, { x: -1.15, y: -0.8, z: 0.5, duration: 1, ease: 'power3.in' }, TEAR_AT);
      tl.to(lower.rotation, { z: -0.03, duration: 1, ease: 'power2.in' }, TEAR_AT);
      tl.to(upper.position, { x: 1.15, y: 0.8, z: 0.5, duration: 1, ease: 'power3.in' }, TEAR_AT);
      tl.to(upper.rotation, { z: 0.03, duration: 1, ease: 'power2.in' }, TEAR_AT);
    }
    if (lowerMat.current && upperMat.current) {
      const gaps = [lowerMat.current.uniforms.uGap, upperMat.current.uniforms.uGap];
      tl.to(gaps, { value: 1, duration: 0.14, ease: 'power2.out' }, TEAR_AT);
      tl.to(gaps, { value: 0, duration: 0.8, ease: 'power2.in' }, TEAR_AT + 0.16);
    }
    // The camera passes through the glasses as the cover peels away: they
    // rush toward the lens and out of frame rather than shrinking away.
    tl.to(specs.scale, { x: 2.6, y: 2.6, z: 2.6, duration: 1, ease: 'power3.in' }, TEAR_AT);
    tl.to(specs.position, { z: 2.3, duration: 1, ease: 'power3.in' }, TEAR_AT);

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
  }, [reduced, quality, onDone, onTear, eyeMaterials]);

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

  const handleTear = useCallback(() => setTearing(true), []);

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
