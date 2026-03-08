// initMarkers — creates SVG <defs> markers for the path endpoints.
//
// FIX for oversized markers:
//   Previous code used markerWidth=100 / markerHeight=100 with the default
//   markerUnits="strokeWidth", which made each marker 100 × strokeWidth pixels
//   (≈ 1500 px at normal scale) — dominating the viewport.
//
//   Now uses markerUnits="userSpaceOnUse" with sizes derived from gridSpacing so
//   the markers are always proportionate to the scene geometry regardless of
//   viewport size or zoom level.  initMarkers() is called from resize() so the
//   sizes update with gridSpacing.
//
// Marker geometry (viewBox 0 0 100 100, values unchanged from original design):
//   cross-marker: vertical tick at x ≈ 57.7, spanning y = 39.3 – 60.7 (21.4%)
//   arrow-marker: two arms from (10.35, 50±0.35) back to (−0.35, 40 or 60)

import * as state from './state.mjs';
import { strokeFraction } from './constants.mjs';

export function initMarkers() {
  // Remove existing marker defs so resize() can safely re-create them.
  const defs = state.svg.select("defs");
  defs.select("#cross-marker").remove();
  defs.select("#arrow-marker").remove();

  // Marker box size in world units (userSpaceOnUse).
  // Choose a size that makes the decorative markers visually proportionate:
  //   marker_box = 6 × strokeWidth → cross height ≈ 1.3 × sw, arrow arms ≈ 0.87 × sw.
  const sw        = strokeFraction * state.gridSpacing;  // path stroke-width in world px
  const markerBox = 6 * sw;                              // marker viewport in world px
  // Line weight inside the marker = same as the main path stroke.
  const lineW     = sw / markerBox * 100;                // in viewBox units (0-100 scale)

  // cross-marker: a vertical tick at path start.
  // The line is slightly right-of-centre (x ≈ 57.7) — original design intent.
  defs.append("marker")
    .attr("id", "cross-marker")
    .attr("viewBox", "0 0 100 100")
    .attr("markerWidth",  markerBox)
    .attr("markerHeight", markerBox)
    .attr("refX", 50)
    .attr("refY", 50)
    .attr("orient", "auto")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("overflow", "visible")
    .append("g")
    .call(g => {
      g.append("line")
       .attr("x1", 62.5 - (12.5 - 12.5/1.618))
       .attr("y1", 25 + 14.5 - 0.23)
       .attr("x2", 62.5 - (12.5 - 12.5/1.618))
       .attr("y2", 75 - 14.5 + 0.23)
       .attr("stroke", "black")
       .attr("stroke-width", lineW);
    });

  // arrow-marker: double-arm arrowhead at path end.
  // refX=10 places the "tip" of the arrow at the path endpoint.
  defs.append("marker")
    .attr("id", "arrow-marker")
    .attr("viewBox", "0 0 100 100")
    .attr("markerWidth",  markerBox)
    .attr("markerHeight", markerBox)
    .attr("refX", 10)
    .attr("refY", 50)
    .attr("orient", "auto")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("overflow", "visible")
    .append("g")
    .call(g => {
      g.append("line")
       .attr("x1", 10 + 0.35)
       .attr("y1", 50 + 0.35)
       .attr("x2", 0 - 0.35)
       .attr("y2", 40 - 0.35)
       .attr("stroke", "black")
       .attr("stroke-width", lineW);
      g.append("line")
       .attr("x1", 10 + 0.35)
       .attr("y1", 50 - 0.35)
       .attr("x2", 0 - 0.35)
       .attr("y2", 60 + 0.35)
       .attr("stroke", "black")
       .attr("stroke-width", lineW);
    });
}
