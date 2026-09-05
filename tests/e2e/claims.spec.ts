import { expect, test } from '@playwright/test';

test('@claim:demo-sample-journal opens a realistic populated journal', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Review a remote workspace handoff');
  await expect(page.getByText('Demo — sample data, nothing is saved to your real journal.')).toBeVisible();
  await expect(page.locator('#demo-entries .demo-entry')).toHaveCount(3);
  await expect(page.locator('#demo-entries')).toContainText('Run integration tests before the deploy');
  await expect(page.locator('#demo-entries')).toContainText('Pull request #482');
});

test('@claim:demo-isolation reset changes only sample storage', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('workspace-history-porter:real-fixture', 'keep-this'));
  await page.goto('/demo/');
  await page.getByLabel('Add a sample task').fill('Check the rate limit response');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.locator('#demo-entries')).toContainText('Check the rate limit response');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#demo-entries .demo-entry')).toHaveCount(3);
  await expect(page.locator('#demo-entries')).not.toContainText('Check the rate limit response');
  expect(await page.evaluate(() => localStorage.getItem('workspace-history-porter:real-fixture'))).toBe('keep-this');
  expect(await page.evaluate(() => localStorage.getItem('demo:workspace-history-porter:sample:v1'))).not.toBeNull();
});

test('@claim:site-local-requests makes no third-party requests', async ({ page, baseURL }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  for (const path of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) await page.goto(path);
  const expectedOrigin = new URL(baseURL!).origin;
  expect(requested.length).toBeGreaterThan(0);
  expect(requested.every((url) => new URL(url).origin === expectedOrigin)).toBe(true);
});

test('@claim:download-artifacts serves the extension and sidecar', async ({ request }) => {
  const extension = await request.get('/downloads/workspace-history-porter-chrome.zip');
  const sidecar = await request.get('/downloads/porter-sidecar.mjs');
  expect(extension.ok()).toBe(true);
  expect(sidecar.ok()).toBe(true);
  expect((await extension.body()).byteLength).toBeGreaterThan(50_000);
  await expect(sidecar.text()).resolves.toContain('workspace-history-porter-sidecar');
});
