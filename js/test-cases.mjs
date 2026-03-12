// Shared test case definitions used by both unit tests and visual tests.
// Each test case defines: name, description, start/end factors, and check functions.
//
// Key principle: when start, center, end are collinear, ALL control points
// must lie on that line. This is tested at multiple rotation angles to ensure
// the algorithm is rotation-invariant.

import { IK_SEG_COUNT } from './constants.mjs';

const TOLERANCE = 2; // pixels

export function close(a, b) { return Math.abs(a - b) < TOLERANCE; }

function closeFactor(a, b) { return Math.abs(a - b) < 0.15; }
function exactFactor(a, b) { return Math.abs(a - b) < 0.02; }

/**
 * Check that points of one chain are evenly spaced along the center→endpoint
 * line. Works at any angle. chainIds ordered from center outward.
 */
function straightChainChecks(center, pts, segLen, endpoint, chainIds, label) {
  const dx = endpoint.x - center.x, dy = endpoint.y - center.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return []; // degenerate
  const dynSegLen = Math.max(segLen, dist / IK_SEG_COUNT);
  const ux = dx / dist, uy = dy / dist;
  const checks = [];
  for (let i = 0; i < chainIds.length; i++) {
    const id = chainIds[i];
    const p = pts[id];
    const expectedX = center.x + (i + 1) * dynSegLen * ux;
    const expectedY = center.y + (i + 1) * dynSegLen * uy;
    const fx = (p.x - center.x) / segLen;
    const fy = (p.y - center.y) / segLen;
    const efx = (expectedX - center.x) / segLen;
    const efy = (expectedY - center.y) / segLen;
    checks.push({
      id,
      pass: exactFactor(fx, efx) && exactFactor(fy, efy),
      label: `${id} ${label} pos=(${fx.toFixed(3)}, ${fy.toFixed(3)}) expect=(${efx.toFixed(3)}, ${efy.toFixed(3)})`
    });
  }
  return checks;
}

/**
 * When start, center, end are collinear, ALL 6 control points must be on
 * that line, evenly spaced from center toward their respective endpoints.
 */
function collinearChecks(center, pts, segLen, start, end) {
  return [
    ...straightChainChecks(center, pts, segLen, start, ['p3','p2','p1'], 'left-straight'),
    ...straightChainChecks(center, pts, segLen, end,   ['p4','p5','p6'], 'right-straight'),
  ];
}

export function segmentChecks(center, pts, segLen) {
  const leftChain  = [center, pts.p3, pts.p2, pts.p1];
  const rightChain = [center, pts.p4, pts.p5, pts.p6];
  const checks = [];
  for (let i = 0; i < leftChain.length - 1; i++) {
    const d = Math.hypot(leftChain[i+1].x - leftChain[i].x, leftChain[i+1].y - leftChain[i].y);
    const id = ["p3","p2","p1"][i];
    checks.push({ id, pass: close(d, segLen), label: `left seg ${i}→${i+1} len=${d.toFixed(1)} (expect ${segLen.toFixed(1)})` });
  }
  for (let i = 0; i < rightChain.length - 1; i++) {
    const d = Math.hypot(rightChain[i+1].x - rightChain[i].x, rightChain[i+1].y - rightChain[i].y);
    const id = ["p4","p5","p6"][i];
    checks.push({ id, pass: close(d, segLen), label: `right seg ${i}→${i+1} len=${d.toFixed(1)} (expect ${segLen.toFixed(1)})` });
  }
  return checks;
}

export function dynamicSegmentChecks(center, start, end, pts, segLen) {
  const distL = Math.hypot(start.x - center.x, start.y - center.y);
  const distR = Math.hypot(end.x - center.x, end.y - center.y);
  const expectedL = Math.max(segLen, distL / IK_SEG_COUNT);
  const expectedR = Math.max(segLen, distR / IK_SEG_COUNT);

  const leftChain  = [center, pts.p3, pts.p2, pts.p1];
  const rightChain = [center, pts.p4, pts.p5, pts.p6];
  const checks = [];
  for (let i = 0; i < leftChain.length - 1; i++) {
    const d = Math.hypot(leftChain[i+1].x - leftChain[i].x, leftChain[i+1].y - leftChain[i].y);
    const id = ["p3","p2","p1"][i];
    checks.push({ id, pass: close(d, expectedL), label: `left seg ${i}→${i+1} len=${d.toFixed(1)} (expect ${expectedL.toFixed(1)})` });
  }
  for (let i = 0; i < rightChain.length - 1; i++) {
    const d = Math.hypot(rightChain[i+1].x - rightChain[i].x, rightChain[i+1].y - rightChain[i].y);
    const id = ["p4","p5","p6"][i];
    checks.push({ id, pass: close(d, expectedR), label: `right seg ${i}→${i+1} len=${d.toFixed(1)} (expect ${expectedR.toFixed(1)})` });
  }
  return checks;
}

/**
 * Check that each point is at its expected position (as factors of gridSpacing from center).
 * Uses 15% tolerance — verifies the shape is approximately correct.
 */
function positionChecks(center, pts, segLen, expectedFactors) {
  const checks = [];
  for (const [id, ef] of Object.entries(expectedFactors)) {
    const p = pts[id];
    const fx = (p.x - center.x) / segLen;
    const fy = (p.y - center.y) / segLen;
    checks.push({
      id,
      pass: closeFactor(fx, ef.x) && closeFactor(fy, ef.y),
      label: `${id} pos=(${fx.toFixed(3)}, ${fy.toFixed(3)}) expect=(${ef.x.toFixed(3)}, ${ef.y.toFixed(3)})`
    });
  }
  return checks;
}

// ---------------------------------------------------------------
// Collinear straight-line test at a given angle (degrees).
// Both halves at exactly maxReach (4× segLen).
// ---------------------------------------------------------------
function collinearTestAtAngle(angleDeg) {
  const a = angleDeg * Math.PI / 180;
  return {
    name: `Collinear straight ${angleDeg}°`,
    description: `Start/end at ±4× along ${angleDeg}° — all points must be on the line`,
    startFactor: { x: -4 * Math.cos(a), y: -4 * Math.sin(a) },
    endFactor:   { x:  4 * Math.cos(a), y:  4 * Math.sin(a) },
    checks(center, pts, segLen, start, end) {
      return [
        ...collinearChecks(center, pts, segLen, start, end),
        ...segmentChecks(center, pts, segLen),
      ];
    }
  };
}

// ---------------------------------------------------------------
// Extended collinear test at a given angle (both halves beyond maxReach).
// ---------------------------------------------------------------
function extendedCollinearTestAtAngle(angleDeg, distFactor) {
  const a = angleDeg * Math.PI / 180;
  return {
    name: `Extended collinear ${angleDeg}° (${distFactor}×)`,
    description: `Start/end at ±${distFactor}× along ${angleDeg}° — straight with dynamic segments`,
    startFactor: { x: -distFactor * Math.cos(a), y: -distFactor * Math.sin(a) },
    endFactor:   { x:  distFactor * Math.cos(a), y:  distFactor * Math.sin(a) },
    checks(center, pts, segLen, start, end) {
      return [
        ...collinearChecks(center, pts, segLen, start, end),
        ...dynamicSegmentChecks(center, start, end, pts, segLen),
      ];
    }
  };
}

export const testCases = [
  // ---------------------------------------------------------------
  // Collinear straight tests at multiple angles (rotation invariance)
  // ---------------------------------------------------------------
  collinearTestAtAngle(0),
  collinearTestAtAngle(30),
  collinearTestAtAngle(45),
  collinearTestAtAngle(90),
  collinearTestAtAngle(135),
  collinearTestAtAngle(170),

  // Extended collinear at various angles
  extendedCollinearTestAtAngle(0, 8),
  extendedCollinearTestAtAngle(90, 6),
  extendedCollinearTestAtAngle(45, 6),

  // ---------------------------------------------------------------
  // Extended asymmetric collinear — different distances per half
  // ---------------------------------------------------------------
  {
    name: "Extended asymmetric",
    description: "Start at 8× left, end at 4× right — left segments 2×, right segments 1×",
    startFactor: { x: -8, y: 0 },
    endFactor:   { x:  4, y: 0 },
    checks(center, pts, segLen, start, end) {
      return [
        ...collinearChecks(center, pts, segLen, start, end),
        ...dynamicSegmentChecks(center, start, end, pts, segLen),
      ];
    }
  },

  // ---------------------------------------------------------------
  // Curved cases — positions verified with 15% tolerance
  // ---------------------------------------------------------------
  {
    name: "Vertical symmetric",
    description: "Start below, end above center — same X, equal distance",
    startFactor: { x: 0, y: 2.5 },
    endFactor:   { x: 0, y: -2.5 },
    checks(center, pts, segLen) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -0.943, y:  2.167 }, p2: { x: -1.342, y:  1.250 }, p3: { x: -0.943, y:  0.333 },
          p4: { x:  0.943, y: -0.333 }, p5: { x:  1.342, y: -1.250 }, p6: { x:  0.943, y: -2.167 },
        }),
        ...segmentChecks(center, pts, segLen),
      ];
    }
  },
  {
    name: "Vertical wave-like",
    description: "Start below, end above — same X, at 2× gridSpacing (S-curve)",
    startFactor: { x: 0, y: 2 },
    endFactor:   { x: 0, y: -2 },
    checks(center, pts, segLen) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -0.993, y:  1.885 }, p2: { x: -1.460, y:  1.000 }, p3: { x: -0.993, y:  0.115 },
          p4: { x:  0.993, y: -0.115 }, p5: { x:  1.460, y: -1.000 }, p6: { x:  0.993, y: -1.885 },
        }),
        ...segmentChecks(center, pts, segLen),
      ];
    }
  },
  {
    name: "Horizontal wave-like",
    description: "Start left, end right — same Y, at 3.5× gridSpacing (near max reach)",
    startFactor: { x: -3.5, y: 0 },
    endFactor:   { x:  3.5, y: 0 },
    checks(center, pts, segLen) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -2.724, y: -0.631 }, p2: { x: -1.750, y: -0.857 }, p3: { x: -0.776, y: -0.631 },
          p4: { x:  0.776, y:  0.631 }, p5: { x:  1.750, y:  0.857 }, p6: { x:  2.724, y:  0.631 },
        }),
        ...segmentChecks(center, pts, segLen),
      ];
    }
  },
  {
    name: "Diagonal symmetric",
    description: "Start bottom-left, end top-right — equal distance",
    startFactor: { x: -2, y: 2 },
    endFactor:   { x:  2, y: -2 },
    checks(center, pts, segLen) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -2.284, y:  1.041 }, p2: { x: -1.869, y:  0.131 }, p3: { x: -0.959, y: -0.284 },
          p4: { x:  0.959, y:  0.284 }, p5: { x:  1.869, y: -0.131 }, p6: { x:  2.284, y: -1.041 },
        }),
        ...segmentChecks(center, pts, segLen),
      ];
    }
  },
  {
    name: "Diagonal wave-like",
    description: "Start bottom-right, end top-left — centrally symmetric S-curve",
    startFactor: { x: 0.5, y: 2.5 },
    endFactor:   { x: -0.5, y: -2.5 },
    checks(center, pts, segLen) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -0.486, y:  2.335 }, p2: { x: -1.051, y:  1.510 }, p3: { x: -0.847, y:  0.531 },
          p4: { x:  0.847, y: -0.531 }, p5: { x:  1.051, y: -1.510 }, p6: { x:  0.486, y: -2.335 },
        }),
        ...segmentChecks(center, pts, segLen),
      ];
    }
  },
  {
    name: "Loop",
    description: "Start and end at same position below center",
    startFactor: { x: 0, y: 2 },
    endFactor:   { x: 0, y: 2 },
    checks(center, pts, segLen) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -0.993, y:  1.885 }, p2: { x: -1.460, y:  1.000 }, p3: { x: -0.993, y:  0.115 },
          p4: { x:  0.993, y:  0.115 }, p5: { x:  1.460, y:  1.000 }, p6: { x:  0.993, y:  1.885 },
        }),
        ...segmentChecks(center, pts, segLen),
      ];
    }
  },
  {
    name: "Self-referencing",
    description: "Start and end both at center — figure-eight shape",
    startFactor: { x: 0, y: 0 },
    endFactor:   { x: 0, y: 0 },
    checks(center, pts, segLen) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -0.707, y:  0.707 }, p2: { x: -1.414, y:  0.000 }, p3: { x: -0.707, y: -0.707 },
          p4: { x:  0.707, y:  0.707 }, p5: { x:  1.414, y:  0.000 }, p6: { x:  0.707, y: -0.707 },
        }),
        ...segmentChecks(center, pts, segLen),
      ];
    }
  },

  // ---------------------------------------------------------------
  // Asymmetric: one half straight (at maxReach), other half curved
  // ---------------------------------------------------------------
  {
    name: "Diagonal to vertical",
    description: "Start top-right (3,-4), end straight below (0,4) — right half straight, left half curved",
    startFactor: { x: 3, y: -4 },
    endFactor:   { x: 0, y: 4 },
    checks(center, pts, segLen, start, end) {
      return [
        // Right half: end is at exactly 4× segLen downward → straight
        ...straightChainChecks(center, pts, segLen, end, ['p4','p5','p6'], 'right-straight'),
        // Left half: curved — approximate positions
        ...positionChecks(center, pts, segLen, {
          p1: { x:  1.393, y: -3.265 }, p2: { x:  0.490, y: -2.400 }, p3: { x:  0.000, y: -1.250 },
        }),
        ...dynamicSegmentChecks(center, start, end, pts, segLen),
      ];
    }
  },
  {
    name: "Diagonal to vertical (mirrored)",
    description: "Start top-left (-3,-4), end straight below (0,4) — mirror of previous",
    startFactor: { x: -3, y: -4 },
    endFactor:   { x: 0, y: 4 },
    checks(center, pts, segLen, start, end) {
      return [
        // Right half: end is at exactly 4× segLen downward → straight
        ...straightChainChecks(center, pts, segLen, end, ['p4','p5','p6'], 'right-straight'),
        // Left half: should be mirror of "Diagonal to vertical" left half
        ...positionChecks(center, pts, segLen, {
          p1: { x: -1.393, y: -3.265 }, p2: { x: -0.490, y: -2.400 }, p3: { x:  0.000, y: -1.250 },
        }),
        ...dynamicSegmentChecks(center, start, end, pts, segLen),
      ];
    }
  },
];
