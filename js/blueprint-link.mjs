// Blueprint-style link helpers used by grid.html.
// The single-link pages keep their existing code unchanged; this module gives
// grid links one source of truth for the same proportions and marker geometry.

import {
  IK_SEG_COUNT,
  radiusFraction,
  sideTolFraction,
  snapFraction,
  strokeFraction,
} from './constants.mjs';
import { vectorAdd, vectorSubtract, vectorScale, offsetPoint } from './geometry.mjs';
import { computeIntermediatePoints } from './ik-pure.mjs';

export const START_OFFSET_FRACTION = 0.10;
export const END_OFFSET_FRACTION = 0.16;

// Control-point outline style, identical to blueprint.html / control-points.mjs:
// a 1px dashed stroke. These are intentionally fixed (not scaled by gridSpacing)
// so a grid link renders exactly like a blueprint link does at the same spacing.
export const CONTROL_POINT_STROKE_WIDTH = 1;
export const CONTROL_POINT_DASH_ARRAY = '4 2';

// Fixed semantic colors for control points, identical to blueprint.html.
// The per-link color only ever applies to the link itself (path + markers).
export const CONTROL_POINT_COLORS = {
  start: 'green',
  end: 'red',
  center: 'black',
  intermediate: 'blue',
};

export function createBlueprintMetrics(gridSpacing) {
  return {
    gridSpacing,
    halfSpacing: gridSpacing / 2,
    snapThreshold: snapFraction * gridSpacing,
    circleRadius: radiusFraction * gridSpacing,
    segmentLength: gridSpacing,
    maximumReach: IK_SEG_COUNT * gridSpacing,
    sideTolerance: sideTolFraction * gridSpacing,
    strokeWidth: strokeFraction * gridSpacing,
    cpStrokeWidth: CONTROL_POINT_STROKE_WIDTH,
    cpDashArray: CONTROL_POINT_DASH_ARRAY,
  };
}

export function computeBlueprintLinkPoints(link, metrics) {
  const ik = computeIntermediatePoints(
    link.center,
    link.start,
    link.end,
    metrics.segmentLength,
    metrics.maximumReach,
    metrics.sideTolerance,
    link.preferRight,
    link.preferLeft
  );

  return {
    preferRight: ik.preferRight,
    preferLeft: ik.preferLeft,
    points: [
      link.start, ik.p1, ik.p2, ik.p3,
      link.center,
      ik.p4, ik.p5, ik.p6,
      link.end,
    ],
  };
}

export function buildBlueprintPathData(
  points,
  gridSpacing,
  startOffsetFraction = START_OFFSET_FRACTION,
  endOffsetFraction = END_OFFSET_FRACTION
) {
  const last = points.length - 1;
  const startOffset = startOffsetFraction * gridSpacing;
  const endOffset = endOffsetFraction * gridSpacing;
  const geometryStart = offsetPoint(points[0], points[1], startOffset);
  const geometryEnd = offsetPoint(points[last], points[last - 1], endOffset);

  const pathPoints = points.map((point, index) =>
    index === 0 ? { ...point, x: geometryStart.x, y: geometryStart.y } :
    index === last ? { ...point, x: geometryEnd.x, y: geometryEnd.y } :
    point
  );

  const tangents = pathPoints.map((point, index) => {
    if (index === 0) return vectorSubtract(pathPoints[1], pathPoints[0]);
    if (index === pathPoints.length - 1) return vectorSubtract(pathPoints[index], pathPoints[index - 1]);
    return vectorScale(vectorSubtract(pathPoints[index + 1], pathPoints[index - 1]), 0.5);
  });

  let pathData = `M ${pathPoints[0].x} ${pathPoints[0].y} `;
  for (let index = 0; index < pathPoints.length - 1; index++) {
    const currentPoint = pathPoints[index];
    const nextPoint = pathPoints[index + 1];
    const controlPoint1 = vectorAdd(currentPoint, vectorScale(tangents[index], 1 / 3));
    const controlPoint2 = vectorSubtract(nextPoint, vectorScale(tangents[index + 1], 1 / 3));
    pathData += `C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${nextPoint.x} ${nextPoint.y} `;
  }
  return pathData;
}

export function appendBlueprintEndpointMarkers(defs, { crossId, arrowId, color }) {
  defs.append("marker")
    .attr("id", crossId)
    .attr("viewBox", "0 0 100 100")
    .attr("markerWidth", 100)
    .attr("markerHeight", 100)
    .attr("refX", 50)
    .attr("refY", 50)
    .attr("orient", "auto")
    .append("g")
    .call(group => {
      group.append("line")
        .attr("x1", 62.5 - (12.5 - 12.5 / 1.618))
        .attr("y1", 25 + 14.5 - 0.23)
        .attr("x2", 62.5 - (12.5 - 12.5 / 1.618))
        .attr("y2", 75 - 14.5 + 0.23)
        .attr("stroke", color);
    });

  defs.append("marker")
    .attr("id", arrowId)
    .attr("viewBox", "0 0 100 100")
    .attr("markerWidth", 100)
    .attr("markerHeight", 100)
    .attr("refX", 10)
    .attr("refY", 50)
    .attr("orient", "auto")
    .append("g")
    .call(group => {
      group.append("line")
        .attr("x1", 10 + 0.35)
        .attr("y1", 50 + 0.35)
        .attr("x2", 0 - 0.35)
        .attr("y2", 40 - 0.35)
        .attr("stroke", color);
      group.append("line")
        .attr("x1", 10 + 0.35)
        .attr("y1", 50 - 0.35)
        .attr("x2", 0 - 0.35)
        .attr("y2", 60 + 0.35)
        .attr("stroke", color);
    });
}
