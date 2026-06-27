/**
 * E2E tests for draw.html.
 *
 * Run with:
 *   RUN_E2E=true node --test tests/draw.e2e.test.mjs
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const PAGE_URL = `${BASE_URL}/draw.html`;
const VIEWPORT = { width: 1200, height: 800 };

function closeTo(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`
  );
}

async function drawPolyline(page, points, expectedLinkCount) {
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (const point of points.slice(1)) {
    await page.mouse.move(point.x, point.y, { steps: 8 });
  }
  await page.mouse.up();
  await page.waitForFunction(
    count => window.__drawDemo?.getLinks().length === count,
    expectedLinkCount
  );
}

describe(
  'draw.html - E2E tests',
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
      await context.addInitScript(() => localStorage.clear());
      page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(PAGE_URL);
      await page.waitForFunction(() =>
        window.__drawDemo &&
        document.querySelector('svg') &&
        document.querySelector('#drawModeBtn.active')
      );
      assert.deepEqual(errors, [], `Page errors: ${errors.join('; ')}`);
    });

    afterEach(async () => {
      if (page) await page.context().close();
    });

    it('loads the mobile-first drawing surface with blueprint markers and grid patterns', async () => {
      const data = await page.evaluate(() => ({
        mode: window.__drawDemo.getMode(),
        svgCount: document.querySelectorAll('svg').length,
        patterns: document.querySelectorAll('svg defs pattern').length,
        crossViewBox: document.querySelector('#draw-cross-marker')?.getAttribute('viewBox'),
        arrowViewBox: document.querySelector('#draw-arrow-marker')?.getAttribute('viewBox'),
        linkCountText: document.getElementById('linkCountVal')?.textContent,
      }));

      assert.equal(data.mode, 'draw');
      assert.equal(data.svgCount, 1);
      assert.ok(data.patterns >= 2, 'Expected minor and major grid patterns');
      assert.equal(data.crossViewBox, '0 0 100 100');
      assert.equal(data.arrowViewBox, '0 0 100 100');
      assert.equal(data.linkCountText, '0');
    });

    it('turns a freehand stroke into a link with start, center, end, and intermediate controls', async () => {
      await drawPolyline(page, [
        { x: 180, y: 560 },
        { x: 310, y: 420 },
        { x: 520, y: 520 },
      ], 1);

      const data = await page.evaluate(() => {
        const link = window.__drawDemo.getLinks()[0];
        const readCircle = selector => {
          const circle = document.querySelector(selector);
          return {
            stroke: circle?.getAttribute('stroke'),
            dash: circle?.getAttribute('stroke-dasharray'),
            strokeWidth: circle?.getAttribute('stroke-width'),
          };
        };
        return {
          mode: window.__drawDemo.getMode(),
          pointRoles: link.points.map(point => point.role),
          pathCount: document.querySelectorAll('path.link-path').length,
          markerStart: document.querySelector('path.link-path')?.getAttribute('marker-start'),
          markerEnd: document.querySelector('path.link-path')?.getAttribute('marker-end'),
          start: readCircle('circle.control.start'),
          center: readCircle('circle.control.center'),
          end: readCircle('circle.control.end'),
          intermediateCount: document.querySelectorAll('circle.control.intermediate').length,
        };
      });

      assert.equal(data.mode, 'draw', 'Drawing multiple links should stay in draw mode');
      assert.equal(data.pathCount, 1);
      assert.equal(data.markerStart, 'url(#draw-cross-marker)');
      assert.equal(data.markerEnd, 'url(#draw-arrow-marker)');
      assert.ok(data.pointRoles.includes('start'));
      assert.ok(data.pointRoles.includes('center'));
      assert.ok(data.pointRoles.includes('end'));
      assert.ok(data.intermediateCount >= 1, 'Freehand path should keep intermediate points');
      assert.equal(data.start.stroke, 'green');
      assert.equal(data.center.stroke, 'black');
      assert.equal(data.end.stroke, 'red');
      for (const control of [data.start, data.center, data.end]) {
        assert.equal(control.dash, '4 2');
        assert.equal(control.strokeWidth, '1');
      }
    });

    it('draw mode creates a pinned child link when a stroke starts on an existing center', async () => {
      await drawPolyline(page, [
        { x: 170, y: 540 },
        { x: 310, y: 410 },
        { x: 500, y: 520 },
      ], 1);

      const firstCenter = await page.evaluate(() => {
        const link = window.__drawDemo.getLinks()[0];
        return link.points[link.centerIndex];
      });

      await drawPolyline(page, [
        { x: firstCenter.x + 2, y: firstCenter.y + 2 },
        { x: firstCenter.x + 110, y: firstCenter.y - 70 },
        { x: firstCenter.x + 240, y: firstCenter.y - 20 },
      ], 2);

      const data = await page.evaluate(() => {
        const [parent, child] = window.__drawDemo.getLinks();
        return {
          parentCenter: parent.points[parent.centerIndex],
          childStart: child.points[0],
          childStartAnchorId: child.startAnchorId,
        };
      });

      assert.equal(data.childStartAnchorId, 'link-0');
      closeTo(data.parentCenter.x, firstCenter.x, 0.1, 'parent center x should not move while drawing');
      closeTo(data.parentCenter.y, firstCenter.y, 0.1, 'parent center y should not move while drawing');
      closeTo(data.childStart.x, data.parentCenter.x, 0.1, 'child start should snap to parent center x');
      closeTo(data.childStart.y, data.parentCenter.y, 0.1, 'child start should snap to parent center y');
    });

    it('select mode moves a pinned center and keeps child endpoints attached', async () => {
      await drawPolyline(page, [
        { x: 180, y: 540 },
        { x: 320, y: 410 },
        { x: 520, y: 520 },
      ], 1);

      const firstCenter = await page.evaluate(() => {
        const link = window.__drawDemo.getLinks()[0];
        return link.points[link.centerIndex];
      });

      await drawPolyline(page, [
        { x: firstCenter.x + 2, y: firstCenter.y + 2 },
        { x: firstCenter.x + 110, y: firstCenter.y - 80 },
        { x: firstCenter.x + 250, y: firstCenter.y - 30 },
      ], 2);

      await page.click('#selectModeBtn');
      await page.waitForFunction(() => window.__drawDemo.getMode() === 'select');

      await page.mouse.move(firstCenter.x, firstCenter.y);
      await page.mouse.down();
      await page.mouse.move(firstCenter.x + 70, firstCenter.y + 45, { steps: 8 });
      await page.mouse.up();

      const data = await page.evaluate(() => {
        const [parent, child] = window.__drawDemo.getLinks();
        return {
          parentCenter: parent.points[parent.centerIndex],
          childStart: child.points[0],
          childStartAnchorId: child.startAnchorId,
          mode: window.__drawDemo.getMode(),
        };
      });

      assert.equal(data.mode, 'select');
      assert.equal(data.childStartAnchorId, 'link-0');
      assert.ok(Math.hypot(data.parentCenter.x - firstCenter.x, data.parentCenter.y - firstCenter.y) > 40,
        'Parent center should move in select mode');
      closeTo(data.childStart.x, data.parentCenter.x, 0.1, 'pinned child start x');
      closeTo(data.childStart.y, data.parentCenter.y, 0.1, 'pinned child start y');
    });
  }
);
