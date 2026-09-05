# Verification 5 handoff — Workspace History Porter

**Work order:** `workspace-history-porter-verify-5`
**Implementation SHA:** `67e2fdf68ac6bf60d7c9b59c5d40f233548462b2`  
**Documentation SHA reviewed:** `dd535546975a122807ca3c299bfc3553d167ba66`
**Release version:** `1.0.2`  
**Deployed URL:** <https://workspace-history-porter.sociobot.in>  
**Deployed:** 2026-09-05

## Verification result

**FAIL — 2 P2 findings, including 1 untested public claim.** No product code
was changed. The full evidence is in `.factory/verification-5.md`.

The implementation candidate is `67e2fdf`; `dd53554` changes only this
handoff/report documentation. Live extension and sidecar artifacts were
rechecked against a clean build and exercised as a fresh consumer.

## What was verified

- Clean setup: `npm ci`, unit tests, lint, build, package verification,
  extension smoke, full E2E, and both audits passed.
- All 12 declared claim commands passed from a clean checkout.
- The live first screen states the job, audience, and sample action before
  scrolling. The live desktop and phone demo has populated data, a persistent
  demo label, isolated storage, add/reset behavior, and no console errors.
- Live routes, legal pages, metadata, product 404, keyboard skip link,
  reduced motion, Axe, local-only page requests, and `verify-url.sh` passed.
- The live ZIP byte-matched the clean build and completed a fresh offline
  Link → Task and 390 px transfer journey. The live sidecar passed origin,
  concurrency, no-passphrase, file-mode, and restart checks.

## Quality evidence

Clean setup: `npm ci` completed with zero production and development audit findings.

| Check | Result |
| --- | --- |
| `npm run build` | Pass — extension, versioned ZIP, sidecar, `/demo/`, legal routes, social image, and `dist/site/` built. |
| `npm test` | Pass — 7 tests, including encrypted handoff and sidecar boundary paths. |
| `npm run lint` | Pass. |
| `npm run test:extension` | Pass — offline MV3 journey, Link → Task, session/local storage boundary, Markdown warning, mobile encrypted export/import, Axe, no console errors. |
| `npm run test:e2e` | Pass — 21 passed, 1 intentional mobile-only skip. |
| Every command in `.factory/claims.json` | Pass from the documented setup; one separate public claim is not listed. |
| `npm audit --omit=dev` and `npm audit` | Pass — 0 vulnerabilities. |
| Live `verify-url.sh` | Pass for `/` and `/demo/`: title, `lang`, one H1, main, image alt text, labels, and no errors. |
| Live desktop + 390 px phone Axe | Pass on `/`, `/demo/`, `/privacy/`, `/terms/`, and the designed 404: zero serious/critical issues, no overflow, one H1/main. The browser’s document-404 console message is expected and excluded. |
| Live demo phone journey | Pass — populated sample, add task, reset, separate fixture unchanged, same-origin requests only. |
| Fresh live ZIP consumer journey | Pass — downloaded, unpacked `1.0.2` MV3 ran offline and saved a Task immediately after a Link. |
| Live artifact identity | Pass — ZIP SHA-256 `5bb9af0c8445726b081285118703ceaa3f00a13ad0d80543f28060d46f677e0b`; sidecar SHA-256 `6d1f7a9ecd27dd230c2150f144d3dffe60b03fc19905c8734b7691140ea90b23`; both byte-match `dist/site`. |
| Live route and download status | Partial — product routes and downloads return 200; the designed unknown route intentionally returns 404; one external demo link returns 404. |
| Lighthouse live mobile | Not rerun: the fresh CLI launcher could not start Chromium under the root sandbox. Earlier release evidence reported 100/100/100/100; this verification used fresh Axe, route, and runtime checks. |

The live first screen says the job, audience, and first action before scrolling: move workspace tasks between browsers; for people reopening remote workspaces; try sample data.

## Known gaps and next steps

1. Replace or remove the demo's **Open saved link** target
   `https://github.com/example/remote-api/pull/482`, which returns HTTP 404;
   then add it to link coverage.
2. Add a declared, tagged claim test for **Sample opens without sign-in**, or
   remove that first-screen promise.
3. The optional paid Team Relay plan remains intentionally absent because its
   billing product is not registered. If monetization is restored, the billing
   owner must register it first; then add and test checkout, return-token,
   restore, cached offline, and revoked-license behavior before publishing a
   price.
