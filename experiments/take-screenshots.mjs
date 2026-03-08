// Quick script to take screenshots of the animated-blueprint.html page
// Usage: node experiments/take-screenshots.mjs

import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const PAGE_URL = `${BASE_URL}/animated-blueprint.html`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1824, height: 1094 } });
  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('Navigating to', PAGE_URL);
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

  // Wait for D3 and modules to load
  console.log('Waiting 15 seconds for full page load...');
  await page.waitForTimeout(15000);

  if (errors.length > 0) {
    console.error('Page errors:', errors);
  }

  // Check SVG exists
  const svgCount = await page.evaluate(() => document.querySelectorAll('svg').length);
  console.log('SVG count:', svgCount);

  // Check circles
  const circleCount = await page.evaluate(() => document.querySelectorAll('circle.control').length);
  console.log('Control circles:', circleCount);

  // Check path
  const pathExists = await page.evaluate(() => document.querySelector('path[marker-start]') !== null);
  console.log('Main path exists:', pathExists);

  // Check markers
  const markerInfo = await page.evaluate(() => {
    const cross = document.querySelector('#cross-marker');
    const arrow = document.querySelector('#arrow-marker');
    return {
      crossExists: cross !== null,
      arrowExists: arrow !== null,
      crossMarkerUnits: cross?.getAttribute('markerUnits'),
      arrowMarkerUnits: arrow?.getAttribute('markerUnits'),
      crossMarkerWidth: cross?.getAttribute('markerWidth'),
      arrowMarkerWidth: arrow?.getAttribute('markerWidth'),
    };
  });
  console.log('Marker info:', markerInfo);

  // Check HUD
  const hudText = await page.evaluate(() => document.getElementById('coordinates')?.textContent?.substring(0, 100));
  console.log('HUD text:', hudText);

  // Take SVG mode screenshot
  console.log('Taking SVG mode screenshot...');
  await page.screenshot({ path: 'docs/screenshots/svg-mode.png' });
  console.log('Saved docs/screenshots/svg-mode.png');

  // Switch to Canvas mode
  console.log('Switching to Canvas mode...');
  await page.click('#renderCanvasBtn');
  await page.waitForTimeout(2000);

  // Check that config panel is still visible
  const configVisible = await page.evaluate(() => {
    const el = document.getElementById('config-panel');
    const style = window.getComputedStyle(el);
    return { display: style.display, opacity: style.opacity, zIndex: style.zIndex };
  });
  console.log('Config panel in canvas mode:', configVisible);

  await page.screenshot({ path: 'docs/screenshots/canvas-mode.png' });
  console.log('Saved docs/screenshots/canvas-mode.png');

  // Switch back to SVG
  await page.click('#renderSVGBtn');
  await page.waitForTimeout(1000);

  await browser.close();
  console.log('Done!');

  if (errors.length > 0) {
    console.error('\nERRORS DETECTED:');
    errors.forEach(e => console.error(' -', e));
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
