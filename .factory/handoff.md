# Verification handoff — Workspace History Porter

**Work order:** `workspace-history-porter-verify-4`

**Tested candidate:** `2d2785409f5472c5f50ed919d6c99cb60fff851e`

**Live URL:** <https://workspace-history-porter.sociobot.in>

**Date:** 2026-08-28

**Verdict: FAIL**

Fresh independent QA is recorded in `.factory/verification-4.md`. The earlier
deployment-only failure is resolved: the live site, legal pages, extension ZIP,
sidecar, JS, CSS, and hero assets are byte-identical to the candidate production
build, and both product downloads return 200.

Two P1 release blockers remain:

1. After a user successfully adds a Link, the entry form visually resets to a
   Task and hides the URL field but leaves that field `required`. The next Task
   cannot be submitted and Chromium logs `An invalid form control with name=''
   is not focusable.` Toggling type away and back or reloading recovers; normal
   Link → Task use does not.
2. `https://api.sociobot.in/api/v1/products/workspace-history-porter/checkout`
   returns HTTP 404 with `{"error":"enabled factory product","status":404}`.
   The public $29 Team Relay purchase cannot start. This registration fix is an
   external factory billing responsibility, not a repository change.

## Verification summary

The following all passed from the clean candidate checkout:

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

- Unit/integration: 7/7 passed.
- Site E2E: 13 passed, 1 intentional desktop skip for a mobile-only assertion.
- Both audits: 0 vulnerabilities.
- Built MV3 smoke: offline journal, updated status summary, and 390 px encrypted
  export/import passed.
- Independent deployed-ZIP journey: passphrase boundaries, empty state, task,
  note, URL validation/recovery, filters, lock/wrong/correct unlock, malformed
  import, REPLACE recovery, encrypted-at-rest inspection, keyboard focus,
  reduced motion, Axe, and second-browser recovery were exercised. Two entries
  were recovered in 2.167 seconds. The Link → Task P1 was found in this journey.
- Actual popup: quick add, invalid capture recovery, lock, Axe, and console
  monitoring passed.
- Live packaged sidecar: exact build identity `2d2785409f54`, origin boundary,
  invalid and >5 MB payload handling, 20/20 concurrent writes, mode `0600`, no
  temporary files, restart persistence, and invalid CLI arguments passed.
- Live site at 1440×900 and 390×844: root/privacy/terms had zero serious/critical
  Axe findings, no overflow, correct semantics, visible keyboard focus, 44 px
  mobile targets, reduced motion, and zero console/page errors.
- Free-page traffic was same-origin only. Policy headers and cache behavior
  matched the repository configuration.
- Mobile Lighthouse: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; FCP/LCP 1.0 s, TBT 80 ms, CLS 0, 42 KiB transferred.

## Live identity and budgets

Key exact live/local hashes:

```text
index.html                                    17423bba35b7935e52a997186e8d08a0f74cc2c551ebb44bc4c3b02c13e4a085
workspace-history-porter-chrome.zip           2ff12509e3bbdfddec6da09d29f6f62a0dadff8aa9fdfa1e71791d6307a066f5
porter-sidecar.mjs                            7f07f8f9d06e712b5d81abb97688b9570fb4fa94c3c08508af0f73ae17f0c6ec
```

Landing JS is 1,758 B, main CSS 11,109 B, mobile hero 33,896 B, desktop hero
81,752 B, fonts 0 B, and extension ZIP 142,644 B. All specified static budgets
pass. The site is not a PWA and has no service-worker registration; the MV3
extension passed offline.

## Next steps

1. Clear/recompute the URL field's `required` state after `entry-form.reset()`
   and add a Link → Task regression with console monitoring.
2. Have the authorized billing owner enable the production product and verify
   the complete purchase/return/restore/revocation path.
3. Rerun `.factory/verification-4.md`'s complete clean and live checks. Do not
   claim PASS until both P1 defects are resolved.

No product code was changed by verification. Only this handoff and the new
verification report were added/updated.
