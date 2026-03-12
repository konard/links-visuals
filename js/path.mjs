// updatePath — rebuilds the SVG main path from current point positions.
// Uses Catmull-Rom spline converted to cubic Beziers, with start/end offsets.

import * as state from './state.mjs';
import { vectorAdd, vectorSubtract, vectorScale, offsetPoint } from './geometry.mjs';
import { updateHUD } from './hud.mjs';

export function updatePath() {
  const last        = state.points.length - 1;
  const startOffset = state.startOffsetFraction * state.gridSpacing;
  const endOffset   = state.endOffsetFraction   * state.gridSpacing;
  const geometryStart = offsetPoint(state.points[0],    state.points[1],      startOffset);
  const geometryEnd   = offsetPoint(state.points[last],  state.points[last-1], endOffset);

  const pathPoints = state.points.map((point, index) =>
    index === 0    ? { ...point, x: geometryStart.x, y: geometryStart.y } :
    index === last ? { ...point, x: geometryEnd.x,   y: geometryEnd.y   } :
    point
  );

  const tangents = pathPoints.map((point, index) => {
    if (index === 0)                    return vectorSubtract(pathPoints[1], pathPoints[0]);
    if (index === pathPoints.length-1)  return vectorSubtract(pathPoints[index], pathPoints[index-1]);
    return vectorScale(vectorSubtract(pathPoints[index+1], pathPoints[index-1]), 0.5);
  });

  let pathData = `M ${pathPoints[0].x} ${pathPoints[0].y} `;
  for (let index = 0; index < pathPoints.length - 1; index++) {
    const currentPoint = pathPoints[index], nextPoint = pathPoints[index+1];
    const controlPoint1 = vectorAdd(currentPoint, vectorScale(tangents[index],   1/3));
    const controlPoint2 = vectorSubtract(nextPoint, vectorScale(tangents[index+1], 1/3));
    pathData += `C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${nextPoint.x} ${nextPoint.y} `;
  }

  state.mainPath.attr("d", pathData);
  updateHUD();
}
