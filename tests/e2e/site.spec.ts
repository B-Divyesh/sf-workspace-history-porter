import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const path of ['/', '/privacy/', '/terms/']) {
  test(`${path} has a clean accessible shell`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((issue) => ['serious', 'critical'].includes(issue.impact || ''))).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}

test('license callback is stored and stripped without blocking the page', async ({ page }) => {
  await page.route('https://api.sociobot.in/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true,"reason":"ok","expires_at":null}' }));
  await page.goto('/?license=test-license#team');
  await expect(page).toHaveURL(/\/#team$/);
  expect(await page.evaluate(() => localStorage.getItem('sb_license:workspace-history-porter'))).toBe('test-license');
  await expect(page.locator('#license-status')).toContainText('active');
});

test('checkout uses only the production Sociobot billing endpoint', async ({ page }) => {
  await page.goto('/#team');
  await expect(page.locator('#buy-link')).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/workspace-history-porter/checkout'
  );
});

test('packaged extension and sidecar are downloadable', async ({ request }) => {
  const extension = await request.get('/downloads/workspace-history-porter-chrome.zip');
  const sidecar = await request.get('/downloads/porter-sidecar.mjs');
  expect(extension.ok()).toBe(true);
  expect(sidecar.ok()).toBe(true);
  expect((await extension.body()).byteLength).toBeGreaterThan(50_000);
});

test('390 px product links meet the 44 px touch-target baseline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This regression is specific to the required 390 px layout.');
  await page.goto('/');
  const targets = page.locator('.site-header nav a:visible, .format-grid article > a:visible, .legal-links a:visible, footer nav a:visible');
  expect(await targets.count()).toBeGreaterThan(0);
  for (const target of await targets.all()) {
    const box = await target.boundingBox();
    const label = (await target.textContent())?.trim();
    expect(box, `${label} should be rendered`).not.toBeNull();
    expect(box!.width, `${label} target width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${label} target height`).toBeGreaterThanOrEqual(44);
  }
});
