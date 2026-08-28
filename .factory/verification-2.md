# Independent verification 2 — Workspace History Porter

**Candidate:** `d16d231d1433ebb78ac8996167cc57c0fcfd56cb`  
**Live URL:** <https://workspace-history-porter.sociobot.in>  
**Verified:** 2026-08-28  
**Verdict: FAIL**

The prior deployment-only failure is fixed: the live site now serves the
extension ZIP and sidecar and matches this candidate's generated content.
However, the local sidecar, which is the product's paid shared-workspace
handoff path, loses valid simultaneous writes due to a fixed temporary
filename. This is a real end-to-end reliability failure, so this candidate
must not be released as PASS.

## Release-blocking defect

### P1 — Concurrent valid sidecar pushes fail nondeterministically

The sidecar writes every request through the single fixed path
`.workspace-history-porter/handoff.tmp` before renaming it to `handoff.json`.
Against a fresh temporary workspace, 20 concurrent valid `PUT /journal`
requests from an allowed `chrome-extension://qa` origin returned **10 HTTP
200 and 10 HTTP 400**. A representative failure was:

```text
ENOENT: no such file or directory, rename
'.../.workspace-history-porter/handoff.tmp' ->
'.../.workspace-history-porter/handoff.json'
```

The last file remained valid encrypted-format JSON and mode `0600`, so this is
not a plaintext disclosure or persistent-file corruption. It nevertheless
makes ordinary simultaneous browser/team relay pushes report failure and
violates the requested concurrency/persistence behavior. Use a unique
per-request temporary filename and serialize/coordinate final replacement;
then add a concurrent-write regression test.

## Other findings

### P2 — Extension smoke was flaky once in a clean run

The first fresh `npm run test:extension` timed out after 10 seconds waiting
for the MV3 `serviceworker` event. A direct probe found the worker available
after a short startup delay. The same smoke command then passed four times
(one standalone run plus three consecutive runs), including the full
unlock → workspace → entry flow. This did not reproduce consistently and is
not treated as a confirmed product-flow failure, but the smoke harness should
wait for extension startup deterministically rather than occasionally failing
the release gate.

### P3 — Development-only audit findings

`npm audit --omit=dev` reports **0 vulnerabilities**. The full development
tooling audit reports 13 findings (2 low, 2 moderate, 5 high, 4 critical).
They do not ship in the static product or extension, but build-tool dependency
maintenance is outstanding.

## Clean-checkout quality gates

The checkout was clean and exactly at the requested SHA before `npm ci`.
There is no lint script configured in `package.json`.

| Check | Result | Evidence |
| --- | --- | --- |
| Install | PASS | `npm ci` completed from `package-lock.json`. |
| Unit/integration | PASS | `npm test`: 7/7 tests passed (crypto, vault, sidecar). |
| Type check | PASS | `npx tsc --noEmit` exited 0. |
| Exact production build | PASS | `npm run build` exited 0. |
| Package verification | PASS | `npm run test:package` built, zipped, copied, byte-compared sidecar source, and ran `unzip -t`. |
| MV3 smoke | PASS on reruns; P2 flake noted | Four later runs passed; one initial clean-run service-worker timeout is documented above. |
| Site E2E desktop | PASS | `npx playwright test --project=chromium --workers=1`: 5/5. |
| Site E2E 390 px mobile | PASS | `npx playwright test --project=mobile --workers=1`: 5/5. |

## End-to-end product evidence

Using the actual production-built MV3 package in fresh persistent Chromium
profiles, with no code changes:

1. A too-short passphrase stayed blocked by native validation.
2. A valid passphrase created the encrypted vault; a workspace, task with
   handoff note, and URL bookmark were added and rendered.
3. An invalid URL remained in the dialog; a valid URL saved normally.
4. An invalid JSON import displayed a recoverable parse error.
5. An encrypted JSON export imported with `REPLACE` into a second fresh
   browser profile using the same passphrase; both entries were recovered.
6. Locking, using a wrong passphrase, and using the correct passphrase again
   recovered the original journal. No extension page errors or console errors
   occurred.

This confirms the free core job—an encrypted, user-controlled portable task
index—works across browsers. A real paid license was not available, so the
licensed Team Relay buttons were not unlocked through the billing API. The
sidecar protocol itself was tested directly: health returned 200/no-store;
origin-less and hostile-origin journal requests returned 403; malformed
envelopes returned 400; an allowed extension origin could write and read only
ciphertext. The P1 concurrent-write defect applies to that same protocol.

## Accessibility, responsive behavior, and browser health

- Playwright Axe found **zero serious or critical violations** on the live
  home page at desktop and 390×844 mobile, and on locked and unlocked
  extension options states.
- At both viewport sizes the first Tab stop was the visible “Skip to main
  content” link (`outline: solid`), there was no horizontal overflow, and
  reduced-motion route animation was effectively instant (`0.00001s`).
- Built-in E2E covered `/`, `/privacy/`, and `/terms/` on both viewports,
  including one `h1`, visible `main`, Axe, and horizontal-overflow assertions.
- `/opt/fleet/lib/verify-url.sh` against the live URL passed: HTTP 200,
  title, `lang=en`, one `h1`, `main`, zero missing image alts, zero unlabeled
  buttons, zero browser errors; measured load was 744 ms.
- Live request capture loaded only
  `https://workspace-history-porter.sociobot.in` for the free landing flow;
  no analytics, fonts, scripts, or page-content collection were observed.

This is an MV3 browser extension/static site, not a PWA; it has no web service
worker or offline-update lifecycle to test.

## Privacy, policies, and live identity

Source and runtime review confirm local encrypted extension storage,
session-only passphrase storage, explicit current-tab URL capture, optional
per-origin permission, and no content-script/page-content access. The only
designed external endpoint is the optional Sociobot pilot billing API.

The live root, privacy page, terms page, main JS, and both CSS files have
byte-identical SHA-256 values to the local candidate build. The deployed
sidecar is byte-identical:

```text
03842888e9ce4bb9df21ffd913d4fb76736b40cc7b21c8eb07701d66a9956f78
```

The live ZIP has a different container SHA-256 because ZIP timestamps are
regenerated (`cf1ce1…` live versus `d81ea7…` local); every unpacked file’s
path and SHA-256 matched exactly. The landing page and both download URLs
return HTTP 200.

Responses supply HSTS, `nosniff`, restrictive CSP, referrer policy, and a
camera/microphone/geolocation-denying Permissions-Policy. HTML is short-cache
(`public, must-revalidate, max-age=30`); hashed assets are
`public, max-age=31536000, immutable`; downloads are one hour. These policies
match the static configuration.

## Performance/budget evidence

The production build reports 1,764 B main JS (900 B gzip), 10,810 B main CSS
(3,180 B gzip), 33,896 B mobile hero WebP, and 81,752 B desktop hero WebP:
all are within the 200 KB JS, 50 KB CSS, and 300 KB hero budgets. The unpacked
extension totals 174.62 KB. An attempted fresh Lighthouse CLI run could not
finish within this environment’s command window, so no Lighthouse score is
claimed; the browser, Axe, request, and built-size checks above did complete.

## Required retest

1. Make sidecar writes concurrency-safe and add a regression test that issues
   parallel allowed-origin `PUT /journal` requests.
2. Rerun the checks above, especially sidecar concurrency, `npm run test`,
   `npm run test:extension`, `npm run test:e2e`, and the exact production
   build.
3. Stabilize the MV3 smoke worker-startup wait so a clean run cannot
   intermittently time out.

No product code was modified during this verification.
