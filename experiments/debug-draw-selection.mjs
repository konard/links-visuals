import { chromium } from 'playwright';

const pageUrl = process.env.TEST_URL || 'http://localhost:8080/draw.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
await context.addInitScript(() => localStorage.clear());
const page = await context.newPage();
await page.goto(pageUrl);
await page.waitForFunction(() => window.__drawDemo);

async function drawPolyline(points, expectedLinkCount) {
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

await drawPolyline([
  { x: 180, y: 540 },
  { x: 320, y: 410 },
  { x: 520, y: 520 },
], 1);

const firstCenter = await page.evaluate(() => {
  const link = window.__drawDemo.getLinks()[0];
  return link.points[link.centerIndex];
});

await drawPolyline([
  { x: firstCenter.x + 2, y: firstCenter.y + 2 },
  { x: firstCenter.x + 110, y: firstCenter.y - 80 },
  { x: firstCenter.x + 250, y: firstCenter.y - 30 },
], 2);

await page.click('#selectModeBtn');
await page.waitForFunction(() => window.__drawDemo.getMode() === 'select');

const hit = await page.evaluate(({ x, y }) => {
  const element = document.elementFromPoint(x, y);
  return {
    tag: element?.tagName,
    className: element?.getAttribute?.('class'),
    linkId: element?.dataset?.linkId,
    pointIndex: element?.dataset?.pointIndex,
    anchored: element?.dataset?.anchored,
    pointerEvents: element ? getComputedStyle(element).pointerEvents : null,
    outerHTML: element?.outerHTML,
  };
}, firstCenter);

console.log(JSON.stringify({ firstCenter, hit }, null, 2));

await browser.close();
