import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4173');
  await page.waitForTimeout(1000);

  // Open modal or check details
  await page.screenshot({ path: 'verification.png', fullPage: true });
  await browser.close();
  console.log('Verified preview');
})();
