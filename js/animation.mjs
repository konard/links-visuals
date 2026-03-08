// startAnimationLoop — runs the requestAnimationFrame loop at ≈ 60 fps.
// Updates IK, refreshes SVG circles/path, and triggers canvas redraws.

import * as state from './state.mjs';
import { updateIntermediateViaIK } from './ik.mjs';
import { updatePath } from './path.mjs';
import { drawSceneOnCanvas } from './canvas-render.mjs';

export function startAnimationLoop() {
  (function loop() {
    updateIntermediateViaIK();
    if (state.animationEnabled) {
      if (state.circles) state.circles.data(state.points).attr("cx", d => d.x).attr("cy", d => d.y);
      updatePath();
    }
    if (state.renderMode === 'canvas') {
      drawSceneOnCanvas();
    }
    requestAnimationFrame(loop);
  })();
}
