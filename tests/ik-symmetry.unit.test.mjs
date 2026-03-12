/**
 * Unit tests for IK solver symmetry.
 *
 * Uses shared test case definitions from js/test-cases.mjs and
 * pure IK solver from js/ik-pure.mjs — the same code used by
 * the visual tests in tests.html.
 *
 * Run with:  node --test tests/ik-symmetry.unit.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IK_SEG_COUNT, sideTolFraction } from '../js/constants.mjs';
import { computeIntermediatePoints } from '../js/ik-pure.mjs';
import { testCases, close } from '../js/test-cases.mjs';

const TOLERANCE = 2;

function assertClose(actual, expected, msg) {
  assert.ok(
    Math.abs(actual - expected) < TOLERANCE,
    `${msg}: expected ≈${expected}, got ${actual} (diff=${Math.abs(actual - expected).toFixed(4)})`
  );
}

describe('IK symmetry — shared test cases', () => {
  const centerX = 640, centerY = 418;
  const gridSpacing = 125;
  const segmentLength = gridSpacing;
  const maximumReach = IK_SEG_COUNT * segmentLength;
  const sideTolerance = 0.001 * gridSpacing;
  const center = { x: centerX, y: centerY };

  for (const testCase of testCases) {
    it(`${testCase.name}: all checks pass`, () => {
      const start = { x: centerX + testCase.startFactor.x * gridSpacing, y: centerY + testCase.startFactor.y * gridSpacing };
      const end   = { x: centerX + testCase.endFactor.x * gridSpacing,   y: centerY + testCase.endFactor.y * gridSpacing };

      const points = computeIntermediatePoints(center, start, end, segmentLength, maximumReach, sideTolerance);
      const checks = testCase.checks(center, points, segmentLength, start, end);

      for (const check of checks) {
        assert.ok(check.pass, `${testCase.name} — ${check.label}`);
      }
    });
  }

  it('all intermediate points lie within dynamic maximumReach of center', () => {
    for (const testCase of testCases) {
      const start = { x: centerX + testCase.startFactor.x * gridSpacing, y: centerY + testCase.startFactor.y * gridSpacing };
      const end   = { x: centerX + testCase.endFactor.x * gridSpacing,   y: centerY + testCase.endFactor.y * gridSpacing };
      const points = computeIntermediatePoints(center, start, end, segmentLength, maximumReach, sideTolerance);

      const distanceLeft = Math.hypot(start.x - centerX, start.y - centerY);
      const distanceRight = Math.hypot(end.x - centerX, end.y - centerY);
      const dynamicMaximumReach = Math.max(maximumReach, distanceLeft, distanceRight);

      for (const [name, point] of Object.entries(points)) {
        if (typeof point !== 'object' || point === null) continue;
        const distance = Math.hypot(point.x - centerX, point.y - centerY);
        assert.ok(distance <= dynamicMaximumReach + TOLERANCE,
          `${testCase.name} — ${name} at (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) is ${distance.toFixed(1)} from center, exceeds dynamicMaximumReach ${dynamicMaximumReach}`);
      }
    }
  });
});
