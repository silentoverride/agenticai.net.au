import { chromium } from 'playwright';
const browser = await chromium.launch();

// Mobile screenshot of home
const ctxH = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const pageH = await ctxH.newPage();
await pageH.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const faqH = await pageH.$('.faq-section, .faq-list-simple');
if (faqH) {
  await faqH.scrollIntoViewIfNeeded();
  await pageH.evaluate(() => { const f = document.querySelector('details.faq-item'); if (f) f.open = true; });
  await pageH.waitForTimeout(200);
  const box = await faqH.boundingBox();
  await pageH.screenshot({ path: '/tmp/po-10-home-faq-mobile.png', clip: { x: 0, y: box.y, width: 375, height: Math.min(800, box.height + 20) } });
}

// Mobile screenshot of services
const ctxS = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const pageS = await ctxS.newPage();
await pageS.goto('http://localhost:5173/services', { waitUntil: 'networkidle' });
const faqS = await pageS.$('.faq-section, .faq-list-card');
if (faqS) {
  await faqS.scrollIntoViewIfNeeded();
  await pageS.waitForTimeout(200);
  const box = await faqS.boundingBox();
  await pageS.screenshot({ path: '/tmp/po-11-services-faq-mobile.png', clip: { x: 0, y: box.y, width: 375, height: Math.min(800, box.height + 20) } });
}

await browser.close();
console.log('done');
