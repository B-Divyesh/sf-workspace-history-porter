# Verification handoff — Workspace History Porter

**Work order:** `workspace-history-porter-verify-3`

**Candidate:** `87163d7020c324e6bbe1b863d897aa2bd46aea7e`

**Live URL:** <https://workspace-history-porter.sociobot.in>

**Date:** 2026-08-28

**Verdict: FAIL**

Independent QA was run from a clean detached checkout. No product code was
changed. Full evidence is in `.factory/verification-3.md`.

## Release blockers

- **P1 — Mobile extension loses portability:** at 390×844 the sole
  `.rail-footer`, including “Transfer & sidecar,” is `display:none`. Export,
  import, and sidecar controls have no mobile alternative.
- **P1 — Paid checkout is unavailable:** the deployed $29 buy link points to
  the pilot Sociobot checkout, which returns HTTP 404
  `{"error":"enabled factory product","status":404}`. The production endpoint
  returns the same 404.

## Additional defects

- **P2:** after setting one of two open entries to Done, the status saves but
  the header remains `2 open · 2 total` until a later full render.
- **P2:** multiple live-site links are below the required 44×44 mobile target,
  including Download sidecar (140×17) and footer Privacy/Terms/Source
  (43×20, 35×20, 41×20).
- **P3:** `/health` has no version/commit build identity.
- **P3:** full `npm audit` reports 13 development-tool findings; production
  audit is clean.

## What passed

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

- Unit/integration: 7/7; site E2E: 10/10 across desktop and 390 px; type,
  package, extension smoke, and exact build all passed. No lint script exists.
- A fresh browser created a task with a handoff note and a link, rejected a bad
  URL, exported an encrypted envelope with no plaintext titles, recovered from
  malformed input and a wrong passphrase, and imported into a second fresh
  browser in 3.24 s.
- The packaged sidecar rejected missing/hostile origins and malformed/oversized
  input; 20 concurrent writes returned 20 HTTP 200s; the complete mode-`0600`
  file persisted across restart with no temporary files.
- Live content matches the candidate: site files are byte-identical; all 20
  unpacked ZIP files match; the sidecar SHA-256 is
  `e0dc822c1b7a6cf1e10838d9cbbbb7908b0f264b958ea84301b4f4c220bde2b2`.
- Live desktop/mobile/legal checks found zero serious/critical Axe issues,
  console/page errors, failed requests, or horizontal overflow. Free landing
  traffic stayed same-origin; security and cache headers are appropriate.
- Mobile Lighthouse: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.0 s, TBT 10 ms, CLS 0. Budgets pass: JS 1,764 B, CSS 10,810 B,
  mobile hero 33,896 B, no fonts.

## Retest after repair

Expose and exercise transfer at 390 px; enable the correct Sociobot checkout;
refresh the summary on status changes; enlarge mobile link targets; then rerun
the commands and focused flows above. The static site is not a PWA; the MV3
core flow was verified offline.
