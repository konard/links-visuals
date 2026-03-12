// Zoom and pan event handlers.
// Shared between SVG mode (listeners on svgElement) and Canvas mode (listeners on canvasElement).

import * as state from './state.mjs';
import { MIN_SCALE, MAX_SCALE } from './constants.mjs';
import { applyCanvasTransform } from './svg-setup.mjs';

export function handleWheel(event) {
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
}

export function handleMouseDown(event) {
  const onCircle = event.target.tagName === "circle" && event.target.classList.contains("control");
  if (!onCircle) {
    state.setIsPanning(true);
    state.setPanStartX(event.clientX);
    state.setPanStartY(event.clientY);
    state.setPanOffsetStartX(state.canvasOffsetX);
    state.setPanOffsetStartY(state.canvasOffsetY);
    event.currentTarget.style.cursor = "grabbing";
    event.preventDefault();
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
    if (state.svgElement) state.svgElement.style.cursor = "";
  }
}

function getTouchOnCircle(touch) {
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  return element && element.tagName === "circle" && element.classList.contains("control");
}

export function handleTouchStart(event) {
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
  state.svgElement.addEventListener("wheel",       handleWheel,       { passive: false });
  state.svgElement.addEventListener("mousedown",   handleMouseDown);
  window.addEventListener("mousemove",             handleMouseMove);
  window.addEventListener("mouseup",               handleMouseUp);
  state.svgElement.addEventListener("touchstart",  handleTouchStart,  { passive: false });
  state.svgElement.addEventListener("touchmove",   handleTouchMove,   { passive: false });
  state.svgElement.addEventListener("touchend",    handleTouchEnd,    { passive: false });
  state.svgElement.addEventListener("touchcancel", handleTouchCancel, { passive: false });
}

export function initCanvasElementEvents(canvasElement) {
  if (state.canvasEventsAttached) return;
  state.setCanvasEventsAttached(true);
  canvasElement.addEventListener("wheel",       handleWheel,       { passive: false });
  canvasElement.addEventListener("mousedown",   handleMouseDown);
  canvasElement.addEventListener("touchstart",  handleTouchStart,  { passive: false });
  canvasElement.addEventListener("touchmove",   handleTouchMove,   { passive: false });
  canvasElement.addEventListener("touchend",    handleTouchEnd,    { passive: false });
  canvasElement.addEventListener("touchcancel", handleTouchCancel, { passive: false });
}
