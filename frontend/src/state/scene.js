/**
 * Module-level mutable scene state.
 *
 * Deliberately NOT React state. Scroll and pointer updates arrive at frame
 * rate; routing them through setState would re-render the tree ~60x/sec for
 * values only the render loop cares about. 3D components read this object
 * inside useFrame, which runs outside React entirely.
 *
 * `pointer` is mutated in place and never reassigned — useFrame closures
 * capture it by reference, so replacing the object would silently detach
 * every consumer.
 */
export const sceneState = {
  scrollY: 0,
  progress: 0,
  pointer: { x: 0, y: 0 },
  route: '/',
  introPlaying: false,
  introDone: false,
  quality: 'high',
  hoveredRow: -1,
};

/** Fraction of the page scrolled, clamped to 0..1. */
export function computeProgress(scrollY, docHeight, viewportHeight) {
  const scrollable = docHeight - viewportHeight;
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / scrollable));
}

export function setScroll(scrollY, docHeight, viewportHeight) {
  sceneState.scrollY = scrollY;
  sceneState.progress = computeProgress(scrollY, docHeight, viewportHeight);
}

/** Normalises pointer position to -1..1, y flipped to match WebGL's axis. */
export function setPointer(clientX, clientY, width, height) {
  sceneState.pointer.x = (clientX / width) * 2 - 1;
  sceneState.pointer.y = -((clientY / height) * 2 - 1);
}

export function resetScene() {
  sceneState.scrollY = 0;
  sceneState.progress = 0;
  sceneState.pointer.x = 0;
  sceneState.pointer.y = 0;
  sceneState.route = '/';
  sceneState.introPlaying = false;
  sceneState.introDone = false;
  sceneState.quality = 'high';
  sceneState.hoveredRow = -1;
}
