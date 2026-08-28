import type { JournalEntry, Vault, Workspace } from './types';

export function upsertWorkspace(vault: Vault, workspace: Workspace): Vault {
  const index = vault.workspaces.findIndex((item) => item.id === workspace.id);
  const workspaces = [...vault.workspaces];
  if (index === -1) workspaces.unshift(workspace);
  else workspaces[index] = workspace;
  return { ...vault, workspaces };
}

export function mergeWorkspaces(vault: Vault, incoming: Workspace[]): Vault {
  let result = vault;
  for (const source of incoming) {
    const existing = result.workspaces.find((item) => item.id === source.id || (
      item.origin === source.origin && item.name === source.name
    ));
    if (!existing) {
      result = upsertWorkspace(result, source);
      continue;
    }
    const byId = new Map(existing.entries.map((entry) => [entry.id, entry]));
    for (const entry of source.entries) {
      const prior = byId.get(entry.id);
      if (!prior || prior.updatedAt < entry.updatedAt) byId.set(entry.id, entry);
    }
    result = upsertWorkspace(result, {
      ...existing,
      entries: [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      updatedAt: existing.updatedAt > source.updatedAt ? existing.updatedAt : source.updatedAt
    });
  }
  return result;
}

export function upsertEntry(workspace: Workspace, entry: JournalEntry): Workspace {
  const entries = [...workspace.entries];
  const index = entries.findIndex((item) => item.id === entry.id);
  if (index === -1) entries.unshift(entry);
  else entries[index] = entry;
  return { ...workspace, entries, updatedAt: entry.updatedAt };
}

export function removeEntry(workspace: Workspace, entryId: string, now = new Date().toISOString()): Workspace {
  return { ...workspace, entries: workspace.entries.filter((entry) => entry.id !== entryId), updatedAt: now };
}

export function toMarkdown(workspace: Workspace): string {
  const lines = [
    `# ${workspace.name} — handoff`,
    '',
    `Origin: ${workspace.origin || 'Not set'}`,
    `Updated: ${workspace.updatedAt}`,
    '',
    '## Journal',
    ''
  ];
  for (const entry of workspace.entries) {
    const status = entry.status === 'done' ? 'x' : ' ';
    lines.push(`- [${status}] **${entry.title}** (${entry.kind})`);
    if (entry.url) lines.push(`  - ${entry.url}`);
    if (entry.note) lines.push(`  - ${entry.note.replaceAll('\n', ' ')}`);
  }
  if (!workspace.entries.length) lines.push('_No entries yet._');
  lines.push('', '<!-- Exported by Workspace History Porter. This Markdown file is not encrypted. -->', '');
  return lines.join('\n');
}
