// SVG setup — creates the SVG element, scene/grid/geometry groups.
// applyCanvasTransform — updates the scene group's SVG transform attribute.
// screenToWorld — converts screen (client) coordinates to world coordinates.

import * as state from './state.mjs';

// d3 is injected at init time (loaded via use-m).
let _d3 = null;
export function setD3(d3) { _d3 = d3; }

export function initSVG() {
  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // Allow marker content to render outside the SVG viewport (no hard clipping).
  svgEl.setAttribute("overflow", "visible");
  const svg = _d3.select("body").append(() => svgEl);

  // Create a single <defs> element shared by markers and grid patterns.
  svg.append("defs");

  // sceneGroup: all visible geometry lives here.
  // The world pan/zoom transform is applied as an SVG attribute so the
  // browser renders everything as crisp vectors at any zoom level.
  const sceneGroup    = svg.append("g").attr("class", "scene");
  const gridGroup     = sceneGroup.append("g").attr("class", "grid");
  const geometryGroup = sceneGroup.append("g").attr("class", "geometry");

  state.setSvgEl(svgEl);
  state.setSvg(svg);
  state.setSceneGroup(sceneGroup);
  state.setGridGroup(gridGroup);
  state.setGeometryGroup(geometryGroup);
}

export function applyCanvasTransform() {
  state.sceneGroup.attr("transform",
    `translate(${state.canvasOffsetX},${state.canvasOffsetY}) scale(${state.canvasScale})`);
}

export function screenToWorld(clientX, clientY) {
  return {
    x: (clientX - state.canvasOffsetX) / state.canvasScale,
    y: (clientY - state.canvasOffsetY) / state.canvasScale
  };
}
