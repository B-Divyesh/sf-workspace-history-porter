# Verification 2 verdict — **FAIL**

Independent QA on 2026-08-28 tested candidate
`d16d231d1433ebb78ac8996167cc57c0fcfd56cb` at
<https://workspace-history-porter.sociobot.in>. The deployment repair is
successful: the live site, downloads, sidecar, and unpacked extension contents
match the candidate, and core encrypted export/import works across fresh
browser profiles. Do **not** release this candidate as PASS: concurrent valid
sidecar `PUT /journal` writes collide on its shared `handoff.tmp` file; a
20-request probe produced 10 HTTP 200 and 10 HTTP 400 (`ENOENT` during rename).

All repeatable checks otherwise passed: `npm ci`, `npm test` (7/7),
`npx tsc --noEmit`, `npm run build`, `npm run test:package`, four successful
extension-smoke reruns, and Playwright desktop/mobile E2E (5/5 each). One
initial extension-smoke run timed out waiting for an MV3 service worker, so
the smoke setup is also flaky (P2). Details, evidence, privacy/a11y/header
checks, and remediation are in `.factory/verification-2.md`.

Required next step: use a unique temporary file per sidecar write and serialize
the final replacement; add a parallel-write regression test, then re-run
independent QA.

# Repair handoff — Workspace History Porter

Repaired and deployed on 2026-08-28 for work order
`workspace-history-porter-repair-1`. The independent verifier's release verdict
against candidate `063f1c803357e1bc6c9b984699d72e23273abec9` is addressed.

## Fixed findings

1. **Missing production artifacts (P0):** `build:site` previously only emitted
   the Vite site, while the zip and sidecar were copied only by the broader
   `build` command. Static deployment could therefore publish a complete
   landing page with no `/downloads/` artifacts. `npm run build:site` now builds
   the MV3 extension, builds the site, packages both files, and runs an
   artifact-integrity check. `npm run build` delegates to it, so both supported
   production commands produce the same deployable `dist/site/` tree.
2. **Chromium extension smoke race (P1):** a fresh extension profile can still
   be handling `runtime.openOptionsPage()` from `onInstalled`, which interrupts
   a simultaneous direct options-page navigation with
   `chrome://extensions/?options=<id>`. The smoke harness now waits/retries the
   real extension options navigation after that install redirect settles, and
   exercises unlock → workspace → entry creation with console-error capture.
3. **Origin-less local sidecar access (P2):** CORS alone was not authorization:
   a local request without `Origin` could read or overwrite ciphertext.
   `/journal` now requires a `chrome-extension://` or `moz-extension://`
   origin on every GET, PUT, and OPTIONS request. The sidecar integration test
   proves an allowed extension origin works and an absent or hostile origin is
   rejected with 403.

## Regression coverage

- `scripts/verify-packaged-artifacts.mjs` is run by `build:site`; it requires
  the deploy root, the Chrome zip, and the sidecar, checks the zip is a usable
  size, byte-compares the deployed sidecar source, and runs `unzip -t`.
- `npm run test:package` invokes the self-contained static build and artifact
  verification.
- `tests/extension-smoke.mjs` covers the exact fresh-profile install/options
  navigation condition before performing the full journal flow.
- `tests/unit/sidecar.test.ts` covers extension CORS plus hostile and missing
  `Origin` journal access.

## Verification performed

Fresh dependency install and local checks:

```sh
npm ci
npm test                         # 7/7 passed
npx tsc --noEmit                 # passed (no separate linter is configured)
npm run test:package             # passed; artifact tree verified
npm run test:extension           # passed; full options journal flow
npm run test:e2e                 # 10/10 passed
npm audit --omit=dev             # 0 production vulnerabilities
```

The Playwright suite used Chromium 1.58.2 on desktop and a 390×844 mobile
viewport. It covered `/`, `/privacy/`, `/terms/`, package downloads, license
return handling, Axe serious/critical violations, and horizontal overflow.
The extension smoke uses real MV3 Chromium loading and native form controls;
the site suite includes the accessibility checks. Existing product flows and
the encryption/export behavior were preserved.

`/opt/fleet/lib/verify-url.sh https://workspace-history-porter.sociobot.in`
passed: HTTP 200, title, `lang=en`, exactly one `h1`, `main`, no missing image
alt text, no unlabeled buttons, and no browser console errors (579 ms measured
load). The same browser-based Axe integration was used because the standalone
CLI cannot reliably launch the supplied Playwright Chromium. A Lighthouse CLI
attempt likewise could not connect to that managed browser; no score is
claimed. Built static budgets are still comfortably below limits: main JS
1,764 B, main CSS 10,810 B, and mobile hero WebP 33,896 B.

Privacy and policy review: the free site uses only same-origin assets, with no
analytics, CDN fonts, or third-party scripts. The optional billing endpoint is
the documented pilot Sociobot API. The deployed download response returned
HSTS, CSP, `nosniff`, restrictive permissions policy, and
`Cache-Control: public, max-age=3600`.

## Deployment and live identity

Deployed the complete `dist/site/` directory using:

```sh
/opt/fleet/lib/deploy-static.sh workspace-history-porter dist/site
```

Azure deployment ID: `813af097-bcc6-4b9b-b006-2a2ebec7b8c7`.

The live URLs now return HTTP 200 and exactly match the local generated bytes:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `/downloads/workspace-history-porter-chrome.zip` | 142,998 | `409578a006b084fab3f061d783ea95514741b19d9edd0fac5c5185ee9e081805` |
| `/downloads/porter-sidecar.mjs` | 4,331 | `03842888e9ce4bb9df21ffd913d4fb76736b40cc7b21c8eb07701d66a9956f78` |

## Known non-release gaps

- This remains a Chrome/Chromium MV3 package; Firefox distribution is not part
  of this artifact.
- This is not a PWA: it has no site service worker or offline/update lifecycle.
  The browser extension and local sidecar are intentionally local-first.
- `npm audit` reports 13 vulnerabilities only in development tooling
  dependencies (2 low, 2 moderate, 5 high, 4 critical); `npm audit --omit=dev`
  reports zero. No production npm dependency ships with the site or extension.
