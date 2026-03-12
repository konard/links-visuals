// Shared test case definitions used by both unit tests and visual tests.
// Each test case defines: name, description, start/end factors, and check functions.
// All position checks use offsets from center in units of gridSpacing (factors).

import { IK_SEG_COUNT } from './constants.mjs';

const TOLERANCE = 2; // pixels

export function close(a, b) { return Math.abs(a - b) < TOLERANCE; }

function closeFactor(a, b) { return Math.abs(a - b) < 0.05; }

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

export function maxReachChecks(center, pts, maxReach) {
  const checks = [];
  for (const [name, p] of Object.entries(pts)) {
    const dist = Math.hypot(p.x - center.x, p.y - center.y);
    checks.push({
      id: name,
      pass: dist <= maxReach + TOLERANCE,
      label: `${name} dist=${dist.toFixed(1)} ≤ maxReach ${maxReach.toFixed(1)}`
    });
  }
  return checks;
}

/**
 * Check that each point is at its expected position (as factors of gridSpacing from center).
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

export const testCases = [
  {
    name: "Horizontal straight",
    description: "Start left, end right — at exactly max reach (4×), all points collinear",
    startFactor: { x: -4, y: 0 },
    endFactor:   { x:  4, y: 0 },
    checks(center, pts, segLen) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -3, y: 0 }, p2: { x: -2, y: 0 }, p3: { x: -1, y: 0 },
          p4: { x:  1, y: 0 }, p5: { x:  2, y: 0 }, p6: { x:  3, y: 0 },
        }),
        ...segmentChecks(center, pts, segLen),
      ];
    }
  },
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
  {
    name: "Extended horizontal (8 units)",
    description: "Start/end at 8× gridSpacing — segments should be 2× gridSpacing each",
    startFactor: { x: -8, y: 0 },
    endFactor:   { x:  8, y: 0 },
    checks(center, pts, segLen, start, end) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -6, y: 0 }, p2: { x: -4, y: 0 }, p3: { x: -2, y: 0 },
          p4: { x:  2, y: 0 }, p5: { x:  4, y: 0 }, p6: { x:  6, y: 0 },
        }),
        ...dynamicSegmentChecks(center, start, end, pts, segLen),
      ];
    }
  },
  {
    name: "Extended vertical (6 units)",
    description: "Start/end at 6× gridSpacing — segments should be 1.5× gridSpacing each",
    startFactor: { x: 0, y: 6 },
    endFactor:   { x: 0, y: -6 },
    checks(center, pts, segLen, start, end) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: 0, y:  4.5 }, p2: { x: 0, y:  3 }, p3: { x: 0, y:  1.5 },
          p4: { x: 0, y: -1.5 }, p5: { x: 0, y: -3 }, p6: { x: 0, y: -4.5 },
        }),
        ...dynamicSegmentChecks(center, start, end, pts, segLen),
      ];
    }
  },
  {
    name: "Extended asymmetric",
    description: "Start at 8× left, end at 4× right — left segments 2×, right segments 1×",
    startFactor: { x: -8, y: 0 },
    endFactor:   { x:  4, y: 0 },
    checks(center, pts, segLen, start, end) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x: -6, y: 0 }, p2: { x: -4, y: 0 }, p3: { x: -2, y: 0 },
          p4: { x:  1, y: 0 }, p5: { x:  2, y: 0 }, p6: { x:  3, y: 0 },
        }),
        ...dynamicSegmentChecks(center, start, end, pts, segLen),
      ];
    }
  },
  {
    name: "Diagonal to vertical",
    description: "Start top-right (3,-4), end straight below (0,4) — asymmetric with dynamic segments",
    startFactor: { x: 3, y: -4 },
    endFactor:   { x: 0, y: 4 },
    checks(center, pts, segLen, start, end) {
      return [
        ...positionChecks(center, pts, segLen, {
          p1: { x:  1.393, y: -3.265 }, p2: { x:  0.490, y: -2.400 }, p3: { x:  0.000, y: -1.250 },
          p4: { x:  0.000, y:  1.000 }, p5: { x:  0.000, y:  2.000 }, p6: { x:  0.000, y:  3.000 },
        }),
        ...dynamicSegmentChecks(center, start, end, pts, segLen),
      ];
    }
  },
  {
    name: "Diagonal to vertical (mirrored)",
    description: "Start top-left (-3,-4), end straight below (0,4) — mirror of previous, must curve not be straight",
    startFactor: { x: -3, y: -4 },
    endFactor:   { x: 0, y: 4 },
    checks(center, pts, segLen, start, end) {
      // p3 should NOT be collinear with center→start — it must curve away
      const dx = start.x - center.x, dy = start.y - center.y;
      const len = Math.hypot(dx, dy);
      const crossP3 = Math.abs((pts.p3.x - center.x) * (dy / len) - (pts.p3.y - center.y) * (dx / len));
      const curvatureCheck = {
        id: "p3",
        pass: crossP3 > segLen * 0.1,
        label: `p3 curvature: perpendicular dist=${crossP3.toFixed(1)} from center→start line (must be > ${(segLen * 0.1).toFixed(1)})`
      };

      // Expected: mirror of "Diagonal to vertical" — p1.x should be negative of the non-mirrored p1.x
      // The mirrored case should produce curved shape, not straight.
      // Current algorithm produces straight line here (known bug), so these positions
      // record what a correct algorithm SHOULD produce (approximately mirrored).
      return [
        curvatureCheck,
        ...positionChecks(center, pts, segLen, {
          p1: { x: -1.393, y: -3.265 }, p2: { x: -0.490, y: -2.400 }, p3: { x:  0.000, y: -1.250 },
          p4: { x:  0.000, y:  1.000 }, p5: { x:  0.000, y:  2.000 }, p6: { x:  0.000, y:  3.000 },
        }),
        ...dynamicSegmentChecks(center, start, end, pts, segLen),
      ];
    }
  },
];
