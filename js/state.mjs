// Shared mutable state for the animated-blueprint.
// All modules import from this file to read/write shared state.

// ---- Viewport / grid geometry (updated by resize()) ----
export let width          = 0;
export let height         = 0;
export let centerX        = 0;   // horizontal centre
export let centerY        = 0;   // vertical centre
export let gridSpacing    = 0;
export let halfSpacing    = 0;
export let snapThreshold  = 20;
export let circleRadius   = 24;

// ---- IK geometry (updated by resize()) ----
export let segmentLength   = 100;
export let maximumReach    = 400;
export let sideTolerance   = 0.1;

// ---- Canvas zoom / pan transform ----
export let canvasScale    = 1;
export let canvasOffsetX  = 0;
export let canvasOffsetY  = 0;

// ---- Render mode ----
export let renderMode = 'svg';

// ---- Link geometry offsets ----
export let startOffsetFraction = 0.10;
export let endOffsetFraction   = 0.16;

// ---- SVG scene objects ----
export let svgElement    = null;
export let svgSelection  = null;
export let gridGroup     = null;
export let mainPath      = null;
export let circles       = null;

// ---- Control points ----
export const points = [
  { id:"start",  xFactor:-4, initialFactor:-4, yFactor:0, type:"endpoint",    draggable:true,  z:7 },
  { id:"p1",     xFactor:-3, initialFactor:-3, yFactor:0, type:"intermediate",draggable:false, z:1 },
  { id:"p2",     xFactor:-2, initialFactor:-2, yFactor:0, type:"intermediate",draggable:false, z:2 },
  { id:"p3",     xFactor:-1, initialFactor:-1, yFactor:0, type:"intermediate",draggable:false, z:3 },
  { id:"center", xFactor: 0, initialFactor: 0, yFactor:0, type:"center",      draggable:false, z:0 },
  { id:"p4",     xFactor: 1, initialFactor: 1, yFactor:0, type:"intermediate",draggable:false, z:4 },
  { id:"p5",     xFactor: 2, initialFactor: 2, yFactor:0, type:"intermediate",draggable:false, z:5 },
  { id:"p6",     xFactor: 3, initialFactor: 3, yFactor:0, type:"intermediate",draggable:false, z:6 },
  { id:"end",    xFactor: 4, initialFactor: 4, yFactor:0, type:"endpoint",    draggable:true,  z:8 }
];
export const byId = Object.fromEntries(points.map(point => [point.id, point]));

// ---- IK animation state ----
export let animationEnabled = false;
export let preferLeft       = 0;
export let preferRight      = 0;

// ---- Canvas events ----
export let canvasEventsAttached = false;

// ---- Pan state ----
export let isPanning          = false;
export let panStartX          = 0;
export let panStartY          = 0;
export let panOffsetStartX    = 0;
export let panOffsetStartY    = 0;

// ---- Touch state ----
export const activeTouches      = {};
export let lastPinchDistance    = null;
export let lastPinchMidX       = null;
export let lastPinchMidY       = null;
export let touchPanStartX      = 0;
export let touchPanStartY      = 0;
export let touchOffsetStartX   = 0;
export let touchOffsetStartY   = 0;
export let isTouchPanning      = false;

// ---- Setters (needed because ES modules can't reassign named exports from outside) ----
export function setWidth(value)               { width = value; }
export function setHeight(value)              { height = value; }
export function setCenterX(value)             { centerX = value; }
export function setCenterY(value)             { centerY = value; }
export function setGridSpacing(value)         { gridSpacing = value; }
export function setHalfSpacing(value)         { halfSpacing = value; }
export function setSnapThreshold(value)       { snapThreshold = value; }
export function setCircleRadius(value)        { circleRadius = value; }
export function setSegmentLength(value)       { segmentLength = value; }
export function setMaximumReach(value)        { maximumReach = value; }
export function setSideTolerance(value)       { sideTolerance = value; }
export function setCanvasScale(value)         { canvasScale = value; }
export function setCanvasOffsetX(value)       { canvasOffsetX = value; }
export function setCanvasOffsetY(value)       { canvasOffsetY = value; }
export function setRenderModeState(value)     { renderMode = value; }
export function setStartOffsetFraction(value) { startOffsetFraction = value; }
export function setEndOffsetFraction(value)   { endOffsetFraction = value; }
export function setSvgElement(value)          { svgElement = value; }
export function setSvgSelection(value)        { svgSelection = value; }
export function setGridGroup(value)           { gridGroup = value; }
export function setMainPath(value)            { mainPath = value; }
export function setCircles(value)             { circles = value; }
export function setAnimationEnabled(value)    { animationEnabled = value; }
export function setPreferLeft(value)          { preferLeft = value; }
export function setPreferRight(value)         { preferRight = value; }
export function setCanvasEventsAttached(value) { canvasEventsAttached = value; }
export function setIsPanning(value)           { isPanning = value; }
export function setPanStartX(value)           { panStartX = value; }
export function setPanStartY(value)           { panStartY = value; }
export function setPanOffsetStartX(value)     { panOffsetStartX = value; }
export function setPanOffsetStartY(value)     { panOffsetStartY = value; }
export function setLastPinchDistance(value)    { lastPinchDistance = value; }
export function setLastPinchMidX(value)       { lastPinchMidX = value; }
export function setLastPinchMidY(value)       { lastPinchMidY = value; }
export function setTouchPanStartX(value)      { touchPanStartX = value; }
export function setTouchPanStartY(value)      { touchPanStartY = value; }
export function setTouchOffsetStartX(value)   { touchOffsetStartX = value; }
export function setTouchOffsetStartY(value)   { touchOffsetStartY = value; }
export function setIsTouchPanning(value)      { isTouchPanning = value; }
