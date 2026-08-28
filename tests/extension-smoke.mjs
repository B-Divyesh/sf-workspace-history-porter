import { chromium } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const userDataDir = await mkdtemp(join(tmpdir(), 'porter-extension-'));
const extensionPath = resolve('.output/chrome-mv3');
let context;

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker', { timeout: 10_000 });
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto(`chrome-extension://${extensionId}/options.html`);
  if (await page.locator('h1').count() !== 1 || await page.locator('main').count() !== 1) throw new Error('Extension shell is missing semantic landmarks.');
  await page.fill('#passphrase', 'test passphrase 123');
  await page.click('#unlock-form button[type=submit]');
  await page.waitForSelector('#journal-view:not([hidden])');
  await page.click('#new-workspace-button');
  await page.fill('#workspace-name', 'Remote API');
  await page.fill('#workspace-origin-input', 'https://dev.example.com');
  await page.click('#workspace-form button[type=submit]');
  await page.click('#add-entry-button');
  await page.fill('#entry-title', 'Run integration tests');
  await page.click('#entry-form button[type=submit]');
  await page.waitForSelector('.journal-card');
  const entry = await page.locator('.journal-card h3').textContent();
  if (entry !== 'Run integration tests') throw new Error('Journal entry was not saved and rendered.');
  if (errors.length) throw new Error(`Extension console errors: ${errors.join('; ')}`);
  process.stdout.write('Extension smoke test passed: unlock → workspace → journal entry; no console errors.\n');
} finally {
  await context?.close();
  await rm(userDataDir, { recursive: true, force: true });
}
