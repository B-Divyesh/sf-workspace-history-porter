# Independent verification 4 — Workspace History Porter

**Work order:** `workspace-history-porter-verify-4`

**Candidate:** `2d2785409f5472c5f50ed919d6c99cb60fff851e`

**Live URL:** <https://workspace-history-porter.sociobot.in>

**Verified:** 2026-08-28

**Verdict: FAIL**

The earlier deployment-only artifact failure is fixed: the live site, extension
ZIP, sidecar, legal pages, JS, CSS, and responsive hero assets are byte-identical
to the candidate's fresh production build. The candidate is nevertheless not
releasable. A normal Link → Task sequence traps the entry form behind a hidden
required URL field, and the advertised production Team Relay checkout still
returns 404.

## Release-blocking defects

### P1 — Adding a Link makes the next default Task impossible to submit

This reproduced against the extension downloaded from the live deployment in a
fresh Chromium profile:

1. Create a vault with the valid 10-character boundary passphrase.
2. Create a workspace and a normal task.
3. Add a Link, first recover from an invalid URL, then save a valid pull-request
   URL.
4. Open **Add journal entry** again. The visible type is the reset default,
   **Task**, and the URL controls are hidden.
5. Enter `Temporary local task` and press Enter.

The dialog remained open, the card count stayed at 2, and the task was not
saved. Runtime state was:

```json
{
  "entryKind": "task",
  "linkFieldsHidden": true,
  "entryUrlRequired": true
}
```

Chromium also emitted a console error:

```text
An invalid form control with name='' is not focusable.
```

The cause is visible in `entrypoints/options/main.ts`: the kind-change handler
sets `#entry-url.required`, but after a successful submission `form.reset()`
and `linkFields.hidden = true` do not clear that property. The user can recover
by changing the type to Note and back to Task, or by reloading the options
page, but the default and common follow-up action silently fails. This breaks a
core journal workflow and the no-console-errors acceptance gate.

### P1 — Production Team Relay checkout is still unavailable

The candidate and live page correctly target the production billing URL, but a
fresh request returned no redirect and no hosted checkout:

```text
GET https://api.sociobot.in/api/v1/products/workspace-history-porter/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

The production verification service itself is reachable: an invalid token
returned HTTP 200 with `{"valid":false,"reason":"invalid",...}`, and the live
restore UI handled that response. Users cannot initiate the advertised $29
one-time purchase, so the accepted freemium paid-unlock path is incomplete.
Product/billing registration is external to this repository and must be fixed
by the authorized factory billing owner.

## Clean-checkout repository gates

The worktree was clean and exactly at the candidate SHA before installation.
No product source was changed.

| Check | Result | Fresh evidence |
| --- | --- | --- |
| Install | PASS | `npm ci`: 233 packages installed; 0 vulnerabilities. |
| Unit/integration | PASS | `npm test`: 3 files, 7/7 tests passed. |
| Type/lint | PASS | `npm run lint` (`tsc --noEmit`) exited 0. |
| Exact production build | PASS | `npm run build` produced the WXT MV3 extension, ZIP, static site, and stamped sidecar. |
| Package verification | PASS | `npm run test:package` rebuilt and verified the deploy tree, ZIP, production billing boundary, and sidecar identity. |
| MV3 smoke | PASS | `npm run test:extension` covered offline journal creation, immediate status summary, 390 px encrypted export/import, Axe, reduced motion, and console monitoring. |
| Site E2E | PASS | `npm run test:e2e`: 13 passed, 1 intentional desktop skip for the mobile-only target test. |
| Production audit | PASS | `npm audit --omit=dev`: 0 vulnerabilities. |
| Full audit | PASS | `npm audit`: 0 vulnerabilities. |

## Independent extension and portability journey

The deployed ZIP was unpacked and installed into clean persistent Chromium
profiles, offline and with reduced motion enabled. Independent checks covered:

- A 9-character passphrase was rejected by native validation; exactly 10
  characters created the encrypted vault.
- Empty state, disabled add-entry control before workspace creation, dialog
  focus placement, an 80-character workspace-name boundary, task creation,
  handoff notes, and a pull-request bookmark all worked.
- An invalid URL kept the dialog open and was recoverable. Task/link filters
  and the no-match state worked. Status changes immediately updated the open
  count.
- The P1 Link → Task failure above reproduced. Toggling the kind away and back
  cleared the stale requirement and allowed the journey to continue.
- Invalid JSON and an invalid MERGE/REPLACE response produced recoverable
  messages and retained existing entries.
- Encrypted JSON contained the expected versioned format but none of the task
  titles or passphrase. Persistent extension storage contained ciphertext, not
  those plaintext values; the passphrase was confined to session storage.
- After adding divergent local data, REPLACE restored the exported two-entry
  journal. Lock → wrong passphrase produced an actionable error; the correct
  passphrase recovered it.
- A second clean browser profile imported the handoff and recovered both task
  titles in **2.167 seconds**, inside the one-minute success target.
- At 390×844, transfer remained visible, there was no horizontal overflow,
  reduced-motion durations were `0.00001s`, and Axe found zero serious/critical
  violations. The first keyboard focus was the visible skip link with a solid
  outline.
- The actual popup separately passed locked/unlocked Axe checks, 10-character
  unlock, quick task creation, count update, invalid current-page capture
  recovery, and lock, with zero console/page errors.

The only console error in the independent options journey was the exact
hidden-required-control error associated with P1.

## Packaged sidecar consumer checks

The sidecar downloaded from the live site was run directly as a clean consumer:

- `/health` returned 200, `Cache-Control: no-store`, service
  `workspace-history-porter-sidecar`, version `1.0.1`, and candidate identity
  `2d2785409f54`.
- Empty journal returned 404. Origin-less and hostile-origin reads returned
  403. Allowed extension preflight returned 204, echoed the exact origin, and
  supplied `Vary: Origin`.
- Malformed JSON, a non-Porter envelope, and a payload over 5 MB returned 400;
  health remained 200 after the oversized request.
- Twenty simultaneous valid writes all returned 200. The final file exactly
  matched one complete submitted envelope, mode was `0600`, and no temporary
  files remained.
- The complete envelope survived process restart.
- Missing `--root` and port 80 exited 1 with actionable usage/range messages.

This independently clears the earlier concurrent-write and build-identity
findings.

## Live deployment, accessibility, privacy, and policy

Desktop 1440×900 and mobile 390×844 browser checks covered `/`, `/privacy/`,
and `/terms/`:

- Every page returned 200, used `lang=en`, had a non-empty title, one `h1`, one
  visible `main`, complete image alt attributes, 16 px body text, no unnamed
  buttons, and no horizontal overflow.
- Axe reported zero serious/critical findings on all six page/viewport cases.
- The first Tab stop was “Skip to main content” with a solid focus ring.
  Reduced-motion route animation was effectively instant; it is removed from
  the mobile layout.
- Required mobile links measured at least 44×44 px. Representative heights
  were 44 px for header download, sidecar download, ticket legal links, and all
  footer links.
- There were zero live page/console errors. The factory URL verifier also
  passed with HTTP 200, an 809 ms load, and no errors.
- Before explicit license restoration, all requests were same-origin: HTML,
  local hashed CSS/JS, the local SVG mark, and the appropriate local WebP.
  There were no analytics, trackers, CDN fonts, third-party scripts, or
  unsolicited billing calls.
- Source/manifest review found no content script. URL capture is tied to the
  explicit **Use this tab** action and optional per-origin permission. The only
  designed external runtime origin is production Sociobot billing; the
  sidecar is loopback-only.
- The single-mode night-market visual system matches `.factory/design.md` and
  has recorded generated-asset provenance. Desktop/mobile visual review found
  the interface coherent and unclipped.

Live policy headers include HSTS, `nosniff`, strict-origin referrer policy, a
camera/microphone/geolocation-denying Permissions Policy, and a restrictive CSP
limited to self except production Sociobot billing for `connect-src`. HTML
uses `public, must-revalidate, max-age=30`; hashed assets use one-year immutable
caching and returned 304 to a matching ETag; downloads use one hour.

The static site has no service-worker controller or registration. This product
is a static site plus an MV3 extension, not a PWA, so a PWA update/offline reload
test does not apply; the MV3 core itself passed offline.

## Live candidate identity

The following live/local SHA-256 pairs matched exactly:

```text
index.html                                    17423bba35b7935e52a997186e8d08a0f74cc2c551ebb44bc4c3b02c13e4a085
privacy/index.html                            a6bba5f6a6545421b1722c3f46e841f2c280866fd870a1e7a4b71694f836a18f
terms/index.html                              42344f67e486ef9962cde57f484ccec880ba2372fe8765f803d9bb550ce98f23
assets/main-B2y264gk.css                      950755fddff26d960c1f5251a5a838e82dee544cc85a97e46fbf22432b4bf7f4
assets/legal-DlHzWrPy.css                     15ab4a38d1409f7dd90925774fa7b8101392957a63aa52b8578934b9a2ca6a4c
assets/main-diCx0dqH.js                       e48aba4bf09ccc8f8d17b1c2b64510b641a6c64d19d14712b6f4aa7205bc5769
downloads/workspace-history-porter-chrome.zip 2ff12509e3bbdfddec6da09d29f6f62a0dadff8aa9fdfa1e71791d6307a066f5
downloads/porter-sidecar.mjs                  7f07f8f9d06e712b5d81abb97688b9570fb4fa94c3c08508af0f73ae17f0c6ec
```

The live ZIP was 142,644 bytes, returned 200, passed `unzip -t`, and is itself
byte-identical rather than merely content-equivalent. The prior artifact 404 is
therefore conclusively resolved.

## Performance and bundle budgets

Fresh mobile Lighthouse against the live URL scored **100 performance, 100
accessibility, 100 best practices, and 100 SEO**. FCP and LCP were 1.0 s, total
blocking time 80 ms, CLS 0, Speed Index 1.0 s, and total transferred weight 42
KiB.

| Asset | Size | Budget | Result |
| --- | ---: | ---: | --- |
| Landing JS | 1,758 B | 200 KB | PASS |
| Main CSS | 11,109 B | 50 KB | PASS |
| Mobile hero WebP | 33,896 B | 300 KB | PASS |
| Desktop hero WebP | 81,752 B | 300 KB | PASS |
| Fonts | 0 B | 120 KB | PASS |
| Extension ZIP | 142,644 B | informational | PASS |

## Required retest

1. After every entry-form reset, derive both link visibility and URL
   `required` state from the reset kind (or explicitly clear `required`). Add a
   regression that saves Link → Task and asserts no console errors.
2. Register/enable the production `workspace-history-porter` billing product,
   then test checkout redirect, $29 one-time terms, license return/storage,
   verification, restore, offline cached unlock, and revoked-license fallback.
3. Repeat the clean gates, live ZIP journey, artifact identity, Axe, request
   capture, and Lighthouse checks before changing the verdict.

No product code was modified during this verification.
