// drawGrid — infinite background grid using SVG pattern tiles.
// Uses two <pattern> elements (minor + major) to tile grid lines across a
// large <rect>.  Panning/zooming moves the pattern naturally; the pattern is
// rebuilt only on resize.

import * as state from './state.mjs';
import { GRID_EXTENT, MINOR_PATTERN_ID, MAJOR_PATTERN_ID } from './constants.mjs';

export function drawGrid() {
  state.gridGroup.selectAll("*").remove();

  // Remove any previously defined grid patterns from <defs>
  const defs = state.svg.select("defs");
  defs.select("#" + MINOR_PATTERN_ID).remove();
  defs.select("#" + MAJOR_PATTERN_ID).remove();

  // Minor-grid pattern: halfSpacing × halfSpacing tile.
  const minorPat = defs.append("pattern")
    .attr("id", MINOR_PATTERN_ID)
    .attr("x", ((state.cx % state.halfSpacing) + state.halfSpacing) % state.halfSpacing)
    .attr("y", ((state.cy % state.halfSpacing) + state.halfSpacing) % state.halfSpacing)
    .attr("width",  state.halfSpacing)
    .attr("height", state.halfSpacing)
    .attr("patternUnits", "userSpaceOnUse");
  minorPat.append("line")
    .attr("x1", state.halfSpacing).attr("y1", 0)
    .attr("x2", state.halfSpacing).attr("y2", state.halfSpacing)
    .attr("stroke", "white").attr("stroke-width", 0.5).attr("opacity", 0.5);
  minorPat.append("line")
    .attr("x1", 0).attr("y1", state.halfSpacing)
    .attr("x2", state.halfSpacing).attr("y2", state.halfSpacing)
    .attr("stroke", "white").attr("stroke-width", 0.5).attr("opacity", 0.5);

  // Major-grid pattern: gridSpacing × gridSpacing tile.
  const majorPat = defs.append("pattern")
    .attr("id", MAJOR_PATTERN_ID)
    .attr("x", ((state.cx % state.gridSpacing) + state.gridSpacing) % state.gridSpacing)
    .attr("y", ((state.cy % state.gridSpacing) + state.gridSpacing) % state.gridSpacing)
    .attr("width",  state.gridSpacing)
    .attr("height", state.gridSpacing)
    .attr("patternUnits", "userSpaceOnUse");
  majorPat.append("line")
    .attr("x1", state.gridSpacing).attr("y1", 0)
    .attr("x2", state.gridSpacing).attr("y2", state.gridSpacing)
    .attr("stroke", "white").attr("stroke-width", 1).attr("opacity", 0.8);
  majorPat.append("line")
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
