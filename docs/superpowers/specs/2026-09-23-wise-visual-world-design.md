# Wise Visual World — Design Spec

**Date:** 2026-09-23
**Status:** Approved (design sections 1 & 2 approved in conversation)
**Supersedes:** Sea-Glass light palette (`2026-09-22-sea-glass-light-palette-design.md`) as the active visual world. That spec's *page recipes* (16-page assignments) carry forward re-expressed in Wise terms (§8).
**Source of truth:** `DESIGN.md` (Wise style reference — Forest Ink `#163300`, Lime Voltage `#9fe870`, pill geometry, Inter).

---

## 1. Goal

Replace the Sea-Glass world with the pinned Wise world across every rendered surface, and recompose layouts where the Wise identity demands it (Auth hero, Dashboard greeting band). Delete dead stub pages. Keep all accessibility wins (axe-clean, focus traps, reduced motion) and anti-slop rules intact.

## 2. Decisions log (approved in conversation)

| Decision | Choice |
|---|---|
| Dead stub pages (9 files, no router) | **Delete**; future pages pre-designed in §8 recipes only |
| Wise Sans 900 display voice | **Auth hero full treatment + small echoes** elsewhere |
| Dashboard heading | **36px Inter 700** greeting ("Good morning, {name}") + mono date/desk eyebrow |
| Data font | **Keep IBM Plex Mono** for all numerals (Wise has no mono; ours is deliberate) |
| Execution depth | **Approach A** — full Wise port + layout recomposition; no dark mode, no new pages |

## 3. Contrast matrix (measured, exact WCAG math)

All values computed with the standard relative-luminance formula. These numbers are binding — QA probes assert them.

### Text on light surfaces

| Pair | Ratio | Verdict |
|---|---|---|
| Obsidian `#0e0f0c` on Paper | 19.23 | AAA — display headlines |
| Forest Ink `#163300` on Paper | 13.93 | AAA — headings, numerals |
| Forest Ink on Fog card | 11.58 | AAA — card headings |
| Charcoal `#454745` on Paper (body) | 9.37 | AAA — body copy |
| Charcoal on Fog (card body) | 7.79 | AAA — **the only body/secondary ink allowed on Fog** |
| Slate `#6a6c6a` on Paper (secondary) | 5.30 | AA — muted text, **Paper only** |
| Pebble `#868685` on Paper | 3.64 | Non-text only — **borders, icons, dividers** (Wise's placeholder gray is banned as text under our AA standard) |
| **Slate on Fog** | **4.40** | **FAILS AA — trap.** Never set Slate text on Fog |

### The signature pair

| Pair | Ratio | Verdict |
|---|---|---|
| **Forest Ink on Lime Voltage (CTA)** | **9.45** | AAA — every primary action |
| Lime on Forest Ink (dark display) | 9.45 | AAA — display text on dark panels |
| Paper on Forest Ink (dark body) | 13.93 | AAA — body on dark panels |

### The Lime trap (binding)

| Pair | Ratio | Rule |
|---|---|---|
| Lime on Paper | **1.47** | Lime is **fill-only** on light surfaces. Never text, never an icon stroke, never a chart line, never a border on light. |
| Lime on Fog | **1.22** | Same. |

### Semantics

| Meaning | Recipe | Ratio |
|---|---|---|
| Positive / approved / live | Linen Mist `#e2f6d5` bg + Forest Ink text + ▲ | 12.19 |
| Negative / danger (text & chips) | Alarm Red `#cb272f` on Fog bg | 4.51 AA — or on Paper 5.43 |
| Destructive button | Alarm Red fill + Paper text | 5.43 |
| Pending / info | Linen Mist bg + Signal Blue `#0b4c72` text | 8.02 |
| Info on Fog | Signal Blue on Fog | 7.62 |
| Spruce `#054d28` (dark-green support) | on Paper 10.01 · on Fog 8.32 | AA/AAA |
| Delta glyphs | ▲ Spruce · ▼ Alarm Red (paired with mono value; color is never the sole signal) | ✓ |

## 4. Tokens (Tailwind v4 `@theme`)

Replace the Sea-Glass block in `frontend/src/index.css`:

```css
@theme {
  /* Wise palette */
  --color-forest-ink: #163300;   /* brand dark: text, dark panels, icons */
  --color-lime-voltage: #9fe870; /* CTA fill + dark-panel display ONLY (see trap) */
  --color-spruce: #054d28;       /* positive delta ink, dark-section support */
  --color-linen-mist: #e2f6d5;   /* tinted highlight surfaces, badge fills */
  --color-signal-blue: #0b4c72;  /* info/pending ink */
  --color-alarm-red: #cb272f;    /* danger ink + destructive fill */
  --color-charcoal: #454745;     /* body text (also on Fog) */
  --color-obsidian: #0e0f0c;     /* display headlines */
  --color-pebble: #868685;       /* borders, icon strokes, dividers — non-text */
  --color-slate: #6a6c6a;        /* secondary text — Paper surfaces only */
  --color-fog: #e8ebe6;          /* card surfaces, input fills, table header band */
  --color-paper: #ffffff;        /* canvas, cards, input fills */

  /* Fonts (Plex Mono carried over deliberately) */
  --font-inter: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  /* Radii: pill geometry is the Wise signature */
  --radius-pill: 9999px;  /* buttons, tags, nav segments, desk pill */
  --radius-card: 10px;    /* cards, inputs, sheets */
  --radius-xl: 28px;      /* large feature cards only */

  /* Shadows: Wise-legal, elevated panels ONLY (hairline-only rule retired) */
  --shadow-lg: rgba(0, 0, 0, 0.08) 0px 6px 20px 0px;
  --shadow-xl: rgba(0, 0, 0, 0.15) 0px 10px 32px 0px, rgba(0, 0, 0, 0.04) 0px 40px 40px 0px;
}
```

Elevation policy: hairline `1px Pebble` borders remain the default card edge; the two shadows above are permitted **only** on floating overlays (drawer sheet, popovers). Cards on the canvas stay flat-bordered. This mirrors Wise: flat by default, soft shadow when an element physically floats.

## 5. Typography

| Role | Spec |
|---|---|
| Display (Auth hero) | Inter 900, tracking −0.03em, 89px, Lime Voltage on Forest Ink panel; line-height 0.85 |
| Display echo (none today) | Inter 900 45–61px reserved for future landing page |
| Page greeting | Inter 700 36px tracking-tight Obsidian + mono eyebrow above |
| Section titles | Inter 600 20–25px Forest Ink |
| Body | Inter 400 16px Charcoal (Paper) / Charcoal (Fog) |
| Secondary | Inter 400–500 14px Slate (Paper only) |
| Numerals, timestamps, desk codes, table values | IBM Plex Mono 500/600, `tabular-nums` — unchanged |

## 6. Components

| Component | Recipe |
|---|---|
| **Primary CTA** | Lime Voltage fill, 9999px, Forest Ink text, Inter 500 16px, py-2.5 px-6, no border/shadow; press = `scale-[0.98]`; hover = slight Lime darken via `brightness(0.96)` filter |
| Secondary action | Outlined pill: Paper fill, 1px Forest Ink border, 9999px |
| Tertiary action | Underlined Forest Ink text link, Inter 500 |
| Semantic pill | per §3 recipes; 9999px; glyph + mono value where numeric |
| Card | Paper or Fog fill, 10px radius, 1px Pebble hairline, no shadow |
| Input | Paper fill, 1px Pebble border, 10px radius, Inter 400 16px; **placeholder = Slate (5.30 on Paper)**; focus = Forest Ink border, no glow |
| Icon rail (56px) | Paper bg, Pebble hairline right edge; active item = **Linen Mist pill wash + Forest Ink icon** (Wise segmented language); hover = Fog wash |
| Desk pill (TopBar) | Fog fill, 1px Pebble border, 9999px, mono desk code Forest Ink |
| Dark panel (Auth left) | Forest Ink bg, 28px radius on desktop, Lime display headline, Paper body, lime pill CTA |
| Drawer sheet | Paper, 10px radius, `shadow-xl`, overlay `rgba(14,15,12,0.4)` fade |
| Live marker | static lime dot + mono `LIVE` label (anti-slop: no ping/pulse) |
| Skeleton | existing sweep animation, recolored to Fog on Paper |

## 7. Page treatments

### AuthPage — recomposed (the one Persuade surface)
Asymmetric split. **Left 45%:** Forest Ink panel, 89px Inter 900 Lime headline (pinned copy: **"Know your rate before you book."** — 7 words, no filler verbs, no em-dash), 16-word Paper subtext ("Forecasted rates, plant windows, and booking guidance for SAIL's freight desk, powered by live market signals."), lime pill CTA ("Run your first analysis"), underlined Paper text link. **Right 55%:** Paper canvas, auth card centered (10px, no shadow), Fog inputs, lime pill submit, Signal Blue info links. Auth error keeps `role="alert"` with Alarm Red recipe (Alarm Red on Paper text + Alarm Red border). Mobile: dark panel condenses to a Forest Ink banner (24px headline) above the form card; form full-width.

### Dashboard
- **New greeting band** above metrics: mono eyebrow (`FR8-PLN · TUE 23 SEP` in Slate) + time-of-day greeting ("Good morning/afternoon/evening, {firstName}") Inter 700 36px Obsidian. One row, no card.
- Metric tiles: Fog cards, Forest Ink 600 mono values, Spruce ▲ / Alarm Red ▼ deltas, Slate labels (tiles sit on Paper canvas — Slate legal).
- Haldia advisory: Fog banner + Alarm Red 600 text + `!` glyph (replaces coral hazard styling).
- Chart card, table card, right rail: re-tint per §6; layout unchanged.

### Table (Simulation Log)
Fog header band with Charcoal 600 labels; rows hover to Fog wash; savings column Forest Ink mono; status chips per §3; focusable scroll region + axe semantics preserved.

### Drawer
Paper sheet, `shadow-xl`, Forest Ink 700 title, Fog inputs, lime submit, Haldia advisory per Dashboard recipe; chart variants renamed (§8).

### TopBar / IconRail / RightRail
Per §6 recipes. RightRail live rows: Forest Ink names, Charcoal values, Spruce/Alarm deltas, `LIVE` marker. Amber caution row becomes Signal Blue info row (Linen Mist).

### Charts (`AnimatedSvgChart`)
- `actual` series: Forest Ink solid 2px
- `forecast` series: Charcoal dashed 2px (differentiation by dash + value, not hue)
- Area wash: Linen Mist at 40% opacity
- Grid: Pebble dotted hairlines; axis labels Slate (on Paper card)
- End marker: square Forest Ink nib (kept)
- **Lime never appears in any chart** (1.47:1 trap)

## 8. Future-page recipes (pre-assigned, not built now)

| Page | Wise treatment |
|---|---|
| Landing | Forest Ink hero, 105px Lime display, lime pill CTA, Fog proof cards |
| Results | Recommendation card on Linen Mist tint + "Recommended" lime chip; why-chosen bars Forest Ink/Charcoal |
| Scenario compare | Side-by-side Fog cards; selected = Forest Ink border |
| Booking | Status: Waiting = Signal Blue info · Sent = Slate · Confirmed = positive pill · Cancelled = danger pill |
| Demand board | Plant chips Fog; merge = lime pill |
| Vendor quotes | Sample-data banner: Fog bg + dashed Pebble border + Slate text |
| Live map | Route = Forest Ink on Fog card; ship marker Forest Ink square nib |
| Admin / Audit log | Standard Fog tables; destructive = Alarm Red fill button |

## 9. Motion

Replace `lib/motion.ts` tokens:

```ts
export const EASE_OUT = [0.23, 1, 0.32, 1];      // entrances, exits
export const EASE_DRAWER = [0.32, 0.72, 0, 1];   // drawer sheet, iOS-like
```

| Element | Spec |
|---|---|
| Entrance stagger | 30–60ms, y: 12→0 + opacity, 250ms EASE_OUT |
| Drawer | x: 100%→0, 280ms EASE_DRAWER; backdrop opacity fade; exit reverses |
| Hover | 150ms color/border only (`transition-colors`) |
| Press | `scale-[0.98]` 100ms |
| Chart draw | unchanged mechanism, 400ms EASE_OUT |
| Reduced motion | `useReducedMotion()` collapses transforms to opacity-only; global CSS kill-switch stays |

Carry-over bans: no `animate-ping`/`animate-pulse`, no decorative dots, no invented easings, `transform`/`opacity` only.

## 10. Scope, hygiene, verification

1. **Delete 9 stub pages** (verified unreferenced; grep confirms zero imports).
2. Execution order: tokens → primitives (`ui.tsx`) → shell (App, IconRail, TopBar, RightRail) → AuthPage (recomposed) → Dashboard + MetricsStrip → Table → Drawer → Charts → `motion.ts`. Drift grep after every task: `foam|shoal|shallow|abyss|deepsea|slate-ink|sea-|glass-|channel|reef|fathom|coral|amber-` must reach zero in `frontend/src`.
3. QA (production preview build): axe-core zero violations across all flows; structural probes assert body Paper `rgb(255,255,255)`, CTA fill `rgb(159,232,112)`, CTA radius 9999px, h1 Inter 900 (auth) / Inter 700 36px (dashboard), card radius 10px + no shadow, drawer `shadow-xl` present, fonts loaded, focus trap + Escape restore, zero overflow at 1440/390.
4. `tsc -b` + `vite build` + oxlint clean.
5. DESIGN.md already pins the world (no rewrite needed); `.geminirules` anti-slop section unchanged.

## 11. Out of scope

Dark mode (rejected in approach choice), router/new pages, backend, copy rewrite beyond hero/greeting, icon-library migration (lucide stays — existing dependency).
