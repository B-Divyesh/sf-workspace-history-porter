import { afterEach, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let processHandle: ChildProcess | undefined;
let temporaryRoot = '';

afterEach(async () => {
  processHandle?.kill('SIGTERM');
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
});

describe('local workspace sidecar', () => {
  it('@claim:sidecar-boundary accepts only encrypted handoff envelopes from extension origins', async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'porter-sidecar-'));
    const port = 45127;
    processHandle = spawn(process.execPath, ['sidecar/porter-sidecar.mjs', '--root', temporaryRoot, '--port', String(port)], { cwd: process.cwd() });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Sidecar did not start.')), 5_000);
      processHandle!.stdout!.on('data', (chunk) => {
        if (String(chunk).includes('Listening')) { clearTimeout(timer); resolve(); }
      });
    });
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    expect(health.status).toBe(200);
    expect(health.headers.get('cache-control')).toBe('no-store');
    expect(await health.json()).toEqual({
      ok: true,
      service: 'workspace-history-porter-sidecar',
      version: '1.0.2',
      commit: 'development',
      root: temporaryRoot
    });
    const payload = { format: 'workspace-history-porter/handoff', version: 1, ciphertext: 'opaque', encryption: {}, exportedAt: 'now', passphrase: 'must-not-be-stored' };
    const extensionOrigin = 'chrome-extension://porterregressiontest';
    const put = await fetch(`http://127.0.0.1:${port}/journal`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: extensionOrigin },
      body: JSON.stringify(payload)
    });
    expect(put.status).toBe(200);
    expect(put.headers.get('access-control-allow-origin')).toBe(extensionOrigin);
    const get = await fetch(`http://127.0.0.1:${port}/journal`, { headers: { origin: extensionOrigin } });
    expect(await get.json()).toEqual({ format: 'workspace-history-porter/handoff', version: 1, ciphertext: 'opaque', encryption: {}, exportedAt: 'now' });
    const stored = await readFile(join(temporaryRoot, '.workspace-history-porter/handoff.json'), 'utf8');
    expect(stored).toContain('opaque');
    expect(stored).not.toContain('must-not-be-stored');
    const rejected = await fetch(`http://127.0.0.1:${port}/journal`, { headers: { origin: 'https://malicious.example' } });
    expect(rejected.status).toBe(403);
    const originless = await fetch(`http://127.0.0.1:${port}/journal`);
    expect(originless.status).toBe(403);

    const concurrentPayloads = Array.from({ length: 20 }, (_, index) => ({
      ...payload,
      ciphertext: `parallel-${index}`
    }));
    const concurrentWrites = await Promise.all(concurrentPayloads.map((body) => fetch(`http://127.0.0.1:${port}/journal`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: extensionOrigin },
      body: JSON.stringify(body)
    })));
    expect(concurrentWrites.map(({ status }) => status)).toEqual(Array(20).fill(200));

    const finalPath = join(temporaryRoot, '.workspace-history-porter/handoff.json');
    const finalHandoff = JSON.parse(await readFile(finalPath, 'utf8'));
    expect(concurrentPayloads.map(({ passphrase: _passphrase, ...body }) => body)).toContainEqual(finalHandoff);
    expect((await stat(finalPath)).mode & 0o777).toBe(0o600);
    expect(await readdir(join(temporaryRoot, '.workspace-history-porter'))).toEqual(['handoff.json']);

    const malformed = await fetch(`http://127.0.0.1:${port}/journal`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: extensionOrigin },
      body: JSON.stringify({ format: 'not-a-porter-handoff' })
    });
    expect(malformed.status).toBe(400);
    const oversized = await fetch(`http://127.0.0.1:${port}/journal`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: extensionOrigin },
      body: `{"ciphertext":"${'x'.repeat(5_000_001)}"}`
    });
    expect(oversized.status).toBe(400);
    expect((await fetch(`http://127.0.0.1:${port}/health`)).status).toBe(200);

    const previous = processHandle!;
    const stopped = new Promise<void>((resolve) => previous.once('exit', () => resolve()));
    previous.kill('SIGTERM');
    await stopped;
    processHandle = spawn(process.execPath, ['sidecar/porter-sidecar.mjs', '--root', temporaryRoot, '--port', String(port)], { cwd: process.cwd() });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Sidecar did not restart.')), 5_000);
      processHandle!.stdout!.on('data', (chunk) => {
        if (String(chunk).includes('Listening')) { clearTimeout(timer); resolve(); }
      });
    });
    const afterRestart = await fetch(`http://127.0.0.1:${port}/journal`, { headers: { origin: extensionOrigin } });
    expect(afterRestart.status).toBe(200);
    expect(await afterRestart.json()).toEqual(finalHandoff);
  });
});
