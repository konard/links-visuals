# Case Study: Issue #21 — Zoom not working at points far from center

## Problem Statement

Zoom (scroll wheel / pinch) stops working when the cursor is positioned far from the
center of the link visualization. The user reports that zoom "looks like it is working
only on initial rectangle that was visible on page load."

Pan (click-drag on empty space) is reported as working at all points.

## Timeline

1. The SVG element is created with `width=innerWidth`, `height=innerHeight`.
2. A CSS transform `translate(X,Y) scale(S)` is applied to the SVG element for
   zoom/pan (see `js/svg-setup.mjs:applyCanvasTransform`).
3. Grid content extends to ±1e6 in SVG user space, and `overflow:visible` is set on
   the SVG so the grid paints beyond the SVG's viewport boundary.
4. `wheel` and `mousedown` event listeners are attached to `state.svgElement`
   (see `js/zoom-pan.mjs:initCanvasZoomPan`).

## Root Cause

The SVG element's **CSS layout box** determines its hit-testing area for pointer
events. This layout box is computed from the element's `width` and `height` attributes
(both equal to the viewport dimensions), then transformed by the CSS `translate/scale`.

When the user:
- **Zooms out** (scale < 1): The SVG's rendered box shrinks to
  `innerWidth × scale` by `innerHeight × scale` pixels — smaller than the viewport.
  Parts of the viewport fall outside the SVG's hit-test area.
- **Pans far from origin**: The SVG's box moves. Screen regions that were previously
  inside the SVG now fall outside.

In both cases, `wheel` events fired at screen positions outside the SVG's transformed
box never reach the SVG element, so `handleWheel` is never called — zoom appears
broken.

Pan (mouse drag) partly works because `mousemove` and `mouseup` are already attached
to `window` (not to the SVG). Only `mousedown` is on the SVG, so initiating a new pan
gesture can also fail in the same regions.

### Visual Diagram

```
┌─────────────────────────────────┐ ← Browser viewport (full screen)
│                                 │
│   ┌───────────────┐             │
│   │  SVG element  │             │ ← After zoom-out, the SVG's CSS
│   │  (scaled)     │             │   layout box is smaller than the
│   │               │             │   viewport.
│   └───────────────┘             │
│                                 │
│         ✖ cursor here           │ ← Wheel event at this position
│           → NOT received by SVG │   has no target element (or hits
│                                 │   <body>), so zoom doesn't work.
└─────────────────────────────────┘
```

## Solution

Attach `wheel` and `mousedown` event listeners to `document` instead of
`state.svgElement`. This ensures zoom/pan events are captured everywhere in the
viewport regardless of the SVG element's CSS transform.

The `mousedown` handler needs a small adjustment: instead of checking
`event.target.tagName === "circle"` to detect control point clicks, it uses the
same check but the target detection still works because the circles are DOM children
of the SVG.

For Canvas mode, the same approach applies — listeners go on `document` rather than
the `<canvas>` element.

### Related Known Patterns

This is a well-known issue with CSS transforms on interactive SVG elements. The
W3C SVG specification (§14.3.3) defines the SVG viewport's clipping behavior, and
CSS transforms affect the element's principal box for hit-testing purposes per the
CSS Transforms spec (§6). Common solutions:

1. **Attach listeners to a parent element** (document/window) — chosen here.
2. **Use an SVG `<g>` group transform** instead of CSS transform — but this breaks
   marker rendering (markers scale with the group transform rather than remaining
   crisp).
3. **Resize the SVG element inversely** to the zoom level — complex and fragile.

## Files Changed

- `js/zoom-pan.mjs` — Changed listener targets from `svgElement` / `canvasElement`
  to `document` for wheel/mousedown/touch events.
- `tests/zoom-pan.unit.test.mjs` — Added test verifying zoom math correctness at
  extreme screen positions (simulating the "far from center" scenario).
- `docs/case-studies/issue-21/` — This case study.
