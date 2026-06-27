import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  applyCenterAnchors,
  createCenterLookup,
  createDrawnLink,
  insertPointAtPolylineFraction,
  pointAtPolylineFraction,
} from '../js/draw-link.mjs';

function closeTo(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`
  );
}

describe('drawn link geometry', () => {
  it('finds the center point at half of the drawn path length', () => {
    const center = pointAtPolylineFraction([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ], 0.5);

    assert.equal(center.totalLength, 20);
    closeTo(center.x, 10, 0.0001, 'center x');
    closeTo(center.y, 0, 0.0001, 'center y');
    assert.equal(center.segmentIndex, 0);
    assert.equal(center.segmentT, 1);
  });

  it('inserts the center as a semantic control point without duplicating an existing point', () => {
    const result = insertPointAtPolylineFraction([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ], 0.5, { role: 'center' });

    assert.equal(result.centerIndex, 1);
    assert.equal(result.points.length, 3);
    assert.equal(result.points[1].role, 'center');
    closeTo(result.points[1].x, 10, 0.0001, 'inserted center x');
    closeTo(result.points[1].y, 0, 0.0001, 'inserted center y');
  });

  it('creates a blueprint-style link from freehand points and pins endpoints near existing centers', () => {
    const existingLink = {
      id: 'link-0',
      points: [
        { role: 'start', x: 20, y: 20 },
        { role: 'center', x: 50, y: 50 },
        { role: 'end', x: 80, y: 20 },
      ],
    };

    const link = createDrawnLink({
      id: 'link-1',
      rawPoints: [
        { x: 52, y: 51 },
        { x: 80, y: 70 },
        { x: 148, y: 151 },
      ],
      existingLinks: [existingLink],
      snapRadius: 5,
      minPointDistance: 0,
    });

    assert.equal(link.id, 'link-1');
    assert.equal(link.startAnchorId, 'link-0');
    assert.equal(link.endAnchorId, null);
    assert.equal(link.points[0].role, 'start');
    assert.equal(link.points[link.centerIndex].role, 'center');
    assert.equal(link.points.at(-1).role, 'end');
    closeTo(link.points[0].x, 50, 0.0001, 'snapped start x');
    closeTo(link.points[0].y, 50, 0.0001, 'snapped start y');
  });

  it('keeps pinned endpoints attached when the source center moves', () => {
    const parent = {
      id: 'link-0',
      points: [
        { role: 'start', x: 0, y: 0 },
        { role: 'center', x: 120, y: 90 },
        { role: 'end', x: 200, y: 0 },
      ],
    };
    const child = {
      id: 'link-1',
      startAnchorId: 'link-0',
      endAnchorId: null,
      centerIndex: 1,
      points: [
        { role: 'start', x: 50, y: 50 },
        { role: 'center', x: 80, y: 80 },
        { role: 'end', x: 110, y: 110 },
      ],
    };

    const anchored = applyCenterAnchors(child, createCenterLookup([parent, child]));

    closeTo(anchored.points[0].x, 120, 0.0001, 'anchored start x');
    closeTo(anchored.points[0].y, 90, 0.0001, 'anchored start y');
    closeTo(anchored.points[2].x, 110, 0.0001, 'free end x');
    closeTo(anchored.points[2].y, 110, 0.0001, 'free end y');
  });
});
