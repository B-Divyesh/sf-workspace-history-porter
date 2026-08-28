import { describe, expect, it } from 'vitest';
import type { JournalEntry, Vault, Workspace } from '../../lib/types';
import { mergeWorkspaces, toMarkdown, upsertEntry } from '../../lib/vault';

const oldEntry: JournalEntry = {
  id: 'entry-1', kind: 'task', status: 'todo', title: 'Run tests', note: '',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
};
const workspace: Workspace = {
  id: 'workspace-1', name: 'API', origin: 'https://dev.example.com', entries: [oldEntry],
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('workspace journal operations', () => {
  it('updates an entry without duplicating it', () => {
    const result = upsertEntry(workspace, { ...oldEntry, status: 'done', updatedAt: '2026-02-01T00:00:00.000Z' });
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].status).toBe('done');
  });

  it('merges the newest entry and retains distinct workspace data', () => {
    const vault: Vault = { version: 1, workspaces: [workspace] };
    const incoming = { ...workspace, entries: [{ ...oldEntry, title: 'Tests passed', updatedAt: '2026-03-01T00:00:00.000Z' }] };
    const result = mergeWorkspaces(vault, [incoming]);
    expect(result.workspaces[0].entries[0].title).toBe('Tests passed');
  });

  it('marks readable Markdown as unencrypted', () => {
    const markdown = toMarkdown(workspace);
    expect(markdown).toContain('# API — handoff');
    expect(markdown).toContain('- [ ] **Run tests**');
    expect(markdown).toContain('not encrypted');
  });
});
