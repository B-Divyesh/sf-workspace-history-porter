# Workspace History Porter

Workspace History Porter carries the small operational index around a remote
workspace—tasks, handoff notes, terminal/PR/test links—between browsers without
making chat transcripts a portability layer.

It is built for developers and teams who open the same remote workspace from a
new browser and otherwise lose the browser-local index that tells them what to
do next.

## What ships

- A WXT + TypeScript Manifest V3 extension with a quick-add popup and full
  workspace journal.
- AES-256-GCM encryption at rest. The user’s passphrase derives the key with
  PBKDF2-SHA-256 (310,000 iterations) and is retained only for the browser
  session.
- Explicit current-tab URL capture with optional per-origin permission. Porter
  never reads page content or model transcripts.
- Encrypted, versioned JSON export/import with merge or replace; readable
  Markdown export remains available with a plaintext warning.
- A zero-dependency Node sidecar that binds to `127.0.0.1` and moves ciphertext
  through a chosen remote workspace.
- A static product site, privacy policy, terms, packaged Chrome zip, and
  Sociobot license restore/verification for the optional Team Relay feature.

## Install the extension

For a packaged build, unzip
`dist/site/downloads/workspace-history-porter-chrome.zip`, open
`chrome://extensions`, enable Developer mode, choose **Load unpacked**, and
select the unzipped folder.

Click the Porter icon, enter a new passphrase of at least 10 characters, then
add a task or explicitly attach the current tab URL. Use **Open full journal**
for workspace management and transfers.

There is no password recovery because the password is never sent anywhere.
Keep an encrypted export before clearing browser data.

## Local development

Requirements: Node.js 20+ and npm.

```sh
npm ci
npm run dev          # WXT extension development
npm run dev:site     # static site development
npm test             # unit + sidecar integration tests
npm run test:e2e     # Chromium desktop/mobile + Axe
npm run test:package # build and verify the deployable artifacts
npm run build        # exact production build
```

Both `npm run build:site` (the static deployment build) and the exact
production command `npm run build` create:

- `dist/site/index.html` — static deployment root
- `dist/site/downloads/workspace-history-porter-chrome.zip`
- `dist/site/downloads/porter-sidecar.mjs`
- `.output/chrome-mv3/` — unpacked extension

The factory deploys `dist/site`; this repository does not modify DNS or
infrastructure.

## Run the sidecar

Team Relay is the optional paid feature; encrypted file export remains free.

```sh
npm run sidecar -- --root /absolute/path/to/workspace
```

The sidecar listens only at `http://127.0.0.1:43821`. It atomically writes the
encrypted envelope to
`<workspace>/.workspace-history-porter/handoff.json`, requires a
browser-extension origin for every journal read or write, and never receives the passphrase or plaintext
journal. Use `--port 45000` to choose another unprivileged port.

## Handoff format and security boundary

The encrypted JSON format identifies itself as
`workspace-history-porter/handoff`, version 1. Its encryption metadata includes
the random salt, random 96-bit IV, PBKDF2 iteration count, and algorithm; only
the ciphertext contains journal data.

This protects data at rest and in a shared workspace when the passphrase is
strong and exchanged separately. It does not protect an unlocked browser from
malware, a compromised extension runtime, or someone who knows the passphrase.

## Paid unlock

Team Relay is a $29 one-time license sold through the Sociobot billing engine.
During staging, checkout and verification use `pilot-api.sociobot.in`; the
factory changes the base at release. License verdicts are cached for at most one
day and a prior valid verdict keeps the feature available offline. Free journal
use and all data exports never wait on billing.

## Project notes

The visual thesis and generated-asset provenance are in
[`.factory/design.md`](.factory/design.md). Build verification and known gaps
are in [`.factory/handoff.md`](.factory/handoff.md). Licensed under the
[MIT License](LICENSE).
