/**
 * E2E tests for grid.html.
 *
 * Run with:
 *   RUN_E2E=true node --test tests/grid.e2e.test.mjs
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const PAGE_URL = `${BASE_URL}/grid.html`;
const VIEWPORT = { width: 1200, height: 800 };
const PADDING_FRACTION = 0.215;
const RADIUS_FRACTION = 0.170;
const STROKE_FRACTION = 0.085;

function closeTo(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`
  );
}

describe(
  'grid.html - E2E tests',
  { skip: !process.env.RUN_E2E },
  () => {
    let browser;
    let page;

    before(async () => {
      const playwright = await import('playwright');
      browser = await playwright.chromium.launch({
        headless: process.env.HEADLESS !== 'false',
      });
    });

    after(async () => {
      if (browser) await browser.close();
    });

    beforeEach(async () => {
      const context = await browser.newContext({ viewport: VIEWPORT });
      page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(PAGE_URL);
      await page.waitForFunction(() =>
        document.querySelectorAll('path[marker-start]').length === 4
      );
      assert.deepEqual(errors, [], `Page errors: ${errors.join('; ')}`);
    });

    afterEach(async () => {
      if (page) await page.context().close();
    });

    it('renders blueprint-style link proportions for each grid cell', async () => {
      const metrics = await page.evaluate(() => {
        const path = document.querySelector('path.link-0');
        const startCircle = document.querySelector('circle.cp-start-0');
        const arrowMarker = document.querySelector('#arrow-marker-0');
        const crossMarker = document.querySelector('#cross-marker-0');
        return {
          linkCount: document.querySelectorAll('path[marker-start]').length,
          radius: parseFloat(startCircle?.getAttribute('r') || '0'),
          strokeWidth: parseFloat(path?.getAttribute('stroke-width') || '0'),
          arrowMarkerUnits: arrowMarker?.getAttribute('markerUnits'),
          crossMarkerUnits: crossMarker?.getAttribute('markerUnits'),
          arrowViewBox: arrowMarker?.getAttribute('viewBox'),
          crossViewBox: crossMarker?.getAttribute('viewBox'),
          arrowMarkerWidth: arrowMarker?.getAttribute('markerWidth'),
          crossMarkerWidth: crossMarker?.getAttribute('markerWidth'),
          width: window.innerWidth,
          height: window.innerHeight,
        };
      });

      const gridSize = Math.ceil(Math.sqrt(metrics.linkCount));
      const availableSize = Math.min(metrics.width, metrics.height) * (1 - 2 * PADDING_FRACTION);
      const expectedGridSpacing = availableSize / (9 * gridSize - 1);

      closeTo(metrics.radius, RADIUS_FRACTION * expectedGridSpacing, 0.25,
        'Control point radius should use the same local grid spacing as the link');
      closeTo(metrics.strokeWidth, STROKE_FRACTION * expectedGridSpacing, 0.25,
        'Path stroke width should use the same local grid spacing as the link');
      assert.equal(metrics.arrowMarkerUnits, null,
        'Arrow marker should use default markerUnits=strokeWidth');
      assert.equal(metrics.crossMarkerUnits, null,
        'Cross marker should use default markerUnits=strokeWidth');
      assert.equal(metrics.arrowViewBox, '0 0 100 100');
      assert.equal(metrics.crossViewBox, '0 0 100 100');
      assert.equal(metrics.arrowMarkerWidth, '100');
      assert.equal(metrics.crossMarkerWidth, '100');
    });

    it('keeps control point colors fixed (green/red/black) while only the link is colored', async () => {
      const data = await page.evaluate(() => {
        const read = sel => {
          const e = document.querySelector(sel);
          return e && {
            stroke: e.getAttribute('stroke'),
            strokeWidth: e.getAttribute('stroke-width'),
            dash: e.getAttribute('stroke-dasharray'),
          };
        };
        const links = [...document.querySelectorAll('path[marker-start]')];
        return {
          // Two different links should have two different link (path) colors…
          linkColors: links.map(p => p.getAttribute('stroke')),
          // …but their control points must share the same fixed semantic colors.
          start0: read('circle.cp-start-0'),
          end0: read('circle.cp-end-0'),
          center0: read('circle.cp-center-0'),
          start1: read('circle.cp-start-1'),
          end1: read('circle.cp-end-1'),
          center1: read('circle.cp-center-1'),
          int0: read('circle.cp-int-0-1'),
          int1: read('circle.cp-int-1-7'),
        };
      });

      // The per-link color is applied to the link path, and differs per link.
      assert.notEqual(data.linkColors[0], data.linkColors[1],
        'Different links should have different link (path) colors');

      // Control point colors are fixed and identical across every link.
      for (const cp of [data.start0, data.start1]) {
        assert.equal(cp.stroke, 'green', 'Start control point must stay green on every link');
      }
      for (const cp of [data.end0, data.end1]) {
        assert.equal(cp.stroke, 'red', 'End control point must stay red on every link');
      }
      for (const cp of [data.center0, data.center1]) {
        assert.equal(cp.stroke, 'black', 'Center control point must stay black on every link');
      }
      for (const cp of [data.int0, data.int1]) {
        assert.equal(cp.stroke, 'blue', 'Intermediate control points must stay blue on every link');
      }

      // Control point outline matches blueprint.html exactly: 1px dashed "4 2".
      for (const cp of [data.start0, data.end0, data.center0, data.start1, data.end1, data.center1, data.int0, data.int1]) {
        assert.equal(cp.strokeWidth, '1', 'Control point stroke-width must match blueprint (1px)');
        assert.equal(cp.dash, '4 2', 'Control point dash must match blueprint ("4 2")');
      }
    });

    it('reset restores the default self-referencing layout', async () => {
      const before = await page.evaluate(() => {
        const end = document.querySelector('circle.cp-end-0');
        return {
          x: parseFloat(end.getAttribute('cx')),
          y: parseFloat(end.getAttribute('cy')),
        };
      });

      await page.mouse.move(before.x, before.y);
      await page.mouse.down();
      await page.mouse.move(before.x + 80, before.y + 60, { steps: 6 });
      await page.mouse.up();

      const movedDistance = await page.evaluate(() => {
        const end = document.querySelector('circle.cp-end-0');
        const center = document.querySelector('circle.cp-center-0');
        return Math.hypot(
          parseFloat(end.getAttribute('cx')) - parseFloat(center.getAttribute('cx')),
          parseFloat(end.getAttribute('cy')) - parseFloat(center.getAttribute('cy'))
        );
      });
      assert.ok(movedDistance > 10, 'The end point should move before reset');

      await page.click('#resetBtn');
      await page.waitForFunction(() => {
        // 4 links x (start + center + end + 6 intermediate) = 36 control circles.
        const controls = [...document.querySelectorAll('circle[class^="cp-"]')];
        return controls.length === 36;
      });

      const after = await page.evaluate(() => {
        return [...document.querySelectorAll('circle.cp-center-0, circle.cp-start-0, circle.cp-end-0')]
          .map(circle => ({
            className: circle.getAttribute('class'),
            x: parseFloat(circle.getAttribute('cx')),
            y: parseFloat(circle.getAttribute('cy')),
          }));
      });
      const center = after.find(point => point.className === 'cp-center-0');
      for (const point of after) {
        closeTo(point.x, center.x, 0.1, `${point.className} x after reset`);
        closeTo(point.y, center.y, 0.1, `${point.className} y after reset`);
      }

      const savedSettings = await page.evaluate(() => localStorage.getItem('grid-settings'));
      assert.equal(savedSettings, null, 'Reset should clear saved grid settings');
    });
  }
);
