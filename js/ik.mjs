// ik.mjs — constant-curvature inverse kinematics math helpers.
// Used to animate the intermediate control points (p1–p6) each frame.

import * as state from './state.mjs';
import { IK_SEG_COUNT, IK_FIRST_INIT_ANGLE, IK_FIRST_MAX_DELTA, IK_SWEEP_STEPS } from './constants.mjs';

function normAngle(a) {
  while (a >  Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function buildArcFixed(thetaAbs, side, baseAngle, root) {
  const arc = [{ ...root }], theta = thetaAbs * side;
  let dir = baseAngle, x = root.x, y = root.y;
  for (let i = 1; i <= IK_SEG_COUNT; i++) {
    x += state.SEG_LEN * Math.cos(dir);
    y += state.SEG_LEN * Math.sin(dir);
    arc[i] = { x, y };
    dir += theta;
  }
  return arc;
}

function buildArc(thetaAbs, side, dx, dy, root) {
  const theta = thetaAbs * side;
  const beta  = Math.atan2(dy, dx) - (IK_SEG_COUNT - 1) * theta / 2;
  return buildArcFixed(thetaAbs, side, beta, root);
}

function rotateAround(pArr, phi, root) {
  const s = Math.sin(phi), c = Math.cos(phi);
  for (const p of pArr) {
    const dx = p.x - root.x, dy = p.y - root.y;
    p.x = root.x + dx * c - dy * s;
    p.y = root.y + dx * s + dy * c;
  }
}

function clampFirstJoint(arc, root, maxDelta = IK_FIRST_MAX_DELTA) {
  const firstDir = Math.atan2(arc[1].y - root.y, arc[1].x - root.x);
  const delta    = normAngle(firstDir - IK_FIRST_INIT_ANGLE);
  if (delta >  maxDelta) rotateAround(arc,  maxDelta - delta, root);
  if (delta < -maxDelta) rotateAround(arc, -maxDelta - delta, root);
}

function bestArc(side, baseAngle, root, target) {
  let best = Infinity, bestArcResult = null;
  const thetaMax = Math.PI * 2 / IK_SEG_COUNT - 1e-4;
  for (let i = 0; i <= IK_SWEEP_STEPS; i++) {
    const theta = i * thetaMax / IK_SWEEP_STEPS;
    const arc   = buildArcFixed(theta, side, baseAngle, root);
    const end   = arc[IK_SEG_COUNT];
    const d     = Math.hypot(end.x - target.x, end.y - target.y);
    if (d < best) { best = d; bestArcResult = arc; }
  }
  clampFirstJoint(bestArcResult, root);
  return { arc: bestArcResult, dist: best };
}

function solveIK(root, target, preferredSide) {
  const dx = target.x - root.x, dy = target.y - root.y, d = Math.hypot(dx, dy);
  if (preferredSide === 0) preferredSide = dy < 0 ? 1 : -1;
  const eff = Math.min(d, state.MAX_REACH);

  let lo = 1e-6, hi = Math.PI * 2 / IK_SEG_COUNT - 1e-6;
  const radius = θ => Math.sin(IK_SEG_COUNT * θ / 2) / Math.sin(θ / 2);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    (radius(mid) > eff / state.SEG_LEN) ? (lo = mid) : (hi = mid);
  }
  const thetaAbs = (lo + hi) / 2;

  let up, down;
  if (d < state.MAX_REACH * 0.82 - 1e-3) {
    up   = { arc: buildArc(thetaAbs,  1, dx, dy, root) };
    down = { arc: buildArc(thetaAbs, -1, dx, dy, root) };
    clampFirstJoint(up.arc,   root, IK_FIRST_MAX_DELTA / 2);
    clampFirstJoint(down.arc, root, IK_FIRST_MAX_DELTA / 2);
    up.dist   = Math.hypot(up.arc[IK_SEG_COUNT].x   - target.x, up.arc[IK_SEG_COUNT].y   - target.y);
    down.dist = Math.hypot(down.arc[IK_SEG_COUNT].x - target.x, down.arc[IK_SEG_COUNT].y - target.y);
  } else if (d < state.MAX_REACH - 1e-3) {
    up   = { arc: buildArc(thetaAbs,  1, dx, dy, root) };
    down = { arc: buildArc(thetaAbs, -1, dx, dy, root) };
    clampFirstJoint(up.arc,   root);
    clampFirstJoint(down.arc, root);
    up.dist   = Math.hypot(up.arc[IK_SEG_COUNT].x   - target.x, up.arc[IK_SEG_COUNT].y   - target.y);
    down.dist = Math.hypot(down.arc[IK_SEG_COUNT].x - target.x, down.arc[IK_SEG_COUNT].y - target.y);
  } else {
    const base = Math.max(
      IK_FIRST_INIT_ANGLE - IK_FIRST_MAX_DELTA,
      Math.min(IK_FIRST_INIT_ANGLE + IK_FIRST_MAX_DELTA, Math.atan2(dy, dx))
    );
    up   = bestArc( 1, base, root, target);
    down = bestArc(-1, base, root, target);
  }

  const cur = preferredSide > 0 ? up   : down;
  const oth = preferredSide > 0 ? down : up;
  if (oth.dist < cur.dist - state.SIDE_TOLERANCE) preferredSide *= -1;
  return { arc: (preferredSide > 0 ? up.arc : down.arc), preferredSide };
}

// updateIntermediateViaIK — called each animation frame when animation is enabled.
export function updateIntermediateViaIK() {
  if (!state.animationEnabled) return;

  const root = { x: state.byId.center.x, y: state.byId.center.y };

  // Left half: center → p3 → p2 → p1 → start (mirrored)
  const tgtL = { x: state.byId.start.x, y: state.byId.start.y };
  const tL   = { x: root.x + Math.abs(tgtL.x - root.x), y: tgtL.y };
  const resL = solveIK(root, tL, -state.preferLeft);
  state.setPreferLeft(-resL.preferredSide);
  const arcL = resL.arc.map(p => ({ x: 2 * root.x - p.x, y: p.y }));
  state.byId.p3.x = arcL[1].x; state.byId.p3.y = arcL[1].y;
  state.byId.p2.x = arcL[2].x; state.byId.p2.y = arcL[2].y;
  state.byId.p1.x = arcL[3].x; state.byId.p1.y = arcL[3].y;

  // Right half: center → p4 → p5 → p6 → end
  const tgtR = { x: state.byId.end.x, y: state.byId.end.y };
  const resR = solveIK(root, tgtR, state.preferRight);
  state.setPreferRight(resR.preferredSide);
  const arcR = resR.arc;
  state.byId.p4.x = arcR[1].x; state.byId.p4.y = arcR[1].y;
  state.byId.p5.x = arcR[2].x; state.byId.p5.y = arcR[2].y;
  state.byId.p6.x = arcR[3].x; state.byId.p6.y = arcR[3].y;
}
