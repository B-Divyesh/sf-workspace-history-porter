import { browser } from 'wxt/browser';
import { decryptPayload, encryptPayload, isEncryptedEnvelope } from './crypto';
import { emptyVault, type EncryptedEnvelope, type Vault } from './types';

const VAULT_KEY = 'porter:vault';
const PASSPHRASE_KEY = 'porter:session-passphrase';

export async function hasVault(): Promise<boolean> {
  const result = await browser.storage.local.get(VAULT_KEY);
  return isEncryptedEnvelope(result[VAULT_KEY]);
}

export async function getSessionPassphrase(): Promise<string | null> {
  const result = await browser.storage.session.get(PASSPHRASE_KEY);
  return typeof result[PASSPHRASE_KEY] === 'string' ? result[PASSPHRASE_KEY] : null;
}

export async function setSessionPassphrase(passphrase: string): Promise<void> {
  await browser.storage.session.set({ [PASSPHRASE_KEY]: passphrase });
}

export async function clearSessionPassphrase(): Promise<void> {
  await browser.storage.session.remove(PASSPHRASE_KEY);
}

export async function loadVault(passphrase: string): Promise<Vault> {
  const result = await browser.storage.local.get(VAULT_KEY);
  const envelope = result[VAULT_KEY];
  if (!envelope) return emptyVault();
  if (!isEncryptedEnvelope(envelope)) throw new Error('The local vault format is not supported.');
  const vault = await decryptPayload<Vault>(envelope, passphrase);
  if (vault?.version !== 1 || !Array.isArray(vault.workspaces)) throw new Error('The decrypted vault is damaged.');
  return vault;
}

export async function saveVault(vault: Vault, passphrase: string): Promise<void> {
  const envelope = await encryptPayload(vault, passphrase);
  await browser.storage.local.set({ [VAULT_KEY]: envelope });
}

export async function readEncryptedVault(): Promise<EncryptedEnvelope | null> {
  const result = await browser.storage.local.get(VAULT_KEY);
  return isEncryptedEnvelope(result[VAULT_KEY]) ? result[VAULT_KEY] : null;
}

export async function replaceEncryptedVault(envelope: EncryptedEnvelope): Promise<void> {
  await browser.storage.local.set({ [VAULT_KEY]: envelope });
}
