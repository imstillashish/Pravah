# Intelligent Freight Portal — Design World: "Sea-Glass"

> **v4 — Mint-Teal Light.** Single source of visual truth. The Admiralty
> Chart mono-blue world is retired as an anti-reference: no all-blue
> surfaces, no filled dark buttons. Light, sea-glass tinted, mint-accented.
> Spec: docs/superpowers/specs/2026-09-22-sea-glass-light-palette-design.md

## 1. The Idea

A harbor office at first light: sea-glass canvas, white cards, teal-black
ink, and a mint ramp from pale glass to deep sea. Optimistic and
growth-coded, but institutional — white cards do the work; mint only ever
signals brand, positivity, or "live". One signature gesture: the full-round
mint pill with deep-sea ink text.

## 2. The Mint Ramp (accent)

| # | Hex | Name | Role |
|---|-----|------|------|
| 1 | `#effaf5` | Glass-50 | Faintest wash, row tints, recommendation ground |
| 2 | `#dcf3ea` | Glass-100 | Washed fills, positive pill bg, active nav wash |
| 3 | `#bfe9db` | Glass-200 | Brand chips, CTA-disabled fill |
| 4 | `#97ddc6` | Glass-300 | Icon tint, decorative borders |
| 5 | `#63d1ab` | Glass-400 | Chart forecast series, graphics — **never text** |
| 6 | `#2fbf94` | Mint-500 | CTA fill (Sea-900 ink text). Hover `#2ab08b` |
| 7 | `#0d7a61` | Sea-600 | Links, interactive text, focus ring, live dots |
| 8 | `#0a5c49` | Sea-700 | Strong text, chart actual series |
| 9 | `#07453a` | Sea-800 | Emphasis text, positive pill text |
| 10 | `#08362c` | Sea-900 | Deep sea ink: headings, numerals, hero bands |

Measured contrast: Sea-600 5.28:1 card / 4.63:1 canvas · Sea-700 7.95:1 ·
Sea-800 10.93:1 · Ink 17.07:1 card / 14.95:1 canvas · Mint-500 carries
5.72:1 with Sea-900 ink. Glass-100–400 and Mint-500 are fills/graphics —
never text.

## 3. Sea-Glass Neutrals

| Token | Hex | Use |
|---|-----|-----|
| canvas `#ecf1ee` | page background |
| card `#ffffff` | cards, sheets, rails |
| well `#f7faf8` | inputs, recessed wells |
| line `#d8e2dc` | hairline borders, chart grid |
| line-strong `#c2d2c9` | table headers, strong dividers |
| wash `#e2ebe6` | hover wash |
| ink `#0d1f1c` | headings, numerals, body-strong |
| body `#243935` | body copy (12.27:1 card) |
| muted `#56706a` | metadata, eyebrows (5.36:1 card / 5.10:1 well) |
| faint `#748c85` | placeholders, disabled only (3.60:1 — large/UI) |

## 4. Semantics — Three Hues, Strict Monopolies

| Meaning | Recipe | Contrast |
|---|---|---|
| Approved / positive / live | Glass-100 bg · Sea-800 text · ▲ glyph | 9.40:1 |
| Pending / caution | Amber-100 `#fdf2d7` · Amber-700 `#7a4f01` · ⏳ glyph | 6.40:1 |
| Rejected / danger / hazard | Coral-100 `#fdeae4` · Coral-700 `#b03616` · ! glyph | 5.34:1 |
| Neutral / draft | Well bg · Muted text | 5.10:1 |

Graphics-only: Amber-500 `#d99a26`, Coral-500 `#e85c3a`, Glass-400 — chart
strokes, icon washes, borders; never text. All sample-data tags use the
amber caution recipe with a dashed Amber-300 `#ecd9a4` border. Destructive
actions (Reject, Disable user) use the coral recipe — never the mint pill.

## 5. Charts

Forecast series Glass-400 `#63d1ab` 2px · actual/benchmark Sea-700 2px ·
negative/drawdown Coral-500 2px. Grid: dotted `#d8e2dc`. Area wash
Glass-100 @ 30%. Square plotter-nib terminal marker. Series differentiate
by lightness + weight, never hue alone.

## 6. Type & Shell

Fonts unchanged: Inter (UI) + IBM Plex Mono tabular (all numerals, prices,
timestamps, desk codes). Page title Inter 600 28–32px Sea-900; section
titles 20px; eyebrows mono 10px uppercase Muted.

Shell: icon rail white + line border, active = Glass-100 wash + 2px Sea-600
bar · top bar white hairline band, Well search, Glass-100 desk pill with
Sea-800 mono code · canvas `#ecf1ee` · white cards 8px radius.
Radius: 8px cards / 12px inputs / full-round CTA pills / 4px chips.
Overlays: one soft sheet shadow `0 8px 24px rgba(8,54,44,0.10)` — the only
shadow in the system. Focus ring 2px Sea-600 offset 2. Motion 150–250ms
ease-out, 4px-rise entrances, chart draw-ins, full reduced-motion collapse.

## 7. Don't

- No text in Glass-100–400, Mint-500, Amber-500, Coral-500 (graphics only).
- No hover fill `#26a884` (4.46:1 — the rejected candidate).
- No second shadow beyond the sheet shadow. No gradients on surfaces.
- No hue-only meaning encoding; every semantic carries a glyph.
- No radius above 12px except full-round pills.
- **No ping/pulse dots** (`animate-ping`/`animate-pulse`): live markers are
  static Sea-600 dots + mono `LIVE` label; loading uses the `skeleton-sweep`
  band in `ui.tsx` — never an opacity pulse. These read as AI slop and are
  hard-banned in workspace rules (`.geminirules`).

## 8. Page Roles (all 16 Features.md pages)

1 Landing: Sea-900 hero band (Glass-50 text = 12.5:1), mint pill CTAs,
  white proof cards, amber sample-data tags · 2–3 Sign up/Login: white card,
  Well inputs, mint pill · 4 Dashboard ✅ · 5 New Analysis ✅ · 6 Results:
  recommendation on Glass-50 + mint chip, Glass-400/Sea-700 bars, amber/coral
  risk pills · 7 Compare: selected = Sea-600 border + Glass-50 · 8 Decision
  record: status pills · 9 History ✅ · 10 Booking: Waiting amber · Sent
  muted · Confirmed positive · Cancelled coral · 11 Demand board: Glass-100
  plant chips · 12 Vendor quotes: amber sample banner · 13 Map: Glass-400
  route, Sea-700 ship, amber tag · 14–15 Admin: tables, coral destructive ·
  16 Audit log: pure mono table.
