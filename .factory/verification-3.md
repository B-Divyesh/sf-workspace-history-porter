# Independent verification 3 — Workspace History Porter

**Candidate:** `87163d7020c324e6bbe1b863d897aa2bd46aea7e`

**Live URL:** <https://workspace-history-porter.sociobot.in>

**Verified:** 2026-08-28

**Verdict: FAIL**

The repaired artifact deployment and sidecar concurrency path now pass from
fresh evidence. The candidate is still not releasable: the only transfer UI is
removed at the required 390 px width, and the advertised paid checkout is a
live 404. The free desktop export/import path itself works end to end.

## Release-blocking defects

### P1 — The extension hides its core transfer path at 390 px

In the actual production-built MV3 extension, after creating a workspace and
two entries, the options page was resized to 390×844. `#transfer-button` was not
visible and the complete `.rail-footer` had `display: none` from the
`max-width: 760px` rule. There is no second transfer control elsewhere in the
mobile layout.

The journal remains usable for adding and editing entries, but encrypted JSON
export/import and sidecar push/pull become unreachable. That removes the
product's portability job at the explicitly required mobile width and
contradicts `.factory/design.md` (“essential content remains”). The 390 px
screenshot showed the workspace rail ending after the workspace selector and
the journal ending after its entries, with no transfer action.

Remediation: keep “Transfer & sidecar” available in the stacked layout, then
add a 390 px extension test that opens the transfer dialog and performs an
export/import.

### P1 — The live $29 Team Relay checkout returns 404

The deployed `#buy-link` resolves to:

```text
https://pilot-api.sociobot.in/api/v1/products/workspace-history-porter/checkout
```

A fresh GET returned:

```text
HTTP/2 404
{"error":"enabled factory product","status":404}
```

The production `api.sociobot.in` checkout path also returned the same 404.
The pilot verification endpoint itself is online—an invalid token returned
HTTP 200 with `valid:false`—but a user cannot initiate the advertised purchase.
This breaks the accepted freemium monetization flow. Register/enable the
correct Sociobot product and point the release build at the intended billing
environment, then test the redirect through return and license restoration.

## Other defects

### P2 — Open-entry summary is stale after a status change

With two open entries, changing one status selector to **Done** saved the
change and showed “Status updated,” but the header continued to say
`2 open · 2 total`. A later full render (lock/unlock) corrected it to
`1 open · 2 total`. The status change handler persists but does not call the
full render that refreshes the summary.

### P2 — Several mobile website links miss the 44 px target baseline

At 390 px, representative rendered targets included “Download sidecar” at
140×17, footer Privacy at 43×20, Terms at 35×20, and Source at 41×20 CSS px.
The header download action was 115×43. Axe does not classify these as
serious/critical, but they fail the attached 44×44 touch-target requirement.

### P3 — Sidecar health has no build identity

`GET /health` returned only `{ "ok": true, "root": "…" }`. Health is useful,
but a running sidecar cannot report a version or commit to distinguish a stale
binary. The downloadable artifact was instead identified by SHA-256 during
this verification.

### P3 — Development tooling audit remains non-zero

`npm audit --omit=dev` found 0 vulnerabilities. Full `npm audit` found 13
development dependency findings: 2 low, 2 moderate, 5 high, and 4 critical,
primarily under WXT/web-ext/Vite/Vitest tooling. No production npm dependency
is affected, but the toolchain should be upgraded separately.

## Clean-checkout quality gates

The candidate was checked out detached into a new temporary worktree. It was
clean before `npm ci`; no product source was changed. There is no lint script.

| Check | Result | Fresh evidence |
| --- | --- | --- |
| Install | PASS | `npm ci` installed 472 packages from the lockfile. |
| Unit/integration | PASS | `npm test`: 7/7 across crypto, vault, and sidecar. |
| Type check | PASS | `npx tsc --noEmit` exited 0. |
| Production build | PASS | `npm run build` produced the MV3 package and complete `dist/site`. |
| Package verification | PASS | `npm run test:package` rebuilt and verified site, ZIP, and packaged sidecar. |
| Extension smoke | PASS | `npm run test:extension` completed unlock → workspace → entry offline with no console errors. |
| Site E2E | PASS | `npm run test:e2e`: 10/10 on desktop Chromium and 390×844 mobile. |
| Production audit | PASS | `npm audit --omit=dev`: 0 vulnerabilities. |
| Full audit | WARN | 13 development-only findings, detailed above. |

## Independent product-flow evidence

The built MV3 package was loaded into fresh persistent Chromium profiles.

- A 9-character passphrase failed native validation; the 10-character boundary
  created the encrypted vault.
- A workspace, task with handoff note, and pull-request link were created. An
  invalid URL kept the dialog open; correcting it allowed save.
- Encrypted export had the expected versioned format and did not contain either
  plaintext task title. Markdown export required confirmation and contained the
  expected readable data.
- Invalid JSON produced a recoverable parse message and retained both entries.
- Lock → wrong passphrase produced the documented error; the correct
  passphrase recovered both entries.
- The encrypted file was imported with **REPLACE** into a second fresh browser
  profile using the same passphrase. Both entries were recovered in 3.24 s,
  comfortably inside the one-minute success target.
- The extension had no page/console errors, no horizontal overflow at 390 px,
  honored reduced motion, and had zero serious/critical Axe findings. The P1
  missing mobile transfer action was found beyond the repository smoke suite.

The prior service-worker-startup flake did not recur in the configured smoke or
multiple independent fresh-profile launches.

## Packaged sidecar regression and boundary checks

Checks used `dist/site/downloads/porter-sidecar.mjs`, a byte-identical copy of
the candidate source:

- `/health`: HTTP 200 with `Cache-Control: no-store`; empty journal: 404.
- Origin-less and hostile-origin journal reads/writes: 403.
- Allowed extension preflight: 204 with the exact echoed origin, limited
  methods, and `Vary: Origin`.
- Malformed JSON and invalid envelope: 400. A payload over 5 MB returned 400
  and health remained 200 afterward.
- Twenty simultaneous valid `PUT /journal` requests returned 20 HTTP 200s.
  The final journal exactly matched one submitted envelope, remained mode
  `0600`, and no temporary files remained.
- After process restart, the same complete envelope was returned.
- Missing `--root` and invalid port 80 exited 1 with actionable messages.

This clears the concurrency and origin-enforcement failures from the earlier
reports. The service binds to loopback and stores only the encrypted envelope;
the passphrase and plaintext journal were not present in its file.

## Accessibility, keyboard, responsive, and visual checks

- Playwright Axe found zero serious/critical violations on the live home,
  privacy, and terms pages at desktop and 390×844, and on the unlocked
  extension. The repository smoke also checks locked and unlocked states.
- Home and legal pages have a title, `lang=en`, one `h1`, a `main`, complete
  image alt attributes, and no horizontal overflow. Body text is 16 px.
- The skip link is the first keyboard target and, after focus style settlement,
  appears at top 8 px with a 3 px amber outline. Native controls and dialogs
  were operated with keyboard/form actions without traps.
- Reduced motion reports no route animation and effectively instant extension
  transitions. No looping or flashing motion was present.
- Visual review at 1440×900 and 390×844 found the site coherent, legible, and
  unclipped. The extension journal also remained legible and unclipped at
  390×844; its missing transfer action is the responsive failure above.
- The distinct night-market visual system matches `.factory/design.md`, which
  records palette, typography, spacing, motion, asset prompts, and provenance.
- `/opt/fleet/lib/verify-url.sh` passed against live: HTTP 200, title, language,
  one `h1`, `main`, alt text, labeled buttons, and no browser errors (1,281 ms).

## Privacy, outbound requests, and response policy

The free live page requested only its own origin: HTML, local CSS/JS, the local
SVG mark, and the responsive WebP hero. No analytics, tracking, CDN font, or
third-party script request occurred. Source and manifest inspection found no
content script. Current-tab URL access uses `activeTab`, an explicit user
action, and `permissions.request` for that origin. Vault data is AES-256-GCM
with PBKDF2-SHA-256; the passphrase is in extension session storage, while only
the encrypted envelope is persisted.

The live privacy and terms pages accurately describe local storage, readable
Markdown risk, sidecar boundaries, and the payment processor. Optional license
verification is the only designed third-party runtime request; the broken
checkout is reported above.

Repository documentation also satisfies the handoff baseline: README covers
audience, operation, testing, packaging, and deployment; `LICENSE` is MIT; and
both legal pages are shipped.

Live responses include HSTS, `nosniff`, `strict-origin-when-cross-origin`, a
restrictive self-only CSP except for pilot billing `connect-src`, and a policy
denying camera, microphone, and geolocation. HTML uses
`public, must-revalidate, max-age=30`; hashed JS uses one-year immutable cache;
downloads use one hour. The static site is not a PWA and registers no product
service worker, so a PWA update/offline-reload check does not apply. The MV3
core smoke passed offline.

## Live candidate identity

The live root, privacy page, terms page, main JS, and both CSS files were
byte-identical to the fresh production build. Key hashes:

```text
index.html          91de89d36042d3a111182cd2c111962f85e5d7ac4cf990f615ce6f97ab6d2743
porter-sidecar.mjs  e0dc822c1b7a6cf1e10838d9cbbbb7908b0f264b958ea84301b4f4c220bde2b2
```

The live ZIP was 142,998 bytes and passed `unzip -t`. ZIP container hashes
differed because rebuild timestamps vary, but all 20 unpacked paths and
SHA-256 values matched the candidate exactly. Both artifact URLs return 200.

## Performance and bundle budgets

Fresh mobile Lighthouse against the live URL scored 100 performance, 100
accessibility, 100 best practices, and 100 SEO. FCP was 0.9 s, LCP 1.0 s, total
blocking time 10 ms, CLS 0, and total transferred page weight 42 KiB.

| Asset | Size | Budget | Result |
| --- | ---: | ---: | --- |
| Landing JS | 1,764 B | 200 KB | PASS |
| Main landing CSS | 10,810 B | 50 KB | PASS |
| Mobile hero WebP | 33,896 B | 300 KB | PASS |
| Desktop hero WebP | 81,752 B | 300 KB | PASS |
| Fonts | 0 B | 120 KB | PASS |
| Unpacked extension | 174,615 B | informational total | PASS |

## Required retest

1. Preserve a reachable transfer/sidecar action at 390 px and test export plus
   import in that layout.
2. Enable/register the Sociobot checkout product and confirm the live buy link
   redirects to hosted checkout and returns a license to the product URL.
3. Refresh the workspace header after a status change and enlarge mobile text
   link targets to the 44 px baseline.
4. Repeat the clean gates, cross-browser transfer, sidecar concurrency, live
   identity, Axe, and Lighthouse checks.

No product code was modified during this verification.
