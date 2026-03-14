// Zoom and pan event handlers.
// Listeners are attached to `document` so that zoom/pan works everywhere in the
// viewport, not just over the SVG/Canvas element's CSS layout box. This fixes
// the issue where zoom stops working after panning far from center or zooming
// out (the CSS transform shrinks/moves the element's hit-test area).

import * as state from './state.mjs';
import { MIN_SCALE, MAX_SCALE } from './constants.mjs';
import { applyCanvasTransform } from './svg-setup.mjs';

// Debug logging — enable via URL param ?debug=zoom or by setting
// window.__ZOOM_PAN_DEBUG = true in the browser console.
function isDebug() {
  if (typeof window !== 'undefined' && window.__ZOOM_PAN_DEBUG) return true;
  if (typeof location !== 'undefined' && location.search.includes('debug=zoom')) return true;
  return false;
}
function dbg(...args) { if (isDebug()) console.log('[zoom-pan]', ...args); }

export function handleWheel(event) {
  // Ignore wheel events on UI panel elements (sliders, config, etc.)
  if (event.target.closest('#config-panel, #coordinates, #toggle-panels')) return;
  event.preventDefault();
  const delta    = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY;
  const factor   = Math.pow(0.999, delta);
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.canvasScale * factor));
  if (newScale === state.canvasScale) return;

  const pivotX = (event.clientX - state.canvasOffsetX) / state.canvasScale;
  const pivotY = (event.clientY - state.canvasOffsetY) / state.canvasScale;
  state.setCanvasOffsetX(event.clientX - pivotX * newScale);
  state.setCanvasOffsetY(event.clientY - pivotY * newScale);
  state.setCanvasScale(newScale);
  applyCanvasTransform();
  dbg('wheel', { clientX: event.clientX, clientY: event.clientY, delta, factor: factor.toFixed(4), scale: newScale.toFixed(4), offsetX: state.canvasOffsetX.toFixed(1), offsetY: state.canvasOffsetY.toFixed(1) });
}

export function handleMouseDown(event) {
  // Ignore clicks on control circles (those are handled by D3 drag)
  const onCircle = event.target.tagName === "circle" && event.target.classList.contains("control");
  // Ignore clicks on UI panel elements (buttons, sliders, etc.)
  const onUI = event.target.closest('#config-panel, #coordinates, #toggle-panels');
  if (!onCircle && !onUI) {
    state.setIsPanning(true);
    state.setPanStartX(event.clientX);
    state.setPanStartY(event.clientY);
    state.setPanOffsetStartX(state.canvasOffsetX);
    state.setPanOffsetStartY(state.canvasOffsetY);
    document.body.style.cursor = "grabbing";
    event.preventDefault();
    dbg('mousedown → pan start', { clientX: event.clientX, clientY: event.clientY, target: event.target.tagName });
  }
}

export function handleMouseMove(event) {
  if (!state.isPanning) return;
  state.setCanvasOffsetX(state.panOffsetStartX + (event.clientX - state.panStartX));
  state.setCanvasOffsetY(state.panOffsetStartY + (event.clientY - state.panStartY));
  applyCanvasTransform();
}

export function handleMouseUp() {
  if (state.isPanning) {
    state.setIsPanning(false);
    document.body.style.cursor = "";
  }
}

function getTouchOnCircle(touch) {
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  return element && element.tagName === "circle" && element.classList.contains("control");
}

export function handleTouchStart(event) {
  // Ignore touches on UI panel elements
  if (event.target.closest('#config-panel, #coordinates, #toggle-panels')) return;
  event.preventDefault();
  for (const touch of event.changedTouches) state.activeTouches[touch.identifier] = touch;
  const identifiers = Object.keys(state.activeTouches);
  if (identifiers.length === 2) {
    state.setLastPinchDistance(null);
    state.setIsTouchPanning(false);
  } else if (identifiers.length === 1) {
    const touch = event.changedTouches[0];
    if (!getTouchOnCircle(touch)) {
      state.setIsTouchPanning(true);
      state.setTouchPanStartX(touch.clientX);
      state.setTouchPanStartY(touch.clientY);
      state.setTouchOffsetStartX(state.canvasOffsetX);
      state.setTouchOffsetStartY(state.canvasOffsetY);
    } else {
      state.setIsTouchPanning(false);
    }
  }
}

export function handleTouchMove(event) {
  event.preventDefault();
  for (const touch of event.changedTouches) state.activeTouches[touch.identifier] = touch;
  const identifiers = Object.keys(state.activeTouches);
  if (identifiers.length >= 2) {
    const touch0   = state.activeTouches[identifiers[0]];
    const touch1   = state.activeTouches[identifiers[1]];
    const distance = Math.hypot(touch1.clientX - touch0.clientX, touch1.clientY - touch0.clientY);
    const midX = (touch0.clientX + touch1.clientX) / 2;
    const midY = (touch0.clientY + touch1.clientY) / 2;
    if (state.lastPinchDistance !== null) {
      const factor   = distance / state.lastPinchDistance;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.canvasScale * factor));
      const pivotX   = (midX - state.canvasOffsetX) / state.canvasScale;
      const pivotY   = (midY - state.canvasOffsetY) / state.canvasScale;
      state.setCanvasOffsetX(midX - pivotX * newScale);
      state.setCanvasOffsetY(midY - pivotY * newScale);
      state.setCanvasScale(newScale);
      state.setCanvasOffsetX(state.canvasOffsetX + midX - state.lastPinchMidX);
      state.setCanvasOffsetY(state.canvasOffsetY + midY - state.lastPinchMidY);
      applyCanvasTransform();
    }
    state.setLastPinchDistance(distance);
    state.setLastPinchMidX(midX);
    state.setLastPinchMidY(midY);
  } else if (identifiers.length === 1 && state.isTouchPanning) {
    const touch = state.activeTouches[identifiers[0]];
    state.setCanvasOffsetX(state.touchOffsetStartX + (touch.clientX - state.touchPanStartX));
    state.setCanvasOffsetY(state.touchOffsetStartY + (touch.clientY - state.touchPanStartY));
    applyCanvasTransform();
  }
}

export function handleTouchEnd(event) {
  for (const touch of event.changedTouches) delete state.activeTouches[touch.identifier];
  const identifiers = Object.keys(state.activeTouches);
  if (identifiers.length < 2)   state.setLastPinchDistance(null);
  if (identifiers.length === 0) state.setIsTouchPanning(false);
}

export function handleTouchCancel(event) {
  for (const touch of event.changedTouches) delete state.activeTouches[touch.identifier];
  state.setLastPinchDistance(null);
  state.setIsTouchPanning(false);
}

export function initCanvasZoomPan() {
  // Attach zoom/pan listeners to `document` so they fire everywhere in the
  // viewport — not just over the SVG element's CSS layout box. This is the
  // fix for issue #21: after panning or zooming out, the SVG element's
  // transformed bounding box may not cover the full viewport, causing
  // events at those positions to be lost.
  document.addEventListener("wheel",       handleWheel,       { passive: false });
  document.addEventListener("mousedown",   handleMouseDown);
  window.addEventListener("mousemove",     handleMouseMove);
  window.addEventListener("mouseup",       handleMouseUp);
  document.addEventListener("touchstart",  handleTouchStart,  { passive: false });
  document.addEventListener("touchmove",   handleTouchMove,   { passive: false });
  document.addEventListener("touchend",    handleTouchEnd,    { passive: false });
  document.addEventListener("touchcancel", handleTouchCancel, { passive: false });
}

export function initCanvasElementEvents(canvasElement) {
  // Canvas mode events are already handled by the document-level listeners
  // registered in initCanvasZoomPan(). This function is kept for backward
  // compatibility but is now a no-op since all events go through document.
  void canvasElement;
}
