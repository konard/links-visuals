// Take a screenshot of the reference version for comparison
import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1824, height: 1094 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  console.log('Loading reference version...');
  await page.goto(`${BASE_URL}/ref-test.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(15000);

  if (errors.length > 0) {
    console.error('Page errors:', errors);
  }

  await page.screenshot({ path: 'docs/screenshots/reference.png' });
  console.log('Saved docs/screenshots/reference.png');

  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
