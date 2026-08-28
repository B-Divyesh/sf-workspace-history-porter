import { access, readFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const downloads = 'dist/site/downloads';
const extension = `${downloads}/workspace-history-porter-chrome.zip`;
const sidecar = `${downloads}/porter-sidecar.mjs`;

await Promise.all([access('dist/site/index.html'), access(extension), access(sidecar)]);
if ((await stat(extension)).size < 50_000) throw new Error('Packaged extension zip is unexpectedly small.');
if (await readFile(sidecar, 'utf8') !== await readFile('sidecar/porter-sidecar.mjs', 'utf8')) {
  throw new Error('Deployed sidecar does not match its source artifact.');
}
await execFileAsync('unzip', ['-t', extension]);
process.stdout.write('Verified deploy tree: index, Chrome zip, and sidecar are present and valid.\n');
