// resize — recomputes all size-dependent values and redraws the scene.
// Called on window resize and at startup.

import * as state from './state.mjs';
import { paddingFraction, snapFraction, radiusFraction, strokeFraction, sideTolFraction, IK_SEG_COUNT } from './constants.mjs';
import { drawGrid } from './grid.mjs';
import { initMarkers } from './markers.mjs';
import { updatePath } from './path.mjs';
import { updateIntermediateViaIK } from './ik.mjs';

export function resize() {
  state.setWidth(innerWidth);
  state.setHeight(innerHeight);
  state.setCx(state.width  / 2);
  state.setCy(state.height / 2);
  state.setGridSpacing(state.cx * (1 - paddingFraction) / 4);
  state.setHalfSpacing(state.gridSpacing / 2);

  state.setSnapThreshold(snapFraction   * state.gridSpacing);
  state.setCircleRadius(radiusFraction * state.gridSpacing);
  state.setSegLen(state.gridSpacing);
  state.setMaxReach(IK_SEG_COUNT * state.gridSpacing);
  state.setSideTolerance(sideTolFraction * state.gridSpacing);

  state.svg.attr("width", state.width).attr("height", state.height);

  // Keep <canvas> sized to match
  const canvasEl  = document.getElementById("render-canvas");
  canvasEl.width  = state.width;
  canvasEl.height = state.height;

  if (state.circles)  state.circles.attr("r", state.circleRadius);
  if (state.mainPath) state.mainPath.attr("stroke-width", strokeFraction * state.gridSpacing);

  drawGrid();
  initMarkers();

  state.points.forEach(d => {
    d.x = state.cx + d.xFactor * state.gridSpacing;
    d.y = state.cy + d.yFactor * state.gridSpacing;
  });

  if (state.circles) state.circles.data(state.points).attr("cx", d => d.x).attr("cy", d => d.y);
  if (state.animationEnabled) updateIntermediateViaIK();
  updatePath();
}
