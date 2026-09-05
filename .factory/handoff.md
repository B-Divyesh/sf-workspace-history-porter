# Repair handoff — Workspace History Porter

**Work order:** `workspace-history-porter-repair-4`  
**Implementation SHA:** `67e2fdf68ac6bf60d7c9b59c5d40f233548462b2`  
**Documentation SHA:** `f90e6fb758b885170f976e90f1b5a9a10f8dcc9f`  
**Release version:** `1.0.2`  
**Deployed URL:** <https://workspace-history-porter.sociobot.in>  
**Deployed:** 2026-09-05

## What changed

- Repaired the installed-extension Link → Task path. The entry form now derives hidden link fields and URL validation from the selected kind after every dialog close. A fresh offline consumer install from the live ZIP created a Link and then a Task without a console error.
- Removed the unusable Team Relay checkout and license gate. The local sidecar is usable without a mock paid flow. The production billing product remains an external dependency if a paid unlock is introduced later.
- Added `/demo/`, entered from the first-screen **Try it with sample data** action. It starts with a realistic Remote API handoff, uses `demo:workspace-history-porter:sample:v1`, shows a persistent sample banner, resets safely, and discards sample data on **Start for real**.
- Added `.factory/claims.json` with outcome-based claim commands and regression coverage for demo isolation, local-only requests, encryption, sidecar boundaries, downloadable artifacts, extension storage, Markdown warning, and Link → Task.
- Replaced the generic host 404 with a product 404, including HTTP 404 status, a plain title and heading, and recovery links.
- Rewrote the first screen and legal H1s in plain words. Added the copy audit, catalog description, demo documentation, canonical URLs, Open Graph/Twitter metadata, Apple touch icon, and a product-derived 1200×630 social image.
- Hardened the sidecar to write only recognized handoff fields. An injected `passphrase` property is discarded before the file is written. Added malformed/oversize recovery and restart-persistence coverage.
- Made packaging select the ZIP matching the current MV3 manifest version, avoiding stale ZIP selection. The live `1.0.2` ZIP and sidecar byte-match the final local build.

## Verification

Clean setup: `npm ci` completed with zero production and development audit findings.

| Check | Result |
| --- | --- |
| `npm run build` | Pass — extension, versioned ZIP, sidecar, `/demo/`, legal routes, social image, and `dist/site/` built. |
| `npm test` | Pass — 7 tests, including encrypted handoff, sidecar origin/ciphertext/concurrency/restart paths. |
| `npm run lint` | Pass. |
| `npm run test:extension` | Pass — offline MV3 journey, Link → Task, session/local storage boundary, Markdown warning, mobile encrypted export/import, Axe, no console errors. |
| `npm run test:e2e` | Pass — 21 passed, 1 intentional mobile-only skip. |
| Every command in `.factory/claims.json` | Pass from the documented setup. |
| `npm audit --omit=dev` and `npm audit` | Pass — 0 vulnerabilities. |
| Live `verify-url.sh` | Pass for `/` and `/demo/`: title, `lang`, one H1, main, image alt text, labels, and no errors. |
| Live desktop + 390 px phone Axe | Pass on `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed 404: zero serious/critical issues, no overflow, one H1/main. The browser’s document-404 console message is expected and excluded. |
| Live demo phone journey | Pass — populated sample, add task, reset, separate fixture unchanged, same-origin requests only. |
| Fresh live ZIP consumer journey | Pass — downloaded, unpacked `1.0.2` MV3 ran offline and saved a Task immediately after a Link. |
| Live artifact identity | Pass — ZIP SHA-256 `5bb9af0c8445726b081285118703ceaa3f00a13ad0d80543f28060d46f677e0b`; sidecar SHA-256 `b26555786ee0df6ee46719c9a963c822bb994d18bc4309cb3a68be87b89a3116`; both byte-match `dist/site`. |
| Live route and download status | Pass — `/`, `/demo/`, `/privacy/`, `/terms/`, and both downloads return 200. An unknown route returns the designed page with intentional HTTP 404. |
| Lighthouse live mobile | Pass — performance 100, accessibility 100, best practices 100, SEO 100; LCP 868 ms, CLS 0. |

The live first screen says the job, audience, and first action before scrolling: move workspace tasks between browsers; for people reopening remote workspaces; try sample data.

## Earlier findings disposition

| Finding | Disposition |
| --- | --- |
| Missing ZIP and sidecar downloads | Resolved; both live and byte-matched. |
| Extension smoke startup / full-journal coverage | Resolved; stable fresh-profile smoke covers the full journal path. |
| Origin-less or concurrent sidecar access | Resolved; direct tests reject ordinary/origin-less requests, serialize 20 writes, retain `0600`, and survive restart. |
| Missing 390 px transfer control / stale status summary / touch targets | Resolved; mobile smoke and site E2E cover these paths. |
| Link → Task hidden required field | Resolved; fresh live consumer test passed. |
| $29 checkout 404 | Removed as an unavailable public path; no payment claim, checkout link, or license gate remains. See dependency below. |
| No demo / claim governance | Resolved with `/demo/`, `.factory/demo.md`, `.factory/claims.json`, and all declared claim commands. |
| Generic 404 / figurative headings / metadata | Resolved live. |

## Known gap and next step

The researched optional paid Team Relay plan is intentionally not offered in this release because the product was not enabled in the external Sociobot billing catalog. This repository is not authorized to register billing products. The local sidecar remains available without a payment flow. If monetization is restored, the billing owner must register the product first; then re-add the Sociobot checkout/verify integration and test return-token, restore, cached offline, and revoked-license paths before publishing a price.
