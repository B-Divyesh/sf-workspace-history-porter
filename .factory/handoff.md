# Repair handoff — Workspace History Porter

**Work order:** `workspace-history-porter-repair-3`

**Verifier report:** `.factory/verification-3.md` at `4ed2a21113fa787cdbf87c3a52cd7d4e85ee4f7a`

**Repaired candidate:** `87163d7020c324e6bbe1b863d897aa2bd46aea7e`

**Repair commits:** `e705c86d7afc`, `9b6b31e1713e`

**Live URL:** <https://workspace-history-porter.sociobot.in>

**Date:** 2026-08-28

## Outcome

The repository, extension package, sidecar, static site, and deployment have
been repaired and verified. All in-repository P1–P3 findings now have direct
regression coverage:

- The full `Transfer & sidecar` path remains visible at 390×844. The real MV3
  smoke exports an encrypted handoff at that width, adds divergent local state,
  imports with `REPLACE`, and confirms the exported journal is restored.
- Entry status changes now re-render the workspace header immediately. The
  extension smoke asserts `0 open · 1 total` without a lock/unlock cycle.
- The reported site links and footer/legal links have measured 44×44 px or
  larger touch targets at 390 px. The price-ticket legal links retain AA
  contrast.
- Sidecar `/health` reports service, semantic version, and source commit. The
  packaged sidecar is stamped from Git HEAD and package verification checks the
  exact stamped source.
- WXT, Vite, and Vitest were upgraded to patched releases. Both full and
  production-only `npm audit` now report zero vulnerabilities.
- Version `1.0.1` targets only the production Sociobot billing origin in the
  site CSP, checkout, verification client, extension manifest, and package
  regression.

No visual assets were regenerated. The original, reviewed night-market hero
and its provenance remain unchanged.

## Verification evidence

The complete clean sequence was run from commit `e705c86d7afc`, followed by the
production billing-boundary regression and another green build/browser pass at
`9b6b31e1713e`:

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:package
npm run test:extension
npm run test:e2e
npm audit --omit=dev
npm audit
```

Results:

- Clean install: 233 packages, 0 vulnerabilities.
- Unit/integration: 7/7 passed, including extension-only origin enforcement,
  20 concurrent sidecar writes, mode `0600`, and exact health identity.
- Type/lint: `tsc --noEmit` passed via the new `npm run lint` gate.
- Production/package: WXT MV3 extension, ZIP, static site, and stamped sidecar
  built and verified. ZIP `unzip -t` passed.
- Extension: offline Chromium smoke passed journal creation, immediate status
  summary, keyboard/form operation, Axe, reduced motion, console monitoring,
  and 390 px encrypted export/import.
- Site: 13 tests passed across desktop Chromium and 390×844 mobile, with one
  intentional desktop skip for the mobile-only target-size test. Home/privacy/
  terms have zero serious/critical Axe findings and no horizontal overflow.
- Audits: both full and `--omit=dev` report 0 vulnerabilities.

The independent URL verifier against the live site returned HTTP 200, an 800 ms
load, one `<h1>`, `lang=en`, `<main>`, complete image alt attributes, no
unlabelled buttons, and no browser errors.

Live Playwright checks at 1440×900 and 390×844 found zero console/page errors,
zero serious/critical Axe findings, no horizontal overflow, and no route-line
animation with reduced motion. Free-page requests were same-origin only. Mobile
targets measured:

- Header download: 114.5×44 px
- Sidecar download: 135.2×44 px
- Ticket Privacy/Terms: 59×44 and 49×44 px
- Footer Privacy/Terms/Source: 44×44 px each

Live mobile Lighthouse: **100 performance, 100 accessibility, 100 best
practices, 100 SEO**; FCP 0.9 s, LCP 1.0 s, TBT 10 ms, CLS 0.

Budgets remain well below limits:

| Asset | Size | Budget |
| --- | ---: | ---: |
| Landing JS | 1,758 B | 200 KB |
| Main CSS | 11,109 B | 50 KB |
| Mobile hero WebP | 33,896 B | 300 KB |
| Desktop hero WebP | 81,752 B | 300 KB |
| Fonts | 0 B | 120 KB |
| Extension ZIP | 142,644 B | informational |

## Deployment and identity

`/opt/fleet/lib/deploy-static.sh workspace-history-porter dist/site` deployed
the final `dist/site` tree successfully (Azure deployment
`61a0b120-0390-4686-a3b9-6ddb927bc66d`). The custom domain is Ready with HTTPS.

Live SHA-256 values exactly match the final local artifacts:

```text
index.html                                    17423bba35b7935e52a997186e8d08a0f74cc2c551ebb44bc4c3b02c13e4a085
privacy/index.html                            a6bba5f6a6545421b1722c3f46e841f2c280866fd870a1e7a4b71694f836a18f
terms/index.html                              42344f67e486ef9962cde57f484ccec880ba2372fe8765f803d9bb550ce98f23
downloads/workspace-history-porter-chrome.zip 2ff12509e3bbdfddec6da09d29f6f62a0dadff8aa9fdfa1e71791d6307a066f5
downloads/porter-sidecar.mjs                  aad06ef04d8a045237d6e052e93cefa1030a1d9ba806560e29f624d39321a449
```

The packaged sidecar consumer returned:

```json
{"ok":true,"service":"workspace-history-porter-sidecar","version":"1.0.1","commit":"9b6b31e1713e"}
```

Live policy is HSTS, `nosniff`, strict-origin referrer policy, denied camera/
microphone/geolocation, and self-only CSP except production Sociobot billing
for `connect-src`. Hashed assets are one-year immutable; downloads cache for one
hour; HTML revalidates after 30 seconds. The product is a static site plus MV3
extension, not a PWA, so no site service-worker update path applies. The MV3
core passed offline.

## External release dependency

The production checkout still returns HTTP 404:

```text
GET https://api.sociobot.in/api/v1/products/workspace-history-porter/checkout
404 {"error":"enabled factory product","status":404}
```

The same slug is absent from the public production and pilot product lists.
This is not repairable from this repository: `AGENTS.md` forbids changing
billing, and this work order supplies neither the documented factory product
registration command nor an authorized billing credential. The client now uses
the correct production endpoint and has exact regression coverage, but the
factory billing owner must register/enable `workspace-history-porter` at $29
one-time with return URL `https://workspace-history-porter.sociobot.in/#team`,
then verify checkout redirect, token return, restore, and revocation. Until
that external state is changed, the paid purchase path remains release-blocked;
the free encrypted journal/export/import product is fully operational.
