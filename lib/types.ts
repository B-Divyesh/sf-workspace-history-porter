export const HANDOFF_FORMAT = 'workspace-history-porter/handoff';
export const HANDOFF_VERSION = 1;

export type EntryKind = 'task' | 'note' | 'link';
export type EntryStatus = 'todo' | 'doing' | 'done';
export type LinkKind = 'terminal' | 'pull-request' | 'test' | 'docs' | 'other';

export interface JournalEntry {
  id: string;
  kind: EntryKind;
  status: EntryStatus;
  title: string;
  note: string;
  url?: string;
  linkKind?: LinkKind;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  origin: string;
  entries: JournalEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Vault {
  version: 1;
  workspaces: Workspace[];
}

export interface EncryptedEnvelope {
  format: typeof HANDOFF_FORMAT;
  version: typeof HANDOFF_VERSION;
  encryption: {
    algorithm: 'AES-GCM';
    keyDerivation: 'PBKDF2-SHA-256';
    iterations: number;
    salt: string;
    iv: string;
  };
  ciphertext: string;
  exportedAt: string;
}

export function makeId(prefix = 'item'): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function emptyVault(): Vault {
  return { version: 1, workspaces: [] };
}

export function originFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return url.origin;
  } catch {
    return '';
  }
}

export function workspaceNameFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const path = url.pathname.split('/').filter(Boolean).slice(0, 2).join('/');
    return path ? `${url.hostname} / ${path}` : url.hostname;
  } catch {
    return 'My workspace';
  }
}
