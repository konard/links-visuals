// initControlPoints — creates control circles and attaches D3 drag behaviour.
// Appends the main path and circles directly to the SVG (not a sub-group),
// matching the reference implementation where everything is a direct child
// of the SVG element.

import * as state from './state.mjs';
import { screenToWorld } from './svg-setup.mjs';
import { updatePath } from './path.mjs';
import { strokeFraction } from './constants.mjs';

// d3 is injected at init time.
let _d3 = null;
export function setD3(d3) { _d3 = d3; }

export function initControlPoints() {
  state.setMainPath(
    state.svgSelection.append("path")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 0)   // set to strokeFraction * gridSpacing in resize()
      .attr("marker-start", "url(#cross-marker)")
      .attr("marker-end",   "url(#arrow-marker)")
  );

  state.setCircles(
    state.svgSelection.selectAll("circle.control")
      .data(state.points, datum => datum.id)
      .enter()
      .append("circle")
      .attr("class", datum => "control " + datum.id)
      .attr("r", state.circleRadius)
      .attr("fill", "rgba(0,0,0,0)")
      .attr("stroke-dasharray", "4 2")
      .attr("stroke", datum => {
        if (datum.type === "center")   return "black";
        if (datum.type === "endpoint") return datum.id === "start" ? "green" : "red";
        return "blue";
      })
      .style("pointer-events", datum => datum.draggable ? "auto" : "none")
  );

  // Reorder SVG DOM for correct paint order (bottom -> top):
  state.circles.filter(datum => datum.type === "center").lower();
  state.circles.filter(datum => datum.id === "start").raise();
  state.circles.filter(datum => datum.id === "end").raise();

  // D3 drag — converts screen coords to SVG-local coords via screenToWorld()
  state.circles.filter(datum => datum.draggable).call(_d3.drag()
    .on("start", function(event, datum) {
      _d3.select(this).attr("stroke-dasharray", null);
      if (datum.id === "start" || datum.id === "end") state.setAnimationEnabled(true);
    })
    .on("drag", function(event, datum) {
      // For touch events, clientX/Y lives on changedTouches[0].
      const source = event.sourceEvent;
      const clientX = source.clientX !== undefined ? source.clientX
                    : source.changedTouches ? source.changedTouches[0].clientX : event.x;
      const clientY = source.clientY !== undefined ? source.clientY
                    : source.changedTouches ? source.changedTouches[0].clientY : event.y;
      const worldPoint  = screenToWorld(clientX, clientY);
      const nearestX    = state.centerX + Math.round((worldPoint.x - state.centerX) / state.halfSpacing) * state.halfSpacing;
      const nearestY    = state.centerY + Math.round((worldPoint.y - state.centerY) / state.halfSpacing) * state.halfSpacing;
      const distance    = Math.hypot(worldPoint.x - nearestX, worldPoint.y - nearestY);
      datum.x = distance < state.snapThreshold ? nearestX : worldPoint.x;
      datum.y = distance < state.snapThreshold ? nearestY : worldPoint.y;
      _d3.select(this).attr("cx", datum.x).attr("cy", datum.y);
      updatePath();
    })
    .on("end", function(event, datum) {
      datum.xFactor = (datum.x - state.centerX) / state.gridSpacing;
      datum.yFactor = (datum.y - state.centerY) / state.gridSpacing;
      _d3.select(this).attr("stroke-dasharray", "4 2");
    }));
}
