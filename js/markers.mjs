// initMarkers — creates SVG <defs> markers for the path endpoints.
//
// Restores the exact marker definitions from the reference implementation
// (commit f2a8fb0). Uses viewBox="0 0 100 100" with markerWidth/Height=100
// and default markerUnits="strokeWidth" — the browser scales the markers
// automatically based on the path stroke-width.
//
// Marker geometry:
//   cross-marker: vertical tick at x ≈ 57.7, spanning y ≈ 39.3 – 60.7
//   arrow-marker: two arms from (10.35, 50±0.35) back to (−0.35, 40 or 60)

import * as state from './state.mjs';

export function initMarkers() {
  const defs = state.svg.select("defs");
  defs.select("#cross-marker").remove();
  defs.select("#arrow-marker").remove();

  // cross-marker: a vertical tick at path start (identical to reference).
  defs.append("marker")
    .attr("id", "cross-marker")
    .attr("viewBox", "0 0 100 100")
    .attr("markerWidth", 100)
    .attr("markerHeight", 100)
    .attr("refX", 50)
    .attr("refY", 50)
    .attr("orient", "auto")
    .append("g")
    .call(g => {
      g.append("line")
       .attr("x1", 62.5 - (12.5 - 12.5/1.618))
       .attr("y1", 25 + 14.5 - 0.23)
       .attr("x2", 62.5 - (12.5 - 12.5/1.618))
       .attr("y2", 75 - 14.5 + 0.23)
       .attr("stroke", "black");
    });

  // arrow-marker: double-arm arrowhead at path end (identical to reference).
  defs.append("marker")
    .attr("id", "arrow-marker")
    .attr("viewBox", "0 0 100 100")
    .attr("markerWidth", 100)
    .attr("markerHeight", 100)
    .attr("refX", 10)
    .attr("refY", 50)
    .attr("orient", "auto")
    .append("g")
    .call(g => {
      g.append("line")
       .attr("x1", 10 + 0.35)
       .attr("y1", 50 + 0.35)
       .attr("x2", 0 - 0.35)
       .attr("y2", 40 - 0.35)
       .attr("stroke", "black");
      g.append("line")
       .attr("x1", 10 + 0.35)
       .attr("y1", 50 - 0.35)
       .attr("x2", 0 - 0.35)
       .attr("y2", 60 + 0.35)
       .attr("stroke", "black");
    });
}
