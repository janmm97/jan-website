# DESIGN.md · Direction E, "Clearance board"

The site is a clearance board. Work runs, anything that goes outward waits for Jan's client to clear it, then it is cleared. Every page borrows from that one idea: a black bay, white strips, a square and a slanted bar.

Approved by Jan (brief: Stella, 2026-11-02). Built by Sienna, 2026-11-03. Source of truth for tokens is `assets/css/e.css`; this file explains them.

## 1. Motifs

| Motif | Where it comes from | Where it is used |
|---|---|---|
| **The square** | The logo's box | Tool stations on routes, course level boxes (`.lv`, filled by level), the "Your OK" gate |
| **The slanted bar** | The logo's stroke (`<symbol id="bar">`) | Button tick, cleared strips, gate stations, list markers |
| **The strip** | A flight-strip / kanban card | Board items, post rows, course rows |

The logo itself is used unchanged and **never animates**. No other decorative shapes, gradients, glows or glass.

## 2. Colour

Monochrome only. Product marks keep their own colours inside white squares; nothing else is coloured.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--ink` | `#0b0b0b` | Dark ground, text on light | 19.0:1 on paper |
| `--paper` | `#fbfbf9` | Light ground | |
| `--strip` | `#f4f4f0` | Strips, text on dark | 17.9:1 on ink |
| `--cleared` | `#ddddd8` | Cleared strips (struck through) | ink on it 14.4:1 |
| `--rule-d` / `--rule-l` | `#2a2a2a` / `#d9d9d3` | Hairlines on dark / light (decorative only) | |
| `--mute-l` | `#55554f` | Secondary text on light | 7.2:1 paper, 6.8:1 strip |
| `--mute-d` | `#d7d7d1` | Secondary text on dark | 13.6:1 |
| `--mute-d2` | `#a9a9a4` | Tertiary text on dark (meta) | 8.3:1 |

Sections alternate `.dark` and `.light`. Focus is a 3 px `currentColor` outline, offset 3 px, so it is visible on both grounds; buttons override it to ink (light) or strip (dark).

## 3. Type

All three are self-hosted, Latin subset, `font-display: swap`. The display and body faces are preloaded.

| Role | Face | Notes |
|---|---|---|
| Display (H1–H3) | Big Shoulders Display 700–900 | Tight leading (≈.92), condensed, all headings |
| Body | Schibsted Grotesk 400–700 | 17 px base, 1.55 leading, 68ch measure in posts |
| Code / meta | JetBrains Mono 500 | Strip ids, route captions, dates, "Jan to confirm" slots |

## 4. Components

- **Nav** (`tools/partials/nav.html`): Work with me · Projects · Academy · Blog · About · **[Book a call]**. `aria-current="page"` set by `tools/pages.mjs`. Under 980 px the links drop to a scrollable second row.
- **Footer** (`tools/partials/foot.html`): "Hand one task over. Keep the final say." + Book a 30-min call, site links, "Product names and logos belong to their owners."
- **Button** `.btn`: ink/strip block with the bar tick. **One primary `.btn` per section.** Secondary actions are underlined links.
- **Board** `#board` (home): three fixed-height lanes (Agent working · Waits for your OK · Cleared). Labelled "Illustration, not live data" in visible text and in `aria-label`. Approve / Hold are real `<button>`s, ≥ 44 px tall. Lanes have a fixed height, so the demo never shifts layout. Under 980 px it becomes a swipe bay that follows the work until the visitor swipes.
- **Routes** `.run`: a rail of tool squares (`aria-hidden`) with a text caption that is the accessible version. The highlight steps only while the route is in view.
- **Tool index**: 16 tools Jan actually uses, grouped Models / Build / Apps. White marks have dedicated `-dark` files; no CSS invert.
- **Shelves / tabs** `[data-tabs]`: WAI-ARIA tabs (arrow keys, Home/End). On /blog/ the tab follows the URL hash (`#business`, `#va`, `#tests`).
- **Slots** `[data-slot]`: dashed box with a "Jan to confirm" label for anything Jan has not confirmed (prices, course files, testimonials). Never fill a slot with invented data.
- **Post template** (`assets/css/e-post.css`): dark head with crumbs (Home / Blog / shelf), light reading column, then a shelf-matched `aside.post-cta`: business → Book a call; VAs → Academy; model tests → Academy.

## 5. Motion

- Easing `--ease: cubic-bezier(.16,1,.3,1)`. Only `transform`, `opacity` and `clip-path` animate.
- The board runs once when it comes into view (FLIP between lanes); the "Run it again" link replays it. Outward strips auto-clear after 5 s only if the visitor has not touched the board.
- **Pause motion** (WCAG 2.2.2): one shared state, shown as a `.textbtn.motion` toggle in the board note and above the routes. A real `<button aria-pressed>` whose label stays "Pause motion"; the square fills when it is pressed. Pausing stops every route loop and jumps the board to its reduced-motion end state; Play resumes the routes in view. Hidden without JS and under reduced motion, where nothing moves.
- **`prefers-reduced-motion: reduce`**: no animation anywhere. The board renders its end state (one strip waiting with live Approve/Hold, one cleared), route captions show the full route as text, level boxes are pre-filled.
- No-JS: the board's static markup is the end state, routes show their captions.

## 6. Page rules

- One H1 per page. Home H1 stays "Automation Specialist for founders and operators."
- Every page: gtag `G-V7TTFWT0GD` in the head, `<body data-root>`, `header#top`, `main#main`, nav/foot markers synced by `node tools/pages.mjs` (`--check` in CI-style review).
- `404.html` is self-contained with absolute `/jan-website/` URLs because it is served from any path.
- Budgets: LCP ≤ 2.5 s (mobile, simulated 4G), CLS ≤ 0.1, TBT ≤ 200 ms, Lighthouse a11y 100, WCAG 2.2 AA, targets ≥ 24 px (board buttons 44 px).

## 7. Don'ts

Animated logo · colour accents · gradients/glows · stock 3D · more than one primary button in a section · invented numbers, clients or quotes · CSS `filter: invert()` on marks · new script origins without Nora.
