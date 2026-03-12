// Pure IK solver functions — no dependency on state.mjs.
// Accepts all parameters explicitly so it can be used in both
// the browser (visual tests) and Node.js (unit tests).

import {
  IK_SEG_COUNT, IK_FIRST_INIT_ANGLE, IK_FIRST_MAX_DELTA, IK_SWEEP_STEPS
} from './constants.mjs';

/**
 * Normalize an angle to the range [-PI, PI].
 */
function normalizeAngle(angle) {
  while (angle >  Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Build a constant-curvature arc of IK_SEG_COUNT segments starting from
 * a fixed base direction. Each successive segment turns by (curvature * side).
 *
 * @param {number} curvature    - Absolute turn angle per joint (radians).
 * @param {number} side         - +1 or -1, determines curve direction.
 * @param {number} baseDirection - Starting direction (radians).
 * @param {{x,y}} origin       - Root point of the arc.
 * @param {number} segmentLength - Length of each segment.
 * @returns {Array<{x,y}>}       Array of IK_SEG_COUNT+1 points.
 */
function buildArcFromDirection(curvature, side, baseDirection, origin, segmentLength) {
  const points = [{ ...origin }];
  const turnPerJoint = curvature * side;
  let direction = baseDirection;
  let currentX = origin.x;
  let currentY = origin.y;
  for (let i = 1; i <= IK_SEG_COUNT; i++) {
    currentX += segmentLength * Math.cos(direction);
    currentY += segmentLength * Math.sin(direction);
    points[i] = { x: currentX, y: currentY };
    direction += turnPerJoint;
  }
  return points;
}

/**
 * Build a constant-curvature arc aimed at a target direction (dx, dy).
 * The base direction is computed so the arc is centered on the target direction.
 *
 * @param {number} curvature      - Absolute turn angle per joint.
 * @param {number} side           - +1 or -1.
 * @param {number} targetDeltaX   - X offset from origin to target.
 * @param {number} targetDeltaY   - Y offset from origin to target.
 * @param {{x,y}} origin         - Root point.
 * @param {number} segmentLength  - Length of each segment.
 */
function buildArcTowardTarget(curvature, side, targetDeltaX, targetDeltaY, origin, segmentLength) {
  const turnPerJoint = curvature * side;
  const baseDirection = Math.atan2(targetDeltaY, targetDeltaX) - (IK_SEG_COUNT - 1) * turnPerJoint / 2;
  return buildArcFromDirection(curvature, side, baseDirection, origin, segmentLength);
}

/**
 * Rotate all points in an array around a root point by a given angle.
 */
function rotatePointsAround(points, angle, origin) {
  const sinAngle = Math.sin(angle);
  const cosAngle = Math.cos(angle);
  for (const point of points) {
    const offsetX = point.x - origin.x;
    const offsetY = point.y - origin.y;
    point.x = origin.x + offsetX * cosAngle - offsetY * sinAngle;
    point.y = origin.y + offsetX * sinAngle + offsetY * cosAngle;
  }
}

/**
 * Clamp the first joint of an arc so it stays within maxDelta radians
 * of the initial angle. If the first segment's direction deviates too far,
 * the entire arc is rotated back into the allowed range.
 *
 * @param {Array<{x,y}>} arc         - The arc points to constrain.
 * @param {{x,y}}        origin      - Root point of the arc.
 * @param {number}        maxDelta    - Maximum allowed deviation (radians).
 * @param {number}        initialAngle - Reference angle to clamp against.
 */
function clampFirstJoint(arc, origin, maxDelta = IK_FIRST_MAX_DELTA, initialAngle = IK_FIRST_INIT_ANGLE) {
  const firstSegmentDirection = Math.atan2(arc[1].y - origin.y, arc[1].x - origin.x);
  const deviation = normalizeAngle(firstSegmentDirection - initialAngle);
  if (deviation >  maxDelta) rotatePointsAround(arc,  maxDelta - deviation, origin);
  if (deviation < -maxDelta) rotatePointsAround(arc, -maxDelta - deviation, origin);
}

/**
 * Find the best arc (by sweeping curvature values) that gets closest to the
 * target point. Used when the target is at or beyond maximum reach.
 *
 * @param {number} side           - +1 or -1.
 * @param {number} baseDirection  - Starting direction for the sweep.
 * @param {{x,y}} origin         - Root point.
 * @param {{x,y}} target         - Target point to reach.
 * @param {number} segmentLength  - Length of each segment.
 * @param {number} initialAngle   - Reference angle for first-joint clamping.
 * @returns {{ arc: Array<{x,y}>, distance: number }}
 */
function findBestArc(side, baseDirection, origin, target, segmentLength, initialAngle = IK_FIRST_INIT_ANGLE) {
  let bestDistance = Infinity;
  let bestArc = null;
  const maxCurvature = Math.PI * 2 / IK_SEG_COUNT - 1e-4;
  for (let step = 0; step <= IK_SWEEP_STEPS; step++) {
    const curvature = step * maxCurvature / IK_SWEEP_STEPS;
    const arc = buildArcFromDirection(curvature, side, baseDirection, origin, segmentLength);
    const tip = arc[IK_SEG_COUNT];
    const distance = Math.hypot(tip.x - target.x, tip.y - target.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestArc = arc;
    }
  }
  clampFirstJoint(bestArc, origin, undefined, initialAngle);
  return { arc: bestArc, distance: bestDistance };
}

/**
 * Solve one half-chain of the IK problem: find a constant-curvature arc from
 * origin to target, choosing the best side (up/down curve direction).
 *
 * The solver has three regimes based on distance to target:
 *   1. Close range (< 82% maxReach): tight first-joint clamp (half delta).
 *   2. Mid range (< maxReach): full first-joint clamp.
 *   3. At/beyond maxReach: sweep from initialAngle to find best arc.
 *
 * @param {{x,y}} origin          - Root point of the chain.
 * @param {{x,y}} target          - Target point to reach.
 * @param {number} preferredSide  - Side preference (+1/-1) or 0 for auto.
 * @param {number} segmentLength  - Length of each segment.
 * @param {number} maximumReach   - Maximum total reach of the chain.
 * @param {number} sideTolerance  - Hysteresis tolerance for side switching.
 * @param {number} initialAngle   - Reference angle for the at/beyond-maxReach regime.
 * @returns {{ arc: Array<{x,y}>, preferredSide: number }}
 */
export function solveIK(origin, target, preferredSide, segmentLength, maximumReach, sideTolerance, initialAngle = IK_FIRST_INIT_ANGLE) {
  const targetDeltaX = target.x - origin.x;
  const targetDeltaY = target.y - origin.y;
  const distanceToTarget = Math.hypot(targetDeltaX, targetDeltaY);

  if (preferredSide === 0) {
    preferredSide = targetDeltaY < 0 ? 1 : -1;
  }

  const effectiveDistance = Math.min(distanceToTarget, maximumReach);

  // Binary search for the curvature that makes the arc span the effective distance.
  let lowCurvature = 1e-6;
  let highCurvature = Math.PI * 2 / IK_SEG_COUNT - 1e-6;
  const arcSpan = curvature => Math.sin(IK_SEG_COUNT * curvature / 2) / Math.sin(curvature / 2);
  for (let iteration = 0; iteration < 40; iteration++) {
    const midCurvature = (lowCurvature + highCurvature) / 2;
    if (arcSpan(midCurvature) > effectiveDistance / segmentLength) {
      lowCurvature = midCurvature;
    } else {
      highCurvature = midCurvature;
    }
  }
  const curvature = (lowCurvature + highCurvature) / 2;

  let upwardArc, downwardArc;

  if (distanceToTarget < maximumReach * 0.82 - 1e-3) {
    // Close range: tighter first-joint constraint for smoother curves.
    upwardArc   = { arc: buildArcTowardTarget(curvature,  1, targetDeltaX, targetDeltaY, origin, segmentLength) };
    downwardArc = { arc: buildArcTowardTarget(curvature, -1, targetDeltaX, targetDeltaY, origin, segmentLength) };
    clampFirstJoint(upwardArc.arc,   origin, IK_FIRST_MAX_DELTA / 2);
    clampFirstJoint(downwardArc.arc, origin, IK_FIRST_MAX_DELTA / 2);
    upwardArc.distance   = Math.hypot(upwardArc.arc[IK_SEG_COUNT].x   - target.x, upwardArc.arc[IK_SEG_COUNT].y   - target.y);
    downwardArc.distance = Math.hypot(downwardArc.arc[IK_SEG_COUNT].x - target.x, downwardArc.arc[IK_SEG_COUNT].y - target.y);

  } else if (distanceToTarget < maximumReach - 1e-3) {
    // Mid range: full first-joint constraint.
    upwardArc   = { arc: buildArcTowardTarget(curvature,  1, targetDeltaX, targetDeltaY, origin, segmentLength) };
    downwardArc = { arc: buildArcTowardTarget(curvature, -1, targetDeltaX, targetDeltaY, origin, segmentLength) };
    clampFirstJoint(upwardArc.arc,   origin);
    clampFirstJoint(downwardArc.arc, origin);
    upwardArc.distance   = Math.hypot(upwardArc.arc[IK_SEG_COUNT].x   - target.x, upwardArc.arc[IK_SEG_COUNT].y   - target.y);
    downwardArc.distance = Math.hypot(downwardArc.arc[IK_SEG_COUNT].x - target.x, downwardArc.arc[IK_SEG_COUNT].y - target.y);

  } else {
    // At or beyond maximum reach: sweep from initialAngle to find best arc.
    // The initialAngle provides rotation-invariant behavior by anchoring the
    // sweep to the geometry (e.g. the opposite half's direction) rather than
    // a hardcoded angle.
    upwardArc   = findBestArc( 1, initialAngle, origin, target, segmentLength, initialAngle);
    downwardArc = findBestArc(-1, initialAngle, origin, target, segmentLength, initialAngle);
  }

  // Choose the better side, switching only if it's significantly closer.
  const currentSideArc  = preferredSide > 0 ? upwardArc   : downwardArc;
  const oppositeSideArc = preferredSide > 0 ? downwardArc : upwardArc;
  if (oppositeSideArc.distance < currentSideArc.distance - sideTolerance) {
    preferredSide *= -1;
  }

  return {
    arc: preferredSide > 0 ? upwardArc.arc : downwardArc.arc,
    preferredSide,
  };
}

/**
 * Compute all six intermediate points (p1–p6) from center, start, and end
 * using the IK solver. This is the single source of truth — used by both
 * the blueprint animation and visual/unit tests.
 *
 * The chain has two halves:
 *   - Right half: center → p4 → p5 → p6 → end
 *   - Left half:  center → p3 → p2 → p1 → start (solved via central mirror)
 *
 * Segment length scales dynamically: if an endpoint is beyond the base
 * maximum reach, segments grow proportionally so the chain can still reach.
 *
 * @param {{x,y}} center         - Center point (root of both half-chains).
 * @param {{x,y}} start          - Start endpoint (left half target).
 * @param {{x,y}} end            - End endpoint (right half target).
 * @param {number} segmentLength  - Base segment length.
 * @param {number} _maxReach      - Base maximum reach (unused, computed dynamically).
 * @param {number} sideTolerance  - Hysteresis tolerance for side switching.
 * @param {number} preferRight    - Side hint for right half (0 = auto).
 * @param {number} preferLeft     - Side hint for left half (0 = auto).
 */
export function computeIntermediatePoints(center, start, end, segmentLength, _maxReach, sideTolerance, preferRight = 0, preferLeft = 0) {
  const origin = { x: center.x, y: center.y };

  // Dynamic segment length: stretches proportionally when endpoint is beyond base reach.
  const distanceToEnd   = Math.hypot(end.x - origin.x, end.y - origin.y);
  const distanceToStart = Math.hypot(start.x - origin.x, start.y - origin.y);
  const rightSegmentLength = Math.max(segmentLength, distanceToEnd / IK_SEG_COUNT);
  const leftSegmentLength  = Math.max(segmentLength, distanceToStart / IK_SEG_COUNT);
  const rightMaximumReach  = IK_SEG_COUNT * rightSegmentLength;
  const leftMaximumReach   = IK_SEG_COUNT * leftSegmentLength;

  // Right half: center → p4 → p5 → p6 → end.
  // Use target direction as initialAngle for rotation invariance at/beyond maxReach.
  const endDirection = distanceToEnd > 1e-6
    ? Math.atan2(end.y - origin.y, end.x - origin.x)
    : IK_FIRST_INIT_ANGLE;
  const rightTarget = { x: end.x, y: end.y };
  const rightResult = solveIK(origin, rightTarget, preferRight, rightSegmentLength, rightMaximumReach, sideTolerance, endDirection);
  const rightArc = rightResult.arc;

  // Left half: center → p3 → p2 → p1 → start (via central mirror).
  // Mirror start through center, solve toward mirrored target, mirror result back.
  // Use right half's first segment direction as initialAngle — this is the
  // "first leg of the not-moving part" that makes curvature rotation-invariant.
  const rightFirstSegmentDirection = Math.atan2(rightArc[1].y - origin.y, rightArc[1].x - origin.x);
  const mirroredStartTarget = { x: 2 * origin.x - start.x, y: 2 * origin.y - start.y };
  const leftPreferredSide = preferLeft !== 0 ? -preferLeft : rightResult.preferredSide;
  const leftResult = solveIK(origin, mirroredStartTarget, leftPreferredSide, leftSegmentLength, leftMaximumReach, sideTolerance, rightFirstSegmentDirection);
  const leftArc = leftResult.arc.map(point => ({ x: 2 * origin.x - point.x, y: 2 * origin.y - point.y }));

  return {
    p3: { x: leftArc[1].x, y: leftArc[1].y },
    p2: { x: leftArc[2].x, y: leftArc[2].y },
    p1: { x: leftArc[3].x, y: leftArc[3].y },
    p4: { x: rightArc[1].x, y: rightArc[1].y },
    p5: { x: rightArc[2].x, y: rightArc[2].y },
    p6: { x: rightArc[3].x, y: rightArc[3].y },
    preferRight: rightResult.preferredSide,
    preferLeft: -leftResult.preferredSide,
  };
}
