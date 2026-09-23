# StatCard Metrics Redesign — Design Spec

**Date:** 2026-09-23
**Status:** Approved (design confirmed in conversation)
**Parent context:** Wise visual world spec (`2026-09-23-wise-visual-world-design.md`), DESIGN.md v5
**Trigger:** User flagged `GlobalMetricsStrip` decorative sparklines + pasted a production-grade reference `StatCards` component (chart-engine based) as the target pattern.

---

## 1. Problem

The current `GlobalMetricsStrip` renders three fog cards whose "sparklines" are **decorative fakes**: `AnimatedSvgChart` draws hardcoded SVG paths unrelated to the metrics shown above them. Real values (BDI 1,842, $14.85/MT, $612.50/MT) are static scalars. The pasted reference derives its sparkline from a real 30-point series, supports pointer/keyboard scrubbing, and rolls the headline number with a tween.

This spec makes the metrics strip real: backend series → derived sparkline → scrubbing → rolling numbers, dressed in the Wise world.

## 2. Decisions Log (user-approved)

| # | Decision | Choice | Alternative rejected |
|---|----------|--------|---------------------|
| D1 | Sparkline data source | **Backend history** (server-generated deterministic series ending at current headline) | Frontend mock walk — keeps the "fake data" problem |
| D2 | Surface scope | **GlobalMetricsStrip only** (3 market cards) | Desk indicator tiles — deferred |
| D3 | Interaction depth | **Full scrub + rolling numbers** | Static sparkline — discards the reference's core value |
| D4 | Visual dress | Wise fog cards, Forest Ink mono values, Spruce/Alarm Red semantic deltas | Reference's neutral-500 palette — wrong brand |

## 3. Measured Contrast Matrix (binding, WCAG 2.1 exact math)

All pairs against Fog `#e8ebe6` card surface unless noted. AA normal text ≥ 4.5, large text (≥18.66px bold / 24px) ≥ 3.0. UI components (strokes, 2px sparklines) ≥ 3.0.

| Pair | Ratio | Verdict | Use |
|---|---|---|---|
| Charcoal label on Fog | 7.79 | AA ✓ | Card label (13px, 400) |
| **Forest Ink value on Fog** | **11.58** | AA+ ✓ | Headline numeral (mono 600) |
| Spruce good-delta on Fog | 8.32 | AA ✓ | Positive-direction delta line (12.5px) |
| **Alarm Red bad-delta on Fog** | **4.51** | AA ✓ (thin) | Negative-direction delta — binding minimum; never darken Fog or lighten Alarm Red under this text |
| Charcoal scrub caption on Fog | 7.79 | AA ✓ | "day 7 of 30" while scrubbing |
| Spruce sparkline stroke on Fog | 8.32 | UI ✓ | Good-direction line (2px) |
| Alarm Red sparkline stroke on Fog | 4.51 | UI ✓ | Bad-direction line |
| Forest Ink on Paper | 13.93 | AA+ ✓ | (reference) |
| Slate on Fog | 4.40 | ✗ FAIL | **Banned** — no Slate text on fog cards |
| Pebble on Fog | 3.03 | ✗ FAIL for text | **Banned** for any text on fog cards |
| Charcoal on Linen Mist | 8.20 | AA ✓ | (reference, Pill positive tone) |
| Forest Ink on Linen Mist | 12.19 | AA+ ✓ | (reference) |

**Lime rule carries over:** Lime Voltage is never text, stroke, or chart color on light surfaces (1.47:1 on Paper). The sparkline never uses lime — good is Spruce, bad is Alarm Red.

**Gradient fill note:** sparkline area fill is the series color at 30% → 2% opacity over Fog. At ≤30% alpha the effective contrast of Spruce/Alarm Red stays far above the 3.0 UI-component floor (fill is decorative reinforcement of the stroked line, which carries the signal on its own at full opacity). No text ever sits on the fill region except the headline above it — unchanged contrast.

## 4. Data Contract

### 4.1 Backend — `GET /api/metrics/global`

Response model `GlobalMetricsResponse` gains one optional-to-consumers field:

```python
class GlobalMetricsResponse(BaseModel):
    bdi_index: int
    bdi_change_pct: float
    current_avg_freight_pmt: float
    freight_change_pct: float
    bunker_vlsfo_pmt: float
    capesize_daily_usd: int
    panamax_daily_usd: int
    series: MetricsSeries

class MetricsSeries(BaseModel):
    bdi: list[float]       # 30 points, series[-1] == bdi_index
    freight: list[float]   # 30 points, series[-1] == current_avg_freight_pmt
    bunker: list[float]    # 30 points, series[-1] == bunker_vlsfo_pmt
```

### 4.2 Series generator

New helper in `backend/app/metrics_service.py` (module created if absent; otherwise extend):

- `generate_series(seed_key: str, endpoint: float, n: int = 30) -> list[float]` — deterministic random walk: port mulberry32-style seeded PRNG to Python (pure stdlib: integer xorshift-family; no dependencies).
- Walk is generated **backwards from the endpoint**: start at endpoint, walk backwards so `series[-1] == endpoint` exactly (no post-hoc normalization drift).
- Volatility tuned per key: `bdi` ±2.5%/step, `freight` ±1.8%, `bunker` ±1.2% — realistic without looking random-noise.
- Values clamped positive (min 0.0001 scaled to each metric's magnitude).
- Seed key includes a **stable day component** (`f"{key}-{date.today().isoformat()}"`) so the series is deterministic within a day (cacheable, testable) but drifts day to day like real history.

### 4.3 Tests — extend `backend/tests/test_analyses_api.py`

- Existing `test_global_metrics_endpoint` keeps all current assertions and adds: `series` present; `len(series["bdi"]) == 30` (and freight, bunker); `series["bdi"][-1] == 1842`; `series["freight"][-1] == 14.85`; `series["bunker"][-1] == 612.50`.
- New `test_metrics_series_deterministic`: two calls same day → identical series lists.
- New `test_metrics_series_shape`: all values > 0; walk is not constant (at least one interior value differs from endpoint).

### 4.4 Frontend type — `frontend/src/types/analysis.ts`

```ts
export interface MetricsSeries {
  bdi: number[];
  freight: number[];
  bunker: number[];
}

export interface GlobalMetrics {
  bdi_index: number;
  bdi_change_pct: number;
  current_avg_freight_pmt: number;
  freight_change_pct: number;
  bunker_vlsfo_pmt: number;
  capesize_daily_usd: number;
  panamax_daily_usd: number;
  series?: MetricsSeries;   // optional: fallback path (§6) may omit it
}
```

## 5. Component Architecture

### 5.1 New: `frontend/src/components/StatCard.tsx`

Self-contained Wise-dressed stat card (adapted from the user's pasted reference, re-skinned and simplified):

**Props:**
```ts
export interface StatCardProps {
  label: string;
  series: number[];            // 30 points
  format: (v: number) => string;
  goodWhen?: "up" | "down";    // default "up"
  deltaLabel?: string;         // e.g. "vs 30 days ago"
  caption?: string;            // static footer when no delta (bunker card)
  delta?: number | null;       // server-provided % change; null → caption or empty fixed-height line (§6)
  index?: number;              // stagger position for entry animation
}
```

**Behavior (from the approved design):**
- **Sparkline math:** normalize series to the spark box; `monotonePath` cubic interpolation for a smooth line; area path = line closed to baseline. Memoized on `series` + measured box size.
- **Measured box:** `ResizeObserver` on the spark container (width-driven redraw), initial `getBoundingClientRect` fallback.
- **Rolling number:** `useSpringNumber(shown, !reduce)` (§5.2) — the motion value updates the DOM text node directly, no per-frame React re-renders. Settles ≈260ms; snaps when `prefers-reduced-motion`.
- **Scrub:** spark region is `tabIndex={0}`, `role="img"` lives on the card root with a full summary `aria-label` (`"{label}: {value}, up 2 percent vs 30 days ago."` pattern). Pointer move/down set hover index by nearest x; pointer leave / blur clears. Keyboard: `←`/`→` step, `Home`/`End` jump, all wrapped in a shared `useHoverIndexKeys` helper (local to StatCard.tsx).
- **While scrubbing:** headline rolls to that day's value; delta line swaps to `day {i+1} of {n}` in Charcoal; scrub dot (r 4.5, Paper fill, 2px series-color ring) tracks the line.
- **Delta line:** `▲/▼ {abs(pct)}% {deltaLabel}` — glyph + value; colored Spruce when the direction is good for this metric (`goodWhen`), Alarm Red when bad. Direction glyph **always** present so hue is never the sole signal (WCAG 1.4.1).
- **Bunker card** (no server delta): static caption line in Charcoal — keeps the existing "SINGAPORE HUB · STEADY" framing via `caption` prop. Its sparkline is still live-scrubbable.
- **Entry animation:** draw-in via `pathLength={1}` + `stroke-dasharray: 1` 700ms `EASE_OUT` (existing motion vocabulary `--ease-out-strong`), staggered `index * 70ms`; area fill fades in +180ms; extreme dots (≤5 local extrema, r 2.5) fade in last. All disabled under reduced motion.
- **Skeleton states:** parent (strip) keeps rendering the existing `Skeleton` sweep cards while loading — StatCard itself only renders with data.

### 5.2 New: `frontend/src/lib/useSpringNumber.ts`

```ts
export function useSpringNumber(value: number, enabled: boolean): MotionValue<number>
```

- framer-motion `useSpring(value, { stiffness, damping })` tuned to settle ≈260ms, returned as a `MotionValue<number>`; the component pipes it through `useTransform(v => format(v))` for display.
- When `enabled=false` (reduced motion), the motion value snaps to `value`.
- No rAF loops, no setState per frame.

### 5.3 Rewritten: `frontend/src/components/GlobalMetricsStrip.tsx`

- Same fetch + fallback logic (`FALLBACK_METRICS` gains a hand-written 30-point `series` triple so offline mode still shows real-looking sparks).
- Three `StatCard`s replace the hand-built markup:
  1. **Baltic Dry Index** — `series: metrics.series.bdi`, `delta: bdi_change_pct`, `goodWhen: "up"`, format `toLocaleString`, deltaLabel "vs 30 days ago".
  2. **Avg Freight Rate** — `series: freight`, `delta: freight_change_pct`, `goodWhen: "down"` (falling rate = savings window ▼ Spruce), format `$x.xx / MT` (unit suffix via formatter), deltaLabel "vs 30 days ago".
  3. **Bunker Fuel · VLSFO** — `series: bunker`, `delta: null`, `caption: "SINGAPORE HUB · STEADY"`, format `$x.xx / MT`.
- `DeltaChip`, `AnimatedSvgChart` import, and hand-built card markup are deleted from this file.
- Grid stays `grid-cols-1 gap-3 md:grid-cols-3`; loading skeleton block unchanged.
- `Pill`/`Fuel` icon usage: the SIN pill and `Fuel` icon are **dropped** (declutter; the label already says VLSFO) — the bunker card's footer is the text-only `caption` per the approved design.

### 5.4 Deleted / orphaned code

- `DeltaChip` in GlobalMetricsStrip — removed with the rewrite.
- `AnimatedSvgChart` — **stays** (drawer forecast chart still uses it); the strip stops importing it. Its decorative-path limitation is documented in its header comment pointing readers at StatCard for data-driven charts.
- `VerifiedDot` in `ui.tsx` — orphaned since the Wise port (dot removal commit `02a78a7`); deleted as cleanup in this implementation.

### 5.5 Wise anatomy (binding)

```
Card tone="fog" rounded-[10px] p-4, Pebble hairline, flex row justify-between gap-5
├─ left column (min-w-0, flex col justify-between)
│  ├─ label: 13px Inter 400 Charcoal (NOT Slate — 4.40 trap), truncate
│  ├─ value: IBM Plex Mono 600 26px Forest Ink, tabular-nums, rolls (via useSpringNumber §5.2 + card `format`)
│  └─ delta/caption line: 12.5px mono 500, fixed-height (no layout shift on scrub swap)
│     ├─ good: Spruce + ▲/▼ glyph per direction
│     ├─ bad: Alarm Red + glyph
│     └─ scrubbing: "day 7 of 30" Charcoal
└─ spark region: ~44% width, max-w-52, min-h 58, self-stretch, cursor-crosshair,
   tabIndex 0, focus ring (focus-visible 2px Forest Ink), touch-pan-y
   ├─ area fill: series color 30%→2% vertical gradient (unique gradient id per card via useId)
   ├─ line: 2px round cap/join, Spruce (good) or Alarm Red (bad)
   ├─ ≤5 extrema dots r 2.5 series color
   └─ scrub dot r 4.5 Paper fill + 2px series ring (only while hovering)
```

## 6. Error & Edge Handling

- **Fetch failure:** existing behavior kept — `FALLBACK_METRICS` (with static series) renders; `console.warn` retained.
- **`series` missing from a future API change:** `GlobalMetricsStrip` guards `metrics.series ?? FALLBACK.series[key]` per card — the card never receives undefined.
- **Series shorter than 2 points:** StatCard renders value + delta but no spark region (no dead interactive area).
- **Scrub on touch:** pointer events cover touch; `touch-pan-y` keeps vertical page scroll native.
- **`delta` null + no caption:** renders an empty fixed-height line (layout stability).

## 7. Accessibility

- Card root: `role="img"` + computed `aria-label` summary (label, current value, direction words "up/down", delta %, deltaLabel). Scrub changes do NOT spam the aria-label (it describes the headline state; visual scrub is supplementary — the reference's pattern, kept).
- Spark region: `tabIndex={0}`, `aria-hidden="true"` (the card root's label already describes the data; the scrub is a visual pointer aid). Keyboard scrubbing updates the visible value/line so sighted keyboard users get parity; the summary label keeps screen-reader users informed of headline facts without 30 stops.
- Focus: `focus-visible` 2px Forest Ink ring (global style already applies outline; spark region adds `outline-offset` inset so the ring hugs the spark box).
- Motion: all entry/roll animation gated on `prefers-reduced-motion` (hook + CSS global rule).
- Color independence: the ▲/▼ glyph (shape, not hue) always accompanies the delta color — WCAG 1.4.1 satisfied; the "up/down" words live in the card's aria-label for screen readers.

## 8. Testing & Verification

**Backend** (pytest, per §4.3): endpoint shape, 30-point lengths, endpoint-match, determinism, positivity, non-constant walk.

**Frontend build:** `tsc -b && vite build` green; `oxlint` 0 errors.

**QA (Playwright + axe, same harness as prior passes):**
- axe-core 0 violations on dashboard (planner + operator), desktop + 390px mobile.
- Structural probes assert:
  - 3 fog cards present with `rounded-[10px]`, `background rgb(232,235,230)`.
  - Headline numerals computed `font-family` contains `IBM Plex Mono`, weight 600, color `rgb(22,51,0)`.
  - Spark `<svg>` present in each card; `stroke` attr is Spruce `rgb(5,77,40)` or Alarm Red `rgb(203,39,47)` — **never lime**.
  - Pointer scrub: dispatch pointermove over spark → headline text changes; pointerleave → returns to headline.
  - Keyboard: focus spark, press `→` → value line shows "day … of 30".
  - `prefers-reduced-motion: reduce` emulation → no entry animation (computed animation-duration 0.01ms), values render instantly.
- Screenshots: dashboard desktop + mobile into `/tmp/qa-shots-statcard/`.

## 9. Out of Scope

- Desk indicator tiles (SPOT VS PERIOD GAP, BERTH AVAILABILITY, …) — stay as-is.
- Real feed integration (the seeded walk is the placeholder; the API contract is designed for it).
- Reusing StatCard for future pages (landing, results) — recipes exist in DESIGN.md; adoption later.
- Chart engine extraction (the reference's `chart-engine.ts` module system) — StatCard is self-contained; extraction if a third data chart ever appears.

## 10. Tasks Preview (for writing-plans)

1. Backend: `MetricsSeries` schema + `generate_series` helper + endpoint + tests.
2. Frontend types: `MetricsSeries`, `GlobalMetrics.series?`.
3. `useSpringNumber` hook.
4. `StatCard.tsx` (full component).
5. `GlobalMetricsStrip.tsx` rewrite + `VerifiedDot` cleanup + AnimatedSvgChart header note.
6. Build/lint/drift verification.
7. QA: axe + probes + screenshots.
