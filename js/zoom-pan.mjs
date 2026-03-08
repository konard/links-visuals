// Zoom and pan event handlers.
// Shared between SVG mode (listeners on svgEl) and Canvas mode (listeners on canvasEl).

import * as state from './state.mjs';
import { MIN_SCALE, MAX_SCALE } from './constants.mjs';
import { applyCanvasTransform } from './svg-setup.mjs';

export function handleWheel(e) {
  e.preventDefault();
  const delta    = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
  const factor   = Math.pow(0.999, delta);
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.canvasScale * factor));
  if (newScale === state.canvasScale) return;

  const pivotX = (e.clientX - state.canvasOffsetX) / state.canvasScale;
  const pivotY = (e.clientY - state.canvasOffsetY) / state.canvasScale;
  state.setCanvasOffsetX(e.clientX - pivotX * newScale);
  state.setCanvasOffsetY(e.clientY - pivotY * newScale);
  state.setCanvasScale(newScale);
  applyCanvasTransform();
}

export function handleMouseDown(e) {
  const onCircle = e.target.tagName === "circle" && e.target.classList.contains("control");
  if (!onCircle) {
    state.setIsPanning(true);
    state.setPanStartX(e.clientX);
    state.setPanStartY(e.clientY);
    state.setPanOffsetStartX(state.canvasOffsetX);
    state.setPanOffsetStartY(state.canvasOffsetY);
    e.currentTarget.style.cursor = "grabbing";
    e.preventDefault();
  }
}

export function handleMouseMove(e) {
  if (!state.isPanning) return;
  state.setCanvasOffsetX(state.panOffsetStartX + (e.clientX - state.panStartX));
  state.setCanvasOffsetY(state.panOffsetStartY + (e.clientY - state.panStartY));
  applyCanvasTransform();
}

export function handleMouseUp() {
  if (state.isPanning) {
    state.setIsPanning(false);
    if (state.svgEl) state.svgEl.style.cursor = "";
  }
}

function getTouchOnCircle(touch) {
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  return el && el.tagName === "circle" && el.classList.contains("control");
}

export function handleTouchStart(e) {
  e.preventDefault();
  for (const t of e.changedTouches) state.activeTouches[t.identifier] = t;
  const ids = Object.keys(state.activeTouches);
  if (ids.length === 2) {
    state.setLastPinchDist(null);
    state.setIsTouchPanning(false);
  } else if (ids.length === 1) {
    const t = e.changedTouches[0];
    if (!getTouchOnCircle(t)) {
      state.setIsTouchPanning(true);
      state.setTouchPanStartX(t.clientX);
      state.setTouchPanStartY(t.clientY);
      state.setTouchOffsetStartX(state.canvasOffsetX);
      state.setTouchOffsetStartY(state.canvasOffsetY);
    } else {
      state.setIsTouchPanning(false);
    }
  }
}

export function handleTouchMove(e) {
  e.preventDefault();
  for (const t of e.changedTouches) state.activeTouches[t.identifier] = t;
  const ids = Object.keys(state.activeTouches);
  if (ids.length >= 2) {
    const t0   = state.activeTouches[ids[0]];
    const t1   = state.activeTouches[ids[1]];
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    const midX = (t0.clientX + t1.clientX) / 2;
    const midY = (t0.clientY + t1.clientY) / 2;
    if (state.lastPinchDist !== null) {
      const factor   = dist / state.lastPinchDist;
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
    state.setLastPinchDist(dist);
    state.setLastPinchMidX(midX);
    state.setLastPinchMidY(midY);
  } else if (ids.length === 1 && state.isTouchPanning) {
    const t = state.activeTouches[ids[0]];
    state.setCanvasOffsetX(state.touchOffsetStartX + (t.clientX - state.touchPanStartX));
    state.setCanvasOffsetY(state.touchOffsetStartY + (t.clientY - state.touchPanStartY));
    applyCanvasTransform();
  }
}

export function handleTouchEnd(e) {
  for (const t of e.changedTouches) delete state.activeTouches[t.identifier];
  const ids = Object.keys(state.activeTouches);
  if (ids.length < 2)   state.setLastPinchDist(null);
  if (ids.length === 0) state.setIsTouchPanning(false);
}

export function handleTouchCancel(e) {
  for (const t of e.changedTouches) delete state.activeTouches[t.identifier];
  state.setLastPinchDist(null);
  state.setIsTouchPanning(false);
}

export function initCanvasZoomPan() {
  state.svgEl.addEventListener("wheel",       handleWheel,       { passive: false });
  state.svgEl.addEventListener("mousedown",   handleMouseDown);
  window.addEventListener("mousemove",        handleMouseMove);
  window.addEventListener("mouseup",          handleMouseUp);
  state.svgEl.addEventListener("touchstart",  handleTouchStart,  { passive: false });
  state.svgEl.addEventListener("touchmove",   handleTouchMove,   { passive: false });
  state.svgEl.addEventListener("touchend",    handleTouchEnd,    { passive: false });
  state.svgEl.addEventListener("touchcancel", handleTouchCancel, { passive: false });
}

export function initCanvasElementEvents(canvasEl) {
  if (state.canvasEventsAttached) return;
  state.setCanvasEventsAttached(true);
  canvasEl.addEventListener("wheel",       handleWheel,       { passive: false });
  canvasEl.addEventListener("mousedown",   handleMouseDown);
  canvasEl.addEventListener("touchstart",  handleTouchStart,  { passive: false });
  canvasEl.addEventListener("touchmove",   handleTouchMove,   { passive: false });
  canvasEl.addEventListener("touchend",    handleTouchEnd,    { passive: false });
  canvasEl.addEventListener("touchcancel", handleTouchCancel, { passive: false });
}
