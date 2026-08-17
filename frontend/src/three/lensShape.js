import * as THREE from 'three';

export const LENS_W = 0.62;
export const LENS_H = 0.36;
export const GAP = 0.18;
export const CX = (LENS_W + GAP) / 2;

/** Rounded rectangle centred on cx, as a THREE.Shape or Path. */
function roundedRect(Ctor, cx, halfW, halfH, r) {
  const p = new Ctor();
  const w = halfW;
  const h = halfH;
  const rad = Math.min(r, w, h);

  p.moveTo(cx - w + rad, -h);
  p.lineTo(cx + w - rad, -h);
  p.quadraticCurveTo(cx + w, -h, cx + w, -h + rad);
  p.lineTo(cx + w, h - rad);
  p.quadraticCurveTo(cx + w, h, cx + w - rad, h);
  p.lineTo(cx - w + rad, h);
  p.quadraticCurveTo(cx - w, h, cx - w, h - rad);
  p.lineTo(cx - w, -h + rad);
  p.quadraticCurveTo(cx - w, -h, cx - w + rad, -h);

  return p;
}

/** Rounded-rectangle outline for one lens, centred on cx. */
export function lensShape(cx) {
  return roundedRect(THREE.Shape, cx, LENS_W / 2, LENS_H / 2, 0.075);
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

/**
 * Frame as swept tube: round in section, so a moving light produces a real
 * travelling specular along it. Used by the opening cinematic, where the
 * glasses are large on screen and lit.
 */
export function frameTubeGeometry(cx, radius = 0.016, tubularSegments = 200) {
  const pts = lensShape(cx)
    .getPoints(72)
    .map((p) => new THREE.Vector3(p.x, p.y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, 8, true);
}

/**
 * Frame as a flat ring in the lens plane — the rounded rectangle with a
 * slightly smaller one punched out of it.
 *
 * Used by the background object, which is drawn unlit in a single flat
 * colour. A swept tube is wrong there: TubeGeometry orients its cross-section
 * with Frenet frames, which twist along a nearly-planar curve. Under a dark
 * shaded material that is invisible, but on a flat colour the twist changes
 * the silhouette width and the outline reads as ragged. A ring is exactly
 * even the whole way round.
 */
export function frameGeometry(cx, width = 0.022) {
  const outer = roundedRect(THREE.Shape, cx, LENS_W / 2 + width, LENS_H / 2 + width, 0.075 + width);
  const inner = roundedRect(THREE.Path, cx, LENS_W / 2, LENS_H / 2, 0.075);
  outer.holes.push(inner);
  return new THREE.ShapeGeometry(outer, 24);
}
