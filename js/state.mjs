// Shared mutable state for the animated-blueprint.
// All modules import from this file to read/write shared state.

// ---- Viewport / grid geometry (updated by resize()) ----
export let width        = 0;
export let height       = 0;
export let cx           = 0;   // horizontal centre
export let cy           = 0;   // vertical centre
export let gridSpacing  = 0;
export let halfSpacing  = 0;
export let snapThreshold = 20;
export let circleRadius  = 24;

// ---- IK geometry (updated by resize()) ----
export let SEG_LEN      = 100;
export let MAX_REACH    = 400;
export let SIDE_TOLERANCE = 0.1;

// ---- Canvas zoom / pan transform ----
export let canvasScale   = 1;
export let canvasOffsetX = 0;
export let canvasOffsetY = 0;

// ---- Render mode ----
export let renderMode = 'svg';

// ---- Link geometry offsets ----
export let startOffsetFraction = 0.10;
export let endOffsetFraction   = 0.16;

// ---- SVG scene objects ----
export let svgEl         = null;
export let svg           = null;
export let sceneGroup    = null;
export let gridGroup     = null;
export let geometryGroup = null;
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
export const byId = Object.fromEntries(points.map(p => [p.id, p]));

// ---- IK animation state ----
export let animationEnabled = false;
export let preferLeft  = 0;
export let preferRight = 0;

// ---- Canvas events ----
export let canvasEventsAttached = false;

// ---- Pan state ----
export let isPanning       = false;
export let panStartX       = 0;
export let panStartY       = 0;
export let panOffsetStartX = 0;
export let panOffsetStartY = 0;

// ---- Touch state ----
export const activeTouches = {};
export let lastPinchDist   = null;
export let lastPinchMidX   = null;
export let lastPinchMidY   = null;
export let touchPanStartX  = 0;
export let touchPanStartY  = 0;
export let touchOffsetStartX = 0;
export let touchOffsetStartY = 0;
export let isTouchPanning  = false;

// ---- Setters (needed because ES modules can't reassign named exports from outside) ----
export function setWidth(v)        { width = v; }
export function setHeight(v)       { height = v; }
export function setCx(v)           { cx = v; }
export function setCy(v)           { cy = v; }
export function setGridSpacing(v)  { gridSpacing = v; }
export function setHalfSpacing(v)  { halfSpacing = v; }
export function setSnapThreshold(v){ snapThreshold = v; }
export function setCircleRadius(v) { circleRadius = v; }
export function setSegLen(v)       { SEG_LEN = v; }
export function setMaxReach(v)     { MAX_REACH = v; }
export function setSideTolerance(v){ SIDE_TOLERANCE = v; }
export function setCanvasScale(v)  { canvasScale = v; }
export function setCanvasOffsetX(v){ canvasOffsetX = v; }
export function setCanvasOffsetY(v){ canvasOffsetY = v; }
export function setRenderModeState(v){ renderMode = v; }
export function setStartOffsetFraction(v){ startOffsetFraction = v; }
export function setEndOffsetFraction(v)  { endOffsetFraction = v; }
export function setSvgEl(v)        { svgEl = v; }
export function setSvg(v)          { svg = v; }
export function setSceneGroup(v)   { sceneGroup = v; }
export function setGridGroup(v)    { gridGroup = v; }
export function setGeometryGroup(v){ geometryGroup = v; }
export function setMainPath(v)     { mainPath = v; }
export function setCircles(v)      { circles = v; }
export function setAnimationEnabled(v){ animationEnabled = v; }
export function setPreferLeft(v)   { preferLeft = v; }
export function setPreferRight(v)  { preferRight = v; }
export function setCanvasEventsAttached(v){ canvasEventsAttached = v; }
export function setIsPanning(v)    { isPanning = v; }
export function setPanStartX(v)    { panStartX = v; }
export function setPanStartY(v)    { panStartY = v; }
export function setPanOffsetStartX(v){ panOffsetStartX = v; }
export function setPanOffsetStartY(v){ panOffsetStartY = v; }
export function setLastPinchDist(v){ lastPinchDist = v; }
export function setLastPinchMidX(v){ lastPinchMidX = v; }
export function setLastPinchMidY(v){ lastPinchMidY = v; }
export function setTouchPanStartX(v){ touchPanStartX = v; }
export function setTouchPanStartY(v){ touchPanStartY = v; }
export function setTouchOffsetStartX(v){ touchOffsetStartX = v; }
export function setTouchOffsetStartY(v){ touchOffsetStartY = v; }
export function setIsTouchPanning(v){ isTouchPanning = v; }
