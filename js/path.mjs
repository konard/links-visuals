// updatePath — rebuilds the SVG main path from current point positions.
// Uses Catmull-Rom spline converted to cubic Béziers, with start/end offsets.

import * as state from './state.mjs';
import { vecAdd, vecSub, vecScale, offsetPoint } from './geometry.mjs';
import { updateHUD } from './hud.mjs';

export function updatePath() {
  const last        = state.points.length - 1;
  const startOffset = state.startOffsetFraction * state.gridSpacing;
  const endOffset   = state.endOffsetFraction   * state.gridSpacing;
  const geomStart   = offsetPoint(state.points[0],    state.points[1],      startOffset);
  const geomEnd     = offsetPoint(state.points[last],  state.points[last-1], endOffset);

  const pts = state.points.map((p, i) =>
    i === 0    ? { ...p, x: geomStart.x, y: geomStart.y } :
    i === last ? { ...p, x: geomEnd.x,   y: geomEnd.y   } :
    p
  );

  const tangents = pts.map((p, i) => {
    if (i === 0)            return vecSub(pts[1], pts[0]);
    if (i === pts.length-1) return vecSub(pts[i], pts[i-1]);
    return vecScale(vecSub(pts[i+1], pts[i-1]), 0.5);
  });

  let d = `M ${pts[0].x} ${pts[0].y} `;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0  = pts[i], p1 = pts[i+1];
    const cp1 = vecAdd(p0, vecScale(tangents[i],   1/3));
    const cp2 = vecSub(p1, vecScale(tangents[i+1], 1/3));
    d += `C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p1.x} ${p1.y} `;
  }

  state.mainPath.attr("d", d);
  updateHUD();
}
