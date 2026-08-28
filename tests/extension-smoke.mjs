import { chromium } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const userDataDir = await mkdtemp(join(tmpdir(), 'porter-extension-'));
const extensionPath = resolve('.output/chrome-mv3');
let context;

async function waitForExtensionId(browserContext) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const extensionUrl = [
      ...browserContext.serviceWorkers().map((worker) => worker.url()),
      ...browserContext.pages().map((page) => page.url())
    ].find((url) => url.startsWith('chrome-extension://'));
    if (extensionUrl) return new URL(extensionUrl).host;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error('Extension did not expose an options page or service worker within 30 seconds.');
}

async function openOptionsAfterInstall(page, optionsUrl) {
  if (page.url().startsWith(optionsUrl)) {
    await page.waitForLoadState('domcontentloaded');
    return;
  }
  let lastError;
  // Chromium may still be honoring runtime.openOptionsPage() from onInstalled
  // when this fresh-profile smoke test opens its own tab. Let that internal
  // chrome://extensions/?options= navigation settle, then load the real shell.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(optionsUrl, { waitUntil: 'domcontentloaded' });
      if (page.url().startsWith(optionsUrl)) return;
    } catch (error) {
      lastError = error;
    }
    await page.waitForLoadState('domcontentloaded', { timeout: 2_000 }).catch(() => {});
    await page.waitForTimeout(100);
  }
  throw lastError || new Error(`Could not open extension options at ${optionsUrl}.`);
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  const errors = [];
  const monitorPage = (candidate) => {
    candidate.on('pageerror', (error) => errors.push(error.message));
    candidate.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  };
  context.pages().forEach(monitorPage);
  context.on('page', monitorPage);

  const extensionId = await waitForExtensionId(context);
  const optionsUrl = `chrome-extension://${extensionId}/options.html`;
  const page = context.pages().find((candidate) => candidate.url().startsWith(optionsUrl)) || await context.newPage();

  await openOptionsAfterInstall(page, optionsUrl);
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
