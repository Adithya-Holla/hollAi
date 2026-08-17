import * as THREE from 'three';

export const LENS_W = 0.62;
export const LENS_H = 0.36;
export const GAP = 0.18;
export const CX = (LENS_W + GAP) / 2;

/** Rounded-rectangle outline for one lens, centred on cx. */
export function lensShape(cx) {
  const shape = new THREE.Shape();
  const w = LENS_W / 2;
  const h = LENS_H / 2;
  const r = 0.075;

  shape.moveTo(cx - w + r, -h);
  shape.lineTo(cx + w - r, -h);
  shape.quadraticCurveTo(cx + w, -h, cx + w, -h + r);
  shape.lineTo(cx + w, h - r);
  shape.quadraticCurveTo(cx + w, h, cx + w - r, h);
  shape.lineTo(cx - w + r, h);
  shape.quadraticCurveTo(cx - w, h, cx - w, h - r);
  shape.lineTo(cx - w, -h + r);
  shape.quadraticCurveTo(cx - w, -h, cx - w + r, -h);

  return shape;
}

/**
 * Lens geometry: the outline extruded with a large bevel.
 *
 * The bevel is the point. A flat lens mirrors a light's shape exactly and
 * reads as a block pasted on; the curvature is what a highlight stretches
 * and bends around, which is what makes a sweep read as a reflection.
 */
export function lensGeometry(cx, { depth = 0.012, bevel = 0.035 } = {}) {
  const geo = new THREE.ExtrudeGeometry(lensShape(cx), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel * 0.86,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 10,
    curveSegments: 24,
  });
  geo.computeVertexNormals();
  return geo;
}

/** Frame geometry: the lens outline swept into a tube. */
export function frameGeometry(cx, radius = 0.016, tubularSegments = 200) {
  const pts = lensShape(cx)
    .getPoints(72)
    .map((p) => new THREE.Vector3(p.x, p.y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, 8, true);
}
