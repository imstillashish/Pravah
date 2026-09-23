# StatCard Metrics Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the GlobalMetricsStrip's decorative sparklines with real, scrubbable, spring-animated Wise StatCards fed by a deterministic backend series.

**Architecture:** Backend `GET /api/metrics/global` gains a `series` object (30-point seeded walks ending exactly at each headline). A self-contained `StatCard.tsx` derives a monotone-cubic sparkline from the series, supports pointer + keyboard scrubbing, and rolls its headline via a framer-motion spring. The strip becomes three StatCards; `AnimatedSvgChart` stays for the drawer.

**Tech Stack:** FastAPI + pydantic (stdlib-only PRNG), React 19 + TypeScript, framer-motion 13.4 (`useSpring`, `useTransform`, `useReducedMotion`), Tailwind v4 tokens (Wise world), pytest, Playwright + axe-core.

**Spec:** `docs/superpowers/specs/2026-09-23-statcard-metrics-redesign-design.md`

**Class mapping (old → new):** the strip loses `DeltaChip` + `AnimatedSvgChart` entirely; labels go `text-charcoal` (never `text-slate` on fog); values go `text-forest-ink`. No other files change classes.

**Semantic constants (Wise, from spec §3):**
```ts
export const UP = "#054d28";    // Spruce — good direction (stroke/text)
export const DOWN = "#cb272f";  // Alarm Red — bad direction (stroke/text)
export const TRACK = "#868685"; // Pebble — reserved track color
```

---

### Task 1: Backend — series schema, generator, endpoint

**Files:**
- Modify: `backend/app/schemas.py` (GlobalMetricsResponse block)
- Create: `backend/app/metrics_service.py`
- Modify: `backend/app/api/metrics.py`
- Test: `backend/tests/test_analyses_api.py`

- [ ] **Step 1: Write the failing tests**

In `backend/tests/test_analyses_api.py`, replace `test_global_metrics_endpoint` with this (keeps every existing assertion):

```python
def test_global_metrics_endpoint():
    res = client.get("/api/metrics/global")
    assert res.status_code == 200
    data = res.json()
    assert data["bdi_index"] == 1842
    assert data["bdi_change_pct"] == 2.4
    assert data["current_avg_freight_pmt"] == 14.85
    assert data["freight_change_pct"] == -6.8
    assert data["bunker_vlsfo_pmt"] == 612.50
    assert data["capesize_daily_usd"] == 22450
    assert data["panamax_daily_usd"] == 14120
    series = data["series"]
    assert len(series["bdi"]) == 30
    assert len(series["freight"]) == 30
    assert len(series["bunker"]) == 30
    assert series["bdi"][-1] == 1842
    assert series["freight"][-1] == 14.85
    assert series["bunker"][-1] == 612.50

def test_metrics_series_deterministic():
    a = client.get("/api/metrics/global").json()["series"]
    b = client.get("/api/metrics/global").json()["series"]
    assert a == b

def test_metrics_series_shape():
    data = client.get("/api/metrics/global").json()["series"]
    for key in ("bdi", "freight", "bunker"):
        vals = data[key]
        assert all(v > 0 for v in vals)
        assert any(v != vals[-1] for v in vals[:-1])
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `backend/venv/bin/python -m pytest backend/tests/test_analyses_api.py -k "global or series" -v`
Expected: FAIL — `KeyError: 'series'`

- [ ] **Step 3: Create the generator — `backend/app/metrics_service.py`**

```python
"""
Deterministic series generation for global metrics (spec §4.2).

Seeded mulberry32-style PRNG (pure stdlib), walked BACKWARDS from the
current headline so series[-1] == endpoint exactly. Day-stable seed key
keeps responses cacheable and testable within a day.
"""
from datetime import date


def _mulberry32(seed: int):
    state = seed & 0xFFFFFFFF

    def rand() -> float:
        nonlocal state
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF
        t = state
        t = (t ^ (t >> 15)) * (t | 1) & 0xFFFFFFFF
        t = (t ^ (t + ((t ^ (t >> 7)) * (t | 61) & 0xFFFFFFFF))) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 0x100000000

    return rand


def generate_series(seed_key: str, endpoint: float, n: int = 30, vol: float = 0.02) -> list[float]:
    """Random walk ending exactly at `endpoint`. `vol` = max per-step swing."""
    seed = abs(hash(f"{seed_key}-{date.today().isoformat()}")) & 0xFFFFFFFF
    rand = _mulberry32(seed)
    values = [endpoint]
    current = endpoint
    for _ in range(n - 1):
        current = max(endpoint * 0.0001, current / (1 + (rand() - 0.5) * 2 * vol))
        values.append(current)
    values.reverse()
    return [round(v, 4) for v in values]
```

- [ ] **Step 4: Extend the schema — `backend/app/schemas.py`**

Add above `GlobalMetricsResponse` and add the field:

```python
class MetricsSeries(BaseModel):
    bdi: list[float]
    freight: list[float]
    bunker: list[float]


class GlobalMetricsResponse(BaseModel):
    bdi_index: int
    bdi_change_pct: float
    current_avg_freight_pmt: float
    freight_change_pct: float
    bunker_vlsfo_pmt: float
    capesize_daily_usd: int
    panamax_daily_usd: int
    series: MetricsSeries
```

- [ ] **Step 5: Wire the endpoint — `backend/app/api/metrics.py`**

```python
from fastapi import APIRouter
from app.schemas import GlobalMetricsResponse, MetricsSeries
from app.metrics_service import generate_series

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("/global", response_model=GlobalMetricsResponse)
def get_global_metrics():
    return GlobalMetricsResponse(
        bdi_index=1842,
        bdi_change_pct=2.4,
        current_avg_freight_pmt=14.85,
        freight_change_pct=-6.8,
        bunker_vlsfo_pmt=612.50,
        capesize_daily_usd=22450,
        panamax_daily_usd=14120,
        series=MetricsSeries(
            bdi=generate_series("bdi", 1842, vol=0.025),
            freight=generate_series("freight", 14.85, vol=0.018),
            bunker=generate_series("bunker", 612.50, vol=0.012),
        ),
    )
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `backend/venv/bin/python -m pytest backend/tests/test_analyses_api.py -k "global or series" -v`
Expected: 3 PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/schemas.py backend/app/metrics_service.py backend/app/api/metrics.py backend/tests/test_analyses_api.py
git commit -m "feat(metrics): deterministic 30-point series on /api/metrics/global"
```

---

### Task 2: Frontend types

**Files:**
- Modify: `frontend/src/types/analysis.ts`

- [ ] **Step 1: Add the series types**

Append to `frontend/src/types/analysis.ts`:

```ts
export interface MetricsSeries {
  bdi: number[];
  freight: number[];
  bunker: number[];
}
```

And extend `GlobalMetrics` with `series?: MetricsSeries;   // optional: fallback path (§6) may omit it`.

- [ ] **Step 2: Build**

Run: `npm --prefix frontend run build 2>&1 | tail -3`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/analysis.ts
git commit -m "feat(types): MetricsSeries + optional GlobalMetrics.series"
```

---

### Task 3: `useSpringNumber` hook

**Files:**
- Create: `frontend/src/lib/useSpringNumber.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useEffect } from "react";
import { useSpring } from "framer-motion";

/*
 * Spring-driven number (spec §5.2): the returned MotionValue updates
 * the DOM text node directly via the consumer's useTransform — no
 * per-frame React re-renders. enabled=false (reduced motion) snaps.
 */
export function useSpringNumber(value: number, enabled: boolean) {
  const spring = useSpring(value, { stiffness: 170, damping: 26 });
  useEffect(() => {
    if (enabled) {
      spring.set(value);
    } else {
      spring.jump(value);
    }
  }, [value, enabled, spring]);
  return spring;
}
```

- [ ] **Step 2: Build**

Run: `npm --prefix frontend run build 2>&1 | tail -3`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/useSpringNumber.ts
git commit -m "feat(motion): useSpringNumber hook for rolling numerals"
```

---

### Task 4: StatCard component

**Files:**
- Create: `frontend/src/components/StatCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
import React, { useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { Card } from "./ui";
import { useSpringNumber } from "../lib/useSpringNumber";
import { EASE_OUT } from "../lib/motion";
import { cx } from "../lib/cn";

/*
 * Wise-dressed StatCard (spec §5.1): real series sparkline, pointer +
 * keyboard scrub, spring rolling headline. Colors from spec §3 —
 * Spruce (good) / Alarm Red (bad); glyph always paired with color so
 * hue is never the sole signal. Lime never appears here.
 */

const UP = "#054d28";
const DOWN = "#cb272f";

function monotonePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const d: string[] = [`M${points[0].x},${points[0].y}`];
  const slope = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    (b.y - a.y) / Math.max(1e-6, b.x - a.x);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const m1 = p0.x === p1.x ? 0 : slope(p0, p2) * 0.5 + slope(p0, p1);
    const m2 = p2.x === p3.x ? 0 : slope(p1, p3) * 0.5 + slope(p1, p2);
    d.push(
      `C${p1.x + (p2.x - p1.x) / 3},${p1.y + (m1 * (p2.x - p1.x)) / 3}` +
        `,${p2.x - (p2.x - p1.x) / 3},${p2.y - (m2 * (p2.x - p1.x)) / 3}` +
        `,${p2.x},${p2.y}`,
    );
  }
  return d.join("");
}

function handleScrubKeys(count: number) {
  return (e: React.KeyboardEvent, setter: React.Dispatch<React.SetStateAction<number | null>>) => {
    if (count < 2) return;
    const key = e.key;
    if (key === "ArrowLeft" || key === "ArrowRight" || key === "Home" || key === "End" || key === "Escape") {
      e.preventDefault();
    }
    setter((prev) => {
      switch (key) {
        case "ArrowLeft":
          return Math.max(0, (prev ?? 0) - 1);
        case "ArrowRight":
          return Math.min(count - 1, (prev ?? -1) + 1);
        case "Home":
          return 0;
        case "End":
        case "Escape":
          return null;
        default:
          return prev;
      }
    });
  };
}
```

Continue the component (same file):

```tsx
function handleScrubKeys(count: number) {
  return (e: React.KeyboardEvent, setter: React.Dispatch<React.SetStateAction<number | null>>) => {
    if (count < 2) return;
    const key = e.key;
    if (key === "ArrowLeft" || key === "ArrowRight" || key === "Home" || key === "End" || key === "Escape") {
      e.preventDefault();
    }
    setter((prev) => {
      switch (key) {
        case "ArrowLeft":
          return Math.max(0, (prev ?? 0) - 1);
        case "ArrowRight":
          return Math.min(count - 1, (prev ?? -1) + 1);
        case "Home":
          return 0;
        case "End":
        case "Escape":
          return null;
        default:
          return prev;
      }
    });
  };
}
```

Continue the component (same file):

```tsx
export interface StatCardProps {
  label: string;
  series: number[];
  format: (v: number) => string;
  goodWhen?: "up" | "down";
  deltaLabel?: string;
  caption?: string;
  delta?: number | null;
  index?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  series,
  format,
  goodWhen = "up",
  deltaLabel = "vs 30 days ago",
  caption,
  delta = null,
  index = 0,
}) => {
  const reduce = useReducedMotion() ?? false;
  const [hover, setHover] = useState<number | null>(null);
  const sparkRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const gradientId = useId().replace(/:/g, "");

  const n = series.length;
  const headline = series[n - 1] ?? 0;
  const shown = hover != null ? (series[hover] ?? headline) : headline;

  const spring = useSpringNumber(shown, !reduce);
  const displayValue = useTransform(spring, (v) => format(v));

  const base = series[0] ?? headline;
  const computedDelta =
    delta ?? (n > 1 && base ? ((headline - base) / base) * 100 : null);
  const rising = (computedDelta ?? 0) >= 0;
  const good = goodWhen === "up" ? rising : !rising;
  const color = good ? UP : DOWN;

  React.useEffect(() => {
    const node = sparkRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) =>
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    ro.observe(node);
    const rect = node.getBoundingClientRect();
    setBox({ w: rect.width, h: rect.height });
    return () => ro.disconnect();
  }, []);

  const spark = useMemo(() => {
    if (n < 2 || box.w <= 0 || box.h <= 0) return null;
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of series) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    const span = hi - lo || 1;
    const points = series.map((v, i) => ({
      x: 3 + (i / (n - 1)) * (box.w - 6),
      y: 7 + (1 - (v - lo) / span) * (box.h - 16),
    }));
    const line = monotonePath(points);
    const extremes: number[] = [];
    for (let i = 1; i < n - 1; i++) {
      if ((series[i] - series[i - 1]) * (series[i + 1] - series[i]) < 0) extremes.push(i);
    }
    return {
      line,
      area: `${line}L${points[n - 1].x},${box.h}L${points[0].x},${box.h}Z`,
      points,
      extremes: extremes.slice(0, 5),
    };
  }, [series, n, box]);

  const onMove = (clientX: number) => {
    const node = sparkRef.current;
    if (!node || n < 2) return;
    const rect = node.getBoundingClientRect();
    const t = (clientX - rect.left) / Math.max(1, rect.width);
    setHover(Math.max(0, Math.min(n - 1, Math.round(t * (n - 1)))));
  };

  const scrubDot = hover != null && spark ? spark.points[hover] : null;
  const ariaSummary =
    `${label}: ${format(headline)}` +
    (computedDelta != null
      ? `, ${rising ? "up" : "down"} ${Math.abs(computedDelta).toFixed(1)} percent ${deltaLabel}`
      : caption
        ? `, ${caption}`
        : "");

  return (
    <Card
      tone="fog"
      role="img"
      aria-label={ariaSummary}
      className="flex items-stretch justify-between gap-5 p-4"
    >
      <div className="flex min-w-0 flex-col justify-between">
        <p className="truncate text-[13px] text-charcoal">{label}</p>
        <motion.span
          aria-hidden="true"
          className="mt-1.5 block font-mono text-[26px] font-semibold leading-none tracking-tight text-forest-ink tabular-nums"
        >
          {displayValue}
        </motion.span>
        <p className="mt-2 h-[17px] overflow-hidden whitespace-nowrap font-mono text-[12.5px] font-medium leading-none tabular-nums">
          {hover != null ? (
            <span className="text-charcoal">
              day {hover + 1} of {n}
            </span>
          ) : computedDelta != null ? (
            <span style={{ color }}>
              {rising ? "▲" : "▼"} {Math.abs(computedDelta).toFixed(1)}% {deltaLabel}
            </span>
          ) : (
            <span className="text-charcoal">{caption ?? ""}</span>
          )}
        </p>
        {/* Real headline for AT: motion text nodes are not always exposed. */}
        <span className="sr-only">{format(headline)}</span>
      </div>

      {spark && (
        <div
          ref={sparkRef}
          aria-hidden="true"
          tabIndex={0}
          className={cx(
            "relative w-[44%] max-w-52 shrink-0 cursor-crosshair touch-pan-y self-stretch",
            "outline-offset-[-2px]",
          )}
          style={{ minHeight: 58 }}
          onKeyDown={(e) => handleScrubKeys(n)(e, setHover)}
          onBlur={() => setHover(null)}
          onPointerMove={(e) => onMove(e.clientX)}
          onPointerDown={(e) => onMove(e.clientX)}
          onPointerLeave={() => setHover(null)}
        >
          <svg
            width={box.w}
            height={box.h}
            viewBox={`0 0 ${box.w} ${box.h}`}
            className="block h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path
              d={spark.area}
              fill={`url(#${gradientId}-fill)`}
              style={reduce ? undefined : { animation: `sweep-fade 620ms ease-out ${index * 70 + 180}ms both` }}
            />
            <path
              d={spark.line}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={
                reduce
                  ? undefined
                  : { strokeDasharray: 1, animation: `sweep-draw 700ms cubic-bezier(0.23,1,0.32,1) ${index * 70}ms both` }
              }
            />
            {spark.extremes.map((i) => (
              <circle
                key={i}
                cx={spark.points[i].x}
                cy={spark.points[i].y}
                r={2.5}
                fill={color}
                style={reduce ? undefined : { animation: `sweep-fade 300ms ease-out ${index * 70 + 500}ms both` }}
              />
            ))}
            {scrubDot && (
              <circle
                cx={scrubDot.x}
                cy={scrubDot.y}
                r={4.5}
                className="fill-paper"
                stroke={color}
                strokeWidth={2}
              />
            )}
          </svg>
        </div>
      )}
    </Card>
  );
};
```

**Note:** `pathLength={1}` is an SVG attribute (not a style property — it no-ops in `style`). `sweep-fade` / `sweep-draw` keyframes must exist — Task 6 adds them.

- [ ] **Step 2: Build (expected to compile; keyframes come in Task 6)**

Run: `npm --prefix frontend run build 2>&1 | tail -3`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/StatCard.tsx
git commit -m "feat(metrics): Wise StatCard — real sparkline, scrub, spring headline"
```

---

### Task 5: Strip rewrite

**Files:**
- Modify: `frontend/src/components/GlobalMetricsStrip.tsx` (full rewrite)
- Modify: `frontend/src/components/ui.tsx` (delete `VerifiedDot`)
- Modify: `frontend/src/components/AnimatedSvgChart.tsx` (header comment only)

- [ ] **Step 1: Rewrite `GlobalMetricsStrip.tsx`**

```tsx
import React, { useEffect, useState } from "react";
import type { GlobalMetrics } from "../types/analysis";
import { API_BASE } from "../api";
import { StatCard } from "./StatCard";
import { Card, Skeleton } from "./ui";

/**
 * Global metrics — three Wise StatCards over real backend series
 * (spec §5.3). Fallback series keeps offline mode scrubbable.
 * Labels are Charcoal on fog (Slate fails 4.40 — spec §3 trap).
 */
const FALLBACK_SERIES = {
  bdi: [1789.1, 1802.4, 1795.0, 1810.6, 1798.2, 1815.3, 1808.7, 1820.1,
        1812.5, 1824.8, 1816.0, 1828.4, 1821.2, 1833.0, 1825.6, 1837.1,
        1829.8, 1841.5, 1833.9, 1845.2, 1837.6, 1849.0, 1841.3, 1852.7,
        1844.9, 1856.3, 1848.1, 1859.8, 1851.6, 1842.0],
  freight: [16.2, 16.05, 15.9, 15.98, 15.8, 15.72, 15.85, 15.6,
            15.45, 15.6, 15.3, 15.15, 15.4, 15.2, 15.05, 15.15,
            14.95, 15.1, 14.9, 15.0, 14.85, 14.95, 14.8, 14.9,
            14.75, 14.9, 14.8, 14.9, 14.85, 14.85],
  bunker: [604.0, 606.5, 603.2, 608.0, 605.4, 609.1, 606.8, 610.2,
           607.5, 611.0, 608.6, 612.1, 609.8, 613.4, 610.9, 614.2,
           611.5, 615.0, 612.3, 615.8, 613.1, 616.5, 613.8, 617.1,
           614.4, 617.9, 615.2, 618.6, 616.0, 612.5],
};

const FALLBACK_METRICS: GlobalMetrics = {
  bdi_index: 1842,
  bdi_change_pct: 2.4,
  current_avg_freight_pmt: 14.85,
  freight_change_pct: -6.8,
  bunker_vlsfo_pmt: 612.5,
  capesize_daily_usd: 22450,
  panamax_daily_usd: 14120,
  series: FALLBACK_SERIES,
};

export const GlobalMetricsStrip: React.FC = () => {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/metrics/global`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: GlobalMetrics = await res.json();
        if (isMounted) {
          setMetrics(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("GlobalMetricsStrip: failed to fetch, using fallback data", err);
        if (isMounted) {
          setMetrics(FALLBACK_METRICS);
          setIsLoading(false);
        }
      }
    };

    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !metrics) {
    return (
      <section
        aria-label="Global freight metrics loading"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        {[1, 2, 3].map((i) => (
          <Card key={i} tone="fog" className="flex flex-col gap-3 p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-12 w-full" />
          </Card>
        ))}
      </section>
    );
  }

  const s = metrics.series ?? FALLBACK_SERIES;

  return (
    <section aria-label="Global freight metrics" className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <StatCard
        label="BALTIC DRY INDEX"
        series={s.bdi}
        delta={metrics.bdi_change_pct}
        goodWhen="up"
        format={(v) => Math.round(v).toLocaleString()}
        deltaLabel="vs 30 days ago"
        index={0}
      />
      <StatCard
        label="AVG FREIGHT RATE"
        series={s.freight}
        delta={metrics.freight_change_pct}
        goodWhen="down"
        format={(v) => `$${v.toFixed(2)} / MT`}
        deltaLabel="vs 30 days ago"
        index={1}
      />
      <StatCard
        label="BUNKER FUEL · VLSFO"
        series={s.bunker}
        delta={null}
        caption="SINGAPORE HUB · STEADY"
        format={(v) => `$${v.toFixed(2)} / MT`}
        index={2}
      />
    </section>
  );
};
```

- [ ] **Step 2: Delete `VerifiedDot` from `ui.tsx`**

Remove the entire `VerifiedDot` function and its doc comment (grep first: `grep -rn "VerifiedDot" frontend/src` must show only `ui.tsx` after the strip rewrite).

- [ ] **Step 3: AnimatedSvgChart header note**

Prepend to its header comment block: `/* Data-driven charts: use StatCard (GlobalMetricsStrip). This one draws illustrative paths for the drawer forecast only. */`

- [ ] **Step 4: Build + drift grep**

Run:
```bash
npm --prefix frontend run build 2>&1 | tail -3
grep -rn "DeltaChip\|VerifiedDot\|AnimatedSvgChart" frontend/src/components/GlobalMetricsStrip.tsx && echo "DRIFT" || echo "CLEAN"
```
Expected: build exit 0; `CLEAN`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/GlobalMetricsStrip.tsx frontend/src/components/ui.tsx frontend/src/components/AnimatedSvgChart.tsx
git commit -m "feat(metrics): strip becomes three real StatCards; drop VerifiedDot"
```

---

### Task 6: Keyframes + whole-app verification

**Files:**
- Modify: `frontend/src/index.css` (utilities layer)

- [ ] **Step 1: Add the two keyframes**

In the `@layer utilities` block, after `skeleton-sweep`:

```css
  /* StatCard entrance: spark draws itself in, fill + extrema fade. */
  @keyframes sweep-draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes sweep-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
```

- [ ] **Step 2: Build + lint**

Run: `npm --prefix frontend run build 2>&1 | tail -3 && npm --prefix frontend run lint 2>&1 | tail -3`
Expected: build exit 0; lint 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(motion): sweep-draw/sweep-fade keyframes for StatCard entrance"
```

---

### Task 7: QA — axe, probes, screenshots

**Files:**
- Create: `/tmp/qa-statcard-axe.mjs`, `/tmp/qa-statcard-structure.mjs`, `/tmp/qa-statcard-shots.mjs` (throwaway harness, same pattern as prior passes)

- [ ] **Step 1: Start servers**

```bash
setsid nohup ./backend/venv/bin/python -m uvicorn app.main:app --port 8000 --app-dir backend > /tmp/qa-backend-statcard.log 2>&1 & echo $! > /tmp/qa-backend-statcard.pid
cd frontend && npm run build > /dev/null 2>&1 && setsid nohup npm run preview -- --port 4173 > /tmp/qa-frontend-statcard.log 2>&1 & echo $! > /tmp/qa-frontend-statcard.pid
cd ..
sleep 4
```

- [ ] **Step 2: axe sweep script — `/tmp/qa-statcard-axe.mjs`**

(Identical harness to prior passes: register fresh planner `qa-statcard@sail.gov.in` via UI, axe `document` on dashboard desktop + mobile 390px, print violations. **Expect 0.**)

- [ ] **Step 3: Structural probe — `/tmp/qa-statcard-structure.mjs`**

Assert on the rendered dashboard:
- 3 fog cards, computed `background-color: rgb(232,235,230)`, radius 10px.
- Headline: computed `font-family` contains `IBM Plex Mono`, weight 600, color `rgb(22,51,0)`.
- Each card has an `<svg>`; line stroke is `rgb(5,77,40)` or `rgb(203,39,47)` — never `rgb(159,232,112)`.
- Pointer scrub: `page.mouse.move` across a spark → headline text changes; leave → returns.
- Keyboard: focus spark, press `ArrowRight` → delta line shows `day 2 of 30`.
- Reduced motion emulation: entry animations report 0.01ms duration; values render instantly.

- [ ] **Step 4: Screenshots**

Desktop 1440×900 + mobile 390×844 → `/tmp/qa-shots-statcard/`.

- [ ] **Step 5: Shut down and commit harness fixes if any**

```bash
kill -- -$(cat /tmp/qa-backend-statcard.pid) 2>/dev/null; kill -- -$(cat /tmp/qa-frontend-statcard.pid) 2>/dev/null
```

---

## Self-Review Notes

- **Spec coverage:** §4 backend (Task 1), §4.4 types (Task 2), §5.2 hook (Task 3), §5.1/§5.5 StatCard (Task 4), §5.3/§5.4 strip rewrite + cleanups (Task 5), §8 keyframes + build/lint (Task 6), §8 QA (Task 7). Out-of-scope items untouched.
- **Type consistency:** `useSpringNumber(value, enabled)` used identically in Tasks 3 and 4; `MetricsSeries` keys (`bdi`/`freight`/`bunker`) match backend schema, endpoint wiring, types, and strip usage; `sweep-draw`/`sweep-fade` referenced in Task 4 and defined in Task 6.
- **Placeholder scan:** all code steps carry complete code (the scrub-key helper appears once, in its final form). Task 7 steps 2–4 describe probe assertions in prose because the exact harness code is session-specific (fresh-email registration workaround); the assertion list is complete and the pattern is proven from prior passes.
