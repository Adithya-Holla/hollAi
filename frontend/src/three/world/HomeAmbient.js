import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { frameGeometry, CX } from '../lensShape';
import { sceneState } from '../../state/scene';

/**
 * Layer reserved for the ambient object and its light.
 *
 * A light bright enough to define the frames also dumps a large bright pool
 * on the floor, which reads as a spotlight blob. three.js only lets a light
 * affect objects whose layers it shares, so putting both on their own layer
 * lights the glasses and nothing else. The meshes keep layer 0 as well, so
 * the camera still draws them.
 */
const AMBIENT_LAYER = 1;

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
  const meshRefs = useRef([]);
  const materialRefs = useRef([]);

  const geometryL = useMemo(() => frameGeometry(-CX, 0.02, 120), []);
  const geometryR = useMemo(() => frameGeometry(CX, 0.02, 120), []);

  const collectMesh = (m) => {
    if (m && !meshRefs.current.includes(m)) meshRefs.current.push(m);
  };
  const collectMaterial = (m) => {
    if (m && !materialRefs.current.includes(m)) materialRefs.current.push(m);
  };

  useEffect(() => {
    meshRefs.current.forEach((mesh) => mesh.layers.enable(AMBIENT_LAYER));
    if (lightRef.current) lightRef.current.layers.set(AMBIENT_LAYER);
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const t = state.clock.elapsedTime;

    // A slow turn that never completes: the figure shifts its weight rather
    // than spinning. Two frequencies so the motion does not visibly loop.
    group.rotation.y = Math.sin(t * 0.13) * 0.55 + Math.sin(t * 0.041) * 0.2;
    group.rotation.x = Math.sin(t * 0.095) * 0.09;
    group.rotation.z = Math.sin(t * 0.061) * 0.04;
    group.position.y = 2.5 + Math.sin(t * 0.15) * 0.28;
    group.position.x = Math.sin(t * 0.056) * 1.1;

    // The light circles the object, so highlights crawl along the frame edge.
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t * 0.24) * 2.6;
      lightRef.current.position.z = Math.cos(t * 0.24) * 2.2 + 1.4;
      lightRef.current.position.y = Math.sin(t * 0.33) * 1.1;
    }

    // Held back while the cinematic is still running, so it never competes
    // with the intro's own spectacles.
    const target = sceneState.introPlaying ? 0 : 1;
    materialRefs.current.forEach((m) => {
      m.opacity += (target - m.opacity) * Math.min(delta * 1.2, 1);
    });
  });

  const material = (
    <meshStandardMaterial
      ref={collectMaterial}
      color="#4c4c5c"
      roughness={0.2}
      metalness={0.9}
      envMapIntensity={3.2}
      transparent
      /*
       * Starts visible, not at zero. On the reduced-motion path the canvas
       * runs frameloop="demand", so the fade below never ticks — seeded at 0
       * the object would simply never appear. Fading out while the cinematic
       * plays is safe because the opaque cover hides the world anyway.
       */
      opacity={1}
    />
  );

  return (
    /*
     * Sits at z -7: far enough back to stay behind the type, near enough that
     * the exponential fog does not erase it. At -15 it was invisible.
     */
    <group ref={groupRef} position={[0, 2.5, -6.2]} scale={quality === 'high' ? 3 : 2.5}>
      <mesh geometry={geometryL} ref={collectMesh}>{material}</mesh>
      <mesh geometry={geometryR} ref={collectMesh}>{material}</mesh>

      {/* Bridge, so the two lenses read as one object. */}
      <mesh position={[0, 0.05, 0]} ref={collectMesh}>
        <boxGeometry args={[0.18, 0.018, 0.018]} />
        {material}
      </mesh>

      <pointLight
        ref={lightRef}
        position={[1.5, 0.4, 2]}
        intensity={quality === 'high' ? 22 : 14}
        distance={9}
        decay={1.4}
        color="#b9c2d4"
      />
    </group>
  );
}

export default HomeAmbient;
