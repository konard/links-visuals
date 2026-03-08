// drawSceneOnCanvas — raster fallback renderer for canvas mode.
// Draws the full scene (grid, path with markers, control circles) each frame.
// Matches the SVG mode appearance as closely as possible.

import * as state from './state.mjs';
import { strokeFraction } from './constants.mjs';
import { vecAdd, vecSub, vecScale, offsetPoint } from './geometry.mjs';

// drawCrossMarker — draws the cross-hair tick at the path start on canvas.
// `x, y`     — attachment point (path start)
// `angle`    — path tangent angle at start (radians)
// `markerBox` — marker box size in world units (same as SVG markerWidth)
// `lineW`    — stroke-width of the marker lines in world units
function drawCrossMarker(ctx, x, y, angle, markerBox, lineW) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Map viewBox (0-100) to marker box (0-markerBox), with refX=50 offset
  const scale = markerBox / 100;
  const ox = -50 * scale; // refX=50 → shift so refX maps to origin
  const oy = -50 * scale; // refY=50 → shift so refY maps to origin

  const x1 = (62.5 - (12.5 - 12.5/1.618)) * scale + ox;
  const y1 = (25 + 14.5 - 0.23)            * scale + oy;
  const y2 = (75 - 14.5 + 0.23)            * scale + oy;

  ctx.strokeStyle = "black";
  ctx.lineWidth   = lineW;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1, y2);
  ctx.stroke();
  ctx.restore();
}

// drawArrowMarker — draws the double-arm arrowhead at the path end on canvas.
// `x, y`     — attachment point (path end)
// `angle`    — path tangent angle at end (radians, pointing in path direction)
// `markerBox` — marker box size in world units
// `lineW`    — stroke-width of the marker lines in world units
function drawArrowMarker(ctx, x, y, angle, markerBox, lineW) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const scale = markerBox / 100;
  const ox = -10 * scale; // refX=10 → shift so refX maps to origin
  const oy = -50 * scale; // refY=50 → shift so refY maps to origin

  ctx.strokeStyle = "black";
  ctx.lineWidth   = lineW;

  // Upper arm: (10.35, 50.35) → (−0.35, 39.65)
  ctx.beginPath();
  ctx.moveTo((10 + 0.35) * scale + ox, (50 + 0.35) * scale + oy);
  ctx.lineTo((0  - 0.35) * scale + ox, (40 - 0.35) * scale + oy);
  ctx.stroke();

  // Lower arm: (10.35, 49.65) → (−0.35, 60.35)
  ctx.beginPath();
  ctx.moveTo((10 + 0.35) * scale + ox, (50 - 0.35) * scale + oy);
  ctx.lineTo((0  - 0.35) * scale + ox, (60 + 0.35) * scale + oy);
  ctx.stroke();

  ctx.restore();
}

export function drawSceneOnCanvas() {
  const canvasEl = document.getElementById("render-canvas");
  const ctx      = canvasEl.getContext("2d");

  ctx.clearRect(0, 0, state.width, state.height);

  // Background fill
  ctx.fillStyle = "#E0F7FA";
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.translate(state.canvasOffsetX, state.canvasOffsetY);
  ctx.scale(state.canvasScale, state.canvasScale);

  // Compute world-space bounds of the visible viewport
  const worldLeft   = (0             - state.canvasOffsetX) / state.canvasScale;
  const worldRight  = (state.width   - state.canvasOffsetX) / state.canvasScale;
  const worldTop    = (0             - state.canvasOffsetY) / state.canvasScale;
  const worldBottom = (state.height  - state.canvasOffsetY) / state.canvasScale;

  // Minor grid — draw only visible lines
  const firstMinorX = state.cx + Math.floor((worldLeft  - state.cx) / state.halfSpacing) * state.halfSpacing;
  const firstMinorY = state.cy + Math.floor((worldTop    - state.cy) / state.halfSpacing) * state.halfSpacing;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth   = 0.5 / state.canvasScale;

  for (let x = firstMinorX; x <= worldRight + state.halfSpacing; x += state.halfSpacing) {
    if (Math.abs(((x - state.cx) % state.gridSpacing + state.gridSpacing) % state.gridSpacing) > 0.1 &&
        Math.abs(((x - state.cx) % state.gridSpacing + state.gridSpacing) % state.gridSpacing - state.gridSpacing) > 0.1) {
      ctx.beginPath();
      ctx.moveTo(x, worldTop    - state.halfSpacing);
      ctx.lineTo(x, worldBottom + state.halfSpacing);
      ctx.stroke();
    }
  }
  for (let y = firstMinorY; y <= worldBottom + state.halfSpacing; y += state.halfSpacing) {
    if (Math.abs(((y - state.cy) % state.gridSpacing + state.gridSpacing) % state.gridSpacing) > 0.1 &&
        Math.abs(((y - state.cy) % state.gridSpacing + state.gridSpacing) % state.gridSpacing - state.gridSpacing) > 0.1) {
      ctx.beginPath();
      ctx.moveTo(worldLeft  - state.halfSpacing, y);
      ctx.lineTo(worldRight + state.halfSpacing, y);
      ctx.stroke();
    }
  }

  // Major grid
  const firstMajorX = state.cx + Math.floor((worldLeft - state.cx) / state.gridSpacing) * state.gridSpacing;
  const firstMajorY = state.cy + Math.floor((worldTop  - state.cy) / state.gridSpacing) * state.gridSpacing;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth   = 1 / state.canvasScale;

  for (let x = firstMajorX; x <= worldRight + state.gridSpacing; x += state.gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, worldTop    - state.gridSpacing);
    ctx.lineTo(x, worldBottom + state.gridSpacing);
    ctx.stroke();
  }
  for (let y = firstMajorY; y <= worldBottom + state.gridSpacing; y += state.gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(worldLeft  - state.gridSpacing, y);
    ctx.lineTo(worldRight + state.gridSpacing, y);
    ctx.stroke();
  }

  // Spline path
  const last        = state.points.length - 1;
  const startOffset = state.startOffsetFraction * state.gridSpacing;
  const endOffset   = state.endOffsetFraction   * state.gridSpacing;
  const geomStart   = offsetPoint(state.points[0],   state.points[1],      startOffset);
  const geomEnd     = offsetPoint(state.points[last], state.points[last-1], endOffset);
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

  const sw = strokeFraction * state.gridSpacing;
  ctx.strokeStyle = "black";
  ctx.lineWidth   = sw;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0  = pts[i], p1 = pts[i+1];
    const cp1 = vecAdd(p0, vecScale(tangents[i],   1/3));
    const cp2 = vecSub(p1, vecScale(tangents[i+1], 1/3));
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p1.x, p1.y);
  }
  ctx.stroke();

  // Draw markers — same proportions as the SVG markers.
  // markerBox = 6 × strokeWidth (matching markers.mjs sizing).
  const markerBox = 6 * sw;
  const lineW     = sw;  // marker line weight = path stroke-width

  // Tangent angle at the path start (from pts[0] toward pts[1])
  const t0 = tangents[0];
  const startAngle = Math.atan2(t0.y, t0.x);
  drawCrossMarker(ctx, pts[0].x, pts[0].y, startAngle, markerBox, lineW);

  // Tangent angle at the path end (from pts[last-1] toward pts[last])
  const tN = tangents[last];
  const endAngle = Math.atan2(tN.y, tN.x);
  drawArrowMarker(ctx, pts[last].x, pts[last].y, endAngle, markerBox, lineW);

  // Control circles
  state.points.forEach(p => {
    const strokeColor =
      p.type === "center"   ? "black"  :
      p.type === "endpoint" ? (p.id === "start" ? "green" : "red") :
      "blue";
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = 1.5 / state.canvasScale;
    ctx.setLineDash([4 / state.canvasScale, 2 / state.canvasScale]);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, state.circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();
}
