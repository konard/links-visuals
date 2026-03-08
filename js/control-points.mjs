// initControlPoints — creates control circles and attaches D3 drag behaviour.

import * as state from './state.mjs';
import { screenToWorld } from './svg-setup.mjs';
import { updatePath } from './path.mjs';
import { strokeFraction } from './constants.mjs';

// d3 is injected at init time.
let _d3 = null;
export function setD3(d3) { _d3 = d3; }

export function initControlPoints() {
  state.setMainPath(
    state.geometryGroup.append("path")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 0)   // set to strokeFraction * gridSpacing in resize()
      .attr("marker-start", "url(#cross-marker)")
      .attr("marker-end",   "url(#arrow-marker)")
  );

  state.setCircles(
    state.geometryGroup.selectAll("circle.control")
      .data(state.points, d => d.id)
      .enter()
      .append("circle")
      .attr("class", d => "control " + d.id)
      .attr("r", state.circleRadius)
      .attr("fill", "rgba(0,0,0,0)")
      .attr("stroke-dasharray", "4 2")
      .attr("stroke", d => {
        if (d.type === "center")   return "black";
        if (d.type === "endpoint") return d.id === "start" ? "green" : "red";
        return "blue";
      })
      .style("pointer-events", d => d.draggable ? "auto" : "none")
  );

  // Reorder SVG DOM for correct paint order (bottom → top):
  state.circles.filter(d => d.type === "center").lower();
  state.circles.filter(d => d.id === "start").raise();
  state.circles.filter(d => d.id === "end").raise();

  // D3 drag — converts screen coords to world coords via screenToWorld()
  state.circles.filter(d => d.draggable).call(_d3.drag()
    .on("start", function(ev, d) {
      _d3.select(this).attr("stroke-dasharray", null);
      if (d.id === "start" || d.id === "end") state.setAnimationEnabled(true);
    })
    .on("drag", function(ev, d) {
      // For touch events, clientX/Y lives on changedTouches[0].
      const src = ev.sourceEvent;
      const clientX = src.clientX !== undefined ? src.clientX
                    : src.changedTouches ? src.changedTouches[0].clientX : ev.x;
      const clientY = src.clientY !== undefined ? src.clientY
                    : src.changedTouches ? src.changedTouches[0].clientY : ev.y;
      const wpt  = screenToWorld(clientX, clientY);
      const nx   = state.cx + Math.round((wpt.x - state.cx) / state.halfSpacing) * state.halfSpacing;
      const ny   = state.cy + Math.round((wpt.y - state.cy) / state.halfSpacing) * state.halfSpacing;
      const dist = Math.hypot(wpt.x - nx, wpt.y - ny);
      d.x = dist < state.snapThreshold ? nx : wpt.x;
      d.y = dist < state.snapThreshold ? ny : wpt.y;
      _d3.select(this).attr("cx", d.x).attr("cy", d.y);
      updatePath();
    })
    .on("end", function(ev, d) {
      d.xFactor = (d.x - state.cx) / state.gridSpacing;
      d.yFactor = (d.y - state.cy) / state.gridSpacing;
      _d3.select(this).attr("stroke-dasharray", "4 2");
    }));
}
