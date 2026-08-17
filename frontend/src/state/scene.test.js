import { sceneState, computeProgress, setScroll, setPointer, resetScene } from './scene';

describe('computeProgress', () => {
  test('returns 0 at the top of the page', () => {
    expect(computeProgress(0, 3000, 1000)).toBe(0);
  });

  test('returns 1 when scrolled to the bottom', () => {
    expect(computeProgress(2000, 3000, 1000)).toBe(1);
  });

  test('returns 0.5 at the midpoint of scrollable distance', () => {
    expect(computeProgress(1000, 3000, 1000)).toBeCloseTo(0.5);
  });

  test('clamps values beyond the end (rubber-band overscroll)', () => {
    expect(computeProgress(9999, 3000, 1000)).toBe(1);
  });

  test('clamps negative scroll (iOS bounce)', () => {
    expect(computeProgress(-200, 3000, 1000)).toBe(0);
  });

  test('returns 0 when the page is not scrollable', () => {
    expect(computeProgress(0, 800, 1000)).toBe(0);
  });
});

describe('setScroll', () => {
  beforeEach(() => resetScene());

  test('records raw scroll and derived progress together', () => {
    setScroll(500, 3000, 1000);
    expect(sceneState.scrollY).toBe(500);
    expect(sceneState.progress).toBeCloseTo(0.25);
  });
});

describe('setPointer', () => {
  beforeEach(() => resetScene());

  test('maps the viewport centre to the origin', () => {
    setPointer(500, 400, 1000, 800);
    expect(sceneState.pointer.x).toBeCloseTo(0);
    expect(sceneState.pointer.y).toBeCloseTo(0);
  });

  test('maps the top-left corner to (-1, 1)', () => {
    setPointer(0, 0, 1000, 800);
    expect(sceneState.pointer.x).toBeCloseTo(-1);
    expect(sceneState.pointer.y).toBeCloseTo(1);
  });

  test('maps the bottom-right corner to (1, -1)', () => {
    setPointer(1000, 800, 1000, 800);
    expect(sceneState.pointer.x).toBeCloseTo(1);
    expect(sceneState.pointer.y).toBeCloseTo(-1);
  });

  test('also records raw viewport pixels for DOM followers', () => {
    setPointer(240, 130, 1000, 800);
    expect(sceneState.pointerPx).toEqual({ x: 240, y: 130 });
    expect(sceneState.pointerSeen).toBe(true);
  });

  test('mutates pointerPx in place too', () => {
    const before = sceneState.pointerPx;
    setPointer(10, 10, 1000, 800);
    expect(sceneState.pointerPx).toBe(before);
  });

  test('mutates in place rather than replacing the pointer object', () => {
    // useFrame closures capture sceneState.pointer by reference. Reassigning
    // the object would silently detach every consumer.
    const before = sceneState.pointer;
    setPointer(100, 100, 1000, 800);
    expect(sceneState.pointer).toBe(before);
  });
});

describe('resetScene', () => {
  test('restores every field to its initial value', () => {
    setScroll(900, 3000, 1000);
    setPointer(0, 0, 1000, 800);
    sceneState.route = '/projects';
    sceneState.introDone = true;
    sceneState.hoveredRow = 3;

    resetScene();

    expect(sceneState.scrollY).toBe(0);
    expect(sceneState.progress).toBe(0);
    expect(sceneState.pointer.x).toBe(0);
    expect(sceneState.pointer.y).toBe(0);
    expect(sceneState.pointerPx).toEqual({ x: 0, y: 0 });
    expect(sceneState.pointerSeen).toBe(false);
    expect(sceneState.route).toBe('/');
    expect(sceneState.introDone).toBe(false);
    expect(sceneState.hoveredRow).toBe(-1);
  });
});
