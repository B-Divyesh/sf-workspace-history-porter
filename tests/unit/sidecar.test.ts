import { afterEach, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let processHandle: ChildProcess | undefined;
let temporaryRoot = '';

afterEach(async () => {
  processHandle?.kill('SIGTERM');
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
});

describe('local workspace sidecar', () => {
  it('accepts and returns only encrypted handoff envelopes from extension origins', async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'porter-sidecar-'));
    const port = 45127;
    processHandle = spawn(process.execPath, ['sidecar/porter-sidecar.mjs', '--root', temporaryRoot, '--port', String(port)], { cwd: process.cwd() });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Sidecar did not start.')), 5_000);
      processHandle!.stdout!.on('data', (chunk) => {
        if (String(chunk).includes('Listening')) { clearTimeout(timer); resolve(); }
      });
    });
    const payload = { format: 'workspace-history-porter/handoff', version: 1, ciphertext: 'opaque', encryption: {}, exportedAt: 'now' };
    const extensionOrigin = 'chrome-extension://porterregressiontest';
    const put = await fetch(`http://127.0.0.1:${port}/journal`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: extensionOrigin },
      body: JSON.stringify(payload)
    });
    expect(put.status).toBe(200);
    expect(put.headers.get('access-control-allow-origin')).toBe(extensionOrigin);
    const get = await fetch(`http://127.0.0.1:${port}/journal`, { headers: { origin: extensionOrigin } });
    expect(await get.json()).toEqual(payload);
    expect(await readFile(join(temporaryRoot, '.workspace-history-porter/handoff.json'), 'utf8')).toContain('opaque');
    const rejected = await fetch(`http://127.0.0.1:${port}/journal`, { headers: { origin: 'https://malicious.example' } });
    expect(rejected.status).toBe(403);
    const originless = await fetch(`http://127.0.0.1:${port}/journal`);
    expect(originless.status).toBe(403);
  });
});
