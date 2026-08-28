import { access, readFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const downloads = 'dist/site/downloads';
const extension = `${downloads}/workspace-history-porter-chrome.zip`;
const sidecar = `${downloads}/porter-sidecar.mjs`;

await Promise.all([access('dist/site/index.html'), access(extension), access(sidecar)]);
if ((await stat(extension)).size < 50_000) throw new Error('Packaged extension zip is unexpectedly small.');
const [{ stdout: expectedCommit }, sourceSidecar, packagedSidecar] = await Promise.all([
  execFileAsync('git', ['rev-parse', '--short=12', 'HEAD']),
  readFile('sidecar/porter-sidecar.mjs', 'utf8'),
  readFile(sidecar, 'utf8')
]);
const expectedSidecar = sourceSidecar.replace("const BUILD_COMMIT = 'development';", `const BUILD_COMMIT = '${expectedCommit.trim()}';`);
if (packagedSidecar !== expectedSidecar) throw new Error('Packaged sidecar does not match the stamped source artifact.');
await execFileAsync('unzip', ['-t', extension]);
process.stdout.write(`Verified deploy tree: index, Chrome zip, and sidecar identity ${expectedCommit.trim()} are present and valid.\n`);
