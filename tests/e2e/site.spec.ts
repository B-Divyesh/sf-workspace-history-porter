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
  await page.route('https://pilot-api.sociobot.in/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true,"reason":"ok","expires_at":null}' }));
  await page.goto('/?license=test-license#team');
  await expect(page).toHaveURL(/\/#team$/);
  expect(await page.evaluate(() => localStorage.getItem('sb_license:workspace-history-porter'))).toBe('test-license');
  await expect(page.locator('#license-status')).toContainText('active');
});

test('packaged extension and sidecar are downloadable', async ({ request }) => {
  const extension = await request.get('/downloads/workspace-history-porter-chrome.zip');
  const sidecar = await request.get('/downloads/porter-sidecar.mjs');
  expect(extension.ok()).toBe(true);
  expect(sidecar.ok()).toBe(true);
  expect((await extension.body()).byteLength).toBeGreaterThan(50_000);
});
