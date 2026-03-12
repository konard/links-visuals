// ik.mjs — thin wrapper around ik-pure.mjs that reads/writes state.
// Calls computeIntermediatePoints — the same function used by
// visual tests and unit tests.

import * as state from './state.mjs';
import { computeIntermediatePoints } from './ik-pure.mjs';

// updateIntermediateViaIK — called each animation frame when animation is enabled.
export function updateIntermediateViaIK() {
  if (!state.animationEnabled) return;

  const center = { x: state.byId.center.x, y: state.byId.center.y };
  const start  = { x: state.byId.start.x,  y: state.byId.start.y };
  const end    = { x: state.byId.end.x,    y: state.byId.end.y };

  const result = computeIntermediatePoints(
    center, start, end,
    state.SEG_LEN, state.MAX_REACH, state.SIDE_TOLERANCE,
    state.preferRight, state.preferLeft
  );

  state.setPreferRight(result.preferRight);
  state.setPreferLeft(result.preferLeft);

  state.byId.p1.x = result.p1.x; state.byId.p1.y = result.p1.y;
  state.byId.p2.x = result.p2.x; state.byId.p2.y = result.p2.y;
  state.byId.p3.x = result.p3.x; state.byId.p3.y = result.p3.y;
  state.byId.p4.x = result.p4.x; state.byId.p4.y = result.p4.y;
  state.byId.p5.x = result.p5.x; state.byId.p5.y = result.p5.y;
  state.byId.p6.x = result.p6.x; state.byId.p6.y = result.p6.y;
}
