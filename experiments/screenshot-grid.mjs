import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto('http://localhost:3099/grid.html');

// Wait for page to load and render
await page.waitForTimeout(3000);

// Set slider to 9 links for a nice 3x3 grid
await page.evaluate(() => {
  const slider = document.getElementById('linkCountSlider');
  slider.value = 9;
  slider.dispatchEvent(new Event('input'));
});

await page.waitForTimeout(1000);

const screenshotPath = path.join(__dirname, '..', 'docs', 'screenshots', 'grid-3x3.png');
await page.screenshot({ path: screenshotPath });
console.log(`Screenshot saved to ${screenshotPath}`);

await browser.close();
