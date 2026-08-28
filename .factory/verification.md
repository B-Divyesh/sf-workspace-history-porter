# Independent verification — Workspace History Porter

**Candidate:** `063f1c803357e1bc6c9b984699d72e23273abec9`  
**URL:** <https://workspace-history-porter.sociobot.in>  
**Date:** 2026-08-28  
**Verdict:** **FAIL**

## Release-blocking findings

### P0 — Production cannot deliver either core product artifact

Fresh local `npm run build` produced both files in `dist/site/downloads/`:

- `workspace-history-porter-chrome.zip` — 142,998 bytes
- `porter-sidecar.mjs` — 4,062 bytes

The deployed product’s primary CTAs link to those same URLs, but fresh `curl -I`
requests returned `HTTP/2 404` for both:

```text
https://workspace-history-porter.sociobot.in/downloads/workspace-history-porter-chrome.zip -> 404
https://workspace-history-porter.sociobot.in/downloads/porter-sidecar.mjs -> 404
```

This is a release blocker. A new user cannot download the extension, and cannot
obtain the sidecar needed for the optional shared-workspace handoff. It violates
the smallest useful product and means the deployment does not fully match the
candidate build.

### P1 — Required extension smoke command fails

`npm run test:extension` failed after the fresh production build in the
preinstalled Playwright 1.58.2 Chromium:

```text
page.goto: Navigation to "chrome-extension://hmnflijplgdmgeiodjlopfaipppkpaab/options.html"
is interrupted by another navigation to
"chrome://extensions/?options=hmnflijplgdmgeiodjlopfaipppkpaab"
```

The test never reaches its full-journal create-workspace/create-entry check.
Direct popup testing works (see below), so this may be an options-page launch
compatibility/test-harness issue rather than a confirmed user-facing failure.
It is nevertheless a required repository quality gate and was reproducibly red
from a clean install.

### P2 — Sidecar origin restriction is not absolute

The sidecar correctly returned 403 for `Origin: https://evil.example` and
emitted extension-only CORS headers for a Chrome extension origin. However, a
request without an `Origin` header successfully read `/journal`. This does not
expose plaintext and the server is loopback-only, but it contradicts the README
claim that it “accepts requests only from browser-extension origins” and allows
another local process to read or overwrite ciphertext. Enforce the origin for
all journal requests if that claim/security boundary is intended.

### P2 — Development dependency audit remains non-zero

`npm audit --omit=dev` reported 0 production vulnerabilities. Full `npm audit`
reported 13 development dependency vulnerabilities: 2 low, 2 moderate, 5 high,
and 4 critical. They do not ship in the static product, but should be triaged
before further build tooling work.

## Fresh local evidence

The checkout was clean at the requested candidate SHA before installation.

| Check | Result | Evidence |
| --- | --- | --- |
| Install | PASS | `npm ci` completed. |
| Unit/integration | PASS | `npm test`: 7 tests across crypto, vault, and sidecar; all passed. |
| Static type check | PASS | `npx tsc --noEmit` exited 0. No lint script exists in `package.json`. |
| Exact production build | PASS | `npm run build` exited 0 and created extension, zip, static site, and downloadable sidecar. |
| Extension smoke | **FAIL** | `npm run test:extension` failed at options-page navigation as quoted above. |
| Site E2E | PASS | `npm run test:e2e`: 10/10 passed (desktop Chromium and 390×844 mobile). |
| Packaged artifacts | PASS locally | `unzip -t` found no zip errors; packaged sidecar byte-matches `sidecar/porter-sidecar.mjs`; invalid port and missing `--root` printed correct errors. |

## Product-flow testing

### Extension popup

Using the actual built MV3 extension in a fresh persistent Chromium profile:

1. A short passphrase remained in the locked view through native minimum-length
   validation.
2. A 10+ character passphrase created/unlocked the encrypted local vault.
3. A representative task, “Run integration tests”, was saved and rendered.
4. Locking, entering a wrong passphrase, and then re-entering the correct
   passphrase recovered the journal. The wrong-passphrase message was
   “Could not unlock this handoff. Check the passphrase and try again.”
5. Keyboard-only form submission with Enter unlocked the vault and added
   “Keyboard added task”. The first tab stop was a focus-visible button.
6. No captured page errors or console errors occurred.
7. Playwright Axe checks on both locked and unlocked popup states had no
   serious or critical violations.

The intended full-journal/options flow could not be completed because the
repository smoke command itself is blocked by the browser navigation described
in P1.

### Sidecar and encrypted handoff boundary

Against a temporary workspace and the built behavior:

- `GET /health` returned 200 and `cache-control: no-store`.
- A hostile web origin was rejected with 403.
- An invalid envelope was rejected with 400.
- A valid format/version/ciphertext envelope from a Chrome extension origin
  was accepted with `Access-Control-Allow-Origin` echoed only for that origin,
  `Vary: Origin`, and limited GET/PUT/OPTIONS headers.
- The resulting handoff was retrievable as ciphertext and had filesystem mode
  `0600`.
- An origin-less `GET /journal` returned the ciphertext (P2 above).

This validates local encrypted persistence and invalid-input recovery, but not
the paid sidecar UI because no test billing license was supplied.

## Accessibility, responsive, motion, and browser behavior

- Repository E2E checked `/, /privacy/, /terms/` at desktop and 390×844,
  including Axe serious/critical checks and horizontal-overflow assertions:
  all 10 tests passed.
- A fresh manual Playwright + Axe run at 390×844 with
  `reducedMotion: 'reduce'` found no serious/critical violations, no console or
  page errors, no horizontal overflow, and no animation name on the route line.
  Reported animations used the reduced `.01ms` duration.
- Keyboard testing found the site skip link as first focus, and the popup’s
  first control was focus-visible; native buttons/forms were operable by
  keyboard in the tested popup flow.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ <temp-evidence>` passed:
  title present, `lang=en`, one `h1`, main landmark, all images with `alt`, no
  unlabeled buttons, and no console errors. Its measured local load was 550 ms.
- The standalone `@axe-core/cli` could not create Chrome because it did not
  discover the Playwright-managed binary. This is an environment/tool-launch
  issue; the repository’s Playwright Axe suite and the separate manual
  Playwright Axe checks above both ran successfully.

The product is a browser extension/static site, not a PWA; no service worker
or offline-update check applies.

## Privacy, requests, policies, and deployment comparison

### Privacy and outbound requests

Source review and browser request capture showed the free landing page loads
only same-origin HTML, CSS, JS, WebP, and SVG resources. No analytics, third
party fonts, or CDN scripts were requested. The only designed external endpoint
is the Sociobot pilot billing verification/checkout endpoint, used only for the
optional paid Team Relay flow. Extension code uses `tabs.query` for the current
tab and requires a user action plus an optional per-origin permission before
attaching its URL; it does not inject or read page content. Vault data is stored
as an AES-GCM/PBKDF2 envelope, with the passphrase held in session storage.

### Live response headers and caching

The live root returned 200 with HSTS, CSP, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive
Permissions-Policy. CSP allows only self resources plus the pilot billing
endpoint for `connect-src`. The immutable hashed JS asset returned
`Cache-Control: public, max-age=31536000, immutable`; root HTML used a short
30-second cache. These are appropriate policies for the deployed static site.

### Candidate/deployment identity

Fresh SHA-256 comparisons showed the live `index.html`, `/privacy/`, `/terms/`,
main CSS, legal CSS, and main JS exactly match local `dist/site`. The visible
site is therefore from this candidate, but it is incomplete: all tested
artifact URLs in `/downloads/` are 404. The root’s candidate-matching HTML is
not sufficient to deliver the product.

## Performance/budget evidence

The fresh production build reported:

| Asset | Size | Budget | Result |
| --- | ---: | ---: | --- |
| Landing JS | 1.76 KB | 200 KB | PASS |
| Main landing CSS | 10.81 KB | 50 KB | PASS |
| Mobile hero WebP | 33.9 KB | 300 KB | PASS |
| Desktop hero WebP | 81.75 KB | 300 KB | PASS |
| Whole unpacked extension | 174.62 KB | 200 KB initial JS budget does not apply to total package | Informational |

A fresh Lighthouse attempt could not complete because the CLI initially did not
discover Chromium and then crashed the supplied Playwright browser tab. No
fresh Lighthouse score is claimed. The manual page load/a11y evidence above and
the small built assets support the stated static budgets, but a stable
Lighthouse run should be repeated after the deployment repair.

## Required remediation and retest

1. Deploy the complete generated `dist/site/` tree, preserving
   `dist/site/downloads/`; confirm both live artifact URLs return 200 and
   byte-match the candidate files.
2. Make `npm run test:extension` pass with the pinned Playwright Chromium,
   either by correcting the product options-page launch behavior or the test’s
   supported navigation approach, then exercise the complete full-journal
   flow.
3. Decide whether origin-less local sidecar clients are allowed. If not,
   reject them server-side; CORS alone is not authorization.
4. Repeat the release QA after a new deployment. Do not mark this candidate
   PASS until P0 and P1 are resolved.

No product code was modified in this verification.
