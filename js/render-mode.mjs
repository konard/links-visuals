// setRenderMode — switches between SVG vector and Canvas raster rendering.

import * as state from './state.mjs';
import { initCanvasElementEvents } from './zoom-pan.mjs';

export function setRenderMode(mode) {
  state.setRenderModeState(mode);
  const renderSVGBtn    = document.getElementById("renderSVGBtn");
  const renderCanvasBtn = document.getElementById("renderCanvasBtn");
  const canvasEl        = document.getElementById("render-canvas");

  if (mode === 'svg') {
    state.svgEl.style.display  = 'block';
    canvasEl.style.display     = 'none';
    renderSVGBtn.classList.add('active');
    renderCanvasBtn.classList.remove('active');
  } else {
    state.svgEl.style.display  = 'none';
    canvasEl.style.display     = 'block';
    renderSVGBtn.classList.remove('active');
    renderCanvasBtn.classList.add('active');
    initCanvasElementEvents(canvasEl);
  }
}
