#!/usr/bin/env node
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const portIndex = args.indexOf('--port');
if (rootIndex === -1 || !args[rootIndex + 1]) {
  process.stderr.write('Usage: node porter-sidecar.mjs --root /path/to/workspace [--port 43821]\n');
  process.exit(1);
}

const root = resolve(args[rootIndex + 1]);
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 43821;
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  process.stderr.write('Port must be an integer between 1024 and 65535.\n');
  process.exit(1);
}

const dataDir = join(root, '.workspace-history-porter');
const handoffPath = join(dataDir, 'handoff.json');
const allowedOrigin = /^(chrome|moz)-extension:\/\/[a-z0-9-]+$/i;
let replacementQueue = Promise.resolve();

function hasExtensionOrigin(request) {
  return typeof request.headers.origin === 'string' && allowedOrigin.test(request.headers.origin);
}

function setCors(request, response) {
  const origin = request.headers.origin;
  if (hasExtensionOrigin(request)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) reject(new Error('Payload exceeds 5 MB.'));
    });
    request.on('end', () => resolveBody(body));
    request.on('error', reject);
  });
}

await mkdir(dataDir, { recursive: true, mode: 0o700 });

const server = createServer(async (request, response) => {
  setCors(request, response);
  // CORS is not authorization: another local process can omit Origin.
  // Journal reads and writes must identify an extension origin themselves.
  if (request.url === '/journal' && !hasExtensionOrigin(request)) {
    return json(response, 403, { error: 'Only browser extensions may use this sidecar.' });
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    return response.end();
  }
  if (request.url === '/health' && request.method === 'GET') return json(response, 200, { ok: true, root });
  if (request.url !== '/journal') return json(response, 404, { error: 'Not found.' });

  if (request.method === 'GET') {
    try {
      const handoff = JSON.parse(await readFile(handoffPath, 'utf8'));
      return json(response, 200, handoff);
    } catch (error) {
      const notFound = error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT';
      return json(response, notFound ? 404 : 500, { error: notFound ? 'No handoff has been pushed yet.' : 'Could not read the handoff.' });
    }
  }

  if (request.method === 'PUT') {
    let temporaryPath;
    try {
      const body = JSON.parse(await readBody(request));
      if (body?.format !== 'workspace-history-porter/handoff' || body?.version !== 1 || typeof body?.ciphertext !== 'string') {
        return json(response, 400, { error: 'Expected an encrypted Porter handoff.' });
      }
      temporaryPath = join(dataDir, `handoff.${process.pid}.${randomUUID()}.tmp`);
      await writeFile(temporaryPath, `${JSON.stringify(body, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
      const replacement = replacementQueue.then(() => rename(temporaryPath, handoffPath));
      // A failed replacement must not poison the queue for later valid writes.
      replacementQueue = replacement.catch(() => {});
      await replacement;
      return json(response, 200, { ok: true, path: handoffPath });
    } catch (error) {
      if (temporaryPath) await unlink(temporaryPath).catch(() => {});
      return json(response, 400, { error: error instanceof Error ? error.message : 'Could not write the handoff.' });
    }
  }

  return json(response, 405, { error: 'Method not allowed.' });
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Workspace History Porter sidecar\nListening on http://127.0.0.1:${port}\nWriting encrypted handoffs under ${dataDir}\nPress Ctrl+C to stop.\n`);
});

function stop() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
