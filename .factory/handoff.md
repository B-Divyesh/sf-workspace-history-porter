# Review handoff — Workspace History Porter

**Work order:** `workspace-history-porter-review-1`
**Implementation reviewed:** `2d2785409f5472c5f50ed919d6c99cb60fff851e`
**Documentation commit:** `c68a90586f78ddaa376346c202ac1038e55caedd`
**Live URL:** <https://workspace-history-porter.sociobot.in>
**Date:** 2026-09-05
**Verdict: FAIL**

The full review is in `.factory/review-1.md`. Product code was not changed.

## What passed

`npm ci`, `npm test` (7/7), `npm run lint`, `npm run build`,
`npm run test:package`, `npm run test:extension`, `npm run test:e2e`
(13 pass, 1 intended skip), and both production/full `npm audit` checks passed.
The live downloads return 200; the ZIP matches the fresh build. Fresh desktop
and phone visits to landing/privacy/terms passed serious/critical Axe checks,
semantics, keyboard skip focus, no overflow, reduced motion, and request/console
checks. The packaged local sidecar passed invalid-origin/input, 20 concurrent
writes, `0600` file mode, and restart persistence.

## Open findings

There are **7 findings** and **20 untested public claims**, so this product is
not a PASS.

1. P1: the installed live extension cannot submit the normal Task after a Link;
   the hidden URL remains required and produces a browser console error.
2. P1: the advertised production Team Relay checkout returns 404.
3. P1: no one-click sample/demo sandbox, reset, persistent demo label, or
   `.factory/demo.md` exists.
4. P1: `.factory/claims.json` is missing; 20 public functional/privacy/
   commercial claims have no required sandbox test.
5. P2: unknown paths show a generic hosting 404 rather than a product 404.
6. P2: the first screen and legal H1s use figurative wording rather than the
   required direct job/audience/action language; no copy audit exists.
7. P2: canonical, Open Graph, Twitter-card, Apple-touch, and product social
   image metadata are absent from all public routes.

## Next steps

Repair the Link → Task reset state and regression-test it; have the billing
owner enable checkout; then add a demo sandbox and tested claim registry. Finish
the 404, plain-language/copy-audit, and metadata work before another review.
