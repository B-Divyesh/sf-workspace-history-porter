# Workspace History Porter — design thesis

## Direction: a night-market wayfinding stall

Remote workspaces can feel like arriving in the same city through a different
station: the code is there, but all the signs that said where to go next have
vanished. Porter borrows the visual language of a late-night market's hand-made
direction boards—ink-black streets, warm paper tickets, cyan route lights and a
single persimmon-red seal. It should feel operational and human, not cyberpunk
or like a generic developer dashboard.

The product mark is a hand-authored SVG luggage tag crossed by two route lines.
The generated hero is an editorial still life of two browser windows joined by
a glowing handoff ticket. Decoration always explains the core action: carry a
small encrypted index between places.

## Palette

This is an explicitly dark, nocturnal product; dark treatment is the thesis,
not a missing theme.

| Token | Value | Use |
| --- | --- | --- |
| `night-950` | `#07110f` | page background, the market after closing |
| `night-900` | `#0c1b18` | raised work surfaces |
| `night-800` | `#142925` | fields and separators |
| `rice-100` | `#f5f0de` | primary text, paper signs |
| `rice-300` | `#c8c3b2` | secondary text |
| `route-cyan` | `#64f4d5` | primary action and focus; dark text on accent |
| `lantern` | `#ffb84d` | active workspace and caution |
| `seal` | `#ff6b5d` | destructive/error states |
| `mint` | `#85e89d` | success |

All body pairings exceed WCAG AA. Statuses combine color with text and icons.

## Type and spacing

Headings use the self-hosted `Bricolage Grotesque` subset when available, with
Arial fallback. Utility text and data use the system monospace stack, which
makes workspace IDs, dates, and file formats scan like shipping labels. The
scale is 16 / 18 / 22 / 32 / 52 px with 1.5 body leading. Spacing follows a
4 px base: 4, 8, 12, 16, 24, 32, 48, 72. Reading measures stop at 68ch.

## Layout and interaction grammar

- A thin cyan route line connects steps; ticket-notch corners identify portable
  artifacts. Cards appear only for independent task entries or plans.
- The popup is a compact dispatch board: current workspace first, one primary
  “Add stop” action, then recent entries. The full journal opens from there.
- Every save produces a short “Sealed locally” confirmation. Import previews
  never overwrite silently; users choose merge or replace.
- URL capture is explicit. The extension requests access only for the current
  origin after a user action and never reads page content.
- On phones the route rail disappears, controls stack, and essential content
  remains; no horizontal scrolling at 390 px.

## Motion

Route lines draw once on first view (480 ms); ticket surfaces rise 8 px over
220 ms; saved-state feedback uses a 160 ms opacity change. Only transforms and
opacity animate. Under `prefers-reduced-motion: reduce`, movement is removed,
transitions are near-instant, and no animation loops.

## Asset plan and provenance

- `public/porter-mark.svg`: hand-authored in-repository, original, MIT.
- `assets/src/neon-route-hero.png`: generated original source, retained with
  prompt sidecar.
- `public/neon-route-hero.webp`: optimized landing hero, ≤300 KB.

### Hero prompt sheet

Use case: `stylized-concept`. Asset type: wide landing-page editorial hero.
Subject: an encrypted handoff ticket with a tiny brass key traveling between
two abstract browser-window kiosks, connected by one luminous cyan route.
World: a quiet night-market workbench after rain; no people. Materials: folded
rice paper, blackened brass, translucent glass, dark green painted metal,
subtle damp asphalt reflections. Light: warm lantern pool plus cyan edge light,
cinematic but legible. Lens/composition: orthographic three-quarter still life,
wide, subject on the right with calm negative space on the left, crisp product
illustration, no fake UI. Palette words: ink black, rice paper, route cyan,
persimmon seal, lantern amber. Negative list: no text, letters, numbers, logos,
watermarks, people, hands, faces, branded products, padlock cliché, purple/blue
gradient, clutter, illegible symbols.

Generated with the factory Azure image deployment (`factory-image`) on
2026-08-28. The image is original to this product; no third-party source art
or branded references were used. The footer discloses AI-assisted imagery.
