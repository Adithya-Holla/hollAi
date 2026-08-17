import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Environment } from '@react-three/drei';
import { lensShape, frameGeometry, LENS_W, GAP, CX } from '../lensShape';

/**
 * The frame as swept tube geometry rather than a flat outline, so the sweep
 * light in the intro timeline produces a real moving specular along it.
 */
function Frame({ cx }) {
  const geometry = useMemo(() => frameGeometry(cx), [cx]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#1a1a1e" roughness={0.22} metalness={0.95} envMapIntensity={1.4} />
    </mesh>
  );
}

/**
 * Very dark and very glossy: reads as almost nothing until light rakes across
 * it, which is the whole point of the sweep.
 *
 * Extruded with a large bevel rather than left flat. A flat lens mirrors the
 * sweep light's rectangle exactly and reads as a grey block pasted on; the
 * bevel gives the surface curvature for the highlight to stretch and bend
 * around, which is what makes it read as a reflection.
 */
function Lens({ cx, tilt }) {
  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(lensShape(cx), {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.035,
      bevelOffset: 0,
      bevelSegments: 10,
      curveSegments: 24,
    });
    geo.computeVertexNormals();
    return geo;
  }, [cx]);

  return (
    <mesh geometry={geometry} position={[0, 0, -0.03]} rotation={[0, tilt, 0]}>
      <meshPhysicalMaterial
        color="#06060a"
        /* Not mirror-smooth: a touch of roughness softens the sweep's edge
           into a gradient instead of a hard rectangle. */
        roughness={0.16}
        metalness={0.35}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={1.8}
        transparent
        /* Enough tint to keep the eyes half-seen, not enough to erase them. */
        opacity={0.66}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * A point of light, not an eye. Sits behind the lens and is partly occluded
 * by the lens tint — the iris is only ever half-seen.
 *
 * `collect` is a stable callback rather than an array push: a ref callback
 * fires on every render, and pushing would accumulate duplicates.
 */
function Eye({ cx, collect }) {
  return (
    <group position={[cx, 0.005, -0.14]}>
      <mesh>
        <circleGeometry args={[0.05, 28]} />
        <meshBasicMaterial
          ref={(m) => collect(`${cx}-iris`, m, 'iris')}
          color="#d5d9e2"
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, -0.006]}>
        <circleGeometry args={[0.098, 28]} />
        <meshBasicMaterial
          ref={(m) => collect(`${cx}-socket`, m, 'socket')}
          color="#2b2b34"
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

/**
 * A tiny procedural environment, rendered once into a cube map.
 *
 * Without one, metal reads as near-black under a single directional light —
 * there is nothing for it to reflect. This is what gives the frames their
 * edge and the lenses something to mirror, and it costs no network request.
 */
function IntroEnvironment() {
  return (
    <Environment resolution={128} frames={1}>
      <mesh scale={60}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#04040a" side={THREE.BackSide} />
      </mesh>
      {/* The bright strip the lenses catch. */}
      <mesh position={[-9, 3, -6]} rotation={[0, 0.6, 0.35]}>
        <planeGeometry args={[3, 26]} />
        <meshBasicMaterial color="#6c7488" />
      </mesh>
      <mesh position={[8, -2, -7]} rotation={[0, -0.7, -0.2]}>
        <planeGeometry args={[1.4, 20]} />
        <meshBasicMaterial color="#2a2f3d" />
      </mesh>
    </Environment>
  );
}

/**
 * @param quality  'high' uses a rect area light for the sweep; 'low' a point light.
 * @param sweepRef the moving light, driven by the intro timeline
 * @param eyeRef   group holding both eyes, scaled to contract the irises
 * @param collect  (key, material, kind) => void — registers eye materials for
 *                 the timeline to fade in
 */
function Spectacles({ quality, sweepRef, eyeRef, collect }) {
  return (
    <group>
      <IntroEnvironment />

      <group ref={eyeRef}>
        <Eye cx={-CX} collect={collect} />
        <Eye cx={CX} collect={collect} />
      </group>

      <Frame cx={-CX} />
      <Frame cx={CX} />
      {/* Tilted outward like real glasses wrap, so the sweep reaches each
          lens at a different angle rather than lighting both identically. */}
      <Lens cx={-CX} tilt={0.13} />
      <Lens cx={CX} tilt={-0.13} />

      {/* Bridge */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[GAP, 0.014, 0.014]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.22} metalness={0.95} envMapIntensity={1.4} />
      </mesh>

      {/* Temples, angling back into the dark. */}
      <mesh position={[-CX - LENS_W / 2, 0.06, -0.16]} rotation={[0, 0.5, 0]}>
        <boxGeometry args={[0.34, 0.012, 0.012]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.22} metalness={0.95} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[CX + LENS_W / 2, 0.06, -0.16]} rotation={[0, -0.5, 0]}>
        <boxGeometry args={[0.34, 0.012, 0.012]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.22} metalness={0.95} envMapIntensity={1.4} />
      </mesh>

      {/*
       * Grazing key. Catches the frame edge only — the face is never modeled,
       * it is implied by everything the light fails to reach.
       */}
      <directionalLight position={[-3, 0.7, 1.2]} intensity={0.85} color="#aeb4c0" />
      {/* A weak counter-rim from the right, so the frame does not read as two
          disconnected vertical bars. */}
      <directionalLight position={[3.2, -0.4, 1]} intensity={0.3} color="#7e8798" />
      {/* From above: catches the top rim of each lens. Without it only the
          left and right arcs light up and the shape never reads as glasses. */}
      <directionalLight position={[0.4, 4, 1.6]} intensity={0.45} color="#9aa3b4" />
      <ambientLight intensity={0.05} />

      {quality === 'high' ? (
        <rectAreaLight
          ref={sweepRef}
          position={[-2.4, 0.3, 0.85]}
          width={0.3}
          height={2.4}
          intensity={0}
          color="#dfe6f2"
        />
      ) : (
        <pointLight ref={sweepRef} position={[-2.4, 0.3, 0.85]} intensity={0} color="#dfe6f2" distance={6} />
      )}
    </group>
  );
}

export default Spectacles;
