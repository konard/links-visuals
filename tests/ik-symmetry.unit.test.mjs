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
  const cx = 640, cy = 418;
  const gridSpacing = 125;
  const segLen = gridSpacing;
  const maxReach = IK_SEG_COUNT * segLen;
  const sideTolerance = 0.001 * gridSpacing;
  const center = { x: cx, y: cy };

  for (const tc of testCases) {
    it(`${tc.name}: all checks pass`, () => {
      const start = { x: cx + tc.startFactor.x * gridSpacing, y: cy + tc.startFactor.y * gridSpacing };
      const end   = { x: cx + tc.endFactor.x * gridSpacing,   y: cy + tc.endFactor.y * gridSpacing };

      const pts = computeIntermediatePoints(center, start, end, segLen, maxReach, sideTolerance);
      const checks = tc.checks(center, pts, segLen, start, end);

      for (const c of checks) {
        assert.ok(c.pass, `${tc.name} — ${c.label}`);
      }
    });
  }

  it('all intermediate points lie within dynamic maxReach of center', () => {
    for (const tc of testCases) {
      const start = { x: cx + tc.startFactor.x * gridSpacing, y: cy + tc.startFactor.y * gridSpacing };
      const end   = { x: cx + tc.endFactor.x * gridSpacing,   y: cy + tc.endFactor.y * gridSpacing };
      const pts = computeIntermediatePoints(center, start, end, segLen, maxReach, sideTolerance);

      const distL = Math.hypot(start.x - cx, start.y - cy);
      const distR = Math.hypot(end.x - cx, end.y - cy);
      const dynMaxReach = Math.max(maxReach, distL, distR);

      for (const [name, p] of Object.entries(pts)) {
        if (typeof p !== 'object' || p === null) continue;
        const dist = Math.hypot(p.x - cx, p.y - cy);
        assert.ok(dist <= dynMaxReach + TOLERANCE,
          `${tc.name} — ${name} at (${p.x.toFixed(1)}, ${p.y.toFixed(1)}) is ${dist.toFixed(1)} from center, exceeds dynMaxReach ${dynMaxReach}`);
      }
    }
  });
});
