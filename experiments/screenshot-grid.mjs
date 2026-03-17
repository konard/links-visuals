import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.argv[2] || '3199';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

// Clear localStorage before loading to ensure default (4 links)
await page.goto(`http://localhost:${port}/grid.html`);
await page.evaluate(() => localStorage.clear());
await page.reload();

// Wait for page to load and render
await page.waitForTimeout(3000);

const screenshotPath = path.join(__dirname, '..', 'docs', 'screenshots', 'grid-2x2.png');
await page.screenshot({ path: screenshotPath });
console.log(`Screenshot saved to ${screenshotPath}`);

await browser.close();
