import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBlueprintPathData,
  computeBlueprintLinkPoints,
  createBlueprintMetrics,
  CONTROL_POINT_COLORS,
  CONTROL_POINT_DASH_ARRAY,
  CONTROL_POINT_STROKE_WIDTH,
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
    // Control-point outline matches blueprint.html exactly (fixed, not scaled).
    assert.equal(metrics.cpStrokeWidth, 1);
    assert.equal(metrics.cpDashArray, '4 2');
  });

  it('exposes blueprint control-point colors and outline as shared constants', () => {
    // Per issue #28, the per-link color must never touch the control points.
    // These stay fixed and identical to blueprint.html / control-points.mjs.
    assert.equal(CONTROL_POINT_COLORS.start, 'green');
    assert.equal(CONTROL_POINT_COLORS.end, 'red');
    assert.equal(CONTROL_POINT_COLORS.center, 'black');
    assert.equal(CONTROL_POINT_COLORS.intermediate, 'blue');
    assert.equal(CONTROL_POINT_STROKE_WIDTH, 1);
    assert.equal(CONTROL_POINT_DASH_ARRAY, '4 2');
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
