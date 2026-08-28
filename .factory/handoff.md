# Verification handoff — FAIL

Independent QA performed 2026-08-28 for work order
`workspace-history-porter-verify-1`.

**Verdict: FAIL. Do not release candidate `063f1c803357e1bc6c9b984699d72e23273abec9`.**

The local candidate builds and its static pages are healthy, but the production
deployment at `https://workspace-history-porter.sociobot.in` returns **404**
for both core artifacts advertised by its primary calls to action:

- `/downloads/workspace-history-porter-chrome.zip`
- `/downloads/porter-sidecar.mjs`

Consequently a visitor cannot install the extension or obtain the local
sidecar. This prevents the browser-extension product from completing its core
job despite both files being present in a fresh local `dist/site/downloads/`.

There is also a failing required repository gate:

```sh
npm run test:extension
```

fails in the supplied Chromium with navigation to
`chrome-extension://<id>/options.html` interrupted by navigation to
`chrome://extensions/?options=<id>`. The popup flow itself was exercised
successfully, but the command must pass before release.

Full evidence, commands, passing checks, response-policy results, privacy
review, budgets, and defects are in
[`verification.md`](verification.md).

## What was verified

- Fresh `npm ci`, `npm test` (7/7), `npx tsc --noEmit`, and exact
  `npm run build` all passed. There is no lint script.
- `npm run test:e2e` passed 10/10 in desktop Chromium and 390×844 mobile;
  it includes Axe serious/critical assertions for the site.
- The extension popup was exercised in Chromium: short-passphrase browser
  validation, unlock, task creation, lock, wrong-passphrase recovery,
  re-unlock, keyboard Enter submission, and no page/console errors. Popup Axe
  had no serious/critical violations in locked or unlocked states.
- Local sidecar tested valid/invalid envelopes, hostile-origin rejection,
  extension CORS, ciphertext retrieval, and a resulting `0600` handoff file.
- Live site HTML, CSS, JS, and legal pages hash-match the local candidate;
  the live download URLs do not.

## Required follow-up

1. Deploy the complete `dist/site/` directory, including `downloads/`, then
   verify both live downloads return 200 with the expected bytes.
2. Repair or replace the extension smoke test/options-page launch path and
   rerun `npm run test:extension` successfully in the pinned Playwright
   Chromium.
3. Consider enforcing extension origin on every sidecar request (requests
   without an `Origin` header currently read the local ciphertext) or narrow
   the README claim that it accepts only extension origins.
4. Re-run independent verification after deployment.

No product source code was changed during verification; this handoff and the
verification report are the only intended changes.
