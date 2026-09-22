# Sea-Glass Light Palette — Design Spec

> **Status:** Approved by user in brainstorming session (2026-09-22).
> **Supersedes:** the "Admiralty Chart" mono-blue world (DESIGN.md v3).
> **Scope:** Full palette system for all 16 pages in `docs/Features.md`, plus
> immediate re-tint of the 4 existing screens (auth, dashboard/desk, analysis
> drawer, recent-analyses table).

## 1. Problem

The current mono-blue palette reads as flat and cold on dense data screens.
The product is a decision-support tool for SAIL bulk chartering — it needs a
light world that feels optimistic and growth-coded, stays institutional
enough for a government PSU, and keeps the dense-table legibility the audit
hardened. This spec replaces the ten-blue system with a **mint-teal light
theme** ("Sea-Glass") and pre-assigns palette roles for all 16 future pages.

## 2. Personality (decided)

**Fresh mint-teal** — optimistic, energetic, growth-coded. Rare in heavy
industry, which makes it distinctive; the sea-glass tint keeps it maritime
and grounded.

## 3. Structure (decided)

**Sea-glass tinted neutrals (Option A).** Neutrals are barely-tinted
green-gray; the mint ramp owns accent duty. White cards float on the tinted
canvas — the Wise "sage canvas" trick, in a sea-glass hue. Pure-neutral and
dual-surface structures were considered and rejected (generic; tinted chrome
competes with data ink).

## 4. The Core Ramp — 10 Steps

| # | Hex | Name | Role |
|---|-----|------|------|
| 1 | `#effaf5` | Glass-50 | Faintest wash, row tints, recommendation card ground |
| 2 | `#dcf3ea` | Glass-100 | Washed fills, positive pill tint, active nav wash |
| 3 | `#bfe9db` | Glass-200 | Brand chips, brand-tinted borders |
| 4 | `#97ddc6` | Glass-300 | Icon tint, hover tint, decorative brand borders |
| 5 | `#63d1ab` | Glass-400 | Chart forecast series, graphics — **never text** |
| 6 | `#2fbf94` | Mint-500 | **CTA fill (Sea-900 ink text)** — the signature |
| 7 | `#0d7a61` | Sea-600 | Links, interactive text, focus ring, active nav bar |
| 8 | `#0a5c49` | Sea-700 | Strong text, chart "actual" series |
| 9 | `#07453a` | Sea-800 | Dense emphasis text, positive pill text |
| 10 | `#08362c` | Sea-900 | Deep sea ink: headings, numerals, hero/footer bands |

> Contrast (measured, WCAG relative luminance): Sea-600 5.3:1 on Card /
> 4.6:1 on Canvas · Sea-700 8.0:1 · Sea-800 10.9:1 · Ink 17.1:1 ·
> Mint-500 fill carries 5.7:1 with Sea-900 ink.

### The signature gesture
Primary actions are **full-round Mint-500 pills with Sea-900 ink text**
(mint `#2fbf94` vs ink `#08362c` = **5.7:1**, AA ✓). Hover deepens fill
to `#2ab08b` (**4.9:1** with ink — chosen over a darker hover, which would
push ink contrast below 4.5); disabled = Glass-200 fill + Faint text.

## 5. Sea-Glass Neutrals

| Token | Hex | Use | Ink contrast |
|---|---|---|---|
| Canvas | `#ecf1ee` | Page background | — |
| Card | `#ffffff` | Cards, sheets, rails | 17.1:1 with Sea-900 |
| Well | `#f7faf8` | Inputs, recessed wells | — |
| Line | `#d8e2dc` | Hairline borders, chart grid | — |
| Line-strong | `#c2d2c9` | Table headers, strong dividers | — |
| Wash | `#e2ebe6` | Hover wash on rows/controls | — |
| Ink | `#0d1f1c` | Headings, numerals, body-strong | 17.1:1 card / 15.0:1 canvas |
| Body | `#243935` | Body copy | 12.3:1 card |
| Muted | `#56706a` | Metadata, eyebrows, timestamps | 5.4:1 card |
| Faint | `#748c85` | Placeholders, disabled only | 3.6:1 — large text/UI only |

## 6. Semantic System — Three Hues, Strict Monopolies

Each hue owns exactly one meaning; everything else is neutral ink.

| Meaning | Pill recipe | Contrast | Appears in |
|---|---|---|---|
| **Approved / positive / live** | Glass-100 bg · Sea-800 text · ▲ glyph | 9.4:1 | Approve action, savings, finalized status, live feeds |
| **Pending / caution** | Amber-100 `#fdf2d7` · Amber-700 `#7a4f01` · ⏳ glyph | 6.4:1 | Approval queue, closing windows, demurrage risk |
| **Rejected / danger** | Coral-100 `#fdeae4` · Coral-700 `#b03616` · ! glyph | 5.3:1 | Reject action, over-draft hazard, disruption matches |
| Neutral / draft | Well bg · Muted text | 5.4:1 | Drafts, disabled |

Graphics-only mid tones: Amber-500 `#d99a26`, Coral-500 `#e85c3a`,
Glass-400 — chart strokes, icon washes, borders. **Never text.**
Destructive actions (Disable user, Reject) use Coral-700 text on Coral-100
fill; they never use the mint pill.

## 7. Chart Language

- Forecast series: Glass-400 `#63d1ab`, 2px — the optimistic line
- Actual/benchmark: Sea-700 `#0a5c49`, 2px — the ink line
- Negative/drawdown: Coral-500, 2px
- Grid: dotted Line `#d8e2dc` hairlines; area wash Glass-100 @ 30%
- Series differentiate by lightness + weight, never hue alone
- Square plotter-nib terminal marker (retained from current build)

## 8. Typography & Shell

- **Fonts unchanged:** Inter (UI) + IBM Plex Mono tabular (every numeral,
  price, timestamp, desk code)
- Hierarchy: page title Inter 600 28–32px Sea-900 · section titles 20px ·
  eyebrows mono 10px uppercase Muted
- Shell (structure unchanged): icon rail white + Line border, active =
  Glass-100 wash + 2px Sea-600 bar · top bar white hairline band, Well
  search field, Glass-100 desk pill with Sea-800 mono code · canvas
  `#ecf1ee` · white cards, 8px radius, hairline borders
- Radius: 8px cards / 12px inputs / full-round CTA pills / 4px chips
- Overlays (drawer): one soft sheet shadow `0 8px 24px rgba(8,54,44,0.10)`
  — the only shadow in the system
- Focus ring: 2px Sea-600, offset 2px. Motion: 150–250ms ease-out, 4px-rise
  entrances, chart draw-ins, full reduced-motion collapse (mechanics kept)

## 9. Page-by-Page Assignment (all 16 from Features.md)

| # | Page | Treatment |
|---|---|---|
| 1 | Landing | Sea-900 hero band (Glass-50 text = 12.5:1), mint pill CTAs, white proof cards, sample-data tags per the §6 caution recipe |
| 2 | Sign Up | White card on canvas, Well inputs, mint pill submit |
| 3 | Login | Same as Sign Up |
| 4 | Dashboard | **Re-tint existing.** Alerts = amber/coral pills per §6 |
| 5 | New Analysis | **Re-tint existing drawer.** Well inputs, Glass-100 quick chips |
| 6 | Results | Hero: recommendation card on Glass-50 + mint "Recommended" chip; "why chosen" = Glass-400/Sea-700 bars; risk table = amber/coral pills |
| 7 | Scenario compare | Side-by-side white cards; selected = Sea-600 border + Glass-50 |
| 8 | Decision record | Approval status pills per §6 |
| 9 | History | **Re-tint existing table.** |
| 10 | Booking | Status colors: Waiting=amber · Sent=Muted · Confirmed=positive · Cancelled=coral |
| 11 | Demand board | Plant chips Glass-100; merge CTA mint pill |
| 12 | Vendor quotes | Constant sample-data banner: dashed Amber-300 `#ecd9a4` border (same caution recipe as all sample-data tags) |
| 13 | Live map | Route line Glass-400, ship marker Sea-700, sample-data tag |
| 14 | Admin · Reference data | Standard tables, Well inputs |
| 15 | Admin · Users | Standard tables; Disable = Coral-100/700 destructive |
| 16 | Audit log | Pure mono table — the most neutral page |

## 10. Accessibility Rules (audit lessons, baked in)

1. Every text token passes AA (≥4.5:1) on both Card and Canvas by
   construction — Faint is the single exception, restricted to
   placeholders/large text.
2. Mint-500/Glass-400/Glass-300 are graphics-and-fills only, never text.
3. Semantic text pairs are fixed recipes from §6 — no ad-hoc tints.
4. Charts never encode meaning by hue alone (lightness + weight too).
5. Focus ring 2px Sea-600 everywhere; scrollable regions are focusable.
6. Reduced-motion collapses all transitions and chart draw-ins.

## 11. Out of Scope

- Building the 12 future pages (their palette roles are assigned above;
  construction is separate work)
- Dark mode
- Changing fonts, page structure, or information architecture
