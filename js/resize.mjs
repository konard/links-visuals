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
  state.setCenterX(state.width  / 2);
  state.setCenterY(state.height / 2);
  state.setGridSpacing(state.centerX * (1 - paddingFraction) / 4);
  state.setHalfSpacing(state.gridSpacing / 2);

  state.setSnapThreshold(snapFraction   * state.gridSpacing);
  state.setCircleRadius(radiusFraction * state.gridSpacing);
  state.setSegmentLength(state.gridSpacing);
  state.setMaximumReach(IK_SEG_COUNT * state.gridSpacing);
  state.setSideTolerance(sideTolFraction * state.gridSpacing);

  state.svgSelection.attr("width", state.width).attr("height", state.height);

  // Keep <canvas> sized to match
  const canvasElement = document.getElementById("render-canvas");
  canvasElement.width  = state.width;
  canvasElement.height = state.height;

  if (state.circles)  state.circles.attr("r", state.circleRadius);
  if (state.mainPath) state.mainPath.attr("stroke-width", strokeFraction * state.gridSpacing);

  drawGrid();
  initMarkers();

  state.points.forEach(datum => {
    datum.x = state.centerX + datum.xFactor * state.gridSpacing;
    datum.y = state.centerY + datum.yFactor * state.gridSpacing;
  });

  if (state.circles) state.circles.data(state.points).attr("cx", datum => datum.x).attr("cy", datum => datum.y);
  if (state.animationEnabled) updateIntermediateViaIK();
  updatePath();
}
