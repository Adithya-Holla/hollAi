import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { advanceCamera } from './cameraRig';
import { sceneState } from '../../state/scene';
import HomeAmbient from './HomeAmbient';

const shaftVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/*
 * Soft on all four edges. A hard-edged additive quad reads as a grey
 * rectangle pasted over the scene; the falloff is what makes it read as light.
 */
const shaftFragment = `
  uniform float uOpacity;
  uniform vec3  uColor;
  varying vec2 vUv;

  void main() {
    float across = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
    float along  = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
    gl_FragColor = vec4(uColor, across * along * uOpacity);
  }
`;

function ShaftPlane({ position, rotation, size, opacity }) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <shaderMaterial
        vertexShader={shaftVertex}
        fragmentShader={shaftFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uOpacity: { value: opacity },
          uColor: { value: new THREE.Color('#7d8496') },
        }}
      />
    </mesh>
  );
}

/**
 * The light shaft is faked with two soft additive planes rather than real
 * volumetrics — the cheap approximation, per spec §7.
 */
function LightShaft() {
  return (
    <group>
      <ShaftPlane position={[-3.4, 3.2, -5]} rotation={[0, 0, 0.34]} size={[2.6, 14]} opacity={0.075} />
      <ShaftPlane position={[-3.0, 3.2, -6.2]} rotation={[0, 0, 0.34]} size={[1.4, 14]} opacity={0.05} />
    </group>
  );
}

const BASE_FOG = 0.055;

/**
 * The entire world: a floor, fog, one key light, one red rim.
 * Deliberately nothing else — no spheres, no cubes, no particle fields.
 */
/**
 * One-time cube map so the floor and the ambient geometry have something to
 * reflect. Metal under a lone directional light renders near-black.
 */
function WorldEnvironment() {
  return (
    <Environment resolution={64} frames={1}>
      <mesh scale={80}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial color="#050509" side={THREE.BackSide} />
      </mesh>
      <mesh position={[-14, 8, -10]} rotation={[0, 0.5, 0.3]}>
        <planeGeometry args={[6, 30]} />
        <meshBasicMaterial color="#5c6474" />
      </mesh>
    </Environment>
  );
}

function BaseScene({ quality, route }) {
  const keyRef = useRef();
  const fogRef = useRef();
  const { camera } = useThree();

  useFrame((_, delta) => {
    advanceCamera(camera, delta);

    if (keyRef.current) {
      // The key drifts with the pointer so the floor's specular moves with it.
      const targetX = -6 + sceneState.pointer.x * 1.5;
      keyRef.current.position.x += (targetX - keyRef.current.position.x) * 0.04;

      // Hovering a case file on /projects drops the key toward that row.
      const targetY = sceneState.route === '/projects' && sceneState.hoveredRow >= 0 ? 2.2 : 3;
      keyRef.current.position.y += (targetY - keyRef.current.position.y) * 0.05;
    }

    if (fogRef.current) {
      // Contact returns toward darkness — the ending echoes the opening.
      const targetFog =
        sceneState.route === '/contact' ? BASE_FOG + sceneState.progress * 0.14 : BASE_FOG;
      fogRef.current.density += (targetFog - fogRef.current.density) * 0.05;
    }
  });

  return (
    <>
      <fogExp2 ref={fogRef} attach="fog" args={['#000000', BASE_FOG]} />
      <ambientLight intensity={0.05} />

      {/* Key: low and hard from screen-left. This is what carves the space. */}
      <directionalLight ref={keyRef} position={[-6, 3, 2]} intensity={1.35} color="#cfd2d8" />

      {/*
       * Red rim, from behind and far off to the side.
       * Kept at a fraction of the key: a directional light of any real
       * strength turns the floor's specular lobe into a red bloom, which is
       * exactly the glow this design must not have.
       */}
      <directionalLight position={[7, 0.6, -14]} intensity={0.055} color="#C4161C" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[80, 90]} />
        {/*
         * Rough enough to scatter rather than mirror. Metalness this high with
         * low roughness produces a single hot reflection that reads as a blob.
         */}
        <meshStandardMaterial color="#0A0A0C" roughness={0.62} metalness={0.55} />
      </mesh>

      <WorldEnvironment />

      {quality === 'high' && <LightShaft />}

      {/* Continuous background motion, Home only. */}
      {route === '/' && <HomeAmbient quality={quality} />}
    </>
  );
}

export default BaseScene;
