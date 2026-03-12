// drawGrid — infinite background grid using SVG pattern tiles.
//
// Uses two <pattern> elements (minor + major) that tile across a very large
// <rect>. The patterns use patternUnits="userSpaceOnUse" so they tile in SVG
// coordinate space. Combined with the CSS transform on the SVG element for
// pan/zoom, this gives an effectively infinite grid.
//
// The pattern origin is aligned to (centerX, centerY) so grid lines pass through the
// viewport center. The large rect ensures grid lines are visible even when
// the user pans far from the center.

import * as state from './state.mjs';

const GRID_EXTENT      = 1e6;
const MINOR_PATTERN_ID = "grid-pattern-minor";
const MAJOR_PATTERN_ID = "grid-pattern-major";

export function drawGrid() {
  state.gridGroup.selectAll("*").remove();

  const defs = state.svgSelection.select("defs");
  defs.select("#" + MINOR_PATTERN_ID).remove();
  defs.select("#" + MAJOR_PATTERN_ID).remove();

  // Minor-grid pattern: halfSpacing x halfSpacing tile.
  const minorPattern = defs.append("pattern")
    .attr("id", MINOR_PATTERN_ID)
    .attr("x", ((state.centerX % state.halfSpacing) + state.halfSpacing) % state.halfSpacing)
    .attr("y", ((state.centerY % state.halfSpacing) + state.halfSpacing) % state.halfSpacing)
    .attr("width",  state.halfSpacing)
    .attr("height", state.halfSpacing)
    .attr("patternUnits", "userSpaceOnUse");
  minorPattern.append("line")
    .attr("x1", state.halfSpacing).attr("y1", 0)
    .attr("x2", state.halfSpacing).attr("y2", state.halfSpacing)
    .attr("stroke", "white").attr("stroke-width", 0.5).attr("opacity", 0.5);
  minorPattern.append("line")
    .attr("x1", 0).attr("y1", state.halfSpacing)
    .attr("x2", state.halfSpacing).attr("y2", state.halfSpacing)
    .attr("stroke", "white").attr("stroke-width", 0.5).attr("opacity", 0.5);

  // Major-grid pattern: gridSpacing x gridSpacing tile.
  const majorPattern = defs.append("pattern")
    .attr("id", MAJOR_PATTERN_ID)
    .attr("x", ((state.centerX % state.gridSpacing) + state.gridSpacing) % state.gridSpacing)
    .attr("y", ((state.centerY % state.gridSpacing) + state.gridSpacing) % state.gridSpacing)
    .attr("width",  state.gridSpacing)
    .attr("height", state.gridSpacing)
    .attr("patternUnits", "userSpaceOnUse");
  majorPattern.append("line")
    .attr("x1", state.gridSpacing).attr("y1", 0)
    .attr("x2", state.gridSpacing).attr("y2", state.gridSpacing)
    .attr("stroke", "white").attr("stroke-width", 1).attr("opacity", 0.8);
  majorPattern.append("line")
    .attr("x1", 0).attr("y1", state.gridSpacing)
    .attr("x2", state.gridSpacing).attr("y2", state.gridSpacing)
    .attr("stroke", "white").attr("stroke-width", 1).attr("opacity", 0.8);

  // Two large rects filled with the tiling patterns
  state.gridGroup.append("rect")
    .attr("x", -GRID_EXTENT).attr("y", -GRID_EXTENT)
    .attr("width", 2 * GRID_EXTENT).attr("height", 2 * GRID_EXTENT)
    .attr("fill", `url(#${MINOR_PATTERN_ID})`);
  state.gridGroup.append("rect")
    .attr("x", -GRID_EXTENT).attr("y", -GRID_EXTENT)
    .attr("width", 2 * GRID_EXTENT).attr("height", 2 * GRID_EXTENT)
    .attr("fill", `url(#${MAJOR_PATTERN_ID})`);
}
