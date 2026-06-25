# Case Study: Issue #28 - Make grid mode closer to single-link mode

## Overview

**Issue:** [#28 - We need to make sure multi link (grid) mode is closer to single link mode](https://github.com/konard/links-visuals/issues/28)

**Pull request:** [#29](https://github.com/konard/links-visuals/pull/29)

**Affected page:** `grid.html`

**Reference pages that must be preserved:** `blueprint.html`, `animated-blueprint.html`

## Archived Evidence

- Raw issue data: [`raw/issue.json`](./raw/issue.json)
- Raw issue comments: [`raw/issue-comments.json`](./raw/issue-comments.json)
- Raw PR data/comments/reviews: [`raw/pr.json`](./raw/pr.json), [`raw/pr-conversation-comments.json`](./raw/pr-conversation-comments.json), [`raw/pr-review-comments.json`](./raw/pr-review-comments.json), [`raw/pr-reviews.json`](./raw/pr-reviews.json)
- Related issue/PR data: [`raw/related-issue-23.json`](./raw/related-issue-23.json), [`raw/related-pr-24.json`](./raw/related-pr-24.json), [`raw/related-pr-25.json`](./raw/related-pr-25.json), [`raw/related-pr-26.json`](./raw/related-pr-26.json)
- Issue screenshot: [`images/grid-mess-layout.png`](./images/grid-mess-layout.png)
- After screenshot: [`images/grid-after.png`](./images/grid-after.png)
- Reproduction log: [`raw/grid-e2e-before.log`](./raw/grid-e2e-before.log)
- Verification logs: [`raw/grid-e2e-after.log`](./raw/grid-e2e-after.log), [`raw/unit-after.log`](./raw/unit-after.log), [`raw/e2e-after.log`](./raw/e2e-after.log)

## Timeline

1. **March 17, 2026:** Issue #23 requested a grid page based on the best practices from `blueprint.html`. It specified a square grid, fixed link centers, self-referencing default links, one slider for link count, localStorage persistence, and a reset button.
2. **March 17, 2026:** PRs #24, #25, and #26 iterated on `grid.html`. They added a colored multi-link grid, then revised control point style and fixed centers to match issue #23 comments.
3. **June 21, 2026:** Issue #28 reported that grid mode still diverged too much from single-link mode, especially in control point/arrow proportions and layout reset behavior.
4. **June 25, 2026:** This investigation archived issue/PR data, reproduced the failures with a new grid E2E test, fixed the grid rendering model, and verified the full test suite.
5. **June 25, 2026:** PR review feedback ("Control points color cannot be changed, or proportions must be preserved") flagged that grid control points were tinted with the per-link color and drawn with a 2px stroke. Fixed by restoring blueprint's fixed semantic colors (green/red/black/blue), 1px dashed outline, and the missing blue intermediate control points.

## Requirements

1. Keep `blueprint.html` and `animated-blueprint.html` unchanged.
2. Make grid links look like the single-link blueprint, with color as the only visual override. The per-link color applies to the link itself (path + endpoint markers) only; control point colors are fixed and must never change.
3. Preserve blueprint proportions for path strokes, endpoint markers, control point radii, snap threshold, IK segment length, and offsets.
4. Keep grid link centers fixed in a square grid.
5. Keep default links self-referencing, with start and end at the fixed center.
6. Preserve localStorage layout persistence.
7. Add a layout reset that actually restores default positions.
8. Archive issue data, related history, screenshots, logs, and analysis in `docs/case-studies/issue-28`.
9. Add tests that fail before the fix and pass after it.

## Root Causes

### 1. Mixed Scale Model

Before the fix, `grid.html` used one value for arrangement (`gridUnit`) and another for link geometry (`segLen = gridUnit * 0.35`). Control point radius used `gridUnit`, while path stroke and markers used `segLen`.

At a 1200 by 800 viewport with 4 links, the failing reproduction captured:

- Expected control radius from blueprint-style local spacing: `4.56`
- Actual control radius before fix: `25.84`

That made control circles much larger than the link geometry and made marker proportions diverge from the reference pages.

### 2. Reset Reused Dirty Link State

The reset button cleared localStorage and reset the link count, but `initLinks()` still preserved `oldLinks` when saved data was absent. After moving a link endpoint and clicking reset, the moved endpoint survived.

The failing reproduction captured:

- Expected `cp-end-0` x after reset: `448`
- Actual `cp-end-0` x after reset: `524`

### 3. Absolute Position Persistence

Saved layouts used absolute `{ x, y }` coordinates. That differs from the blueprint model, where point positions are represented as factors of `gridSpacing`. Absolute values make saved layouts less responsive to viewport and grid-size changes.

### 4. Control Points Tinted With the Link Color

Grid control points were drawn with colors derived from the per-link color: start blended the link color with green, end blended it with red, and center used the raw link color, all with a 2px stroke. The blue IK-controlled intermediate control points from blueprint.html were missing entirely.

This contradicted the core requirement that "the only change that can be applied at multi line link is color" — meaning only the link (path + markers) is recolored, while control points must keep their fixed semantic meaning. In `blueprint.html` / `js/control-points.mjs` those colors are fixed: start = green, end = red, center = black, intermediate = blue, with a 1px dashed (`4 2`) outline. The grid therefore looked different from single mode even though both render the same geometry.

## Solution

1. Added `js/blueprint-link.mjs` as a small reusable helper for grid mode:
   - `createBlueprintMetrics(gridSpacing)`
   - `computeBlueprintLinkPoints(link, metrics)`
   - `buildBlueprintPathData(points, gridSpacing)`
   - `appendBlueprintEndpointMarkers(defs, ids)`
2. Updated `grid.html` so each grid cell has one local blueprint scale:
   - path stroke = `strokeFraction * gridSpacing`
   - marker size follows stroke through default `markerUnits="strokeWidth"`
   - control radius = `radiusFraction * gridSpacing`
   - IK segment length = `gridSpacing`
   - snap threshold = `snapFraction * gridSpacing`
3. Changed grid spacing to model each miniature link as an 8-unit blueprint link plus a 1-unit gap:
   - `gridSpacing = availableSize / (9 * gridSize - 1)`
   - `cellSpacing = 9 * gridSpacing`
4. Changed persisted layout from absolute coordinates to center-relative endpoint factors:
   - `startFactor`
   - `endFactor`
5. Made reset call `initLinks({ restoreSaved: false, preserveExisting: false })`, so the dirty in-memory layout is discarded.
6. Added backward compatibility for old absolute saved positions when possible.
7. Restored blueprint's fixed control-point appearance so only the link is recolored:
   - Exported `CONTROL_POINT_COLORS` (`start: green`, `end: red`, `center: black`, `intermediate: blue`), `CONTROL_POINT_STROKE_WIDTH` (`1`), and `CONTROL_POINT_DASH_ARRAY` (`4 2`) from `js/blueprint-link.mjs` as one source of truth, and exposed `cpStrokeWidth`/`cpDashArray` on `createBlueprintMetrics`.
   - Removed the link-color blending helpers (`blendColor`, `GREEN_RGB`, `RED_RGB`) from `grid.html`; control points now use the fixed semantic colors and a 1px dashed outline, identical to `blueprint.html`.
   - Added the blue IK-controlled intermediate control points (points `1,2,3,5,6,7`) to each grid link, matching blueprint's auto-layout look. Each grid link now renders the same 9 control points (3 draggable endpoints + center + 6 intermediates) as single mode.

## Options Considered

### Option A: Modify `blueprint.html` and `animated-blueprint.html` to share the new helper

Rejected for this stage because issue #28 explicitly says those pages cannot be changed.

### Option B: Keep all code inline in `grid.html`

Rejected because it would continue the divergence problem. The helper module keeps the blueprint-like link math in one place without touching protected pages.

### Option C: Use a full graph/edge library

Rejected for this repository stage. React Flow and similar libraries are useful references for reusable SVG edge components, but adding React or a graph framework would be a large dependency and architecture change for one static D3 page.

## Online Research

- [MDN `markerUnits`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/markerUnits) confirms the default value is `strokeWidth`, which is why preserving path stroke scale also preserves marker scale.
- [MDN `patternUnits`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/patternUnits) documents `userSpaceOnUse`, matching the existing infinite grid pattern approach.
- [D3 drag documentation](https://d3js.org/d3-drag) supports the current D3 drag behavior used for endpoint control points.
- [React Flow custom edges](https://reactflow.dev/learn/customization/custom-edges) and [`getBezierPath`](https://reactflow.dev/api-reference/utils/get-bezier-path) are relevant examples of reusable SVG edge path helpers, but they do not justify adding a React dependency here.

No upstream/library bug was found, so no external repository issue was opened.

## Verification

Failing reproduction before fix:

```bash
RUN_E2E=true TEST_URL=http://localhost:8080 node --test tests/grid.e2e.test.mjs
```

Passing checks after fix:

```bash
npm test
TEST_URL=http://localhost:8080 npm run test:e2e
```

Results:

- Unit tests: 51 passed (includes assertions that grid control-point colors, stroke width, and dash match blueprint exactly).
- Grid E2E: 3 passed, including a test that asserts each link's path color differs while every control point keeps its fixed semantic color (start = green, end = red, center = black, intermediate = blue), 1px stroke, and `4 2` dash.
- Blueprint + animated-blueprint E2E (the protected reference pages): 40 passed, confirming they are unchanged.

## Visual Result

Before:

![Grid layout before](./images/grid-mess-layout.png)

After:

![Grid layout after](./images/grid-after.png)
