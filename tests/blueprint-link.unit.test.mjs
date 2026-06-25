import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBlueprintPathData,
  computeBlueprintLinkPoints,
  createBlueprintMetrics,
} from '../js/blueprint-link.mjs';

describe('blueprint link helpers', () => {
  it('derive every visual metric from one grid spacing', () => {
    const metrics = createBlueprintMetrics(100);

    assert.equal(metrics.gridSpacing, 100);
    assert.equal(metrics.halfSpacing, 50);
    assert.equal(metrics.segmentLength, 100);
    assert.equal(metrics.maximumReach, 400);
    assert.equal(metrics.snapThreshold, 14.2);
    assert.equal(metrics.circleRadius, 17);
    assert.equal(metrics.strokeWidth, 8.5);
    assert.equal(metrics.sideTolerance, 0.1);
  });

  it('builds blueprint-style IK points and cubic path data', () => {
    const metrics = createBlueprintMetrics(80);
    const link = {
      center: { x: 400, y: 300 },
      start: { x: 400, y: 300 },
      end: { x: 400, y: 300 },
      preferRight: 0,
      preferLeft: 0,
    };

    const result = computeBlueprintLinkPoints(link, metrics);
    const pathData = buildBlueprintPathData(result.points, metrics.gridSpacing);

    assert.equal(result.points.length, 9);
    assert.match(pathData, /^M /);
    assert.match(pathData, / C /);
    assert.equal(typeof result.preferRight, 'number');
    assert.equal(typeof result.preferLeft, 'number');
  });
});
