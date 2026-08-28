# Workspace History Porter — build handoff

Build completed 2026-08-28 for work order
`workspace-history-porter-build-1`.

## What was built

- WXT + TypeScript Manifest V3 Chrome extension with:
  - 380 px quick-add popup and full responsive journal/options surface;
  - workspace creation, task/note/link entries, status changes, filters, and
    confirmed deletion;
  - explicit current-tab URL capture and optional per-origin permission;
  - AES-256-GCM encrypted browser storage using PBKDF2-SHA-256 at 310,000
    iterations, random salts, and random IVs;
  - passphrase held in `browser.storage.session`, never persisted or sent;
  - encrypted JSON export/import with merge or replace, plus warned plaintext
    Markdown export;
  - first-class empty, wrong-passphrase, failed-save, offline-sidecar, and
    invalid-license states.
- Zero-dependency Node sidecar bound to `127.0.0.1`, with extension-origin CORS,
  5 MB input cap, encrypted-envelope validation, restrictive file modes, and
  atomic writes under `.workspace-history-porter/handoff.json`.
- Team Relay paid unlock at $29 one-time. Checkout and daily verification use
  the specified Sociobot pilot endpoint; cached valid licenses unlock
  optimistically offline. Free journal use and both export formats remain free.
- Static product site with original night-market visual system, responsive
  generated hero, privacy and terms pages, downloadable extension zip and
  sidecar, security headers, robots/sitemap, and no analytics/CDN resources.
- Original generated art source, prompt sidecar, optimized 720 px and 1200 px
  WebPs, hand-authored mark, and extension icons. Provenance is recorded in
  `.factory/design.md` and disclosed in the site footer.

## Build and outputs

Exact production command:

```sh
npm ci
npm run build
```

Static deployment root: `dist/site/` (contains `index.html`). Packaged artifacts:

- `dist/site/downloads/workspace-history-porter-chrome.zip` — 143 KB
- `dist/site/downloads/porter-sidecar.mjs`
- `.output/chrome-mv3/` — unpacked extension for local loading

## Verification

All run locally against the production build:

- `npm test` — 7/7 passing (crypto, merge/export, live sidecar integration and
  hostile-origin rejection).
- `npx tsc --noEmit` — passing.
- `npm run build` — passing; reproducibly creates both deploy and downloads.
- `npm run test:extension` — passing in Chromium: unlock → create workspace →
  create journal entry; no page or console errors.
- `npm run test:e2e` — 10/10 passing in desktop Chromium and 390×844 mobile,
  including Axe serious/critical checks, no horizontal overflow, license return
  handling, and downloadable artifact checks.
- `/opt/fleet/lib/verify-url.sh` — HTTP 200, title present, `lang=en`, exactly one
  `h1`, main landmark present, no missing alt text, no unlabeled buttons, no
  console errors.
- `npm audit --omit=dev` — 0 production vulnerabilities (the product has no
  runtime npm dependencies).

Lighthouse 13 mobile-class run against the local production server:

| Category/metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| LCP | 0.9 s |
| FCP | 0.9 s |
| Total blocking time | 0 ms |
| CLS | 0 |

Budget checks: landing JS 1.76 KB uncompressed, landing CSS 10.81 KB, extension
JS about 22 KB total, mobile hero 33.9 KB, desktop hero 81.8 KB. All are below
the specified 200 KB JS, 50 KB CSS, and 300 KB hero budgets.

## Known gaps and release notes

- V1 packages Chrome/Chromium MV3 only. The code uses WebExtension APIs but a
  Firefox package/store review is not part of this work order.
- Billing intentionally points to `pilot-api.sociobot.in` for staging. The
  factory must register the product/return URL and switch the billing base to
  production at release; no product ID is embedded.
- A license returned to the website cannot cross the browser extension origin.
  Users paste the receipt token once in the extension’s Transfer panel; this is
  explicit and documented.
- The sidecar is intentionally a local/shared-workspace file bridge, not a
  hosted sync service. Teammates must exchange the passphrase separately.
- Passphrase recovery is deliberately impossible. Users are warned to retain an
  encrypted export before clearing extension storage.

## Recommended next steps

1. Register the production Sociobot billing product and return URL, then replace
   the pilot base in the site and extension release build.
2. Publish the signed Chrome Web Store package; replace the developer-mode zip
   CTA with the store URL once approved.
3. Run the stated pilot measure: second-browser recovery time under one minute
   for at least 75% of participants.
