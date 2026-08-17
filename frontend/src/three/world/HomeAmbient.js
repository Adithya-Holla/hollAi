import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { frameGeometry, lensGeometry, CX } from '../lensShape';
import LensSweep from './LensSweep';
import { sceneState } from '../../state/scene';


/*
 * NOTE — do not put these lights on their own layer.
 *
 * three.js collects a light only when `light.layers.test(camera.layers)`
 * passes, and there is no per-object light masking in the forward renderer.
 * Moving a light to layer 1 while the camera renders layer 0 therefore does
 * not restrict it to matching objects — it removes the light from the scene
 * entirely. An earlier version did exactly that, which is why no intensity
 * value here had any visible effect.
 *
 * Floor spill is controlled physically instead: modest intensities and a
 * `distance` short enough that the falloff dies before it reaches the floor.
 */

/* Reflection pass: seconds between passes, and the share of that spent
   travelling. The rest is idle, so it reads as a catch of light. */
const SWEEP_PERIOD = 7;
const SWEEP_FRACTION = 0.22;
const SWEEP_PEAK = 1.5;

/*
 * Band position along the lens diagonal. -2 is the top-left corner and +2 the
 * bottom-right, so the extra margin either side starts and finishes the pass
 * fully off the glass.
 */
const SWEEP_START = -2.7;
const SWEEP_END = 2.7;

/**
 * The continuous background motion on Home.
 *
 * Rather than adding abstract geometry, this brings the spectacles back as a
 * presence behind the type — the same character from the opening, still in
 * the room. It turns slowly and its own light circles it, so something is
 * always moving without anything demanding attention.
 *
 * Driven by the clock rather than by scroll, so it keeps running once the
 * hero animation has finished.
 */
function HomeAmbient({ quality }) {
  const groupRef = useRef();
  const lightRef = useRef();

  const geometryL = useMemo(() => frameGeometry(-CX, 0.034, 140), []);
  const geometryR = useMemo(() => frameGeometry(CX, 0.034, 140), []);
  const lensL = useMemo(() => lensGeometry(-CX), []);
  const lensR = useMemo(() => lensGeometry(CX), []);
  // Populated by the LensSweep children with their actual materials.
  const sweepMaterials = useRef([]);


  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const t = state.clock.elapsedTime;

    // A slow turn that never completes: the figure shifts its weight rather
    // than spinning. Two frequencies so the motion does not visibly loop.
    // Capped around 28°: beyond that the far lens turns nearly edge-on and
    // the pair stops reading as spectacles.
    group.rotation.y = Math.sin(t * 0.13) * 0.36 + Math.sin(t * 0.041) * 0.13;
    group.rotation.x = Math.sin(t * 0.095) * 0.09;
    group.rotation.z = Math.sin(t * 0.061) * 0.04;
    group.position.y = 2.5 + Math.sin(t * 0.15) * 0.28;
    group.position.x = Math.sin(t * 0.056) * 1.1;

    // The light circles the object, so highlights crawl along the frame edge.
    // It stays ABOVE the glasses: the group sits 2.5 world units over the
    // floor, and the light's radius is set to die before it gets there.
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t * 0.24) * 0.7;
      lightRef.current.position.z = Math.cos(t * 0.24) * 0.3 + 0.55;
      lightRef.current.position.y = 0.5 + Math.sin(t * 0.33) * 0.12;
    }

    /*
     * The reflection pass. Every SWEEP_PERIOD seconds a light crosses the
     * lenses from the top-left corner to the bottom-right, echoing the sweep
     * in the opening cinematic. Idle between passes rather than continuous,
     * so it reads as a catch of light rather than a rotating beacon.
     */
    {
      const phase = (t % SWEEP_PERIOD) / SWEEP_PERIOD;
      const p = phase / SWEEP_FRACTION;

      let head = SWEEP_END;
      let strength = 0;

      if (p <= 1) {
        // Eased travel so it accelerates in and decelerates out.
        const eased = p * p * (3 - 2 * p);
        head = SWEEP_START + (SWEEP_END - SWEEP_START) * eased;
        // Fades up and back down across the pass; never pops on or off.
        strength = Math.sin(Math.PI * p) * SWEEP_PEAK;
      }

      sweepMaterials.current.forEach((m) => {
        m.uniforms.uHead.value = head;
        m.uniforms.uStrength.value = strength;
      });

      if (process.env.NODE_ENV !== 'production') {
        window.__sweep = { intensity: strength, head };
      }
    }

    /*
     * Hidden outright while the cinematic runs, rather than faded through
     * material opacity. Marking these materials `transparent` moved them into
     * the transparent render pass, which draws after opaque geometry and
     * painted straight over the sweep quad — the reason no reflection was
     * visible at all. The opaque cover hides the world during the intro
     * anyway, so a hard toggle loses nothing.
     */
    group.visible = !sceneState.introPlaying;
  });

  /*
   * Deliberately NOT transparent. A transparent material joins the
   * transparent render pass, which draws after all opaque geometry — enough
   * to hide the additive sweep quad completely.
   */
  const material = (
    <meshStandardMaterial
      color="#9aa0b4"
      roughness={0.38}
      metalness={0.3}
      envMapIntensity={3}
      /*
       * A low emissive floor so the frame never drops to pure black as the
       * object turns away from its light. This is what keeps the silhouette
       * continuously readable; without it the outline breaks up whenever the
       * key light falls off an edge.
       */
      emissive="#414a63"
      emissiveIntensity={0.7}
    />
  );

  return (
    /*
     * Sits at z -7: far enough back to stay behind the type, near enough that
     * the exponential fog does not erase it. At -15 it was invisible.
     */
    <group ref={groupRef} position={[0, 2.5, -6.2]} scale={quality === 'high' ? 3 : 2.5}>
      {/*
       * The lens surfaces. Without these the object is only wire-thin frames,
       * and a light passing them can produce a glint but never a sweep —
       * there is simply no surface for a reflection to travel across.
       */}
      <mesh geometry={lensL} position={[0, 0, -0.03]} rotation={[0, 0.13, 0]}>
        <meshPhysicalMaterial
          color="#0b0b12"
          roughness={0.14}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1.5}
        />
      </mesh>
      <mesh geometry={lensR} position={[0, 0, -0.03]} rotation={[0, -0.13, 0]}>
        <meshPhysicalMaterial
          color="#0b0b12"
          roughness={0.14}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1.5}
        />
      </mesh>

      <mesh geometry={geometryL}>{material}</mesh>
      <mesh geometry={geometryR}>{material}</mesh>

      {/* Bridge, so the two lenses read as one object. */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.18, 0.03, 0.03]} />
        {material}
      </mesh>

      {/*
       * Keeps the frames alive between passes. `distance` is deliberately
       * short: the floor sits ~2.5 world units below this group, and anything
       * that reaches it turns into a bright pool.
       */}
      <pointLight
        ref={lightRef}
        position={[0.5, 0.5, 0.55]}
        intensity={quality === 'high' ? 13 : 9}
        distance={3.4}
        decay={1.5}
        color="#b9c2d4"
      />

      {/* The travelling reflection, drawn on the lens faces. */}
      <LensSweep cx={-CX} materialRef={sweepMaterials} tilt={0.13} />
      <LensSweep cx={CX} materialRef={sweepMaterials} tilt={-0.13} />
    </group>
  );
}

export default HomeAmbient;
