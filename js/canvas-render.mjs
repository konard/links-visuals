// drawSceneOnCanvas — raster fallback renderer for canvas mode.
// Draws the full scene (grid, path with markers, control circles) each frame.
// Matches the SVG mode appearance as closely as possible.

import * as state from './state.mjs';
import { strokeFraction } from './constants.mjs';
import { vectorAdd, vectorSubtract, vectorScale, offsetPoint } from './geometry.mjs';

// drawCrossMarker — draws the cross-hair tick at the path start on canvas.
// Replicates the SVG marker with viewBox="0 0 100 100", markerWidth=100,
// markerUnits="strokeWidth": the marker box is 100 × strokeWidth.
function drawCrossMarker(context, positionX, positionY, angle, markerBox) {
  context.save();
  context.translate(positionX, positionY);
  context.rotate(angle);
  // Map viewBox (0-100) to marker box (0-markerBox), with refX=50, refY=50 offset
  const scale = markerBox / 100;
  const offsetX = -50 * scale;
  const offsetY = -50 * scale;

  const lineX = (62.5 - (12.5 - 12.5/1.618)) * scale + offsetX;
  const lineY1 = (25 + 14.5 - 0.23) * scale + offsetY;
  const lineY2 = (75 - 14.5 + 0.23) * scale + offsetY;

  context.strokeStyle = "black";
  context.lineWidth   = 1 * scale; // default SVG stroke-width is 1 in viewBox units
  context.beginPath();
  context.moveTo(lineX, lineY1);
  context.lineTo(lineX, lineY2);
  context.stroke();
  context.restore();
}

// drawArrowMarker — draws the double-arm arrowhead at the path end on canvas.
function drawArrowMarker(context, positionX, positionY, angle, markerBox) {
  context.save();
  context.translate(positionX, positionY);
  context.rotate(angle);
  const scale = markerBox / 100;
  const offsetX = -10 * scale; // refX=10
  const offsetY = -50 * scale; // refY=50

  context.strokeStyle = "black";
  context.lineWidth   = 1 * scale;

  // Upper arm: (10.35, 50.35) → (−0.35, 39.65)
  context.beginPath();
  context.moveTo((10 + 0.35) * scale + offsetX, (50 + 0.35) * scale + offsetY);
  context.lineTo((0  - 0.35) * scale + offsetX, (40 - 0.35) * scale + offsetY);
  context.stroke();

  // Lower arm: (10.35, 49.65) → (−0.35, 60.35)
  context.beginPath();
  context.moveTo((10 + 0.35) * scale + offsetX, (50 - 0.35) * scale + offsetY);
  context.lineTo((0  - 0.35) * scale + offsetX, (60 + 0.35) * scale + offsetY);
  context.stroke();

  context.restore();
}

export function drawSceneOnCanvas() {
  const canvasElement = document.getElementById("render-canvas");
  const context       = canvasElement.getContext("2d");

  context.clearRect(0, 0, state.width, state.height);

  // Background fill
  context.fillStyle = "#E0F7FA";
  context.fillRect(0, 0, state.width, state.height);

  context.save();
  context.translate(state.canvasOffsetX, state.canvasOffsetY);
  context.scale(state.canvasScale, state.canvasScale);

  // Compute world-space bounds of the visible viewport
  const worldLeft   = (0             - state.canvasOffsetX) / state.canvasScale;
  const worldRight  = (state.width   - state.canvasOffsetX) / state.canvasScale;
  const worldTop    = (0             - state.canvasOffsetY) / state.canvasScale;
  const worldBottom = (state.height  - state.canvasOffsetY) / state.canvasScale;

  // Minor grid — draw only visible lines
  const firstMinorX = state.centerX + Math.floor((worldLeft  - state.centerX) / state.halfSpacing) * state.halfSpacing;
  const firstMinorY = state.centerY + Math.floor((worldTop    - state.centerY) / state.halfSpacing) * state.halfSpacing;
  context.strokeStyle = "rgba(255,255,255,0.5)";
  context.lineWidth   = 0.5 / state.canvasScale;

  for (let gridX = firstMinorX; gridX <= worldRight + state.halfSpacing; gridX += state.halfSpacing) {
    if (Math.abs(((gridX - state.centerX) % state.gridSpacing + state.gridSpacing) % state.gridSpacing) > 0.1 &&
        Math.abs(((gridX - state.centerX) % state.gridSpacing + state.gridSpacing) % state.gridSpacing - state.gridSpacing) > 0.1) {
      context.beginPath();
      context.moveTo(gridX, worldTop    - state.halfSpacing);
      context.lineTo(gridX, worldBottom + state.halfSpacing);
      context.stroke();
    }
  }
  for (let gridY = firstMinorY; gridY <= worldBottom + state.halfSpacing; gridY += state.halfSpacing) {
    if (Math.abs(((gridY - state.centerY) % state.gridSpacing + state.gridSpacing) % state.gridSpacing) > 0.1 &&
        Math.abs(((gridY - state.centerY) % state.gridSpacing + state.gridSpacing) % state.gridSpacing - state.gridSpacing) > 0.1) {
      context.beginPath();
      context.moveTo(worldLeft  - state.halfSpacing, gridY);
      context.lineTo(worldRight + state.halfSpacing, gridY);
      context.stroke();
    }
  }

  // Major grid
  const firstMajorX = state.centerX + Math.floor((worldLeft - state.centerX) / state.gridSpacing) * state.gridSpacing;
  const firstMajorY = state.centerY + Math.floor((worldTop  - state.centerY) / state.gridSpacing) * state.gridSpacing;
  context.strokeStyle = "rgba(255,255,255,0.8)";
  context.lineWidth   = 1 / state.canvasScale;

  for (let gridX = firstMajorX; gridX <= worldRight + state.gridSpacing; gridX += state.gridSpacing) {
    context.beginPath();
    context.moveTo(gridX, worldTop    - state.gridSpacing);
    context.lineTo(gridX, worldBottom + state.gridSpacing);
    context.stroke();
  }
  for (let gridY = firstMajorY; gridY <= worldBottom + state.gridSpacing; gridY += state.gridSpacing) {
    context.beginPath();
    context.moveTo(worldLeft  - state.gridSpacing, gridY);
    context.lineTo(worldRight + state.gridSpacing, gridY);
    context.stroke();
  }

  // Spline path
  const last        = state.points.length - 1;
  const startOffset = state.startOffsetFraction * state.gridSpacing;
  const endOffset   = state.endOffsetFraction   * state.gridSpacing;
  const geometryStart = offsetPoint(state.points[0],   state.points[1],      startOffset);
  const geometryEnd   = offsetPoint(state.points[last], state.points[last-1], endOffset);
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

  const strokeWidth = strokeFraction * state.gridSpacing;
  context.strokeStyle = "black";
  context.lineWidth   = strokeWidth;
  context.setLineDash([]);
  context.beginPath();
  context.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let index = 0; index < pathPoints.length - 1; index++) {
    const currentPoint = pathPoints[index], nextPoint = pathPoints[index+1];
    const controlPoint1 = vectorAdd(currentPoint, vectorScale(tangents[index],   1/3));
    const controlPoint2 = vectorSubtract(nextPoint, vectorScale(tangents[index+1], 1/3));
    context.bezierCurveTo(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, nextPoint.x, nextPoint.y);
  }
  context.stroke();

  // Draw markers — same proportions as SVG markers.
  // SVG uses markerUnits="strokeWidth" with markerWidth=100,
  // so the marker box in pixels = 100 × strokeWidth.
  const markerBox = 100 * strokeWidth;

  // Tangent angle at the path start
  const startTangent = tangents[0];
  const startAngle = Math.atan2(startTangent.y, startTangent.x);
  drawCrossMarker(context, pathPoints[0].x, pathPoints[0].y, startAngle, markerBox);

  // Tangent angle at the path end
  const endTangent = tangents[last];
  const endAngle = Math.atan2(endTangent.y, endTangent.x);
  drawArrowMarker(context, pathPoints[last].x, pathPoints[last].y, endAngle, markerBox);

  // Control circles
  state.points.forEach(point => {
    const strokeColor =
      point.type === "center"   ? "black"  :
      point.type === "endpoint" ? (point.id === "start" ? "green" : "red") :
      "blue";
    context.save();
    context.strokeStyle = strokeColor;
    context.lineWidth   = 1.5 / state.canvasScale;
    context.setLineDash([4 / state.canvasScale, 2 / state.canvasScale]);
    context.fillStyle = "rgba(0,0,0,0)";
    context.beginPath();
    context.arc(point.x, point.y, state.circleRadius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  });

  context.restore();
}
