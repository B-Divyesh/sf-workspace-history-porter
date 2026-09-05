import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const path of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) {
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

test('every public route provides canonical and social metadata', async ({ page }) => {
  for (const path of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /porter-social\.webp$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icon/180.png');
  }
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
