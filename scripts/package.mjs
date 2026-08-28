import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const output = 'dist/site/downloads';
await mkdir(output, { recursive: true });
const files = await readdir('.output');
const zip = files.find((file) => file.endsWith('.zip') && file.includes('chrome')) || files.find((file) => file.endsWith('.zip'));
if (!zip) throw new Error('WXT did not produce an extension zip.');
await copyFile(join('.output', zip), join(output, 'workspace-history-porter-chrome.zip'));
const { stdout } = await execFileAsync('git', ['rev-parse', '--short=12', 'HEAD']);
const commit = stdout.trim();
if (!/^[0-9a-f]{12}$/.test(commit)) throw new Error('Could not determine the source commit for the sidecar build.');
const sidecarSource = await readFile('sidecar/porter-sidecar.mjs', 'utf8');
const stampedSidecar = sidecarSource.replace("const BUILD_COMMIT = 'development';", `const BUILD_COMMIT = '${commit}';`);
if (stampedSidecar === sidecarSource) throw new Error('Could not stamp the sidecar build identity.');
await writeFile(join(output, 'porter-sidecar.mjs'), stampedSidecar, { encoding: 'utf8', mode: 0o644 });
process.stdout.write(`Packaged ${zip} and sidecar (${commit}) in ${output}\n`);
