# Workspace History Porter

Move workspace tasks, notes, and useful links to another browser with an encrypted local journal.

It is for people who reopen a remote development workspace in a different browser and need to know what to do next.

Try the filled sandbox at [the demo route](https://workspace-history-porter.sociobot.in/demo/). It uses separate sample data and can be reset at any time.

## What it includes

- A Chromium MV3 extension for an encrypted workspace journal.
- Tasks, handoff notes, and links that you add yourself.
- Encrypted JSON export and import for moving a journal between browsers.
- An optional loopback-only Node sidecar for an encrypted handoff file in a workspace.

## Install the extension

Download `dist/site/downloads/workspace-history-porter-chrome.zip`, unzip it, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the unzipped folder.

Open the Porter icon, choose a passphrase with at least 10 characters, and create a workspace. Add a task, note, or link. Open **Transfer & sidecar** to export encrypted JSON or use a local sidecar.

## Run locally

Requirements: Node.js 20+ and npm.

```sh
npm ci
npm run build
npm test
npm run lint
npm run test:extension
npm run test:e2e
```

`npm run build` creates the MV3 extension, the Chrome ZIP, the packaged sidecar, and the static product site in `dist/site/`.

Run each documented public-claim command after `npm ci` with:

```sh
node -e "for (const claim of require('./.factory/claims.json')) console.log(claim.test)"
```

Then run each printed command. The browser claim commands start their own static preview. The link-followup claim command builds the extension before opening it in a clean Chromium profile.

## Run the sidecar

```sh
npm run sidecar -- --root /absolute/path/to/workspace
```

The sidecar listens on `http://127.0.0.1:43821`. It accepts journal requests from browser-extension origins, stores an encrypted envelope at `<workspace>/.workspace-history-porter/handoff.json`, and does not receive the passphrase.

## Deploy

The factory deploys `dist/site/` to `https://workspace-history-porter.sociobot.in`. This repository does not change DNS, hosting, or billing configuration.

## Product notes

The demo contract is in [`.factory/demo.md`](.factory/demo.md). The tested public claims are in [`.factory/claims.json`](.factory/claims.json). The visual system and asset provenance are in [`.factory/design.md`](.factory/design.md). Licensed under the [MIT License](LICENSE).
