// SVG setup — creates the SVG element and the grid group.
// applyCanvasTransform — applies CSS transform on the SVG element (pan/zoom).
// screenToWorld — converts screen (client) coordinates to SVG-local coordinates.
//
// IMPORTANT: The canvas pan/zoom is applied as a CSS transform on the SVG
// element itself (translateX/Y + scale), NOT as an SVG group transform.
// This matches the reference implementation and ensures markers render
// correctly relative to the path stroke at any zoom level.

import * as state from './state.mjs';

// d3 is injected at init time (loaded via use-m).
let _d3 = null;
export function setD3(d3) { _d3 = d3; }

export function initSVG() {
  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const svg = _d3.select("body").append(() => svgEl);

  // overflow:visible allows the grid pattern rect (which extends ±1e6 in SVG
  // user space) to paint beyond the SVG element's width/height boundary.
  // Without this, the outermost SVG element defaults to overflow:hidden (per
  // SVG spec §14.3.3), which clips the grid to the SVG viewport before the
  // CSS pan/zoom transform is applied — making the grid appear finite.
  svg.attr("overflow", "visible");

  // pointer-events:all ensures the SVG element receives wheel/mouse/touch
  // events everywhere on the infinite grid, not just where painted content
  // (path, circles) exists. The default SVG pointer-events value is
  // "visiblePainted", which only fires events over painted pixels — leaving
  // the empty space between grid lines unresponsive to zoom/pan gestures.
  svg.style("pointer-events", "all");

  // defs for markers
  svg.append("defs");

  const gridGroup = svg.insert("g", ":first-child").attr("class", "grid");

  state.setSvgEl(svgEl);
  state.setSvg(svg);
  state.setGridGroup(gridGroup);
}

export function applyCanvasTransform() {
  // CSS transform on the SVG element — keeps markers crisp and correctly sized.
  state.svg.style("transform",
    `translate(${state.canvasOffsetX}px, ${state.canvasOffsetY}px) scale(${state.canvasScale})`);
  state.svg.style("transform-origin", "0 0");
}

export function screenToWorld(clientX, clientY) {
  return {
    x: (clientX - state.canvasOffsetX) / state.canvasScale,
    y: (clientY - state.canvasOffsetY) / state.canvasScale
  };
}
