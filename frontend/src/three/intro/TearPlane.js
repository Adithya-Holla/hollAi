import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { generateSeam } from './seam';

const SEAM_SEED = 1337;
/*
 * Many short segments with a small perpendicular amplitude. The ratio between
 * these two is what decides whether the edge reads as torn paper or as a
 * cartoon lightning bolt — large amplitude over few segments gives regular
 * zigzags, which is the wrong material entirely.
 */
const SEAM_SEGMENTS = 110;
const SEAM_AMPLITUDE = 0.045;

/**
 * One half of the cover: the seam polyline, closed through the corner on
 * `side`. -1 takes the lower-left triangle, +1 the upper-right.
 */
function halfGeometry(seam, side) {
  const shape = new THREE.Shape();
  const [sx, sy] = seam[0];
  shape.moveTo(sx, sy);
  seam.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.lineTo(side < 0 ? -1 : 1, side < 0 ? -1 : 1);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 1);
}

const vertexShader = `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/*
 * The seam draws itself before anything moves.
 *
 * `uReveal` is how far the split has travelled along the diagonal, 0 at the
 * top-left corner and 1 at the bottom-right. Only the drawn portion lights
 * up, and a hot point rides the leading end, so the tear reads as something
 * propagating through a surface rather than a line switching on.
 *
 * `uHeat` is the overall brightness, faded down as the halves separate.
 *
 * Distance to the diagonal stands in for distance to the seam itself — at
 * this amplitude the two are within a few percent, and it costs one dot
 * product instead of sampling the polyline per fragment.
 */
const fragmentShader = `
  uniform float uReveal;
  uniform float uHeat;
  uniform vec3  uSignal;
  varying vec2 vPos;

  void main() {
    float d = abs(vPos.x + vPos.y) * 0.70710678;
    float along = (vPos.x - vPos.y + 2.0) * 0.25;

    // Everything behind the leading end, with a soft trailing edge.
    float drawn = 1.0 - smoothstep(uReveal, uReveal + 0.045, along);

    // A brighter point riding the split as it travels.
    float tip = exp(-pow((along - uReveal) / 0.03, 2.0));

    // A thin hot line, not a band. Anything wider reads as neon.
    float rim  = 1.0 - smoothstep(0.0, 0.006, d);
    float halo = 1.0 - smoothstep(0.0, 0.030, d);

    vec3 color = uSignal * pow(halo, 1.8) * 0.32 * drawn
               + vec3(1.0) * pow(rim, 3.0) * 0.9 * drawn
               + vec3(1.0) * tip * halo * 1.1;

    gl_FragColor = vec4(color * uHeat, 1.0);
  }
`;

/**
 * @param side        -1 lower-left half, +1 upper-right half
 * @param groupRef    animated apart by the intro timeline
 * @param materialRef exposes uGap to the timeline
 */
function TearHalf({ side, groupRef, materialRef, depth = 0 }) {
  const { camera, size } = useThree();

  const seam = useMemo(
    () =>
      generateSeam({
        segments: SEAM_SEGMENTS,
        seed: SEAM_SEED,
        amplitude: SEAM_AMPLITUDE,
      }),
    []
  );

  const geometry = useMemo(() => halfGeometry(seam, side), [seam, side]);

  // Size the cover to the viewport at the plane's depth, so the seam's ends
  // land on the actual screen corners rather than somewhere off-screen.
  const scale = useMemo(() => {
    const distance = camera.position.z - depth;
    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * distance;
    const halfWidth = halfHeight * (size.width / size.height);
    // Margin covers the corners once the halves start rotating.
    const margin = 1.3;
    return [halfWidth * margin, halfHeight * margin, 1];
  }, [camera.position.z, camera.fov, size.width, size.height, depth]);

  const uniforms = useMemo(
    () => ({
      uReveal: { value: 0 },
      uHeat: { value: 0 },
      uSignal: { value: new THREE.Color('#C4161C') },
    }),
    []
  );

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} scale={scale}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default TearHalf;
