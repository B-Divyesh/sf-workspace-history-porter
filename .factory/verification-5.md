# Independent verification 5 — Workspace History Porter

**Work order:** `workspace-history-porter-verify-5`  
**Implementation candidate:** `67e2fdf68ac6bf60d7c9b59c5d40f233548462b2`  
**Documentation SHA reviewed:** `dd535546975a122807ca3c299bfc3553d167ba66`  
**Live URL:** <https://workspace-history-porter.sociobot.in>  
**Verified:** 2026-09-05  
**Verdict: FAIL**

The implementation candidate and documentation SHA differ only in
`.factory/handoff.md`. The live extension ZIP byte-matches the clean build, and
the live sidecar byte-matches the clean build made at the documentation SHA.
The latter embeds `dd535546975a` as its build identity; this is a report-only
difference, not a changed product implementation.

## Findings

### P2 — The populated demo has a dead public link

The third sample entry, **Pull request #482**, exposes **Open saved link** to
`https://github.com/example/remote-api/pull/482`. A fresh `curl -I -L` on
2026-09-05 returned HTTP 404. This is a visitor-facing link in the required
one-click sample, so it fails the site link requirement and makes a realistic
sample action lead to a nonexistent page.

Use a reachable public example URL, or render this sample value as non-link
text. Add the link to the route/link checks so a future sample cannot publish a
404.

### P2 — “Sample opens without sign-in” is an unlisted public claim

The first-screen facts include **“Sample opens without sign-in.”** No entry in
`.factory/claims.json` states that claim, and no test is tagged
`@claim:<id>` for it. The existing sample-journal test incidentally opens a
fresh browser context, but the claims contract requires each public claim to
be listed and have its own tagged observable test. This promise is therefore
untested for release purposes.

Add a `no-sign-in-demo` claim with a fresh-context test that asserts the sample
opens without any account or authentication request, or remove the promise.

**Finding count: 2. Untested public-claim count: 1.**

## First screen and demo

Fresh desktop (1440×900) and phone (390×844) contexts were opened at scroll
position zero. Before scrolling, both state the job, audience, and first
action:

- Job: **Move workspace tasks between browsers**.
- Audience: people reopening remote workspaces who need tasks, notes, and
  links in the next browser.
- First action: **Try it with sample data**; its adjacent text says the sample
  opens a filled journal and does not change the real journal.

The live phone journey used that action, found three realistic entries, added
a fourth sample task, and reset back to three. The persistent banner remained
visible. The browser contained only
`demo:workspace-history-porter:sample:v1`; no real-data fixture was created
or changed. There were no page or console errors.

## Clean-checkout evidence

A new local clone at `dd53554` was used. `npm ci` installed successfully and
reported zero vulnerabilities. No product source was changed during this
review.

| Check | Result |
| --- | --- |
| `npm test` | PASS — 7 tests. |
| `npm run lint` | PASS. |
| `npm run build` | PASS — extension ZIP, sidecar, and `dist/site/` produced. |
| `npm run test:package` | PASS. |
| `npm run test:extension` | PASS — offline MV3 journey, Link → Task, encrypted transfer, reduced motion, Axe, and no console errors. |
| `npm run test:e2e` | PASS — 21 passed, 1 intentional mobile-only skip. |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities. |
| `npm audit` | PASS — 0 vulnerabilities. |

Every command declared by the 12 entries in `.factory/claims.json` was run
from that clean checkout and passed. This includes each demo, encrypted
handoff, sidecar-boundary, download, Link → Task, extension journal,
cross-browser transfer, passphrase-session, Markdown-warning, and manifest
claim command. The one unlisted public promise above is not a declared claim,
so it is not cleared by that result.

## Live site, accessibility, privacy, and routes

- `/`, `/demo/`, `/privacy/`, and `/terms/` returned 200. An arbitrary unknown
  path returned the intended HTTP 404 and a designed Porter page with title,
  one H1, main landmark, explanation, and recovery links. The browser's
  failed-resource message for that deliberate document 404 is expected, not a
  page defect.
- Desktop and 390 px phone checks found one H1, one main landmark, `lang=en`,
  nonempty route titles, complete image alt attributes, no horizontal overflow,
  and zero serious or critical Axe violations on every route including the
  designed 404.
- The first keyboard focus on the live phone site is the visible **Skip to
  main content** link with a solid outline. Reduced-motion phone loading
  removes the route animation. Normal desktop loading uses the documented
  one-time route-line animation.
- `/opt/fleet/lib/verify-url.sh` passed live `/` (803 ms) and `/demo/` (570
  ms): title, language, one H1, main, image alt text, labelled controls, and
  no browser errors.
- Captured product-page requests used only
  `https://workspace-history-porter.sociobot.in`. There were no third-party
  page resources, analytics, or CDN fonts. Live responses provide HSTS,
  `nosniff`, strict-origin referrer policy, a self-only CSP with response-header
  `frame-ancestors`, and a camera/microphone/geolocation-denying permissions
  policy.
- The static site registers no service worker and makes no web offline-reload
  promise. The installed extension's core journey was exercised offline.
- `robots.txt`, `sitemap.xml`, canonical URLs, Open Graph/Twitter metadata,
  favicon, Apple touch icon, legal pages, and product 404 are present. Internal
  product links and downloads returned 200. The demo's external 404 is the
  finding above.

## Installed artifacts and sidecar

The downloaded live ZIP passed `unzip -t` and SHA-256 was
`5bb9af0c8445726b081285118703ceaa3f00a13ad0d80543f28060d46f677e0b`;
it byte-matched the clean build. It was unpacked into a fresh Chromium profile
and tested offline. The installed artifact created a journal, saved a Link,
then saved the next default Task without a console error. It also completed
the 390 px encrypted JSON export, divergent change, and REPLACE import journey
with the original entries restored.

The downloaded sidecar SHA-256 was
`6d1f7a9ecd27dd230c2150f144d3dffe60b03fc19905c8734b7691140ea90b23`,
matching the clean build. In a fresh temporary workspace it returned a
no-store 200 health response; rejected origin-less and hostile-origin journal
requests with 403; accepted 20 concurrent extension-origin writes; wrote only
one complete `0600` envelope without the supplied passphrase; and returned it
after a restart. This product is a local extension/loopback sidecar, not a
multi-tenant hosted backend, so tenant isolation and external 429/Retry-After
checks do not apply.

## Earlier findings disposition

| Earlier finding | Disposition |
| --- | --- |
| Missing live ZIP and sidecar | Resolved — both downloads are 200 and byte-matched. |
| Extension smoke startup failure | Resolved — clean `npm run test:extension` passed. |
| Origin-less sidecar access | Resolved — live consumer sidecar returned 403. |
| Development audit findings | Resolved — both current audits report zero. |
| Concurrent sidecar write loss | Resolved — 20 writes and restart-persistence passed. |
| Missing 390 px transfer control and stale status | Resolved — installed-artifact smoke passed. |
| Link → Task hidden required URL control | Resolved — reproduced former path passed in the live ZIP. |
| Broken $29 checkout | Resolved by removal — no checkout link, price, or license gate remains. Billing registration remains an external future dependency only. |
| Missing demo, generic 404, figurative copy, metadata | Resolved — live demo, reset/isolation, designed 404, plain first screen, and route metadata are present. |
| Missing claim governance | Partially resolved — the registry and all 12 declared commands pass; the unlisted sign-in promise remains a P2 finding. |

No product code was modified during this verification.
