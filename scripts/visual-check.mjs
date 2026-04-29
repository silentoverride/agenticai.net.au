import { chromium } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

const pages = [
  { name: 'home', path: '/' },
  { name: 'services', path: '/services' },
  { name: 'contact', path: '/contact' }
];

const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const viewport of viewports) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  for (const target of pages) {
    await page.goto(`${baseUrl}${target.path}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('body');
    await page.waitForTimeout(600);

    const pageState = await page.evaluate(() => {
      return {
        canvases: document.querySelectorAll('canvas').length,
        opportunityVisuals: document.querySelectorAll('.opportunity-map, .report-stack').length,
        bodyText: document.body.innerText
      };
    });

    if (pageState.canvases > 0) {
      throw new Error(`${target.name} ${viewport.name} should not render the globe canvas`);
    }

    if (target.name === 'home' && pageState.opportunityVisuals < 2) {
      throw new Error(`${target.name} ${viewport.name} opportunity visuals did not render`);
    }

    if (!pageState.bodyText.toLowerCase().includes('ai business assessment')) {
      throw new Error(`${target.name} ${viewport.name} core assessment copy is missing`);
    }

    await page.screenshot({
      path: `/tmp/agenticai-${target.name}-${viewport.name}.png`,
      fullPage: true
    });
  }
}

await browser.close();
console.log('Visual checks passed for desktop and mobile assessment layout rendering.');
