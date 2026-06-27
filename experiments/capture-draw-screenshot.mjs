import { mkdir, copyFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const pageUrl = process.env.TEST_URL || 'http://localhost:8080/draw.html';
const caseStudyOutput = 'docs/case-studies/issue-27/images/draw-after.png';
const prOutput = 'docs/screenshots/draw-issue-27-after.png';

await mkdir('docs/case-studies/issue-27/images', { recursive: true });
await mkdir('docs/screenshots', { recursive: true });

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
    await page.mouse.move(point.x, point.y, { steps: 10 });
  }
  await page.mouse.up();
  await page.waitForFunction(
    count => window.__drawDemo?.getLinks().length === count,
    expectedLinkCount
  );
}

await drawPolyline([
  { x: 170, y: 540 },
  { x: 320, y: 410 },
  { x: 520, y: 520 },
], 1);

const center = await page.evaluate(() => {
  const link = window.__drawDemo.getLinks()[0];
  return link.points[link.centerIndex];
});

await drawPolyline([
  { x: center.x + 2, y: center.y + 2 },
  { x: center.x + 130, y: center.y - 90 },
  { x: center.x + 290, y: center.y - 30 },
], 2);

await page.click('#selectModeBtn');
await page.waitForFunction(() => window.__drawDemo.getMode() === 'select');
await page.mouse.move(center.x, center.y);
await page.mouse.down();
await page.mouse.move(center.x + 65, center.y + 45, { steps: 10 });
await page.mouse.up();

await page.screenshot({ path: caseStudyOutput });
await copyFile(caseStudyOutput, prOutput);
await browser.close();

console.log(caseStudyOutput);
console.log(prOutput);
