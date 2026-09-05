# Demo sandbox

**URL:** `https://workspace-history-porter.sociobot.in/demo/` (or `/demo/` in a local preview)

The landing page’s **Try it with sample data** action opens this route in one click.

## Sample

The sample workspace is **Remote API**. It starts with three realistic entries:

- Run integration tests before the deploy
- Handoff for the next browser
- Pull request #482

Visitors can add a sample task and see the populated journal immediately.

## Isolation and reset

Demo storage uses only the `demo:workspace-history-porter:sample:v1` localStorage key. It never reads or writes the extension’s browser storage or any non-demo web-storage key.

The persistent banner says **Demo — sample data, nothing is saved to your real journal.** Select **Reset demo** to restore the three seeded entries. Select **Start for real** to discard the demo key and return to the product home page.

## Verification

The claim tests in `.factory/claims.json` open this route in a fresh browser context. They verify populated output, reset behavior, separate storage, and local-only product-page requests.
