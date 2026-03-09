/**
 * E2E tests for blueprint.html using Playwright.
 *
 * Prerequisites:
 *   1. Install dependencies:    npm install
 *   2. Install Playwright:      npx playwright install chromium
 *   3. Serve the repo locally:  npx serve . -p 8080  (or any static server)
 *   4. Run tests:               RUN_E2E=true node --test tests/blueprint.e2e.test.mjs
 *
 * Environment variables:
 *   TEST_URL   — base URL of the running server (default: http://localhost:8080)
 *   HEADLESS   — set to 'false' to show the browser window during tests
 *   RUN_E2E    — must be set to any truthy value to run these tests
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const PAGE_URL = `${BASE_URL}/blueprint.html`;

describe(
  'blueprint.html — E2E tests',
  { skip: !process.env.RUN_E2E },
  () => {
    let browser;
    let page;

    before(async () => {
      let playwright;
      try {
        playwright = await import('playwright');
        browser = await playwright.chromium.launch({
          headless: process.env.HEADLESS !== 'false',
        });
        const context = await browser.newContext();
        page = await context.newPage();
      } catch (err) {
        console.error('Could not start browser:', err.message);
      }
    });

    after(async () => {
      if (browser) await browser.close();
    });

    // -----------------------------------------------------------------------
    // Page load
    // -----------------------------------------------------------------------
    describe('Page load', () => {
      it('navigates to blueprint.html without errors', async () => {
        if (!page) return;
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(PAGE_URL);
        await page.waitForTimeout(3000);
        assert.strictEqual(errors.length, 0, `Page errors: ${errors.join('; ')}`);
      });

      it('renders an SVG element', async () => {
        if (!page) return;
        const svgCount = await page.evaluate(() =>
          document.querySelectorAll('svg').length
        );
        assert.ok(svgCount > 0, 'Expected at least one <svg> element');
      });

      it('renders the background grid', async () => {
        if (!page) return;
        const hasGrid = await page.evaluate(() =>
          document.querySelector('.grid') !== null
        );
        assert.ok(hasGrid, 'Expected .grid element inside SVG');
      });

      it('renders exactly 9 control circles', async () => {
        if (!page) return;
        const count = await page.evaluate(() =>
          document.querySelectorAll('circle.control').length
        );
        assert.strictEqual(count, 9, `Expected 9 control circles, got ${count}`);
      });

      it('renders the main path with markers', async () => {
        if (!page) return;
        const hasPath = await page.evaluate(() => {
          const path = document.querySelector('path[marker-start]');
          return path !== null;
        });
        assert.ok(hasPath, 'Expected a path with marker-start attribute');
      });
    });

    // -----------------------------------------------------------------------
    // Infinite grid via SVG pattern tiles
    // -----------------------------------------------------------------------
    describe('Infinite grid', () => {
      it('grid uses SVG pattern tiles', async () => {
        if (!page) return;
        const hasPatterns = await page.evaluate(() => {
          const defs = document.querySelector('svg defs');
          return defs?.querySelectorAll('pattern').length >= 2;
        });
        assert.ok(hasPatterns, 'Expected at least 2 pattern elements for grid tiling');
      });

      it('SVG has overflow=visible so grid extends beyond SVG viewport during pan/zoom', async () => {
        if (!page) return;
        const overflow = await page.evaluate(() =>
          document.querySelector('svg')?.getAttribute('overflow')
        );
        assert.strictEqual(overflow, 'visible',
          'SVG element must have overflow="visible" to allow infinite grid during pan/zoom');
      });
    });

    // -----------------------------------------------------------------------
    // Zoom works at any point on the infinite grid (bug fix: pointer-events)
    // -----------------------------------------------------------------------
    describe('Zoom at any grid position', () => {
      it('SVG element has pointer-events:all so empty grid areas receive wheel events', async () => {
        if (!page) return;
        const pointerEvents = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          return svg ? svg.style.pointerEvents : null;
        });
        assert.strictEqual(pointerEvents, 'all',
          'SVG element must have pointer-events:all so wheel/mouse events fire everywhere on grid');
      });

      it('zoom via wheel works at the top-left corner of the viewport (empty grid area)', async () => {
        if (!page) return;

        const scaleBefore = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          const transform = svg ? svg.style.transform : '';
          const scaleMatch = transform.match(/scale\(([^)]+)\)/);
          return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        });

        // Scroll at top-left corner (5, 5) — far from the arrow link in the center
        await page.mouse.wheel({ deltaY: -120 }, { x: 5, y: 5 });
        await page.waitForTimeout(100);

        const scaleAfter = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          const transform = svg ? svg.style.transform : '';
          const scaleMatch = transform.match(/scale\(([^)]+)\)/);
          return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        });

        assert.notStrictEqual(scaleAfter, scaleBefore,
          'Scale should change when scrolling at top-left corner (empty grid area)');
        assert.ok(scaleAfter > scaleBefore,
          'Scrolling up (negative deltaY) should zoom in');
      });

      it('zoom via wheel works at the bottom-right corner of the viewport (empty grid area)', async () => {
        if (!page) return;

        const { vpW, vpH } = await page.evaluate(() => ({
          vpW: window.innerWidth,
          vpH: window.innerHeight,
        }));

        const scaleBefore = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          const transform = svg ? svg.style.transform : '';
          const scaleMatch = transform.match(/scale\(([^)]+)\)/);
          return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        });

        await page.mouse.wheel({ deltaY: 120 }, { x: vpW - 5, y: vpH - 5 });
        await page.waitForTimeout(100);

        const scaleAfter = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          const transform = svg ? svg.style.transform : '';
          const scaleMatch = transform.match(/scale\(([^)]+)\)/);
          return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        });

        assert.notStrictEqual(scaleAfter, scaleBefore,
          'Scale should change when scrolling at bottom-right corner (empty grid area)');
        assert.ok(scaleAfter < scaleBefore,
          'Scrolling down (positive deltaY) should zoom out');
      });

      it('zoom via wheel works at the top-right corner of the viewport (empty grid area)', async () => {
        if (!page) return;

        const vpW = await page.evaluate(() => window.innerWidth);

        const scaleBefore = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          const transform = svg ? svg.style.transform : '';
          const scaleMatch = transform.match(/scale\(([^)]+)\)/);
          return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        });

        await page.mouse.wheel({ deltaY: -120 }, { x: vpW - 5, y: 5 });
        await page.waitForTimeout(100);

        const scaleAfter = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          const transform = svg ? svg.style.transform : '';
          const scaleMatch = transform.match(/scale\(([^)]+)\)/);
          return scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        });

        assert.notStrictEqual(scaleAfter, scaleBefore,
          'Scale should change when scrolling at top-right corner (empty grid area)');
      });

      it('pan via drag works at empty grid areas', async () => {
        if (!page) return;

        const offsetBefore = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          const transform = svg ? svg.style.transform : '';
          const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
          return translateMatch
            ? { x: parseFloat(translateMatch[1]), y: parseFloat(translateMatch[2]) }
            : { x: 0, y: 0 };
        });

        // Drag from top-left corner (empty grid area, not on any link/circle)
        await page.mouse.move(10, 10);
        await page.mouse.down();
        await page.mouse.move(110, 60, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(100);

        const offsetAfter = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          const transform = svg ? svg.style.transform : '';
          const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
          return translateMatch
            ? { x: parseFloat(translateMatch[1]), y: parseFloat(translateMatch[2]) }
            : { x: 0, y: 0 };
        });

        const panDist = Math.hypot(offsetAfter.x - offsetBefore.x, offsetAfter.y - offsetBefore.y);
        assert.ok(panDist > 1,
          'Canvas should have panned when dragging from empty grid area');
      });
    });

    // -----------------------------------------------------------------------
    // UI panels
    // -----------------------------------------------------------------------
    describe('UI panels', () => {
      it('shows the coordinate HUD', async () => {
        if (!page) return;
        const text = await page.evaluate(() =>
          document.getElementById('coordinates')?.textContent
        );
        assert.ok(text && text.includes('start'), 'HUD should list "start" point');
      });

      it('shows the config panel with offset sliders', async () => {
        if (!page) return;
        const hasSliders = await page.evaluate(() =>
          document.getElementById('startOffsetSlider') !== null &&
          document.getElementById('endOffsetSlider') !== null
        );
        assert.ok(hasSliders, 'Config panel should have start and end offset sliders');
      });

      it('toggle button hides panels', async () => {
        if (!page) return;
        await page.click('#toggle-panels');
        const hidden = await page.evaluate(() =>
          document.body.classList.contains('panels-hidden')
        );
        assert.ok(hidden, 'Body should have panels-hidden class after toggle');
        // Restore
        await page.click('#toggle-panels');
      });
    });

    // -----------------------------------------------------------------------
    // Responsiveness
    // -----------------------------------------------------------------------
    describe('Responsiveness', () => {
      it('SVG fills the full viewport', async () => {
        if (!page) return;
        const { svgW, svgH, vpW, vpH } = await page.evaluate(() => ({
          svgW: parseFloat(document.querySelector('svg')?.getAttribute('width') || '0'),
          svgH: parseFloat(document.querySelector('svg')?.getAttribute('height') || '0'),
          vpW: window.innerWidth,
          vpH: window.innerHeight,
        }));
        assert.strictEqual(svgW, vpW, 'SVG width should match viewport width');
        assert.strictEqual(svgH, vpH, 'SVG height should match viewport height');
      });
    });
  }
);
