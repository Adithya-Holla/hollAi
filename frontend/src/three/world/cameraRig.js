import { sceneState } from '../../state/scene';

/**
 * Where the camera sits at scroll progress 0 and at progress 1, per route.
 * Forward is -z.
 */
export const RAILS = {
  '/': { from: [0, 1.4, 6], to: [0, 1.1, -14] },
  '/projects': { from: [0, 1.5, 4], to: [0, 1.5, -22] },
  '/about': { from: [0, 1.5, 5], to: [0, 1.5, 1] },
  '/certifications': { from: [0, 1.5, 5], to: [0, 1.5, 1] },
  // Contact inverts the move: the camera retreats and the fog closes in.
  '/contact': { from: [0, 1.4, 0], to: [0, 1.8, 12] },
};

const DEFAULT_RAIL = RAILS['/about'];
const DAMPING = 0.06;
const PARALLAX = 0.35;

export function targetForRoute(route, progress) {
  const rail = RAILS[route] || DEFAULT_RAIL;
  const [fx, fy, fz] = rail.from;
  const [tx, ty, tz] = rail.to;
  return [
    fx + (tx - fx) * progress,
    fy + (ty - fy) * progress,
    fz + (tz - fz) * progress,
  ];
}

/**
 * Called every frame. Lerps toward the rail target rather than snapping, so
 * scrolling feels weighted without hijacking the browser's native scroll.
 * The damping is frame-rate independent.
 */
export function advanceCamera(camera, delta) {
  const [x, y, z] = targetForRoute(sceneState.route, sceneState.progress);
  const k = 1 - Math.pow(1 - DAMPING, Math.min(delta, 0.1) * 60);

  camera.position.x += (x + sceneState.pointer.x * PARALLAX - camera.position.x) * k;
  camera.position.y += (y + sceneState.pointer.y * PARALLAX * 0.4 - camera.position.y) * k;
  camera.position.z += (z - camera.position.z) * k;
  camera.lookAt(0, 1.0, camera.position.z - 6);
}
