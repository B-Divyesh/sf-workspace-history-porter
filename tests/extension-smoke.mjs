import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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

async function assertNoSeriousA11yViolations(page, state) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((issue) => ['serious', 'critical'].includes(issue.impact || ''));
  if (blocking.length) throw new Error(`${state} extension accessibility violations: ${blocking.map(({ id }) => id).join(', ')}`);
}

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    offline: true,
    reducedMotion: 'reduce',
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
  await assertNoSeriousA11yViolations(page, 'Locked');
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => ({
    href: document.activeElement?.getAttribute('href'),
    outline: document.activeElement ? getComputedStyle(document.activeElement).outlineStyle : 'none'
  }));
  if (firstFocus.href !== '#main' || firstFocus.outline === 'none') throw new Error(`Extension skip link is not the first visible keyboard focus: ${JSON.stringify(firstFocus)}`);
  await page.fill('#passphrase', 'test passphrase 123');
  await page.press('#passphrase', 'Enter');
  await page.waitForSelector('#journal-view:not([hidden])');
  await page.click('#new-workspace-button');
  await page.fill('#workspace-name', 'Remote API');
  await page.fill('#workspace-origin-input', 'https://dev.example.com');
  await page.click('#workspace-form button[type=submit]');
  await page.click('#add-entry-button');
  await page.fill('#entry-title', 'Run integration tests');
  await page.press('#entry-title', 'Enter');
  await page.waitForSelector('.journal-card');
  const entry = await page.locator('.journal-card h3').textContent();
  if (entry !== 'Run integration tests') throw new Error('Journal entry was not saved and rendered.');

  await page.selectOption('.status-select', 'done');
  await page.waitForFunction(() => document.querySelector('#workspace-summary')?.textContent?.startsWith('0 open · 1 total'));

  await page.setViewportSize({ width: 390, height: 844 });
  const transferButton = page.locator('#transfer-button');
  if (!await transferButton.isVisible()) throw new Error('Transfer is not reachable at the required 390 px viewport.');
  const transferBox = await transferButton.boundingBox();
  if (!transferBox || transferBox.height < 44) throw new Error(`Mobile transfer target is below 44 px: ${JSON.stringify(transferBox)}`);
  await transferButton.click();
  await page.waitForSelector('#transfer-dialog[open]');

  const downloadPromise = page.waitForEvent('download');
  await page.click('#export-button');
  const download = await downloadPromise;
  const handoffPath = join(userDataDir, 'mobile-transfer-handoff.json');
  await download.saveAs(handoffPath);
  await page.click('#transfer-dialog [data-close]');

  await page.click('#add-entry-button');
  await page.fill('#entry-title', 'Temporary local task');
  await page.press('#entry-title', 'Enter');
  await page.waitForFunction(() => document.querySelectorAll('.journal-card').length === 2);

  await transferButton.click();
  page.once('dialog', (dialog) => dialog.accept('REPLACE'));
  await page.setInputFiles('#import-file', handoffPath);
  await page.waitForFunction(() => document.querySelectorAll('.journal-card').length === 1);
  if (await page.locator('.journal-card h3').textContent() !== 'Run integration tests') {
    throw new Error('Mobile encrypted export/import did not restore the exported journal.');
  }
  if (!await page.locator('#transfer-status').textContent().then((value) => value?.includes('1 workspace imported'))) {
    throw new Error('Mobile encrypted import did not report its result.');
  }
  await assertNoSeriousA11yViolations(page, 'Unlocked');
  if (errors.length) throw new Error(`Extension console errors: ${errors.join('; ')}`);
  process.stdout.write('Extension smoke passed: journal, live status summary, and 390 px encrypted export/import; no console errors.\n');
} finally {
  await context?.close();
  await rm(userDataDir, { recursive: true, force: true });
}
