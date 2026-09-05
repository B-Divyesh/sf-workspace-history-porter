# Workspace History Porter review 1 — portable workspace handoff

**Work order:** `workspace-history-porter-review-1`
**Live URL:** <https://workspace-history-porter.sociobot.in>
**Reviewed:** 2026-09-05
**Implementation candidate:** `2d2785409f5472c5f50ed919d6c99cb60fff851e`
**Documentation HEAD:** `c68a90586f78ddaa376346c202ac1038e55caedd`  
**Verdict: FAIL**

`c68a905` changes only `.factory/handoff.md` and `.factory/verification-4.md`
relative to the implementation candidate. The live ZIP and landing HTML match
the implementation reviewed; the live sidecar identifies itself as
`2d2785409f54`. This is not a fresh product image after a report-only commit.

## First screen

Fresh 1440×900 desktop and 390×844 phone browser contexts opened the landing
page at scroll position zero. The visible job is carrying an encrypted index of
tasks, handoff notes, and useful URLs to another browser. The intended audience
is people reopening a remote workspace in a new browser. The first available
action is **Download Chrome extension** (with **Download v1** in the header),
not a sample.

The first screen does not meet the required plain-words shape: “Carry the useful
context. Leave the transcript behind.” is not a direct job statement, does not
name the audience, and offers no one-click sample. Both initial loads had zero
console or page errors.

## Findings

### P1 — A normal Link → Task workflow still fails in the installed live extension

This is the unresolved P1 from verification 4. I downloaded the live ZIP,
unpacked it, and loaded it in a fresh offline Chromium profile. After creating
a workspace and task, adding a valid Link, then opening a new default Task and
pressing Enter, the task was not saved. The observable final state was:

```json
{
  "cards": 2,
  "dialogOpen": true,
  "kind": "task",
  "urlRequired": true,
  "linkHidden": true
}
```

Chromium reported `An invalid form control with name='' is not focusable.` The
hidden URL field stays required after the Link form is reset. This blocks a
common core journal path and violates the no-console-errors quality gate.

### P1 — The advertised $29 Team Relay checkout is unavailable

The public checkout link
`https://api.sociobot.in/api/v1/products/workspace-history-porter/checkout`
returns HTTP 404 with the service’s enabled-product error response. The
invalid-license recovery path itself works: an explicit invalid-token attempt
shows an actionable inactive-license message without console errors. A customer
cannot start the advertised purchase, however, so the paid path remains
incomplete. This is the unresolved P1 from verifications 3 and 4; billing
registration is outside this repository.

### P1 — There is no one-click demo sandbox

The live first screen has no **Try it with sample data** action. `/demo` and
`/demo/` both return the generic hosting 404 page. The repository also has no
`.factory/demo.md`, no `?demo=1` route, no isolated demo storage namespace, no
persistent “Demo — sample data, nothing is saved” label, and no reset path.
Consequently a reviewer cannot enter the required realistic sample, inspect
populated output, reset it, or prove it cannot change real data.

### P1 — Claim governance is missing; 20 public claims are untested

`.factory/claims.json` does not exist. There are therefore zero declared claim
commands to run, and no public claim has the required one-to-one sandbox test.
The following 20 distinct visitor-facing functional, privacy, quantitative, or
commercial claims were inventoried across the landing page, README, privacy
page, and terms; each lacks a claim entry and tagged observable test:

1. Free use
2. Offline use
3. No account is needed
4. AES-256-GCM encryption at rest
5. No transcript or page-content collection
6. One-minute recovery target
7. Open/portable JSON handoff
8. Explicit URL capture with origin permission
9. Browser-side passphrase key derivation
10. Encryption key is not persisted
11. Import merge does not lose local work
12. Only explicitly added notes and links are stored
13. Passphrase is not sent
14. Encrypted JSON export
15. Plaintext Markdown warning
16. Loopback-only sidecar
17. Sidecar writes ciphertext only
18. Sidecar rejects ordinary web origins
19. No site analytics, ad pixels, third-party fonts, or trackers
20. $29 one-time Team Relay purchase and license behaviour

The claims contract requires every one to be listed and tested from the demo
entry point. The current total of untested public claims is **20**. The false
checkout claim is separately recorded above.

### P2 — Unknown URLs show a broken generic 404 page

`/404` and `/not-a-real-route` deliberately return HTTP 404, which is correct.
Their body is not a product 404: it has the title “Azure Static Web Apps - 404:
Not found”, no `h1`, no `main`, no product navigation or route home, and logs a
failed-resource error. This violates the required designed 404 route. The
status itself is not the defect; the unusable generic page is.

### P2 — Landing and legal copy do not follow the plain-words contract

The homepage headline and multiple headings use figurative route language
instead of naming the job. Examples include “Three stops. No cloud account.”,
“Take the exit whenever you want.”, “Pass the baton through a shared
workspace.”, and “Your workspace already moved. Bring the signs.” The legal
page H1s, “Privacy, by route.” and “Terms of the handoff.”, likewise do not
name the page in plain words. `.factory/copy-audit.md` is absent, so there is no
word-count/banned-language evidence. This finding includes the first-screen
defect recorded above, but is not counted twice.

### P2 — Required route metadata is missing

Live `/`, `/privacy/`, and `/terms/` have route titles, descriptions, `lang`,
and favicons, but none has a canonical URL, Open Graph title/image, Twitter
card, or Apple touch icon. The site-structure contract requires these on every
public route and a real 1200×630 product-derived social image.

## Current evidence

### Clean checkout commands

Documented prerequisites were installed with `npm ci` before tests. All
declared project quality commands that apply to a clean consumer checkout pass:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 7/7 Vitest tests |
| `npm run lint` | PASS — TypeScript no-emit check |
| `npm run build` | PASS — MV3 extension, ZIP, static site, and sidecar |
| `npm run test:package` | PASS — artifact verifier and ZIP test |
| `npm run test:extension` | PASS — offline journal, status summary, 390 px transfer, Axe, no console errors in its covered flow |
| `npm run test:e2e` | PASS — 13 passed, 1 intentional mobile-only skip |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `npm audit` | PASS — 0 vulnerabilities |

There is no `.factory/claims.json`, so there are no declared claim commands;
that absence is the P1 claim-governance finding, not a pass.

### Live site, accessibility, privacy, and links

- Fresh desktop and phone visits to `/`, `/privacy/`, and `/terms/` all returned
  200 with one `h1`, one `main`, `lang=en`, no horizontal overflow, visible
  skip-link focus, no console/page errors, and no serious or critical Axe
  violations.
- Reduced-motion contexts exposed no running route animation after load. Mobile
  E2E also passed the defined 44 px product-link target checks.
- `/opt/fleet/lib/verify-url.sh` passed against the live root: title, language,
  one H1, main landmark, image alts, labelled buttons, zero browser errors, and
  592 ms load time.
- Before an explicit license action, request capture contained only same-origin
  resources. An explicit invalid-license check made only the expected
  `api.sociobot.in` verification request and recovered cleanly.
- All live product links return 200 except the checkout link above. The source
  repository link returns 200. The two download artifacts return 200.
- The root response supplies HSTS, `nosniff`, strict-origin referrer policy,
  restrictive CSP with response-header `frame-ancestors`, and a restrictive
  permissions policy. The static product is not a PWA; there is no web service
  worker/update lifecycle to test.

A fresh Lighthouse invocation produced category values but ended with a
`TARGET_CRASHED` screenshot artifact, so this review does not treat those
values as valid new Lighthouse evidence. The prior candidate’s reported
Lighthouse result is unchanged because the implementation image is unchanged;
the current build sizes remain within budget: 1,758 B landing JS, 11,109 B
landing CSS, 33,896 B mobile hero, and 81,752 B desktop hero.

### Installed artifact and sidecar checks

The live ZIP was used in a fresh persistent Chromium profile, offline. Normal
vault creation, workspace creation, task creation, Link creation, and the
reproduced Link → Task failure above were tested. The repository smoke also
proves its covered 390 px export/import recovery flow.

The sidecar downloaded from the live deployment was run in a temporary clean
workspace. It passed these direct consumer checks:

- `/health`: 200 with `Cache-Control: no-store`
- hostile origin: 403
- malformed and over-5 MB envelopes: 400
- 20 simultaneous valid extension-origin writes: all 200
- final file: a complete envelope with mode `0600`
- after process restart: encrypted journal still returned 200

This is a browser extension and local sidecar, not a multi-tenant hosted
backend. Tenant isolation and externally exposed 429/`Retry-After` behaviour
do not apply. There is no public promise of a hosted API rate limit.

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing deployed ZIP and sidecar (verification 1 P0) | Resolved — both live downloads are 200; ZIP SHA-256 is `2ff12509e3bbdfddec6da09d29f6f62a0dadff8aa9fdfa1e71791d6307a066f5` and matches the fresh build. |
| Extension smoke failure/flakiness (verification 1 P1, verification 2 P2) | Resolved in current evidence — `npm run test:extension` passed. |
| Origin-less sidecar journal access (verification 1 P2) | Resolved — direct origin-less and hostile-origin requests are 403. |
| Development audit findings (verifications 1–3) | Resolved — both current audits report 0 vulnerabilities. |
| Concurrent sidecar write loss (verification 2 P1) | Resolved — all 20 concurrent writes returned 200 and a complete `0600` file survived restart. |
| Missing mobile transfer control (verification 3 P1) | Resolved in current smoke evidence — 390 px transfer/export/import passed. |
| Stale open-entry summary (verification 3 P2) | Resolved in current smoke evidence — status summary update is covered and passed. |
| Mobile touch targets (verification 3 P2) | Resolved in current E2E evidence — mobile target test passed. |
| Sidecar build identity (verification 3 P3) | Resolved — live health identifies commit `2d2785409f54`. |
| Link → Task hidden required field (verification 4 P1) | **Unresolved** — reproduced in the installed live ZIP. |
| Production Team Relay checkout 404 (verifications 3–4 P1) | **Unresolved** — live checkout still returns 404. |

## Required next steps

1. Clear or recompute the URL input’s `required` state after every entry form
   reset, then add a Link → Task regression that monitors console errors.
2. Have the authorized billing owner enable the production checkout product and
   retest checkout, return-token storage, verification, restore, cached offline
   unlock, and revoked-license handling.
3. Build `/demo` (or `?demo=1`) with sample journal data, isolated storage,
   persistent demo label, reset, and `.factory/demo.md`; put the sample action
   first on the landing page.
4. Add `.factory/claims.json` and exactly one tagged observable demo test for
   every retained public claim; remove any claim that cannot be tested.
5. Replace the generic 404 with a product page, rewrite the first screen and
   legal H1s in plain language, record `.factory/copy-audit.md`, and add the
   missing canonical/social metadata and product social image.

No product code was modified during this review.
