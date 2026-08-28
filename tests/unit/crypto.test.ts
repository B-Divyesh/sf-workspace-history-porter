import { describe, expect, it } from 'vitest';
import { decryptPayload, encryptPayload, isEncryptedEnvelope } from '../../lib/crypto';

describe('encrypted handoff envelope', () => {
  it('round trips a journal without exposing plaintext', async () => {
    const payload = { workspaces: [{ name: 'Secret staging task' }] };
    const envelope = await encryptPayload(payload, 'a useful long passphrase', 1_000);
    expect(isEncryptedEnvelope(envelope)).toBe(true);
    expect(JSON.stringify(envelope)).not.toContain('Secret staging task');
    await expect(decryptPayload(envelope, 'a useful long passphrase')).resolves.toEqual(payload);
  });

  it('rejects a wrong passphrase with an actionable error', async () => {
    const envelope = await encryptPayload({ ok: true }, 'correct passphrase', 1_000);
    await expect(decryptPayload(envelope, 'incorrect passphrase')).rejects.toThrow('Check the passphrase');
  });

  it('requires a meaningful passphrase', async () => {
    await expect(encryptPayload({}, 'short')).rejects.toThrow('at least 10');
  });
});
