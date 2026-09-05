import { readFile } from 'node:fs/promises';

// @claim:no-page-content-script
const manifest = JSON.parse(await readFile('.output/chrome-mv3/manifest.json', 'utf8'));
if (Array.isArray(manifest.content_scripts) && manifest.content_scripts.length) {
  throw new Error('The packaged extension unexpectedly includes a page content script.');
}
process.stdout.write('Packaged MV3 manifest contains no page content script.\n');
