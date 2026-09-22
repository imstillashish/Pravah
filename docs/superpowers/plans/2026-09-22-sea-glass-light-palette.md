# Sea-Glass Light Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mono-blue "Admiralty Chart" world with the approved Sea-Glass mint-teal light theme (spec: `docs/superpowers/specs/2026-09-22-sea-glass-light-palette-design.md`) across DESIGN.md, tokens, primitives, and all 4 existing screens, with measured-contrast QA.

**Architecture:** Token-first re-tint. `index.css @theme` defines the entire palette; primitives in `ui.tsx` and one chart component consume only tokens; shell and surfaces receive exact string-replacement mappings (old Admiralty token → new Sea-Glass token). No structural/IA changes, fonts unchanged, all a11y hardening (focus trap, focusable scroll regions, reduced motion) preserved. Verification is build + drift-grep per task, plus a computed-style contrast probe and axe-core sweep at the end.

**Tech Stack:** Tailwind CSS v4 (`@theme`), React 19 + TypeScript, framer-motion, Playwright + axe-core (dev-only QA), oxlint.

**Palette quick-reference (from spec §4–6):**

| Old (Admiralty) | New (Sea-Glass) |
|---|---|
| `foam` canvas | `canvas` `#ecf1ee` |
| `abyss` ink / CTA fill | `sea-900` `#08362c` ink; CTA = `mint-500` `#2fbf94` fill + `sea-900` text |
| `deepsea` body | `body` `#243935` (text) / `ink` `#0d1f1c` (emphasis) |
| `slate-ink` muted | `muted` `#56706a` |
| `shallow/45` hairlines | `line` `#d8e2dc` |
| `shoal` elevated | `card` `#ffffff` / `well` `#f7faf8` / `glass-100` `#dcf3ea` |
| `deep` live dot | `sea-600` `#0d7a61` |
| `fathom` hover | `sea-600` |
| positive pill (Slate ink) | `glass-100` bg + `sea-800` `#07453a` text + ▲ |
| negative (Abyss 600) | pending = `amber-100`/`amber-700`; rejected = `coral-100`/`coral-700` |
| chart live/neutral/negative | `forecast` Glass-400 / `actual` Sea-700 / `negative` Coral-500 |

**Contrast invariants (measured, must hold after implementation):**
mint-500/sea-900 5.72 · mint-hover `#2ab08b`/sea-900 4.88 · sea-600/card 5.28 · sea-600/canvas 4.63 · muted/card 5.36 · muted/well 5.10 · amber 6.40 · coral 5.34 · ink/canvas 14.95. The rejected hover candidate `#26a884` (4.46 — fails) must NOT appear anywhere.

---

### Task 1: Rewrite DESIGN.md to the Sea-Glass world

**Files:**
- Modify: `DESIGN.md` (full rewrite)

- [ ] **Step 1: Write DESIGN.md v4**

Replace the entire file with:

````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add DESIGN.md && git commit -m "docs: rewrite DESIGN.md to Sea-Glass mint-teal light world"
```

---

### Task 2: Token foundation (`index.css`)

**Files:**
- Modify: `frontend/src/index.css` (full rewrite)

- [ ] **Step 1: Write the new @theme**

Replace the entire file with:

```css
@import "tailwindcss";

/*
 * Sea-Glass design world — single source of truth: DESIGN.md (v4).
 * Mint-teal accent ramp over sea-glass tinted neutrals. Three semantic
 * hues with strict monopolies (amber=pending, coral=danger). Measured
 * AA contrast; the ONLY allowed box-shadow is .shadow-sheet (overlays).
 */
@theme {
  /* Mint ramp (accent) */
  --color-glass-50: #effaf5;
  --color-glass-100: #dcf3ea;
  --color-glass-200: #bfe9db;
  --color-glass-300: #97ddc6;
  --color-glass-400: #63d1ab;
  --color-mint-500: #2fbf94;
  --color-mint-hover: #2ab08b;
  --color-sea-600: #0d7a61;
  --color-sea-700: #0a5c49;
  --color-sea-800: #07453a;
  --color-sea-900: #08362c;

  /* Sea-glass neutrals */
  --color-canvas: #ecf1ee;
  --color-card: #ffffff;
  --color-well: #f7faf8;
  --color-line: #d8e2dc;
  --color-line-strong: #c2d2c9;
  --color-wash: #e2ebe6;
  --color-ink: #0d1f1c;
  --color-body: #243935;
  --color-muted: #56706a;
  --color-faint: #748c85;

  /* Semantic ramps (text-legal 700s + graphics 500s + tints) */
  --color-amber-100: #fdf2d7;
  --color-amber-300: #ecd9a4;
  --color-amber-500: #d99a26;
  --color-amber-700: #7a4f01;
  --color-coral-100: #fdeae4;
  --color-coral-500: #e85c3a;
  --color-coral-700: #b03616;

  /* Typography — unchanged faces */
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  /* Radius scale — 4px chips / 8px cards / 12px inputs / full pills */
  --radius-*: initial;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}

@layer base {
  ::selection {
    background-color: #dcf3ea;
    color: #08362c;
  }

  *:focus-visible {
    outline: 2px solid #0d7a61;
    outline-offset: 2px;
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  body {
    margin: 0;
    background-color: var(--color-canvas);
    color: var(--color-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer utilities {
  /* The ONLY shadow in the system — overlays/drawer sheets (DESIGN.md §6). */
  .shadow-sheet {
    box-shadow: 0 8px 24px rgba(8, 54, 44, 0.1);
  }
}
```

- [ ] **Step 2: Build (components still reference old tokens — expect failures, this is expected mid-migration)**

Run: `npm --prefix frontend run build 2>&1 | tail -5`
Expected: build FAILS or CSS emits with unknown classes — do not fix yet; Tasks 3–9 migrate all consumers.

- [ ] **Step 3: Commit (tokens land first; consumers follow immediately)**

```bash
git add frontend/src/index.css && git commit -m "feat: Sea-Glass token foundation in @theme"
```

---

### Task 3: Primitives (`ui.tsx`)

**Files:**
- Modify: `frontend/src/components/ui.tsx` (full rewrite)

- [ ] **Step 1: Rewrite primitives**

Replace the entire file with:

```tsx
import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cn";

/*
 * Sea-Glass primitives (DESIGN.md v4). The mint pill + Sea-900 ink is the
 * signature. Semantic tints carry glyphs — hue is never the sole signal.
 */

type ButtonBaseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
};

/** Primary action: full-round Mint-500 pill, Sea-900 ink text. */
export function PrimaryButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-mint-500",
        "px-5 py-2.5 text-sm font-medium text-sea-900 transition-colors duration-150",
        "hover:bg-mint-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea-600",
        "active:bg-mint-500 disabled:cursor-not-allowed disabled:bg-glass-200 disabled:text-faint",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Secondary action: line-strong outline, Sea-800 text; hover washes. */
export function SecondaryButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md border border-line-strong bg-transparent",
        "px-4 py-2.5 text-sm font-medium text-sea-800 transition-colors duration-150",
        "hover:bg-wash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea-600",
        "active:bg-wash disabled:cursor-not-allowed disabled:border-line disabled:text-faint",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Text-style tertiary action (Sea-600, link-legal 5.28:1). */
export function TextButton({ className, children, ...props }: ButtonBaseProps) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-sm font-medium text-sea-600 underline-offset-2",
        "transition-colors duration-150 hover:text-sea-800 hover:underline",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea-600",
        "disabled:cursor-not-allowed disabled:text-faint",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type CardProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };

/** Base surface: white card + hairline line border. No shadow. */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-md border border-line bg-card transition-colors duration-150",
        "hover:border-line-strong",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  children?: ReactNode;
  /**
   * Semantic tone — filled tints with glyphs from the caller (DESIGN.md §4):
   * positive = approved/live, pending = caution, negative = rejected/danger.
   */
  tone?: "default" | "positive" | "pending" | "negative" | "muted";
};

const PILL_TONES = {
  default: "border-line bg-well text-body",
  positive: "border-glass-200 bg-glass-100 font-medium text-sea-800",
  pending: "border-amber-300 bg-amber-100 font-medium text-amber-700",
  negative: "border-coral-500/40 bg-coral-100 font-semibold text-coral-700",
  muted: "border-line bg-well text-muted",
} as const;

/** Status pill: 4px chip, tinted fill, mono 12px label. */
export function Pill({ className, children, tone = "default", ...props }: PillProps) {
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5",
        "font-mono text-xs",
        PILL_TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Live/verified dot — Sea-600 is the informational accent. */
export function VerifiedDot({ className }: { className?: string }) {
  return <span aria-hidden className={cx("inline-block size-1 rounded-sm bg-sea-600", className)} />;
}

/** Section title: 20px Inter 600 Sea-900. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-semibold leading-tight text-sea-900">{title}</h2>
      {action}
    </div>
  );
}

/** Mono eyebrow: 10px uppercase, letter-spaced, Muted ink. */
export function Eyebrow({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx("font-mono text-[10px] uppercase tracking-[0.08em] text-muted", className)} {...props}>
      {children}
    </span>
  );
}

/** Loading skeleton: Glass-100 block with a soft pulse (reduced-motion safe). */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cx("animate-pulse rounded-sm bg-glass-100", className)} {...props} />;
}
```

Note the API change: `Pill` tone `"positive" | "negative"` kept, **`"pending"` added** — consumers updated in Tasks 6–8.

- [ ] **Step 2: Build**

Run: `npm --prefix frontend run build 2>&1 | tail -5`
Expected: FAILS only in shell/surface files (old token classes). `ui.tsx` itself must compile clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui.tsx && git commit -m "feat: Sea-Glass primitives — mint pill CTA, tinted semantic pills"
```

---

### Task 4: Chart variants (`AnimatedSvgChart.tsx`)

**Files:**
- Modify: `frontend/src/components/AnimatedSvgChart.tsx`

- [ ] **Step 1: Rename variants and re-color**

Replacements (old → new):

| Old | New |
|---|---|
| `export type ChartVariant = "neutral" \| "live" \| "negative";` | `export type ChartVariant = "actual" \| "forecast" \| "negative";` |
| `variant = "neutral"` (default param) | `variant = "actual"` |
| neutral block `stroke: "#1565c0", // Slate ink — 5.03:1 on Foam` | actual block `stroke: "#0a5c49", // Sea-700 — 7.95:1 on card` |
| neutral `gradientColor: "#90caf9", gradientOpacity: 0.18` | actual `gradientColor: "#dcf3ea", gradientOpacity: 0.3` |
| comment `/* Neutral — steady series (bunkers, turnaround) */` | `/* Actual — benchmark/steady series */` |
| live block comment `/* Live — market/forecast signal (BDI, forward curve).\n     Fathom, not Deep: Deep is 2.74:1 on Foam, below the 3:1 non-text bar. */` | `/* Forecast — optimistic series (BDI, forward curve). Glass-400 is a graphic-only tone. */` |
| live `stroke: "#1e88e5", // Fathom` | forecast `stroke: "#63d1ab", // Glass-400` |
| live `gradientColor: "#64b5f6", // Channel wash` | forecast `gradientColor: "#dcf3ea", // Glass-100 wash` |
| negative `stroke: "#0d47a1", // Abyss` | negative `stroke: "#e85c3a", // Coral-500 — graphics only` |
| negative `gradientColor: "#0d47a1", // Abyss wash` | negative `gradientColor: "#fdeae4", // Coral-100 wash` |
| `<g stroke="#90caf9" strokeWidth="1" strokeDasharray="2 6" opacity="0.8">` | `<g stroke="#d8e2dc" strokeWidth="1" strokeDasharray="2 6" opacity="0.9">` |
| header comment block (Admiralty wording) | `Sparkline variants for the Sea-Glass world (DESIGN.md §5): forecast Glass-400, actual Sea-700, negative Coral-500 — differentiated by lightness + weight, never hue alone.` |
| `VARIANT_CONFIGS[variant] \|\| VARIANT_CONFIGS.neutral` | `VARIANT_CONFIGS[variant] \|\| VARIANT_CONFIGS.actual` |

- [ ] **Step 2: Build**

Run: `npm --prefix frontend run build 2>&1 | tail -5`
Expected: same remaining-consumer failures as Task 3 (MetricsStrip still says `"live"` — fixed in Task 6). No NEW errors from this file.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AnimatedSvgChart.tsx && git commit -m "feat: Sea-Glass chart variants (forecast/actual/negative)"
```

---

### Task 5: Shell (App, IconRail, TopBar, RightRail)

**Files:**
- Modify: `frontend/src/App.tsx`, `frontend/src/components/IconRail.tsx`, `frontend/src/components/TopBar.tsx`, `frontend/src/components/RightRail.tsx`

- [ ] **Step 1: App.tsx replacements**

| Old | New |
|---|---|
| `bg-foam` (3 occurrences) | `bg-canvas` |
| `border-2 border-shallow border-t-abyss` | `border-2 border-line-strong border-t-mint-500` |
| `text-slate-ink` | `text-muted` |

- [ ] **Step 2: IconRail.tsx replacements**

| Old | New |
|---|---|
| aside: `border-r border-shallow/15 bg-foam` | `border-r border-line bg-card` |
| brand: `bg-abyss text-foam` | `rounded-md bg-mint-500 text-sea-900` (keep size-8 flex center) |
| active: `bg-shoal text-abyss before:...before:bg-abyss` | `bg-glass-100 text-sea-900 before:...before:bg-sea-600` |
| idle: `text-slate-ink hover:bg-shoal/60 hover:text-fathom` | `text-muted hover:bg-wash hover:text-sea-700` |
| divider: `bg-shallow/45` | `bg-line-strong` |
| avatar: `bg-shoal ... text-abyss` | `bg-glass-100 ... text-sea-900` |
| remaining `text-slate-ink` (bottom cluster) | `text-muted` |

- [ ] **Step 3: TopBar.tsx replacements**

| Old | New |
|---|---|
| header: `border-b border-shallow/45 bg-foam/95` | `border-b border-line bg-card/95` |
| brand mark: `bg-abyss text-foam` | `bg-mint-500 text-sea-900` |
| brand text: `text-abyss` | `text-sea-900` |
| search well: `border border-shallow/45 bg-shoal/60` | `border border-line bg-well` |
| `focus-within:border-fathom` | `focus-within:border-sea-600` |
| search input: `text-abyss placeholder:text-slate-ink` | `text-ink placeholder:text-faint` |
| kbd: `border border-shallow/45 ... text-slate-ink` | `border border-line ... text-muted` |
| desk pill: `border border-shallow/45 bg-foam` | `border border-line bg-glass-100` |
| live dot: `bg-deep` | `bg-sea-600` |
| desk code: `text-abyss` | `text-sea-800` |
| switch button: `border border-shallow/45 ... text-slate-ink ... hover:border-fathom hover:text-fathom` | `border border-line ... text-muted ... hover:border-sea-600 hover:text-sea-600` |
| mobile chip: `border border-shallow/45 bg-foam ... text-abyss ... hover:border-fathom` | `border border-line bg-card ... text-sea-900 ... hover:border-sea-600` |
| icons `text-deep` | `text-sea-600` |
| chevron `text-slate-ink` | `text-muted` |

- [ ] **Step 4: RightRail.tsx replacements**

| Old | New |
|---|---|
| aside: `border-l border-shallow/15 bg-foam` | `border-l border-line bg-card` |
| feed header: `text-slate-ink` (2×) | `text-muted` |
| live ping: `bg-deep` (2×) | `bg-sea-600` |
| divider: `divide-shallow/45` | `divide-line` |
| hazard row: `border border-dotted border-slate-ink/60 ... border-abyss/50 ... text-abyss (4×)` | `border border-dashed border-amber-300 bg-amber-100 ... border-amber-500/60 ... text-amber-700` (hazard = caution monopoly; switch dotted→dashed to match sample/caution language) |
| hazard icon span: `font-mono text-xs font-semibold text-abyss` | `font-mono text-xs font-semibold text-amber-700` |
| hazard value `text-abyss` | `text-amber-700` |
| PLANNER_ROWS iconClass: `text-deep` → `text-sea-600`; `text-slate-ink` → `text-muted` |
| OPERATOR_ROWS: same mapping; keep `hazard: true` row |
| row label `text-abyss` | `text-sea-900` |
| row sub `text-slate-ink` | `text-muted` |
| row value `text-abyss` | `text-sea-900` |
| hover: `hover:bg-shoal` | `hover:bg-wash` |
| delta up: `font-medium text-slate-ink` | `font-medium text-sea-800` |
| delta down: `font-semibold text-abyss` | `font-semibold text-coral-700` |
| footnote `text-slate-ink` | `text-muted` |

- [ ] **Step 5: Build + drift grep**

Run: `npm --prefix frontend run build 2>&1 | tail -5` → remaining failures must ONLY be in AuthPage/Dashboard/MetricsStrip/Table/Drawer.
Run: `grep -rnE "foam|shoal|shallow|abyss|deepsea|slate-ink|fathom|channel|bg-deep|text-deep" frontend/src/components/IconRail.tsx frontend/src/components/TopBar.tsx frontend/src/components/RightRail.tsx frontend/src/App.tsx` → Expected: empty.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/IconRail.tsx frontend/src/components/TopBar.tsx frontend/src/components/RightRail.tsx && git commit -m "feat: Sea-Glass shell — white rails, glass desk pill, semantic feed rows"
```

---

### Task 6: AuthPage

**Files:**
- Modify: `frontend/src/pages/AuthPage.tsx`

- [ ] **Step 1: Replacements**

| Old | New |
|---|---|
| band: `border-b border-shallow/45 bg-foam` | `border-b border-line bg-card` |
| brand mark: `bg-abyss text-foam` | `bg-mint-500 text-sea-900` |
| brand text: `text-abyss` | `text-sea-900` |
| `text-slate-ink` (all: SAIL caption, SECURE TERMINAL, input icons, desk codes) | `text-muted` |
| hero icon tile: `border border-shallow/45 bg-foam` + `text-deep` | `border border-line bg-card` + `text-sea-600` |
| h1: `text-[32px] font-normal leading-tight text-abyss` | `text-[32px] font-semibold leading-tight text-sea-900` (spec §8: page titles Inter 600) |
| hero sub: `text-deepsea` | `text-body` |
| INPUT_CLASS: `border border-shallow/45 bg-foam ... text-abyss placeholder:text-slate-ink ... hover:border-shallow focus:border-fathom` | `border border-line bg-well ... text-ink placeholder:text-faint ... hover:border-line-strong focus:border-sea-600` |
| error box: `border border-dotted border-slate-ink/60` + `border border-abyss/50 ... text-abyss` + trailing `text-slate-ink` icon | `border border-coral-500/40 bg-coral-100` + `border border-coral-500/50 ... text-coral-700` + `text-coral-700` (danger recipe) |
| error text: `text-sm font-semibold text-abyss` | `text-sm font-semibold text-coral-700` |
| LABEL_CLASS: `text-deepsea` | `text-muted` |
| desk selected: `border-abyss bg-shoal` | `border-sea-600 bg-glass-50` |
| desk idle: `border-shallow/45 bg-foam hover:border-fathom` | `border-line bg-card hover:border-sea-600` |
| desk radio selected: `bg-abyss` | `bg-sea-600` |
| desk idle radio: `border border-shallow/45` | `border border-line-strong` |
| desk title `text-abyss` / sub `text-deepsea` | `text-sea-900` / `text-body` |
| switch link: `text-slate-ink underline ... hover:text-abyss` | `text-sea-600 underline ... hover:text-sea-800` |

- [ ] **Step 2: Build + drift grep**

Run: `npm --prefix frontend run build 2>&1 | tail -3`
Run: `grep -nE "foam|shoal|abyss|deepsea|slate-ink|shallow|fathom" frontend/src/pages/AuthPage.tsx` → empty.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AuthPage.tsx && git commit -m "feat: Sea-Glass auth — white card, well inputs, coral danger recipe"
```

---

### Task 7: Dashboard + GlobalMetricsStrip

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`, `frontend/src/components/GlobalMetricsStrip.tsx`

- [ ] **Step 1: Dashboard.tsx replacements**

| Old | New |
|---|---|
| eyebrow row: `text-slate-ink` | `text-muted` |
| h1: `text-[32px] font-normal leading-tight text-abyss` | `text-[32px] font-semibold leading-tight text-sea-900` (spec §8: page titles Inter 600) |
| intro: `text-deepsea` | `text-body` |
| error banner: `border border-dotted border-slate-ink/60` + `border border-abyss/50 ... text-abyss` + `font-semibold text-abyss` + retry `border border-shallow/45 ... text-abyss ... hover:bg-shoal` | `border border-coral-500/40 bg-coral-100` + `border border-coral-500/50 ... text-coral-700` + `font-semibold text-coral-700` + retry `border border-coral-500/50 ... text-coral-700 ... hover:bg-coral-100/70` |
| tile eyebrow `text-slate-ink` (all 6) | `text-muted` |
| tile value `text-abyss` (all 6) | `text-sea-900` |
| tile body `text-deepsea` (all 6) | `text-body` |
| icons `text-deep` (all live/info) | `text-sea-600` |
| DRAFT ADVISORY icon `text-fathom` | `text-amber-500` (caution) |

- [ ] **Step 2: GlobalMetricsStrip.tsx replacements**

| Old | New |
|---|---|
| DeltaChip: `tone={positive ? "positive" : "negative"}` | keep, but negative freight drop means SAVINGS — wrap: positive Δ = `tone="positive"`, negative Δ = `tone="pending"` (a falling rate is a closing-window caution, not a rejection) |
| DeltaChip glyphs: `▲`/`▼` | keep; add `⏳` prefix inside pending branch via `{positive ? "▲" : "⏳"}` |
| skeletons: `bg-shoal`/`bg-graphite`→ none present (Skeleton now used) — verify loading branch uses `<Skeleton>` | already does |
| eyebrows `text-slate-ink` (3×) | `text-muted` |
| values `text-abyss` (3×) | `text-sea-900` |
| value suffixes `text-slate-ink` (2×) | `text-muted` |
| body notes `text-deepsea` (3×) | `text-body` |
| chart calls: `variant="live"` (1×) | `variant="forecast"` |
| chart call: `variant={isFreightSavings ? "live" : "negative"}` | `variant={isFreightSavings ? "forecast" : "negative"}` |
| SIN pill `tone="muted"` | keep |
| footer row: `text-slate-ink` (2×) | `text-muted` |

- [ ] **Step 3: Build + drift grep on both files** (pattern as Task 5 Step 5) → empty.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/components/GlobalMetricsStrip.tsx && git commit -m "feat: Sea-Glass dashboard + metrics — coral hazards, amber caution deltas"
```

---

### Task 8: RecentAnalysesTable

**Files:**
- Modify: `frontend/src/components/RecentAnalysesTable.tsx`

- [ ] **Step 1: Replacements**

| Old | New |
|---|---|
| scroll region focus ring: `focus-visible:outline-abyss` | `focus-visible:outline-sea-600` (keep role/label/tabIndex) |
| band: `border-b border-shallow/45 bg-shoal/60` | `border-b border-line bg-well` |
| band eyebrow: `text-deepsea` (the 4.45 fix) | `text-muted` (5.10:1 on well) |
| section sub: `text-deepsea` | `text-body` |
| thead: `border-b border-shallow/45 ... text-slate-ink` | `border-b border-line-strong ... text-muted` |
| tbody: `divide-y divide-shallow/15` | `divide-y divide-line` |
| skeletons: already `<Skeleton>` — keep |
| empty box: `border border-dashed border-slate-ink/60` + `text-channel` icon + `text-abyss` + `text-slate-ink` | `border border-dashed border-line-strong` + `text-faint` icon + `text-sea-900` + `text-muted` |
| row hover: `hover:bg-shoal/60` | `hover:bg-glass-50` |
| route cell `text-abyss` / arrow `text-slate-ink` / country eyebrow `text-slate-ink` | `text-sea-900` / `text-faint` / `text-muted` |
| tonnage `text-abyss` + MT `text-slate-ink` / commodity `text-deepsea` | `text-sea-900` + `text-muted` / `text-body` |
| rates `text-abyss` + suffix `text-slate-ink` / spot line `text-slate-ink` | `text-sea-900` + `text-muted` / `text-muted` |
| savings: `font-medium tabular-nums text-slate-ink` + ▲ | `font-medium tabular-nums text-sea-800` + ▲ (positive recipe text) |
| time: `text-slate-ink` | `text-muted` |
| status pills: `renderStatusBadge` — finalized stays `tone="positive"`; draft stays `tone="muted"`; **overridden: `tone="negative"` keep** (overridden decision = danger) |

- [ ] **Step 2: Build + drift grep** → empty.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/RecentAnalysesTable.tsx && git commit -m "feat: Sea-Glass table — glass hover rows, Sea-800 savings"
```

---

### Task 9: NewAnalysisDrawer

**Files:**
- Modify: `frontend/src/components/NewAnalysisDrawer.tsx`

- [ ] **Step 1: Replacements**

| Old | New |
|---|---|
| backdrop: `bg-deepsea/30` | `bg-sea-900/40` |
| chart call: `variant="live"` | `variant="forecast"` (Task 4 renamed the union — build fails without this) |
| sheet: `border-l border-shallow/45 bg-foam` | `border-l border-line bg-card shadow-sheet` |
| header border `border-shallow/45` | `border-line` |
| header eyebrow `text-slate-ink` | `text-muted` |
| h2 `text-abyss` / sub `text-deepsea` | `text-sea-900` / `text-body` |
| close btn: `text-slate-ink ... hover:bg-shoal hover:text-abyss` | `text-muted ... hover:bg-wash hover:text-sea-900` |
| content bg: `bg-shoal/40` | `bg-canvas` |
| submit error: `border border-dotted border-slate-ink/60` + `!` span `border-abyss/50 ... text-abyss` + message `text-abyss` | `border border-coral-500/40 bg-coral-100` + `border-coral-500/50 ... text-coral-700` + `text-coral-700` |
| INPUT_CLASS: `border border-shallow/45 bg-foam ... text-abyss ... hover:border-shallow focus:border-fathom` | `border border-line bg-well ... text-ink ... hover:border-line-strong focus:border-sea-600` + `rounded-lg` (12px inputs per spec) |
| labels `text-slate-ink` (FIELD/GROUP_LABEL_CLASS + inline) | `text-muted` |
| tonnage readout: `text-abyss` | `text-sea-900` |
| chips selected: `border-abyss bg-foam shadow-[inset_0_0_0_1px_#0d47a1]` | `border-sea-600 bg-glass-50` (drop inset shadow — spec bans extra shadows) |
| chips idle: `border-shallow/45 bg-foam hover:border-fathom` | `border-line bg-card hover:border-sea-600` |
| chip label `text-abyss` / idle sub `text-slate-ink` / selected sub `text-abyss` | `text-sea-900` / `text-muted` / `text-sea-800` |
| rec panel: `border border-shallow/45 bg-foam` | `border border-line bg-card` |
| Ship icon `text-deep` | `text-sea-600` |
| rec pill: `border border-shallow/45 bg-foam ... text-abyss` | `border border-glass-300 bg-glass-100 ... text-sea-800` (brand chip) |
| rec copy `text-deepsea` / mono `text-abyss` / strong `text-abyss` | `text-body` / `text-sea-900` / `text-sea-900` |
| divider `border-shallow/45` | `border-line` |
| Haldia advisory: `border border-dotted border-slate-ink/60 bg-foam` + `!` span `border-abyss/50 ... text-abyss` + title `text-abyss` + copy `text-deepsea` | `border border-coral-500/40 bg-coral-100` + `border-coral-500/50 ... text-coral-700` + `text-coral-700` + `text-body` (danger monopoly — Haldia over-draft is a hazard) |
| footer: `border-t border-shallow/45 bg-foam` | `border-t border-line bg-card` |

- [ ] **Step 2: Build + drift grep (whole src)**

Run: `npm --prefix frontend run build 2>&1 | tail -3` → Expected: SUCCESS (all consumers migrated).
Run: `grep -rnE "foam|shoal|shallow|abyss|deepsea|slate-ink|fathom|channel|bg-deep|text-deep|vermilion|graphite|obsidian|charcoal|void|paper|fog|iron|variant=\"live\"|26a884" frontend/src --include="*.tsx" --include="*.ts"` → Expected: empty.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/NewAnalysisDrawer.tsx && git commit -m "feat: Sea-Glass drawer — sheet shadow, well inputs, coral hazard advisory"
```

---

### Task 10: QA — contrast probe, axe sweep, screenshots

**Files:**
- Create (temp, not committed): `/tmp/qa-seaglass-structure.mjs`, `/tmp/qa-seaglass-axe.mjs`

- [ ] **Step 1: Start servers**

```bash
setsid nohup ./backend/venv/bin/python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 > /tmp/sg-backend.log 2>&1 & echo $! > /tmp/sg-backend.pid
setsid nohup npm --prefix frontend run preview -- --port 4173 --strictPort > /tmp/sg-preview.log 2>&1 & echo $! > /tmp/sg-preview.pid
sleep 4 && curl -s -o /dev/null -w "preview: %{http_code}\n" http://localhost:4173
```
Expected: `preview: 200`

- [ ] **Step 2: Axe sweep (7 flows)**

Write `/tmp/qa-seaglass-axe.mjs` reusing the exact flow structure of `/tmp/audit-axe.mjs` (register fresh users with unique emails, auth/planner/drawer/haldia/operator/auth-mobile/dashboard-mobile, axe wcag2a+2aa+21a+21aa). Run it.
Expected: `TOTAL violation instances: 0`. If color-contrast appears, fix the named element with the nearest spec-legal token (consult spec §4 recipes; never `#26a884`), rebuild, re-run.

- [ ] **Step 3: Structural probe**

`/tmp/qa-seaglass-structure.mjs` checks (computed styles after login):
- body bg `rgb(236, 241, 238)` (canvas)
- h1 color `rgb(8, 54, 44)` (sea-900), Inter, 600, 32px
- CTA: bg `rgb(47, 191, 148)` (mint-500), color `rgb(8, 54, 44)`, radius `9999px`, height ≥ 40
- metric value: IBM Plex Mono, weight 600, `rgb(8, 54, 44)`
- card: 1px border `rgb(216, 226, 220)` (line), `box-shadow: none`
- drawer sheet (when open): `rgb(255,255,255)` + shadow contains `rgba(8, 54, 44, 0.1)`
- focusable scroll region present (`[role=region][tabindex="0"]`)
- reduced-motion drawer appears with no slide offset
- no horizontal overflow at 1440 and 390
Expected: all PASS.

- [ ] **Step 4: Hover-ink invariant grep**

Run: `grep -rn "26a884\|26A884" frontend/src` → Expected: empty (rejected hover candidate must not exist).

- [ ] **Step 5: Screenshots + lint**

```bash
node /tmp/qa-seaglass-axe.mjs 2>&1 | tail -3
npm --prefix frontend run lint 2>&1 | tail -2
```
Expected: 0 axe violations; oxlint 0 errors (2 pre-existing warnings acceptable).

- [ ] **Step 6: Shut down + final commit**

```bash
kill $(cat /tmp/sg-backend.pid) $(cat /tmp/sg-preview.pid) 2>/dev/null; fuser -k 4173/tcp 8000/tcp 2>/dev/null
git status --short | grep -E "frontend|DESIGN" || echo "worktree clean"
```
Expected: `worktree clean` (all tasks already committed).

---

## Verification Matrix (spec → task)

| Spec section | Task |
|---|---|
| §2 mint ramp + signature gesture | 2, 3 |
| §3 neutrals | 2 |
| §4 semantic monopolies | 3 (Pill), 6–9 (consumers) |
| §5 charts | 4 |
| §6 type & shell | 5, 9 |
| §8 page roles (existing 4 screens) | 5–9 |
| §10 a11y rules | 3 (focus), 8 (scroll region), 10 (axe + probes) |
