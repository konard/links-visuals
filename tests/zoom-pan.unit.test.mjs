/**
 * Unit tests for zoom and pan logic.
 *
 * Tests the mathematical correctness of:
 *   - screenToWorld coordinate conversion
 *   - handleWheel zoom-at-cursor pivot calculation
 *   - handleMouseMove pan offset update
 *   - handleTouchMove pinch-to-zoom calculation
 *
 * These tests run entirely in Node.js with no browser required.
 * Run with:  node --test tests/zoom-pan.unit.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_SCALE, MAX_SCALE } from '../js/constants.mjs';

// ---------------------------------------------------------------------------
// Pure functions extracted from zoom-pan.mjs / svg-setup.mjs for unit testing
// ---------------------------------------------------------------------------

/**
 * Convert a screen (client) coordinate to SVG world coordinate.
 * Mirrors screenToWorld() in svg-setup.mjs.
 */
function screenToWorld(clientX, clientY, canvasOffsetX, canvasOffsetY, canvasScale) {
  return {
    x: (clientX - canvasOffsetX) / canvasScale,
    y: (clientY - canvasOffsetY) / canvasScale,
  };
}

/**
 * Compute the new canvas offset and scale after a wheel zoom event.
 * Mirrors the pivot math in handleWheel() in zoom-pan.mjs.
 *
 * @param {number} clientX       - cursor screen X
 * @param {number} clientY       - cursor screen Y
 * @param {number} canvasOffsetX - current canvas translate X
 * @param {number} canvasOffsetY - current canvas translate Y
 * @param {number} canvasScale   - current canvas scale
 * @param {number} factor        - zoom factor (>1 = zoom in, <1 = zoom out)
 * @returns {{ newOffsetX, newOffsetY, newScale }}
 */
function computeWheelZoom(clientX, clientY, canvasOffsetX, canvasOffsetY, canvasScale, factor) {
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, canvasScale * factor));
  const pivotX = (clientX - canvasOffsetX) / canvasScale;
  const pivotY = (clientY - canvasOffsetY) / canvasScale;
  const newOffsetX = clientX - pivotX * newScale;
  const newOffsetY = clientY - pivotY * newScale;
  return { newOffsetX, newOffsetY, newScale };
}

/**
 * Compute the new canvas offset after a mouse pan move.
 * Mirrors handleMouseMove() in zoom-pan.mjs.
 */
function computePanMove(clientX, clientY, panStartX, panStartY, panOffsetStartX, panOffsetStartY) {
  return {
    newOffsetX: panOffsetStartX + (clientX - panStartX),
    newOffsetY: panOffsetStartY + (clientY - panStartY),
  };
}

/**
 * Compute new scale and offsets for a pinch-zoom gesture (two touches).
 * Mirrors the pinch logic in handleTouchMove() in zoom-pan.mjs.
 */
function computePinchZoom(
  midX, midY, prevMidX, prevMidY,
  dist, prevDist,
  canvasOffsetX, canvasOffsetY, canvasScale
) {
  const factor = dist / prevDist;
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, canvasScale * factor));
  const pivotX = (midX - canvasOffsetX) / canvasScale;
  const pivotY = (midY - canvasOffsetY) / canvasScale;
  let newOffsetX = midX - pivotX * newScale;
  let newOffsetY = midY - pivotY * newScale;
  // Add midpoint translation delta (midpoint pan during pinch)
  newOffsetX += midX - prevMidX;
  newOffsetY += midY - prevMidY;
  return { newOffsetX, newOffsetY, newScale };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const EPSILON = 1e-9;
function assertClose(actual, expected, msg) {
  assert.ok(
    Math.abs(actual - expected) < EPSILON,
    `${msg}: expected ${expected}, got ${actual}`
  );
}

// ---------------------------------------------------------------------------
// Tests: screenToWorld
// ---------------------------------------------------------------------------
describe('screenToWorld', () => {
  it('returns SVG origin when no transform is applied', () => {
    const point = screenToWorld(0, 0, 0, 0, 1);
    assertClose(point.x, 0, 'x');
    assertClose(point.y, 0, 'y');
  });

  it('converts correctly with scale=1 and no offset', () => {
    const point = screenToWorld(300, 200, 0, 0, 1);
    assertClose(point.x, 300, 'x');
    assertClose(point.y, 200, 'y');
  });

  it('accounts for translation offset', () => {
    const point = screenToWorld(300, 200, 100, 50, 1);
    assertClose(point.x, 200, 'x');
    assertClose(point.y, 150, 'y');
  });

  it('accounts for scale', () => {
    // With scale=2 and no offset, screen(200,100) → world(100,50)
    const point = screenToWorld(200, 100, 0, 0, 2);
    assertClose(point.x, 100, 'x');
    assertClose(point.y, 50, 'y');
  });

  it('accounts for both offset and scale', () => {
    // transform: translate(100,50) scale(2)
    // screen point (500, 250) → world: (500-100)/2=200, (250-50)/2=100
    const point = screenToWorld(500, 250, 100, 50, 2);
    assertClose(point.x, 200, 'x');
    assertClose(point.y, 100, 'y');
  });

  it('is the inverse of the CSS transform (world→screen)', () => {
    // If a world point (wx, wy) maps to screen point:
    //   screenX = wx * scale + offsetX
    //   screenY = wy * scale + offsetY
    // then screenToWorld(screenX, screenY, offsetX, offsetY, scale) == (wx, wy)
    const wx = 123.456, wy = -78.9;
    const offsetX = 40, offsetY = -30, scale = 1.5;
    const screenX = wx * scale + offsetX;
    const screenY = wy * scale + offsetY;
    const point = screenToWorld(screenX, screenY, offsetX, offsetY, scale);
    assertClose(point.x, wx, 'x round-trip');
    assertClose(point.y, wy, 'y round-trip');
  });
});

// ---------------------------------------------------------------------------
// Tests: computeWheelZoom (pivot invariant — the world point under the cursor
//         must be at the same screen position before and after zoom)
// ---------------------------------------------------------------------------
describe('computeWheelZoom — pivot invariant', () => {
  /**
   * After zoom, the world point that was under the cursor should still map
   * to the same screen position (the cursor position).
   */
  function pivotScreenPoint(clientX, clientY, newOffsetX, newOffsetY, newScale) {
    return {
      screenX: (clientX - newOffsetX) / newScale * newScale + newOffsetX,
      // simpler: the world point under cursor = (clientX-newOffsetX)/newScale
      // verify that world point maps back to clientX: worldX * newScale + newOffsetX == clientX
      worldX: (clientX - newOffsetX) / newScale,
      worldY: (clientY - newOffsetY) / newScale,
    };
  }

  it('zoom-in: world point under cursor is unchanged', () => {
    const clientX = 400, clientY = 300;
    const offsetX = 0, offsetY = 0, scale = 1;
    // The world point under cursor before zoom
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 1.1
    );

    // The world point under cursor after zoom
    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);

    assertClose(worldAfter.x, worldBefore.x, 'world X under cursor unchanged');
    assertClose(worldAfter.y, worldBefore.y, 'world Y under cursor unchanged');
  });

  it('zoom-out: world point under cursor is unchanged', () => {
    const clientX = 200, clientY = 150;
    const offsetX = 50, offsetY = -20, scale = 2;
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 0.9
    );

    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);
    assertClose(worldAfter.x, worldBefore.x, 'world X under cursor unchanged');
    assertClose(worldAfter.y, worldBefore.y, 'world Y under cursor unchanged');
  });

  it('zoom at top-left corner: world point under cursor is unchanged', () => {
    const clientX = 0, clientY = 0;
    const offsetX = -100, offsetY = -50, scale = 1.5;
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 1.2
    );

    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);
    assertClose(worldAfter.x, worldBefore.x, 'world X under cursor unchanged');
    assertClose(worldAfter.y, worldBefore.y, 'world Y under cursor unchanged');
  });

  it('zoom at bottom-right corner: world point under cursor is unchanged', () => {
    const clientX = 1920, clientY = 1080;
    const offsetX = 200, offsetY = 100, scale = 0.8;
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 1.05
    );

    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);
    assertClose(worldAfter.x, worldBefore.x, 'world X under cursor unchanged');
    assertClose(worldAfter.y, worldBefore.y, 'world Y under cursor unchanged');
  });

  it('respects MIN_SCALE lower bound', () => {
    const { newScale } = computeWheelZoom(0, 0, 0, 0, MIN_SCALE, 0.5);
    assert.strictEqual(newScale, MIN_SCALE, 'scale should not go below MIN_SCALE');
  });

  it('respects MAX_SCALE upper bound', () => {
    const { newScale } = computeWheelZoom(0, 0, 0, 0, MAX_SCALE, 2);
    assert.strictEqual(newScale, MAX_SCALE, 'scale should not exceed MAX_SCALE');
  });

  it('wheel delta=0 produces no change', () => {
    const offsetX = 10, offsetY = 20, scale = 1.5;
    // factor = Math.pow(0.999, 0) = 1 → newScale = scale (no change)
    const factor = Math.pow(0.999, 0);
    const { newScale } = computeWheelZoom(400, 300, offsetX, offsetY, scale, factor);
    assertClose(newScale, scale, 'scale unchanged when delta=0');
  });

  it('zoom-in at arbitrary off-center cursor position', () => {
    // Simulates zooming at a point far from the center of the canvas
    const clientX = 750, clientY = 100;
    const offsetX = -300, offsetY = 150, scale = 1.3;
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 1.15
    );

    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);
    assertClose(worldAfter.x, worldBefore.x, 'world X at far-off cursor unchanged');
    assertClose(worldAfter.y, worldBefore.y, 'world Y at far-off cursor unchanged');
  });
});

// ---------------------------------------------------------------------------
// Tests: computePanMove
// ---------------------------------------------------------------------------
describe('computePanMove', () => {
  it('no movement produces no offset change', () => {
    const { newOffsetX, newOffsetY } = computePanMove(100, 200, 100, 200, 50, 75);
    assertClose(newOffsetX, 50, 'X unchanged');
    assertClose(newOffsetY, 75, 'Y unchanged');
  });

  it('moves offset by the delta of cursor movement', () => {
    // start at (100,200), moved to (150, 180) → delta (+50, -20)
    const { newOffsetX, newOffsetY } = computePanMove(150, 180, 100, 200, 0, 0);
    assertClose(newOffsetX, 50, 'X offset = +50');
    assertClose(newOffsetY, -20, 'Y offset = -20');
  });

  it('adds delta to initial offset (not current offset)', () => {
    const { newOffsetX, newOffsetY } = computePanMove(200, 100, 150, 50, 30, -10);
    assertClose(newOffsetX, 80, 'X = 30 + (200-150)');
    assertClose(newOffsetY, 40, 'Y = -10 + (100-50)');
  });

  it('supports panning in negative direction', () => {
    const { newOffsetX, newOffsetY } = computePanMove(50, 30, 100, 80, 200, 150);
    assertClose(newOffsetX, 150, 'X = 200 + (50-100)');
    assertClose(newOffsetY, 100, 'Y = 150 + (30-80)');
  });
});

// ---------------------------------------------------------------------------
// Tests: computePinchZoom (pinch-to-zoom pivot invariant)
// ---------------------------------------------------------------------------
describe('computePinchZoom — pivot invariant', () => {
  it('pinch-zoom: world point at midpoint is unchanged', () => {
    const midX = 400, midY = 300;
    const prevMidX = 400, prevMidY = 300; // no translation
    const prevDist = 100, dist = 150; // zoom in
    const offsetX = 0, offsetY = 0, scale = 1;

    const worldBefore = screenToWorld(midX, midY, offsetX, offsetY, scale);
    const { newOffsetX, newOffsetY, newScale } = computePinchZoom(
      midX, midY, prevMidX, prevMidY,
      dist, prevDist,
      offsetX, offsetY, scale
    );
    const worldAfter = screenToWorld(midX, midY, newOffsetX, newOffsetY, newScale);

    assertClose(worldAfter.x, worldBefore.x, 'world X at midpoint unchanged');
    assertClose(worldAfter.y, worldBefore.y, 'world Y at midpoint unchanged');
  });

  it('pinch-zoom with moving midpoint pans the canvas', () => {
    // Midpoint moves from (400,300) to (420,310) while pinching
    const prevMidX = 400, prevMidY = 300;
    const midX = 420, midY = 310;
    const prevDist = 100, dist = 100; // same distance (no scale change), only pan
    const offsetX = 0, offsetY = 0, scale = 1;

    const { newOffsetX, newOffsetY, newScale } = computePinchZoom(
      midX, midY, prevMidX, prevMidY,
      dist, prevDist,
      offsetX, offsetY, scale
    );

    // No scale change (factor=1), but midpoint moved by +20, +10
    assertClose(newScale, scale, 'scale unchanged');
    assertClose(newOffsetX, 20, 'offset X panned by midpoint delta');
    assertClose(newOffsetY, 10, 'offset Y panned by midpoint delta');
  });

  it('respects MIN_SCALE during pinch-out', () => {
    const { newScale } = computePinchZoom(
      400, 300, 400, 300,
      10, 100, // very small new distance (zooming out a lot)
      0, 0, MIN_SCALE
    );
    assert.strictEqual(newScale, MIN_SCALE, 'scale clamps at MIN_SCALE');
  });

  it('respects MAX_SCALE during pinch-in', () => {
    const { newScale } = computePinchZoom(
      400, 300, 400, 300,
      1000, 10, // very large new distance (zooming in a lot)
      0, 0, MAX_SCALE
    );
    assert.strictEqual(newScale, MAX_SCALE, 'scale clamps at MAX_SCALE');
  });
});

// ---------------------------------------------------------------------------
// Tests: pointer-events fix — verifies the fix intent
// ---------------------------------------------------------------------------
describe('pointer-events fix — zoom at any grid position', () => {
  it('zoom math is correct at any arbitrary screen position (top-left)', () => {
    // Simulates a user scrolling at the very top-left of the viewport
    // (far from the arrow link which was near the center)
    const clientX = 5, clientY = 5;
    const offsetX = 0, offsetY = 0, scale = 1;
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 1.1
    );
    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);

    assertClose(worldAfter.x, worldBefore.x, 'top-left zoom: world X preserved');
    assertClose(worldAfter.y, worldBefore.y, 'top-left zoom: world Y preserved');
  });

  it('zoom math is correct at any arbitrary screen position (bottom-right)', () => {
    const clientX = 1919, clientY = 1079;
    const offsetX = 0, offsetY = 0, scale = 1;
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 0.9
    );
    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);

    assertClose(worldAfter.x, worldBefore.x, 'bottom-right zoom: world X preserved');
    assertClose(worldAfter.y, worldBefore.y, 'bottom-right zoom: world Y preserved');
  });

  it('zoom math is correct after prior pan (simulates pan then zoom elsewhere)', () => {
    // User panned 300px right and 200px down, then zooms at top-right
    const offsetX = 300, offsetY = 200, scale = 1;
    const clientX = 1800, clientY = 10; // top-right of viewport
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 1.2
    );
    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);

    assertClose(worldAfter.x, worldBefore.x, 'after pan, zoom X preserved');
    assertClose(worldAfter.y, worldBefore.y, 'after pan, zoom Y preserved');
  });
});

// ---------------------------------------------------------------------------
// Tests: Issue #21 regression — zoom far from link center
// ---------------------------------------------------------------------------
describe('Issue #21 — zoom works far from link center', () => {
  it('zoom-in after panning far right (cursor beyond initial SVG bounds)', () => {
    // Simulates: user pans 5000px to the right, then tries to zoom at
    // a screen position that would be outside the original SVG element box.
    const offsetX = -5000, offsetY = 0, scale = 1;
    const clientX = 960, clientY = 540; // center of a 1920×1080 viewport
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 1.1
    );
    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);

    assertClose(worldAfter.x, worldBefore.x, 'far-right pan: world X preserved');
    assertClose(worldAfter.y, worldBefore.y, 'far-right pan: world Y preserved');
  });

  it('zoom-out at small scale (SVG layout box smaller than viewport)', () => {
    // Simulates: user has already zoomed out to scale=0.3, so the SVG's
    // CSS box is only 30% of the viewport. Cursor at viewport edge is
    // outside the SVG box.
    const offsetX = 200, offsetY = 100, scale = 0.3;
    const clientX = 1800, clientY = 1000; // far bottom-right of viewport
    const worldBefore = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    const { newOffsetX, newOffsetY, newScale } = computeWheelZoom(
      clientX, clientY, offsetX, offsetY, scale, 0.95
    );
    const worldAfter = screenToWorld(clientX, clientY, newOffsetX, newOffsetY, newScale);

    assertClose(worldAfter.x, worldBefore.x, 'zoomed-out viewport: world X preserved');
    assertClose(worldAfter.y, worldBefore.y, 'zoomed-out viewport: world Y preserved');
  });

  it('successive zoom operations accumulate correctly at any position', () => {
    // Simulates several successive wheel zooms at the same position after
    // panning — confirms no drift accumulates.
    let offsetX = -3000, offsetY = 2000, scale = 0.8;
    const clientX = 100, clientY = 900;

    const worldInitial = screenToWorld(clientX, clientY, offsetX, offsetY, scale);

    for (let i = 0; i < 20; i++) {
      const factor = i % 2 === 0 ? 1.05 : 0.95;
      const result = computeWheelZoom(clientX, clientY, offsetX, offsetY, scale, factor);
      offsetX = result.newOffsetX;
      offsetY = result.newOffsetY;
      scale   = result.newScale;
    }

    // After 10 zoom-ins and 10 zoom-outs at same factor, scale returns to original
    const worldFinal = screenToWorld(clientX, clientY, offsetX, offsetY, scale);
    assertClose(worldFinal.x, worldInitial.x, 'successive zooms: world X preserved');
    assertClose(worldFinal.y, worldInitial.y, 'successive zooms: world Y preserved');
  });
});
