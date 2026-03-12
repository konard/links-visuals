// Shared test case definitions used by both unit tests and visual tests.
// Each test case defines: name, description, start/end factors, and check functions.

import { IK_SEG_COUNT } from './constants.mjs';

const TOLERANCE = 2; // pixels

export function close(a, b) { return Math.abs(a - b) < TOLERANCE; }

function symmetryChecks(center, pts) {
  return [
    { id: "p3", pass: close(Math.abs(pts.p3.x - center.x), Math.abs(pts.p4.x - center.x))
                    && close(Math.abs(pts.p3.y - center.y), Math.abs(pts.p4.y - center.y)),
      label: "p3↔p4 symmetric" },
    { id: "p2", pass: close(Math.abs(pts.p2.x - center.x), Math.abs(pts.p5.x - center.x))
                    && close(Math.abs(pts.p2.y - center.y), Math.abs(pts.p5.y - center.y)),
      label: "p2↔p5 symmetric" },
    { id: "p1", pass: close(Math.abs(pts.p1.x - center.x), Math.abs(pts.p6.x - center.x))
                    && close(Math.abs(pts.p1.y - center.y), Math.abs(pts.p6.y - center.y)),
      label: "p1↔p6 symmetric" },
    { id: "p4", pass: close(Math.abs(pts.p3.x - center.x), Math.abs(pts.p4.x - center.x))
                    && close(Math.abs(pts.p3.y - center.y), Math.abs(pts.p4.y - center.y)),
      label: "p4↔p3 symmetric" },
    { id: "p5", pass: close(Math.abs(pts.p2.x - center.x), Math.abs(pts.p5.x - center.x))
                    && close(Math.abs(pts.p2.y - center.y), Math.abs(pts.p5.y - center.y)),
      label: "p5↔p2 symmetric" },
    { id: "p6", pass: close(Math.abs(pts.p1.x - center.x), Math.abs(pts.p6.x - center.x))
                    && close(Math.abs(pts.p1.y - center.y), Math.abs(pts.p6.y - center.y)),
      label: "p6↔p1 symmetric" },
  ];
}

function distanceSymmetryChecks(center, pts) {
  return [
    { id: "p3", pass: close(Math.hypot(pts.p3.x - center.x, pts.p3.y - center.y),
                            Math.hypot(pts.p4.x - center.x, pts.p4.y - center.y)),
      label: "p3↔p4 equal dist from center" },
    { id: "p2", pass: close(Math.hypot(pts.p2.x - center.x, pts.p2.y - center.y),
                            Math.hypot(pts.p5.x - center.x, pts.p5.y - center.y)),
      label: "p2↔p5 equal dist from center" },
    { id: "p1", pass: close(Math.hypot(pts.p1.x - center.x, pts.p1.y - center.y),
                            Math.hypot(pts.p6.x - center.x, pts.p6.y - center.y)),
      label: "p1↔p6 equal dist from center" },
    { id: "p4", pass: close(Math.hypot(pts.p3.x - center.x, pts.p3.y - center.y),
                            Math.hypot(pts.p4.x - center.x, pts.p4.y - center.y)),
      label: "p4↔p3 equal dist from center" },
    { id: "p5", pass: close(Math.hypot(pts.p2.x - center.x, pts.p2.y - center.y),
                            Math.hypot(pts.p5.x - center.x, pts.p5.y - center.y)),
      label: "p5↔p2 equal dist from center" },
    { id: "p6", pass: close(Math.hypot(pts.p1.x - center.x, pts.p1.y - center.y),
                            Math.hypot(pts.p6.x - center.x, pts.p6.y - center.y)),
      label: "p6↔p1 equal dist from center" },
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

export const testCases = [
  {
    name: "Horizontal straight",
    description: "Start left, end right — at exactly max reach (4×), all points collinear",
    startFactor: { x: -4, y: 0 },
    endFactor:   { x:  4, y: 0 },
    checks(center, pts, segLen) {
      // All intermediate points should be on the same Y as center (collinear)
      const collinearChecks = [
        { id: "p3", pass: close(pts.p3.y, center.y), label: `p3 collinear: y=${pts.p3.y.toFixed(1)} ≈ center.y=${center.y.toFixed(1)}` },
        { id: "p2", pass: close(pts.p2.y, center.y), label: `p2 collinear: y=${pts.p2.y.toFixed(1)} ≈ center.y=${center.y.toFixed(1)}` },
        { id: "p1", pass: close(pts.p1.y, center.y), label: `p1 collinear: y=${pts.p1.y.toFixed(1)} ≈ center.y=${center.y.toFixed(1)}` },
        { id: "p4", pass: close(pts.p4.y, center.y), label: `p4 collinear: y=${pts.p4.y.toFixed(1)} ≈ center.y=${center.y.toFixed(1)}` },
        { id: "p5", pass: close(pts.p5.y, center.y), label: `p5 collinear: y=${pts.p5.y.toFixed(1)} ≈ center.y=${center.y.toFixed(1)}` },
        { id: "p6", pass: close(pts.p6.y, center.y), label: `p6 collinear: y=${pts.p6.y.toFixed(1)} ≈ center.y=${center.y.toFixed(1)}` },
      ];
      // Equal spacing: each point should be 1× segLen apart along X
      const spacingChecks = [
        { id: "p3", pass: close(pts.p3.x, center.x - 1 * segLen), label: `p3 x-spacing: x=${pts.p3.x.toFixed(1)} ≈ ${(center.x - segLen).toFixed(1)}` },
        { id: "p2", pass: close(pts.p2.x, center.x - 2 * segLen), label: `p2 x-spacing: x=${pts.p2.x.toFixed(1)} ≈ ${(center.x - 2*segLen).toFixed(1)}` },
        { id: "p1", pass: close(pts.p1.x, center.x - 3 * segLen), label: `p1 x-spacing: x=${pts.p1.x.toFixed(1)} ≈ ${(center.x - 3*segLen).toFixed(1)}` },
        { id: "p4", pass: close(pts.p4.x, center.x + 1 * segLen), label: `p4 x-spacing: x=${pts.p4.x.toFixed(1)} ≈ ${(center.x + segLen).toFixed(1)}` },
        { id: "p5", pass: close(pts.p5.x, center.x + 2 * segLen), label: `p5 x-spacing: x=${pts.p5.x.toFixed(1)} ≈ ${(center.x + 2*segLen).toFixed(1)}` },
        { id: "p6", pass: close(pts.p6.x, center.x + 3 * segLen), label: `p6 x-spacing: x=${pts.p6.x.toFixed(1)} ≈ ${(center.x + 3*segLen).toFixed(1)}` },
      ];
      return [...collinearChecks, ...spacingChecks, ...segmentChecks(center, pts, segLen)];
    }
  },
  {
    name: "Vertical symmetric",
    description: "Start below, end above center — same X, equal distance",
    startFactor: { x: 0, y: 2.5 },
    endFactor:   { x: 0, y: -2.5 },
    checks(center, pts, segLen) {
      return [...symmetryChecks(center, pts), ...segmentChecks(center, pts, segLen)];
    }
  },
  {
    name: "Vertical wave-like",
    description: "Start below, end above — same X, at 2× gridSpacing (S-curve)",
    startFactor: { x: 0, y: 2 },
    endFactor:   { x: 0, y: -2 },
    checks(center, pts, segLen) {
      // S-wave continuity: p3 and p4 must be on opposite sides of center X
      const p3side = Math.sign(pts.p3.x - center.x);
      const p4side = Math.sign(pts.p4.x - center.x);
      const continuity = {
        id: "p3",
        pass: p3side !== 0 && p4side !== 0 && p3side !== p4side,
        label: `S-wave continuity: p3 x-side=${p3side}, p4 x-side=${p4side} (must be opposite)`
      };
      return [continuity, ...symmetryChecks(center, pts), ...segmentChecks(center, pts, segLen)];
    }
  },
  {
    name: "Horizontal wave-like",
    description: "Start left, end right — same Y, at 3.5× gridSpacing (near max reach)",
    startFactor: { x: -3.5, y: 0 },
    endFactor:   { x:  3.5, y: 0 },
    checks(center, pts, segLen) {
      // S-wave continuity: p3 and p4 must be on opposite sides of center Y
      const p3side = Math.sign(pts.p3.y - center.y);
      const p4side = Math.sign(pts.p4.y - center.y);
      const continuity = {
        id: "p3",
        pass: p3side !== 0 && p4side !== 0 && p3side !== p4side,
        label: `S-wave continuity: p3 y-side=${p3side}, p4 y-side=${p4side} (must be opposite)`
      };
      return [continuity, ...symmetryChecks(center, pts), ...segmentChecks(center, pts, segLen)];
    }
  },
  {
    name: "Diagonal symmetric",
    description: "Start bottom-left, end top-right — equal distance",
    startFactor: { x: -2, y: 2 },
    endFactor:   { x:  2, y: -2 },
    checks(center, pts, segLen) {
      return [...distanceSymmetryChecks(center, pts), ...segmentChecks(center, pts, segLen)];
    }
  },
  {
    name: "Diagonal wave-like",
    description: "Start bottom-right, end top-left — centrally symmetric S-curve",
    startFactor: { x: 0.5, y: 2.5 },
    endFactor:   { x: -0.5, y: -2.5 },
    checks(center, pts, segLen) {
      // Central symmetry: p3 offset ≈ negated p4 offset, etc.
      const centralChecks = [
        { id: "p3", pass: close(pts.p3.x - center.x, -(pts.p4.x - center.x))
                        && close(pts.p3.y - center.y, -(pts.p4.y - center.y)),
          label: "p3↔p4 centrally symmetric" },
        { id: "p2", pass: close(pts.p2.x - center.x, -(pts.p5.x - center.x))
                        && close(pts.p2.y - center.y, -(pts.p5.y - center.y)),
          label: "p2↔p5 centrally symmetric" },
        { id: "p1", pass: close(pts.p1.x - center.x, -(pts.p6.x - center.x))
                        && close(pts.p1.y - center.y, -(pts.p6.y - center.y)),
          label: "p1↔p6 centrally symmetric" },
        { id: "p4", pass: close(pts.p4.x - center.x, -(pts.p3.x - center.x))
                        && close(pts.p4.y - center.y, -(pts.p3.y - center.y)),
          label: "p4↔p3 centrally symmetric" },
        { id: "p5", pass: close(pts.p5.x - center.x, -(pts.p2.x - center.x))
                        && close(pts.p5.y - center.y, -(pts.p2.y - center.y)),
          label: "p5↔p2 centrally symmetric" },
        { id: "p6", pass: close(pts.p6.x - center.x, -(pts.p1.x - center.x))
                        && close(pts.p6.y - center.y, -(pts.p1.y - center.y)),
          label: "p6↔p1 centrally symmetric" },
      ];
      return [...centralChecks, ...segmentChecks(center, pts, segLen)];
    }
  },
  {
    name: "Loop",
    description: "Start and end at same position below center",
    startFactor: { x: 0, y: 2 },
    endFactor:   { x: 0, y: 2 },
    checks(center, pts, segLen) {
      return [...distanceSymmetryChecks(center, pts), ...segmentChecks(center, pts, segLen)];
    }
  },
  {
    name: "Self-referencing",
    description: "Start and end both at center — figure-eight shape",
    startFactor: { x: 0, y: 0 },
    endFactor:   { x: 0, y: 0 },
    checks(center, pts, segLen) {
      // p3 and p4 should be on opposite sides of center Y (figure-eight)
      const p3side = Math.sign(pts.p3.y - center.y);
      const p4side = Math.sign(pts.p4.y - center.y);
      const continuity = {
        id: "p3",
        pass: p3side !== 0 && p4side !== 0 && p3side !== p4side,
        label: `Figure-eight continuity: p3 y-side=${p3side}, p4 y-side=${p4side} (must be opposite)`
      };
      return [continuity, ...distanceSymmetryChecks(center, pts), ...segmentChecks(center, pts, segLen)];
    }
  },
];
