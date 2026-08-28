import './style.css';
import { browser } from 'wxt/browser';
import { clearSessionPassphrase, getSessionPassphrase, hasVault, loadVault, saveVault, setSessionPassphrase } from '../../lib/extension-store';
import { makeId, originFromUrl, workspaceNameFromUrl, type EntryKind, type Vault, type Workspace } from '../../lib/types';
import { upsertEntry, upsertWorkspace } from '../../lib/vault';

const lockedView = document.querySelector<HTMLElement>('#locked-view')!;
const journalView = document.querySelector<HTMLElement>('#journal-view')!;
const unlockForm = document.querySelector<HTMLFormElement>('#unlock-form')!;
const quickForm = document.querySelector<HTMLFormElement>('#quick-form')!;
const passphraseInput = document.querySelector<HTMLInputElement>('#passphrase')!;
const titleInput = document.querySelector<HTMLInputElement>('#entry-title')!;
const kindInput = document.querySelector<HTMLSelectElement>('#entry-kind')!;
const recentList = document.querySelector<HTMLUListElement>('#recent-list')!;
const emptyState = document.querySelector<HTMLElement>('#empty-state')!;
const status = document.querySelector<HTMLElement>('#status')!;
const lockButton = document.querySelector<HTMLButtonElement>('#lock-button')!;

let passphrase = '';
let vault: Vault;
let workspace: Workspace;
let activeUrl = '';
let capturedUrl = '';

function say(message: string, error = false) {
  status.textContent = message;
  status.style.color = error ? 'var(--seal)' : 'var(--mint)';
}

async function activeTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  activeUrl = tab?.url || '';
  document.querySelector<HTMLElement>('#current-origin')!.textContent = originFromUrl(activeUrl) || 'Browser page';
}

function currentWorkspace(): Workspace {
  const origin = originFromUrl(activeUrl);
  const found = vault.workspaces.find((item) => item.origin === origin);
  if (found) return found;
  const now = new Date().toISOString();
  return { id: makeId('workspace'), name: workspaceNameFromUrl(activeUrl), origin, entries: [], createdAt: now, updatedAt: now };
}

function render() {
  recentList.replaceChildren();
  const entries = workspace.entries.slice(0, 3);
  for (const entry of entries) {
    const li = document.createElement('li');
    const title = document.createElement('span');
    title.className = 'entry-title';
    title.textContent = entry.title;
    const meta = document.createElement('span');
    meta.className = 'entry-meta';
    meta.textContent = `${entry.kind} · ${entry.status}`;
    li.append(title, meta);
    recentList.append(li);
  }
  document.querySelector('#entry-count')!.textContent = String(workspace.entries.length);
  emptyState.hidden = workspace.entries.length > 0;
}

async function showJournal() {
  lockedView.hidden = true;
  journalView.hidden = false;
  lockButton.hidden = false;
  await activeTab();
  workspace = currentWorkspace();
  render();
  titleInput.focus();
}

unlockForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const candidate = passphraseInput.value;
  try {
    vault = await loadVault(candidate);
    passphrase = candidate;
    await setSessionPassphrase(candidate);
    if (!(await hasVault())) await saveVault(vault, passphrase);
    say('Journal unlocked.');
    await showJournal();
  } catch (error) {
    say(error instanceof Error ? error.message : 'Could not unlock the journal.', true);
    passphraseInput.select();
  }
});

quickForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const now = new Date().toISOString();
  workspace = upsertEntry(workspace, {
    id: makeId('entry'),
    kind: kindInput.value as EntryKind,
    status: 'todo',
    title: titleInput.value.trim(),
    note: '',
    url: capturedUrl || undefined,
    linkKind: capturedUrl ? 'other' : undefined,
    createdAt: now,
    updatedAt: now
  });
  vault = upsertWorkspace(vault, workspace);
  try {
    await saveVault(vault, passphrase);
    titleInput.value = '';
    capturedUrl = '';
    document.querySelector<HTMLButtonElement>('#capture-button')!.textContent = 'Use this tab';
    render();
    say('Sealed locally.');
    titleInput.focus();
  } catch {
    say('Could not save locally. Try again.', true);
  }
});

document.querySelector('#capture-button')!.addEventListener('click', async () => {
  if (!activeUrl || !/^https?:/.test(activeUrl)) {
    say('This browser page cannot be bookmarked.', true);
    return;
  }
  const origin = `${new URL(activeUrl).origin}/*`;
  try {
    const granted = await browser.permissions.request({ origins: [origin] });
    if (!granted) {
      say('Origin access was not granted. Nothing was captured.', true);
      return;
    }
    capturedUrl = activeUrl;
    kindInput.value = 'link';
    document.querySelector<HTMLButtonElement>('#capture-button')!.textContent = 'Tab attached ✓';
    say('Only the tab URL will be saved; page content is never read.');
  } catch {
    say('This browser did not allow origin access.', true);
  }
});

lockButton.addEventListener('click', async () => {
  await clearSessionPassphrase();
  passphrase = '';
  journalView.hidden = true;
  lockedView.hidden = false;
  lockButton.hidden = true;
  passphraseInput.value = '';
  say('Journal locked.');
  passphraseInput.focus();
});

document.querySelector('#open-journal')!.addEventListener('click', () => browser.runtime.openOptionsPage());

async function init() {
  const session = await getSessionPassphrase();
  if (!session) {
    passphraseInput.focus();
    return;
  }
  try {
    vault = await loadVault(session);
    passphrase = session;
    await showJournal();
  } catch {
    await clearSessionPassphrase();
    say('Your session expired. Unlock the journal again.', true);
  }
}

void init();
