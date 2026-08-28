# Repair handoff — Workspace History Porter

Repaired, verified, and deployed on 2026-08-28 for work order
`workspace-history-porter-repair-2`. This repair addresses the independent
verifier report in commit `26f5016db44832fa1cd2b0b682bf306264f15b58`
against candidate `d16d231d1433ebb78ac8996167cc57c0fcfd56cb`.

## Findings repaired

### P1 — concurrent sidecar writes

The verifier's 20-way `PUT /journal` probe was reproduced against the candidate:
valid extension-origin requests returned a mix of HTTP 200 and HTTP 400 because
all handlers shared `handoff.tmp`. The new integration assertion failed on the
candidate with multiple 400 responses.

Each valid write now uses an unguessable, request-specific temporary filename
containing the process ID and a random UUID. Completed temp files enter a
serialized replacement queue, so only one atomic rename targets `handoff.json`
at a time. A failed rename is removed without poisoning later queue entries.
The committed regression sends 20 valid requests concurrently and requires:

- all 20 responses are HTTP 200;
- the final file is exactly one complete submitted encrypted envelope;
- the final file retains mode `0600`;
- no temporary files remain.

The final sidecar integration test passed five consecutive focused reruns plus
the complete suite, and the live downloadable sidecar byte-matches the tested
source.

### P2 — MV3 smoke startup flake

The smoke harness no longer depends on receiving one service-worker event in a
10-second window. It polls both already-created and newly visible extension
pages/service workers for up to 30 seconds, reuses the install-opened options
page when present, and retains the options-navigation retry for Chromium's
install redirect.

The smoke now also runs the free core flow offline with reduced motion, uses
Enter to submit unlock and entry forms, verifies the skip link is the first
visible keyboard focus, and runs Axe in locked and unlocked states. Five
consecutive startup-focused runs passed; after enabling the final offline,
keyboard, reduced-motion, and Axe coverage, three consecutive runs passed.

## Verification performed

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run test:package
npm run test:extension
npm run test:e2e
npm audit --omit=dev
```

Results:

- `npm ci`: completed from the committed lockfile.
- `npm test`: 7/7 crypto, vault, and sidecar tests passed, including the
  parallel-write regression.
- `npx tsc --noEmit`: passed. The repository has no separate lint script.
- `npm run build`: passed and produced the MV3 extension plus complete
  `dist/site` deployment tree.
- `npm run test:package`: rebuilt and verified the site, ZIP, byte-identical
  sidecar copy, and `unzip -t` integrity.
- Final offline/reduced-motion extension smoke: 3/3 consecutive passes; full
  unlock → workspace → entry flow, keyboard submission, locked/unlocked Axe,
  semantic landmarks, and no console errors.
- `npm run test:e2e`: 10/10 passed across desktop Chromium and 390×844 mobile.
  Coverage includes `/`, `/privacy/`, `/terms/`, downloads, license return,
  Axe serious/critical checks, and horizontal overflow.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Full `npm audit`: 13 development-tool findings (2 low, 2 moderate, 5 high,
  4 critical), unchanged in scope from the verifier report; no production npm
  dependency or shipped browser artifact is affected.

`/opt/fleet/lib/verify-url.sh` passed locally (583 ms) and live (647 ms): HTTP
200, correct title and `lang=en`, one `h1`, a `main` landmark, no missing image
alt text, no unlabeled buttons, and no browser errors. Manual Playwright checks
on desktop and 390 px mobile confirmed the skip link is the first focus target
with a solid outline, no horizontal overflow, reduced-motion route animation
set to `none`, and no console/page errors. Visual review of both screenshots
found no clipping or regressions.

Mobile Lighthouse against the production build completed with:

| Category/metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| Largest Contentful Paint | 0.9 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0 |

Static budgets remain within contract: landing JS 1,764 B (900 B gzip), main
CSS 10,810 B (3,180 B gzip), mobile hero WebP 33,896 B, desktop hero WebP
81,752 B, and unpacked extension 174.62 kB.

## Privacy, offline, and response policy

Live request capture for the free landing flow contacted only
`https://workspace-history-porter.sociobot.in`; there are no analytics, CDN
fonts, or third-party scripts. The optional licensed flow remains limited to
the documented Sociobot pilot billing API. Core extension smoke passed with
the browser context offline, proving local vault creation and journal writes do
not require network access. The site is intentionally static rather than a PWA,
so no site service-worker update lifecycle applies; the MV3 package is updated
by replacing the installed package.

Live responses include HSTS, `X-Content-Type-Options: nosniff`, restrictive
CSP, `strict-origin-when-cross-origin`, and camera/microphone/geolocation-denying
Permissions-Policy. HTML uses `public, must-revalidate, max-age=30`, the hashed
JS asset uses `public, max-age=31536000, immutable`, and downloads use a one-hour
cache.

## Deployment and live identity

The complete deployment tree was published with:

```sh
/opt/fleet/lib/deploy-static.sh workspace-history-porter dist/site
```

Azure deployment ID: `f486bc80-1fd8-4bc9-b92a-6fd1f2215f79`.

The custom domain is ready over managed TLS. Live files were downloaded after
deployment and byte-compared with the production build:

| Artifact | Bytes | SHA-256 | Live result |
| --- | ---: | --- | --- |
| `/index.html` | 8,941 | `91de89d36042d3a111182cd2c111962f85e5d7ac4cf990f615ce6f97ab6d2743` | exact match |
| `/downloads/workspace-history-porter-chrome.zip` | 142,998 | `81fe6b32cb4fde2fb4ca76fd63a17a42ad034f74361d0afcd7af2475b050a9f0` | exact match; unpacked tree exact |
| `/downloads/porter-sidecar.mjs` | 4,749 | `e0dc822c1b7a6cf1e10838d9cbbbb7908b0f264b958ea84301b4f4c220bde2b2` | exact tested source match |

## Known non-release gaps

- Firefox packaging is outside this Chrome/Chromium MV3 artifact.
- A real paid license was not supplied. The license callback/verification UI is
  covered with a mocked valid Sociobot response, while the sidecar protocol is
  covered directly, including origin enforcement and concurrency.
- Development-only audit findings remain in WXT/Vite/Vitest transitive tooling;
  production audit is clean. Upgrade these separately to avoid broad build-tool
  churn in this focused release repair.
