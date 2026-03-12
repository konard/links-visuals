// ik.mjs — thin wrapper around ik-pure.mjs that reads/writes state.
// All IK math lives in ik-pure.mjs so that the same code is used
// by the animation loop, visual tests, and unit tests.

import * as state from './state.mjs';
import { solveIK } from './ik-pure.mjs';
import { IK_SEG_COUNT } from './constants.mjs';

// updateIntermediateViaIK — called each animation frame when animation is enabled.
export function updateIntermediateViaIK() {
  if (!state.animationEnabled) return;

  const root = { x: state.byId.center.x, y: state.byId.center.y };

  // Dynamic segment length: proportional to distance, minimum is base segLen
  const distR = Math.hypot(state.byId.end.x - root.x, state.byId.end.y - root.y);
  const distL = Math.hypot(state.byId.start.x - root.x, state.byId.start.y - root.y);
  const segLenR = Math.max(state.SEG_LEN, distR / IK_SEG_COUNT);
  const segLenL = Math.max(state.SEG_LEN, distL / IK_SEG_COUNT);
  const maxReachR = IK_SEG_COUNT * segLenR;
  const maxReachL = IK_SEG_COUNT * segLenL;

  // Right half first: center → p4 → p5 → p6 → end
  const tgtR = { x: state.byId.end.x, y: state.byId.end.y };
  const resR = solveIK(root, tgtR, state.preferRight, segLenR, maxReachR, state.SIDE_TOLERANCE);
  state.setPreferRight(resR.preferredSide);
  const arcR = resR.arc;
  state.byId.p4.x = arcR[1].x; state.byId.p4.y = arcR[1].y;
  state.byId.p5.x = arcR[2].x; state.byId.p5.y = arcR[2].y;
  state.byId.p6.x = arcR[3].x; state.byId.p6.y = arcR[3].y;

  // Left half: center → p3 → p2 → p1 → start (central mirror)
  const tL   = { x: 2 * root.x - state.byId.start.x, y: 2 * root.y - state.byId.start.y };
  const preferL = state.preferLeft !== 0 ? -state.preferLeft : resR.preferredSide;
  const resL = solveIK(root, tL, preferL, segLenL, maxReachL, state.SIDE_TOLERANCE);
  state.setPreferLeft(-resL.preferredSide);
  const arcL = resL.arc.map(p => ({ x: 2 * root.x - p.x, y: 2 * root.y - p.y }));
  state.byId.p3.x = arcL[1].x; state.byId.p3.y = arcL[1].y;
  state.byId.p2.x = arcL[2].x; state.byId.p2.y = arcL[2].y;
  state.byId.p1.x = arcL[3].x; state.byId.p1.y = arcL[3].y;
}
