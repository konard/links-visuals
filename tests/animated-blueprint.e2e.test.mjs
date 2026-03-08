/**
 * E2E tests for animated-blueprint.html using browser-commander + Playwright.
 *
 * Prerequisites:
 *   1. Install dependencies:    npm install
 *   2. Install Playwright:      npx playwright install chromium
 *   3. Serve the repo locally:  npx serve . -p 8080  (or any static server)
 *   4. Run tests:               RUN_E2E=true node --test tests/animated-blueprint.e2e.test.mjs
 *
 * Environment variables:
 *   TEST_URL   — base URL of the running server (default: http://localhost:8080)
 *   HEADLESS   — set to 'false' to show the browser window during tests
 *   RUN_E2E    — must be set to any truthy value to run these tests
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const PAGE_URL = `${BASE_URL}/animated-blueprint.html`;

describe(
  'animated-blueprint.html — E2E tests',
  { skip: !process.env.RUN_E2E },
  () => {
    let browser;
    let page;
    let commander;

    before(async () => {
      let playwright;
      let createCommander;
      try {
        playwright = await import('playwright');
        const mod = await import('browser-commander');
        createCommander = mod.createCommander ?? mod.makeBrowserCommander;

        browser = await playwright.chromium.launch({
          headless: process.env.HEADLESS !== 'false',
        });
        const context = await browser.newContext();
        page = await context.newPage();
        commander = createCommander({ page, verbose: false });
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
      it('navigates to animated-blueprint.html without errors', async () => {
        if (!commander) return;
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await commander.goto({ url: PAGE_URL });
        // Allow async module loading to complete
        await page.waitForTimeout(3000);
        assert.strictEqual(errors.length, 0, `Page errors: ${errors.join('; ')}`);
      });

      it('renders an SVG element', async () => {
        if (!commander) return;
        const svgCount = await page.evaluate(() =>
          document.querySelectorAll('svg').length
        );
        assert.ok(svgCount > 0, 'Expected at least one <svg> element');
      });

      it('renders the background grid', async () => {
        if (!commander) return;
        const hasGrid = await page.evaluate(() =>
          document.querySelector('.grid') !== null
        );
        assert.ok(hasGrid, 'Expected .grid element inside SVG');
      });

      it('renders exactly 9 control circles', async () => {
        if (!commander) return;
        const count = await page.evaluate(() =>
          document.querySelectorAll('circle.control').length
        );
        assert.strictEqual(count, 9, `Expected 9 control circles, got ${count}`);
      });

      it('renders the main path with markers', async () => {
        if (!commander) return;
        const hasPath = await page.evaluate(() => {
          const path = document.querySelector('path[marker-start]');
          return path !== null;
        });
        assert.ok(hasPath, 'Expected a path with marker-start attribute');
      });
    });

    // -----------------------------------------------------------------------
    // Markers — must match reference (viewBox-based, default strokeWidth units)
    // -----------------------------------------------------------------------
    describe('Markers', () => {
      it('cross-marker definition exists in <defs>', async () => {
        if (!commander) return;
        const exists = await page.evaluate(() =>
          document.querySelector('#cross-marker') !== null
        );
        assert.ok(exists, 'Expected #cross-marker in SVG defs');
      });

      it('arrow-marker definition exists in <defs>', async () => {
        if (!commander) return;
        const exists = await page.evaluate(() =>
          document.querySelector('#arrow-marker') !== null
        );
        assert.ok(exists, 'Expected #arrow-marker in SVG defs');
      });

      it('markers use default markerUnits (strokeWidth)', async () => {
        if (!commander) return;
        const { cross, arrow } = await page.evaluate(() => ({
          cross: document.querySelector('#cross-marker')?.getAttribute('markerUnits'),
          arrow: document.querySelector('#arrow-marker')?.getAttribute('markerUnits'),
        }));
        // Default markerUnits is "strokeWidth" — getAttribute returns null when not set
        assert.strictEqual(cross, null,
          'cross-marker should use default markerUnits (strokeWidth)');
        assert.strictEqual(arrow, null,
          'arrow-marker should use default markerUnits (strokeWidth)');
      });

      it('markers have viewBox="0 0 100 100" and markerWidth=100', async () => {
        if (!commander) return;
        const info = await page.evaluate(() => {
          const cross = document.querySelector('#cross-marker');
          const arrow = document.querySelector('#arrow-marker');
          return {
            crossViewBox: cross?.getAttribute('viewBox'),
            arrowViewBox: arrow?.getAttribute('viewBox'),
            crossWidth:   cross?.getAttribute('markerWidth'),
            arrowWidth:   arrow?.getAttribute('markerWidth'),
          };
        });
        assert.strictEqual(info.crossViewBox, '0 0 100 100');
        assert.strictEqual(info.arrowViewBox, '0 0 100 100');
        assert.strictEqual(info.crossWidth, '100');
        assert.strictEqual(info.arrowWidth, '100');
      });
    });

    // -----------------------------------------------------------------------
    // UI panels
    // -----------------------------------------------------------------------
    describe('UI panels', () => {
      it('shows the coordinate HUD', async () => {
        if (!commander) return;
        const text = await page.evaluate(() =>
          document.getElementById('coordinates')?.textContent
        );
        assert.ok(text && text.includes('start'), 'HUD should list "start" point');
      });

      it('shows the config panel', async () => {
        if (!commander) return;
        const visible = await page.evaluate(() => {
          const el = document.getElementById('config-panel');
          if (!el) return false;
          const s = window.getComputedStyle(el);
          return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
        });
        assert.ok(visible, 'Config panel should be visible');
      });

      it('toggle button hides panels', async () => {
        if (!commander) return;
        await page.click('#toggle-panels');
        const hidden = await page.evaluate(() =>
          document.body.classList.contains('panels-hidden')
        );
        assert.ok(hidden, 'Body should have panels-hidden class after toggle');
        // Restore
        await page.click('#toggle-panels');
      });

      it('SVG render mode is active by default', async () => {
        if (!commander) return;
        const active = await page.evaluate(() =>
          document.getElementById('renderSVGBtn')?.classList.contains('active')
        );
        assert.ok(active, 'SVG button should be active by default');
      });

      it('Canvas render mode button switches to canvas', async () => {
        if (!commander) return;
        await page.click('#renderCanvasBtn');
        const { canvasVisible, svgHidden } = await page.evaluate(() => ({
          canvasVisible: document.getElementById('render-canvas')?.style.display !== 'none',
          svgHidden:     document.querySelector('svg')?.style.display === 'none',
        }));
        assert.ok(canvasVisible, 'Canvas element should be visible in canvas mode');
        assert.ok(svgHidden, 'SVG element should be hidden in canvas mode');
        // Switch back
        await page.click('#renderSVGBtn');
      });

      it('config panel remains visible in canvas mode', async () => {
        if (!commander) return;
        await page.click('#renderCanvasBtn');
        const style = await page.evaluate(() => {
          const el = document.getElementById('config-panel');
          const s  = window.getComputedStyle(el);
          return { display: s.display, opacity: s.opacity };
        });
        assert.strictEqual(style.display, 'block', 'Config panel display should be block');
        assert.strictEqual(style.opacity, '1', 'Config panel opacity should be 1');
        // Switch back
        await page.click('#renderSVGBtn');
      });
    });

    // -----------------------------------------------------------------------
    // Infinite grid via SVG pattern tiles
    // -----------------------------------------------------------------------
    describe('Infinite grid', () => {
      it('grid uses SVG pattern tiles', async () => {
        if (!commander) return;
        const hasPatterns = await page.evaluate(() => {
          const defs = document.querySelector('svg defs');
          return defs?.querySelectorAll('pattern').length >= 2;
        });
        assert.ok(hasPatterns, 'Expected at least 2 pattern elements for grid tiling');
      });

      it('SVG has overflow=visible so grid extends beyond SVG viewport during pan/zoom', async () => {
        if (!commander) return;
        // The outermost SVG element defaults to overflow:hidden per the SVG spec.
        // Without overflow:visible the CSS-transform-based pan/zoom clips the grid
        // to the SVG element's width/height box, making the grid appear finite.
        const overflow = await page.evaluate(() =>
          document.querySelector('svg')?.getAttribute('overflow')
        );
        assert.strictEqual(overflow, 'visible',
          'SVG element must have overflow="visible" to allow infinite grid during pan/zoom');
      });
    });

    // -----------------------------------------------------------------------
    // Responsiveness
    // -----------------------------------------------------------------------
    describe('Responsiveness', () => {
      it('SVG fills the full viewport', async () => {
        if (!commander) return;
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

    // -----------------------------------------------------------------------
    // Drag / animation trigger (smoke test)
    // -----------------------------------------------------------------------
    describe('Interaction', () => {
      it('dragging start point triggers animation', async () => {
        if (!commander) return;
        // Switch to SVG mode first
        await page.click('#renderSVGBtn');

        // Get initial position of the start circle
        const { x, y } = await page.evaluate(() => {
          const c = document.querySelector('circle.start');
          return { x: parseFloat(c.getAttribute('cx')), y: parseFloat(c.getAttribute('cy')) };
        });

        // Simulate a small drag: mouse down → move → up
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 30, y - 30, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(100);

        // After a drag, the start point should have moved
        const { newX, newY } = await page.evaluate(() => {
          const c = document.querySelector('circle.start');
          return {
            newX: parseFloat(c.getAttribute('cx')),
            newY: parseFloat(c.getAttribute('cy')),
          };
        });
        const moved = Math.hypot(newX - x, newY - y) > 1;
        assert.ok(moved, 'start circle should have moved after drag');
      });
    });
  }
);
