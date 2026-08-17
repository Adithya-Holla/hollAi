import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { lensShape, LENS_W, LENS_H } from '../lensShape';

const vertexShader = `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/*
 * A soft band travelling along the lens diagonal.
 *
 * `s` runs from -2 at the top-left corner to +2 at the bottom-right, so
 * moving uHead across that range carries the band from one corner to the
 * other, with the band itself lying along the opposite diagonal.
 *
 * The edge falloff keeps it from ending abruptly at the lens boundary, so it
 * reads as light sliding across glass rather than a shape drawn on top.
 */
const fragmentShader = `
  uniform float uHead;
  uniform float uStrength;
  uniform float uCx;
  uniform float uHalfW;
  uniform float uHalfH;
  uniform vec3  uColor;
  varying vec2 vPos;

  void main() {
    float x = (vPos.x - uCx) / uHalfW;
    float y = vPos.y / uHalfH;

    float s = x - y;
    float band = exp(-pow((s - uHead) / 0.4, 2.0));

    // A brighter core inside the wider band gives it a defined leading edge.
    float core = exp(-pow((s - uHead) / 0.13, 2.0));

    // Fade near the lens edge so the band does not stop dead at the rim.
    float edge = (1.0 - smoothstep(0.78, 1.0, abs(x))) *
                 (1.0 - smoothstep(0.78, 1.0, abs(y)));

    float a = (band * 0.5 + core * 0.9) * uStrength * edge;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/** Uniform set for one lens. The parent owns these and writes them per frame. */
export function createSweepUniforms(cx) {
  return {
    uHead: { value: -3 },
    uStrength: { value: 0 },
    uCx: { value: cx },
    uHalfW: { value: LENS_W / 2 },
    uHalfH: { value: LENS_H / 2 },
    uColor: { value: new THREE.Color('#f2efe9') },
  };
}

/**
 * The travelling reflection, painted onto the lens face.
 *
 * A real area light was tried first: on a lens this small and this far back
 * it resolves to a round specular blob rather than a streak. Drawing the band
 * directly gives the shape the brief calls for, and costs one additive quad.
 *
 * `renderOrder` matters here. Everything else in the group is opaque, so this
 * quad is the only member of the transparent pass and must draw last.
 */
/**
 * The material is built once, outside React, and handed over whole.
 *
 * Passing `uniforms` as a JSX prop did not work: the object the parent held
 * and mutated was not the one the material ended up reading, so the band
 * rendered but never changed. Constructing the material here and exposing it
 * through `materialRef` removes the ambiguity — the parent writes to exactly
 * the instance being drawn.
 */
function LensSweep({ cx, materialRef, tilt = 0 }) {
  const geometry = useMemo(() => new THREE.ShapeGeometry(lensShape(cx), 24), [cx]);

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: createSweepUniforms(cx),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    m.toneMapped = false;
    return m;
  }, [cx]);

  useEffect(() => {
    // Captured here so cleanup operates on the same array it registered with.
    const registry = materialRef ? materialRef.current : null;
    if (registry) registry.push(material);

    return () => {
      if (registry) {
        const i = registry.indexOf(material);
        if (i >= 0) registry.splice(i, 1);
      }
      material.dispose();
    };
  }, [material, materialRef]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, 0, -0.02]}
      rotation={[0, tilt, 0]}
      renderOrder={20}
    />
  );
}

export default LensSweep;
