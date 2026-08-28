import './style.css';
import { browser } from 'wxt/browser';
import { decryptPayload, isEncryptedEnvelope } from '../../lib/crypto';
import { downloadText, safeFilename } from '../../lib/download';
import {
  clearSessionPassphrase,
  getSessionPassphrase,
  hasVault,
  loadVault,
  readEncryptedVault,
  saveVault,
  setSessionPassphrase
} from '../../lib/extension-store';
import { cachedLicenseVerdict, saveLicense, verifySavedLicense } from '../../lib/extension-license';
import {
  makeId,
  type EntryKind,
  type EntryStatus,
  type LinkKind,
  type Vault,
  type Workspace
} from '../../lib/types';
import { mergeWorkspaces, removeEntry, toMarkdown, upsertEntry, upsertWorkspace } from '../../lib/vault';

const lockedView = document.querySelector<HTMLElement>('#locked-view')!;
const journalView = document.querySelector<HTMLElement>('#journal-view')!;
const unlockForm = document.querySelector<HTMLFormElement>('#unlock-form')!;
const passphraseInput = document.querySelector<HTMLInputElement>('#passphrase')!;
const unlockStatus = document.querySelector<HTMLElement>('#unlock-status')!;
const workspaceList = document.querySelector<HTMLUListElement>('#workspace-list')!;
const entryList = document.querySelector<HTMLOListElement>('#entry-list')!;
const emptyJournal = document.querySelector<HTMLElement>('#empty-journal')!;
const journalStatus = document.querySelector<HTMLElement>('#journal-status')!;
const workspaceDialog = document.querySelector<HTMLDialogElement>('#workspace-dialog')!;
const entryDialog = document.querySelector<HTMLDialogElement>('#entry-dialog')!;
const transferDialog = document.querySelector<HTMLDialogElement>('#transfer-dialog')!;

let vault: Vault;
let passphrase = '';
let selectedId = '';
let filter: 'all' | EntryKind = 'all';
let statusTimer = 0;
let teamUnlocked = false;

function selectedWorkspace(): Workspace | undefined {
  return vault?.workspaces.find((workspace) => workspace.id === selectedId);
}

function say(element: HTMLElement, message: string, error = false) {
  element.textContent = message;
  element.style.color = error ? 'var(--seal)' : 'var(--mint)';
  if (element === journalStatus) {
    element.classList.add('visible');
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => element.classList.remove('visible'), 2600);
  }
}

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function kindGlyph(kind: EntryKind): string {
  return kind === 'task' ? '✓' : kind === 'note' ? '≡' : '↗';
}

function renderWorkspaces() {
  workspaceList.replaceChildren();
  for (const workspace of vault.workspaces) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `workspace-button${workspace.id === selectedId ? ' active' : ''}`;
    button.setAttribute('aria-current', workspace.id === selectedId ? 'page' : 'false');
    const name = document.createElement('strong');
    name.textContent = workspace.name;
    const count = document.createElement('span');
    count.textContent = `${workspace.entries.length} ${workspace.entries.length === 1 ? 'entry' : 'entries'}`;
    button.append(name, count);
    button.addEventListener('click', () => {
      selectedId = workspace.id;
      render();
    });
    li.append(button);
    workspaceList.append(li);
  }
}

function renderEntries() {
  entryList.replaceChildren();
  const workspace = selectedWorkspace();
  const entries = (workspace?.entries || []).filter((entry) => filter === 'all' || entry.kind === filter);
  for (const entry of entries) {
    const item = document.createElement('li');
    item.className = 'journal-card';
    const mark = document.createElement('span');
    mark.className = 'kind-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = kindGlyph(entry.kind);
    const copy = document.createElement('div');
    copy.className = 'entry-copy';
    const title = document.createElement('h3');
    title.textContent = entry.title;
    const meta = document.createElement('span');
    meta.className = 'entry-meta';
    meta.textContent = `${entry.kind.replace('-', ' ')} · ${displayDate(entry.updatedAt)}`;
    copy.append(title, meta);
    if (entry.note) {
      const note = document.createElement('p');
      note.textContent = entry.note;
      copy.append(note);
    }
    if (entry.url) {
      const link = document.createElement('a');
      link.href = entry.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = entry.url;
      copy.append(link);
    }
    const actions = document.createElement('div');
    actions.className = 'entry-actions';
    const select = document.createElement('select');
    select.className = 'status-select';
    select.setAttribute('aria-label', `Status for ${entry.title}`);
    for (const [value, label] of [['todo', 'To do'], ['doing', 'In progress'], ['done', 'Done']] as const) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = entry.status === value;
      select.append(option);
    }
    select.addEventListener('change', async () => {
      if (!workspace) return;
      const updated = { ...entry, status: select.value as EntryStatus, updatedAt: new Date().toISOString() };
      vault = upsertWorkspace(vault, upsertEntry(workspace, updated));
      await persist('Status updated.');
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${entry.title}`);
    remove.textContent = '×';
    remove.addEventListener('click', async () => {
      if (!workspace || !confirm(`Delete “${entry.title}”? This cannot be undone.`)) return;
      vault = upsertWorkspace(vault, removeEntry(workspace, entry.id));
      await persist('Entry deleted.');
      render();
    });
    actions.append(select, remove);
    item.append(mark, copy, actions);
    entryList.append(item);
  }
  emptyJournal.hidden = entries.length > 0;
  const noEntries = workspace?.entries.length === 0;
  emptyJournal.querySelector('h3')!.textContent = noEntries ? 'No handoff trail yet' : 'No entries match this filter';
  emptyJournal.querySelector('p')!.textContent = noEntries
    ? 'Add the next task, a useful note, or a terminal/PR/test URL. Porter stores only what you enter.'
    : 'Choose another type above to see the rest of this workspace.';
}

function render() {
  if (!selectedId && vault.workspaces[0]) selectedId = vault.workspaces[0].id;
  const workspace = selectedWorkspace();
  renderWorkspaces();
  document.querySelector('#workspace-title')!.textContent = workspace?.name || 'Choose a workspace';
  document.querySelector('#workspace-origin')!.textContent = workspace?.origin || 'No workspace selected';
  const open = workspace?.entries.filter((entry) => entry.status !== 'done').length || 0;
  document.querySelector('#workspace-summary')!.textContent = workspace
    ? `${open} open · ${workspace.entries.length} total · Updated ${displayDate(workspace.updatedAt)}`
    : 'Create a workspace to start your portable index.';
  document.querySelector<HTMLButtonElement>('#add-entry-button')!.disabled = !workspace;
  renderEntries();
}

async function persist(message: string) {
  try {
    await saveVault(vault, passphrase);
    say(journalStatus, message);
  } catch {
    say(journalStatus, 'Could not save the encrypted journal.', true);
  }
}

function showJournal() {
  lockedView.hidden = true;
  journalView.hidden = false;
  document.querySelector<HTMLButtonElement>('#lock-button')!.hidden = false;
  render();
}

unlockForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const candidate = passphraseInput.value;
  try {
    vault = await loadVault(candidate);
    passphrase = candidate;
    await setSessionPassphrase(candidate);
    if (!(await hasVault())) await saveVault(vault, passphrase);
    showJournal();
  } catch (error) {
    say(unlockStatus, error instanceof Error ? error.message : 'Could not unlock the journal.', true);
    passphraseInput.select();
  }
});

document.querySelector('#lock-button')!.addEventListener('click', async () => {
  await clearSessionPassphrase();
  passphrase = '';
  journalView.hidden = true;
  lockedView.hidden = false;
  document.querySelector<HTMLButtonElement>('#lock-button')!.hidden = true;
  passphraseInput.value = '';
  passphraseInput.focus();
});

function openDialog(dialog: HTMLDialogElement, focus: HTMLElement) {
  dialog.showModal();
  requestAnimationFrame(() => focus.focus());
}

document.querySelector('#new-workspace-button')!.addEventListener('click', () => openDialog(workspaceDialog, document.querySelector('#workspace-name')!));
document.querySelector('#add-entry-button')!.addEventListener('click', () => openDialog(entryDialog, document.querySelector('#entry-title')!));
document.querySelector('#empty-add-button')!.addEventListener('click', () => {
  if (selectedWorkspace()) openDialog(entryDialog, document.querySelector('#entry-title')!);
  else openDialog(workspaceDialog, document.querySelector('#workspace-name')!);
});
document.querySelector('#transfer-button')!.addEventListener('click', () => openDialog(transferDialog, document.querySelector('#export-button')!));
document.querySelectorAll<HTMLElement>('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog')?.close()));

document.querySelector<HTMLFormElement>('#workspace-form')!.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const name = document.querySelector<HTMLInputElement>('#workspace-name')!.value.trim();
  const origin = document.querySelector<HTMLInputElement>('#workspace-origin-input')!.value.trim();
  if (!name) return;
  const now = new Date().toISOString();
  const workspace: Workspace = { id: makeId('workspace'), name, origin, entries: [], createdAt: now, updatedAt: now };
  vault = upsertWorkspace(vault, workspace);
  selectedId = workspace.id;
  await persist('Workspace created.');
  render();
  workspaceDialog.close();
  form.reset();
});

const kindInput = document.querySelector<HTMLSelectElement>('#entry-kind')!;
const linkFields = document.querySelector<HTMLElement>('#link-fields')!;
kindInput.addEventListener('change', () => {
  linkFields.hidden = kindInput.value !== 'link';
  document.querySelector<HTMLInputElement>('#entry-url')!.required = kindInput.value === 'link';
});

document.querySelector<HTMLFormElement>('#entry-form')!.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const workspace = selectedWorkspace();
  if (!workspace) return;
  const now = new Date().toISOString();
  const kind = kindInput.value as EntryKind;
  const updated = upsertEntry(workspace, {
    id: makeId('entry'),
    kind,
    status: document.querySelector<HTMLSelectElement>('#entry-status')!.value as EntryStatus,
    title: document.querySelector<HTMLInputElement>('#entry-title')!.value.trim(),
    note: document.querySelector<HTMLTextAreaElement>('#entry-note')!.value.trim(),
    url: kind === 'link' ? document.querySelector<HTMLInputElement>('#entry-url')!.value.trim() : undefined,
    linkKind: kind === 'link' ? document.querySelector<HTMLSelectElement>('#link-kind')!.value as LinkKind : undefined,
    createdAt: now,
    updatedAt: now
  });
  vault = upsertWorkspace(vault, updated);
  await persist('Sealed locally.');
  render();
  entryDialog.close();
  form.reset();
  linkFields.hidden = true;
});

document.querySelectorAll<HTMLButtonElement>('.filter').forEach((button) => button.addEventListener('click', () => {
  filter = button.dataset.filter as typeof filter;
  document.querySelectorAll<HTMLButtonElement>('.filter').forEach((item) => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  renderEntries();
}));

document.querySelector('#export-button')!.addEventListener('click', async () => {
  const envelope = await readEncryptedVault();
  if (!envelope) return say(document.querySelector('#transfer-status')!, 'There is no vault to export yet.', true);
  downloadText(JSON.stringify(envelope, null, 2), 'porter-encrypted-handoff.json', 'application/json');
  say(document.querySelector('#transfer-status')!, 'Encrypted handoff exported.');
});

document.querySelector('#markdown-button')!.addEventListener('click', () => {
  const workspace = selectedWorkspace();
  if (!workspace) return;
  if (!confirm('Export readable Markdown? Anyone with the file can read it; it is not encrypted.')) return;
  downloadText(toMarkdown(workspace), `${safeFilename(workspace.name)}-handoff.md`, 'text/markdown');
  say(document.querySelector('#transfer-status')!, 'Readable Markdown exported.');
});

document.querySelector<HTMLInputElement>('#import-file')!.addEventListener('change', async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const target = document.querySelector<HTMLElement>('#transfer-status')!;
  try {
    const parsed: unknown = JSON.parse(await file.text());
    if (!isEncryptedEnvelope(parsed)) throw new Error('Choose a Porter encrypted JSON handoff.');
    const incoming = await decryptPayload<Vault>(parsed, passphrase);
    if (!Array.isArray(incoming?.workspaces)) throw new Error('The handoff does not contain a workspace journal.');
    const choice = prompt('Type MERGE to combine entries, or REPLACE to use only the imported vault. Cancel keeps your current journal.');
    if (!choice) return;
    if (choice.toUpperCase() === 'MERGE') vault = mergeWorkspaces(vault, incoming.workspaces);
    else if (choice.toUpperCase() === 'REPLACE') vault = incoming;
    else throw new Error('Import canceled: enter MERGE or REPLACE exactly.');
    selectedId = vault.workspaces[0]?.id || '';
    await persist('Handoff imported.');
    render();
    say(target, `${incoming.workspaces.length} workspace${incoming.workspaces.length === 1 ? '' : 's'} imported.`);
  } catch (error) {
    say(target, error instanceof Error ? error.message : 'Could not import this file.', true);
  } finally {
    input.value = '';
  }
});

function sidecarBase(): string {
  return document.querySelector<HTMLInputElement>('#sidecar-url')!.value.replace(/\/$/, '');
}

function sidecarState(message: string, online: boolean) {
  const pill = document.querySelector<HTMLElement>('#sidecar-state')!;
  pill.innerHTML = '<span aria-hidden="true">●</span> ';
  pill.append(message);
  pill.querySelector('span')!.style.color = online ? 'var(--mint)' : 'var(--seal)';
}

function renderLicense(valid: boolean, message: string) {
  teamUnlocked = valid;
  document.querySelector<HTMLButtonElement>('#sidecar-push')!.disabled = !valid;
  document.querySelector<HTMLButtonElement>('#sidecar-pull')!.disabled = !valid;
  const output = document.querySelector<HTMLElement>('#extension-license-status')!;
  output.textContent = message;
  output.style.color = valid ? 'var(--mint)' : 'var(--muted)';
  sidecarState(valid ? 'Team unlocked' : 'License needed', valid);
}

async function refreshLicense(force = false) {
  const cached = await cachedLicenseVerdict();
  if (cached?.valid) renderLicense(true, 'Team Relay available from the last successful check.');
  const verdict = await verifySavedLicense(force);
  if (!verdict) return renderLicense(false, 'Paste a license token to unlock the sidecar.');
  renderLicense(verdict.valid, verdict.valid ? 'Team Relay license active.' : 'License no longer active. Restore another token or buy Team Relay.');
}

document.querySelector('#verify-license')!.addEventListener('click', async () => {
  const token = document.querySelector<HTMLInputElement>('#extension-license')!.value.trim();
  if (!token) return renderLicense(false, 'Paste the license token from your receipt.');
  await saveLicense(token);
  renderLicense(false, 'Checking license…');
  await refreshLicense(true);
});

document.querySelector('#sidecar-push')!.addEventListener('click', async () => {
  if (!teamUnlocked) return;
  const target = document.querySelector<HTMLElement>('#transfer-status')!;
  try {
    const envelope = await readEncryptedVault();
    if (!envelope) throw new Error('There is no encrypted vault to push.');
    const response = await fetch(`${sidecarBase()}/journal`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(envelope) });
    if (!response.ok) throw new Error(`Sidecar returned ${response.status}.`);
    sidecarState('Sidecar online', true);
    say(target, 'Encrypted vault pushed to the workspace sidecar.');
  } catch {
    sidecarState('Sidecar offline', false);
    say(target, 'Could not reach the sidecar. Start it in the workspace and check the address.', true);
  }
});

document.querySelector('#sidecar-pull')!.addEventListener('click', async () => {
  if (!teamUnlocked) return;
  const target = document.querySelector<HTMLElement>('#transfer-status')!;
  try {
    const response = await fetch(`${sidecarBase()}/journal`);
    if (!response.ok) throw new Error(`Sidecar returned ${response.status}.`);
    const envelope: unknown = await response.json();
    if (!isEncryptedEnvelope(envelope)) throw new Error('The sidecar file is not a valid Porter handoff.');
    const incoming = await decryptPayload<Vault>(envelope, passphrase);
    vault = mergeWorkspaces(vault, incoming.workspaces);
    selectedId ||= vault.workspaces[0]?.id || '';
    await persist('Sidecar merged.');
    render();
    sidecarState('Sidecar online', true);
    say(target, 'Sidecar vault decrypted and merged.');
  } catch (error) {
    sidecarState('Sidecar offline', false);
    say(target, error instanceof Error ? error.message : 'Could not pull from the sidecar.', true);
  }
});

async function init() {
  void refreshLicense();
  const session = await getSessionPassphrase();
  if (!session) {
    passphraseInput.focus();
    return;
  }
  try {
    vault = await loadVault(session);
    passphrase = session;
    showJournal();
  } catch {
    await clearSessionPassphrase();
    say(unlockStatus, 'Your previous browser session could not be restored. Unlock again.', true);
    passphraseInput.focus();
  }
}

void init();
