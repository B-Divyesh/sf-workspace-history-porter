import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const output = 'dist/site/downloads';
await mkdir(output, { recursive: true });
const files = await readdir('.output');
const zip = files.find((file) => file.endsWith('.zip') && file.includes('chrome')) || files.find((file) => file.endsWith('.zip'));
if (!zip) throw new Error('WXT did not produce an extension zip.');
await copyFile(join('.output', zip), join(output, 'workspace-history-porter-chrome.zip'));
await copyFile('sidecar/porter-sidecar.mjs', join(output, 'porter-sidecar.mjs'));
process.stdout.write(`Packaged ${zip} and sidecar in ${output}\n`);
