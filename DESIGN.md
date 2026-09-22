# Intelligent Freight Portal — Design World: "Admiralty Chart"

> **v3 — Monochrome Blue.** This document is the single source of visual truth.
> The previous worlds (Wise lime, OpenSea dark terminal) are **retired as
> anti-references**: no green/lime/emerald anywhere, no black/charcoal surfaces
> anywhere. The palette is exactly ten blues; nothing else may ship.

## 1. The Idea

A **hydrographic chart** — the nautical chart a port office would actually
have pinned to the wall. Paper is light, water is ink. The interface is drawn
with **ruled hairlines and hatching**, like engraved chart linework: elevation
comes from density of rule, never from shadows or color. Data is rendered the
way a chart renders depth soundings — in a numerals-only face, weighted and
italic for emphasis. One hue, ten steps, zero exceptions. The moment a second
hue appears, the world collapses into a generic admin — the ban is the design.

## 2. The Palette — Exactly Ten Blues

| # | Hex | Chart Name | Role |
|---|-----|-----------|------|
| 1 | `#e3f2fd` | **Foam** | Page canvas, panel fill (light end) |
| 2 | `#bbdefb` | **Shoal** | Elevated fill, pressed states, rule on Foam |
| 3 | `#90caf9` | **Shallow** | Hairline rules, card edges, icon washes, quiet icons |
| 4 | `#64b5f6` | **Channel** | Disabled ink, tertiary hover washes |
| 5 | `#42a5f5` | **Reef** | Secondary emphasis, tertiary text on light |
| 6 | `#2196f3` | **Deep** | Live-signal accent, informational accent, delta up-tint |
| 7 | `#1e88e5` | **Fathom** | Interactive hover states, active icon |
| 8 | `#1565c0` | **Slate (ink)** | Muted ink: metadata, placeholders, timestamps |
| 9 | `#1e3a8a` | **Deep Sea** | Body copy, secondary headings, filled interactive controls |
| 10 | `#0d47a1` | **Abyss** | Primary ink: headings, numerals, filled CTAs |

> **Contrast is pre-solved.** Abyss-on-Foam 8.6:1, Slate-on-Foam 6.4:1,
> Deep-Sea-on-Foam 10.4:1, Deep-on-Foam 3.5:1 — large-text/icon only.
> Never set body copy in Reef or lighter.

## 3. Type — Numerals, Not Prose

| Role | Face | Weight | Size | Notes |
|------|------|--------|------|-------|
| Numerals & code | **IBM Plex Mono** | 400 / 500 / **600** | 12–30px | ALL tabular; 600 = data emphasis |
| Headings / hero | Inter | 400 | 20–32px | Chart caption voice — weight 400 max |
| Body | Inter | 400 | 14px | weight 400 |
| Eyebrows | IBM Plex Mono | 400 | 10px | uppercase, letter-spaced, Slate ink |
| **Banned** | bold/heavy display | 600+ sans | — | Charts don't shout; data does |

The **lightest-weight numeral is the quietest element on screen; the 600
numeral is the loudest** — that is the whole hierarchy engine. No heading may
exceed 32px. Section titles live at 20px.

## 4. Rules and Lines (Elevation)

There are **no shadows. Ever.** No glow. No gradients on surfaces. Elevation
is expressed only through rule density:

| Token | Value | Use |
|-------|-------|-----|
| `--rule-hairline` | `1px #90caf9` | card edges, dividers (15% alpha on Foam canvas) |
| `--rule-medium` | `1px #90caf9` (45%) | table header underline, footer rule |
| `--rule-hard` | `2px #0d47a1` | current section indicator, active nav |
| `--rule-dotted` | `1px dotted #1565c0` | advisory callout borders |
| `--wash-recessed` | `#e3f2fd` fill | inside-card wells, input wells |
| `--wash-elevated` | `#bbdefb` fill | toolbar band, pressed rows |

Cards: **Foam panel + 1px hairline ring**. Hover = ring deepens to 45% rule;
never a shadow. Highest elevation = a **double rule** (hairline + medium rule
2px below) — use for the active nav item and the primary data card only.

## 5. Geometry

- **Radius scale:** 3px (controls, chips) / **6px (cards, inputs)** — nothing larger. Zero radius is allowed for table shells and rules.
- **Base unit:** 4px. Gutters 12px inside cards; 48px between sections.
- **Page max-width:** 1200px center column (content), full-bleed rails.

## 6. Layout — The Three-Pane Chart Sheet

- **Left rail (56px):** Foam panel, hairline right edge. 24px icons in Slate;
  active item = 2px Abyss left bar + Shoal wash. Bottom: settings, sign-out.
- **Top bar (48px):** Foam band, medium rule below. Brand 14px/500 Abyss.
  Search well (recessed Foam on Shoal wash) with `/` kbd. Desk pill on the
  right (mono desk code, hairline border).
- **Center column (max 1200px):** Foam canvas. 32px weight-400 Abyss desk
  title with mono desk-code eyebrow. Metric cards in a dense 3-up row
  (12px gaps). Data table with mono numerals, 1px rules between rows.
- **Right rail (320px):** Foam panel with hairline left edge; "chart feed"
  rows with mono values; dot rules; 45% section dividers.

## 7. Semantics Without a Second Hue

| Meaning | Expression | Never |
|---------|-----------|-------|
| Primary action | **Filled Abyss** button, Foam text | filled Deep |
| Secondary action | Hairline outline, Abyss text; hover washes Shoal | filled anything |
| Live/verified/info | **Deep** dot or Deep text only | filled area |
| Negative delta | **Abyss 600 + down-triangle glyph** | red, vermilion, any hue |
| Positive delta | **Deep 500 + up-triangle glyph** | green, emerald, lime |
| Neutral delta | Slate 400 mono | — |
| Advisory/hazard | **Dotted Slate rule box + "!" glyph + 600 weight** | amber, red, orange |
| Disabled | Channel ink on Shoal wash | opacity tricks on colored elements |

Danger and status are communicated by **glyph + weight + rule**, the way
charts mark hazards with hatching. Never by adding a hue.

## 7a. Empty & Loading States

- **Loading:** skeleton = Shoal block with **animated dotted Slate rule**
  sweeping across (chart "drawing in" metaphor), 1.6s ease-in-out loop.
- **Empty:** dashed Slate hairline box, centered 400 mono note.
- **Error:** dotted-rule alert box, 600 Abyss glyph + message, medium rule
  under header. Alert uses the same box as advisory — errors are hazards.

## 8. Motion — The Pen Plotter

All motion reads as a **pen plotter drawing a chart**: directional, precise,
never bouncy. One curve: `cubic-bezier(0.4, 0, 0.2, 1)`, 200ms standard,
400ms entrances.

- Draw-in: rules and card edges **draw from left** (`scaleX 0→1`,
  transform-origin left).
- Series draw left-to-right (existing chart `pathLength` behavior).
- Numerals settle with a 4px rise + fade, 200ms.
- Hover: rule deepens (hairline → medium) over 150ms; wash transitions 150ms.
- Deltas: up-triangle ▲ / down-triangle ▼ as glyphs — **no bounce, no pulse**.
- **Reduced motion:** all transitions ≤1ms; draw-ins appear complete.

## 9. Do

- Keep the entire UI in the ten blues; check every new element against §2.
- Render **every number, code, timestamp, and unit in mono, tabular**.
- Express hierarchy through **weight (400/500/600 mono) and rule density**.
- Mark hazards with dotted rules + glyph, never with color.
- Use ▲/▼ glyphs for deltas with 500/600 mono weight.

## 10. Don't

- **No second hue.** No green/emerald/lime, no red/vermilion, no amber — the
  semantic §7 mapping is mandatory.
- **No shadows** (`box-shadow` banned on all elements). No glow. No gradients.
- No bold sans (600+) for headings; only mono 600 for data emphasis.
- No radius above 6px. No filled Deep buttons (only Abyss fills).
- No body text in Reef or lighter (contrast < 4.5:1).

## 11. Agent Quick Reference

```css
/* text: #0d47a1 · body: #1e3a8a · muted: #1565c0
   canvas: #e3f2fd · elevated: #bbdefb
   rules: #90caf9 (hairline) / #90caf9 45% (medium) / #0d47a1 2px (hard)
   accent: #2196f3 · hover: #1e88e5 · CTA fill: #0d47a1 with #e3f2fd text */
```

**Example prompts:**
1. Metric card: Foam fill, 1px hairline ring, 6px radius, 12px padding. Mono
   10px uppercase Slate eyebrow; value in mono 24px 600 Abyss; body note in
   12px Deep Sea.
2. Table: zero radius shell, header row Shoal fill with mono 10px Slate
   labels, 1px hairline row rules, hover row = Shoal wash, values mono
   tabular.
3. Primary button: filled `#0d47a1`, `#e3f2fd` 14px/500 text, 3px radius,
   hover `#1e3a8a`, no shadow.
4. Advisory: 1px dotted `#1565c0` rule box on Foam, "!" glyph in 600 Abyss,
   message 12px Deep Sea.
