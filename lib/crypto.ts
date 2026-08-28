import { HANDOFF_FORMAT, HANDOFF_VERSION, type EncryptedEnvelope } from './types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const DEFAULT_ITERATIONS = 310_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPayload(
  payload: unknown,
  passphrase: string,
  iterations = DEFAULT_ITERATIONS
): Promise<EncryptedEnvelope> {
  if (passphrase.length < 10) throw new Error('Use a passphrase with at least 10 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, iterations);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(payload))
  );
  return {
    format: HANDOFF_FORMAT,
    version: HANDOFF_VERSION,
    encryption: {
      algorithm: 'AES-GCM',
      keyDerivation: 'PBKDF2-SHA-256',
      iterations,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv)
    },
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    exportedAt: new Date().toISOString()
  };
}

export async function decryptPayload<T>(envelope: EncryptedEnvelope, passphrase: string): Promise<T> {
  if (
    envelope?.format !== HANDOFF_FORMAT ||
    envelope?.version !== HANDOFF_VERSION ||
    envelope?.encryption?.algorithm !== 'AES-GCM'
  ) {
    throw new Error('This is not a supported Porter handoff file.');
  }
  try {
    const salt = base64ToBytes(envelope.encryption.salt);
    const iv = base64ToBytes(envelope.encryption.iv);
    const key = await deriveKey(passphrase, salt, envelope.encryption.iterations);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      base64ToBytes(envelope.ciphertext)
    );
    return JSON.parse(decoder.decode(plaintext)) as T;
  } catch {
    throw new Error('Could not unlock this handoff. Check the passphrase and try again.');
  }
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Partial<EncryptedEnvelope>;
  return envelope.format === HANDOFF_FORMAT && envelope.version === HANDOFF_VERSION;
}
