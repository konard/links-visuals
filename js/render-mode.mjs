// setRenderMode — switches between SVG vector and Canvas raster rendering.

import * as state from './state.mjs';
import { initCanvasElementEvents } from './zoom-pan.mjs';

export function setRenderMode(mode) {
  state.setRenderModeState(mode);
  const renderSVGButton    = document.getElementById("renderSVGBtn");
  const renderCanvasButton = document.getElementById("renderCanvasBtn");
  const canvasElement      = document.getElementById("render-canvas");

  if (mode === 'svg') {
    state.svgElement.style.display  = 'block';
    canvasElement.style.display     = 'none';
    renderSVGButton.classList.add('active');
    renderCanvasButton.classList.remove('active');
  } else {
    state.svgElement.style.display  = 'none';
    canvasElement.style.display     = 'block';
    renderSVGButton.classList.remove('active');
    renderCanvasButton.classList.add('active');
    initCanvasElementEvents(canvasElement);
  }
}
