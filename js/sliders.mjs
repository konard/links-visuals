// initSliders — manages the start/end offset sliders and render mode buttons.

import * as state from './state.mjs';
import { updatePath } from './path.mjs';
import { setRenderMode } from './render-mode.mjs';

export function initSliders() {
  const startOffsetSlider = document.getElementById("startOffsetSlider");
  const endOffsetSlider   = document.getElementById("endOffsetSlider");
  const startOffsetVal    = document.getElementById("startOffsetVal");
  const endOffsetVal      = document.getElementById("endOffsetVal");
  const renderSVGBtn      = document.getElementById("renderSVGBtn");
  const renderCanvasBtn   = document.getElementById("renderCanvasBtn");

  startOffsetSlider.addEventListener("input", () => {
    state.setStartOffsetFraction(+startOffsetSlider.value);
    startOffsetVal.textContent = state.startOffsetFraction.toFixed(2);
    updatePath();
  });

  endOffsetSlider.addEventListener("input", () => {
    state.setEndOffsetFraction(+endOffsetSlider.value);
    endOffsetVal.textContent = state.endOffsetFraction.toFixed(2);
    updatePath();
  });

  renderSVGBtn.addEventListener("click",    () => setRenderMode('svg'));
  renderCanvasBtn.addEventListener("click", () => setRenderMode('canvas'));
}
