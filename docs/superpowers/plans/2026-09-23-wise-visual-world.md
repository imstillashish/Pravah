# Wise Visual World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the rendered app (Auth, Dashboard, shell, drawer, table, charts) from Sea-Glass to the pinned Wise world (Forest Ink + Lime Voltage, pill geometry, Inter 900 display) with Auth/Dashboard layout recomposition, deleting the 9 dead stub pages.

**Architecture:** Token-first swap (`index.css` `@theme`) so Tailwind utilities rename cleanly, then primitives, then surfaces bottom-up. Every task ends in build + drift grep + commit. QA runs against the production preview build.

**Tech Stack:** React + Vite + Tailwind v4, framer-motion, lucide-react (existing), axe-core (dev), Playwright for probes.

**Spec:** `docs/superpowers/specs/2026-09-23-wise-visual-world-design.md` — the contrast matrix (§3) is binding; QA asserts its numbers.

**Semantic class mapping (used throughout):**

| Sea-Glass (old) | Wise (new) | Note |
|---|---|---|
| `text-ink` / `text-sea-900` / `text-sea-800` | `text-obsidian` (display) / `text-forest-ink` (headings, values) | |
| `text-body` | `text-charcoal` | body copy, incl. on Fog |
| `text-muted` | `text-slate` | **Paper surfaces only** (4.40 on Fog = fail) |
| `text-faint` / `placeholder:*-faint` | `text-slate` | placeholders 5.30 on Paper ✓ |
| `text-sea-600` (links) | `text-forest-ink underline underline-offset-2` | Wise text-link button |
| `bg-canvas` | `bg-paper` | |
| `bg-card` / `bg-white` cards | `bg-paper border border-pebble` | hairline edge stays |
| `bg-fog` (stat tiles) | `bg-fog` | same name, new hex `#e8ebe6` |
| `bg-well` | `bg-paper` (inputs) / `bg-fog` (search) | |
| `bg-wash` (hover) | `bg-fog` | |
| `border-line` / `border-line-strong` | `border-pebble` | |
| `bg-mint-500` + `text-sea-900` (CTA) | `bg-lime-voltage` + `text-forest-ink` | hover `brightness-95`, never a new hex |
| `hover:bg-[#2ab08b]` | `hover:brightness-95` | rejected hover stays banned |
| `bg-glass-100` + `text-sea-800` (positive pill) | `bg-linen-mist` + `text-forest-ink` | |
| `bg-glass-50` (row tint) | `bg-fog` | |
| `bg-glass-100` quick chips | `bg-fog` | |
| `bg-coral-100` + `text-coral-700` | `bg-fog` + `text-alarm-red` | danger recipe |
| `bg-alarm-red`-destructive | `bg-alarm-red text-paper` | 5.43 ✓ |
| `bg-amber-100` + `text-amber-700` | `bg-linen-mist` + `text-signal-blue` | pending/info |
| `text-spruce` ▲ / `text-coral-500` ▼ | `text-spruce` ▲ / `text-alarm-red` ▼ | deltas |
| `rounded-lg` (8px cards) | `rounded-card` (10px) | defined in Task 2 |
| `rounded-xl` (12px) | `rounded-card`; 28px large panels → `rounded-xl` (redefined) | |
| `.shadow-sheet` | `shadow-xl` | utility deleted |

---

### Task 1: Delete the 9 dead stub pages

**Files:**
- Delete: `frontend/src/pages/AnalysisResultsPage.tsx`, `NewAnalysisPage.tsx`, `ScenarioViewPage.tsx`, `AdminUsersPage.tsx`, `AdminReferencePage.tsx`, `AuditLogPage.tsx`, `LoginPage.tsx`, `DashboardPage.tsx`, `NotFoundPage.tsx`
- Keep: `frontend/src/pages/AuthPage.tsx`, `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Verify nothing imports the stubs**

Run:
```bash
ls frontend/src/pages/ && grep -rln "AnalysisResultsPage\|NewAnalysisPage\|ScenarioViewPage\|AdminUsersPage\|AdminReferencePage\|AuditLogPage\|LoginPage\|DashboardPage\|NotFoundPage" frontend/src --include="*.tsx" --include="*.ts" | grep -v "frontend/src/pages/"
```
Expected: empty output from the grep (no importer outside the stubs themselves).

- [ ] **Step 2: Delete and verify build**

```bash
cd frontend/src/pages && rm AnalysisResultsPage.tsx NewAnalysisPage.tsx ScenarioViewPage.tsx AdminUsersPage.tsx AdminReferencePage.tsx AuditLogPage.tsx LoginPage.tsx DashboardPage.tsx NotFoundPage.tsx && cd ../../.. && npm --prefix frontend run build 2>&1 | tail -3
```
Expected: build succeeds (proves zero references).

- [ ] **Step 3: Commit**

```bash
git add -A frontend/src/pages && git commit -q -m "chore: delete 9 unreferenced stub page files" && git log --oneline -1
```

---

### Task 2: Token foundation — `frontend/src/index.css` full rewrite

**Files:**
- Modify (full rewrite): `frontend/src/index.css`

- [ ] **Step 1: Read current file** to confirm nothing beyond these blocks exists (expected: tailwind import, `@theme`, sweep keyframes, reduced-motion block, `.shadow-sheet`). If an unlisted utility exists, carry it into the rewrite.

- [ ] **Step 2: Overwrite with the Wise world**

```css
@import "tailwindcss";

/*
 * Wise visual world — single source of truth: DESIGN.md + spec
 * docs/superpowers/specs/2026-09-23-wise-visual-world-design.md
 * Contrast matrix in the spec §3 is binding. Lime is fill-only on light
 * surfaces (1.47:1 as ink — never text/icon/stroke/chart).
 */
@theme {
  /* Wise palette */
  --color-forest-ink: #163300;
  --color-lime-voltage: #9fe870;
  --color-spruce: #054d28;
  --color-linen-mist: #e2f6d5;
  --color-signal-blue: #0b4c72;
  --color-alarm-red: #cb272f;
  --color-charcoal: #454745;
  --color-obsidian: #0e0f0c;
  --color-pebble: #868685;
  --color-slate: #6a6c6a;
  --color-fog: #e8ebe6;
  --color-paper: #ffffff;

  /* Fonts — Inter UI, IBM Plex Mono numerals (deliberate Wise deviation) */
  --font-inter: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Radii — pill geometry is the signature (buttons/tags/nav use Tailwind's
     built-in rounded-full = 9999px; --radius-pill kept for spec fidelity) */
  --radius-pill: 9999px;
  --radius-card: 10px;   /* cards, inputs, sheets */
  --radius-xl: 28px;     /* large feature panels only (auth hero) */

  /* Shadows — elevated/floating surfaces ONLY */
  --shadow-lg: rgba(0, 0, 0, 0.08) 0px 6px 20px 0px;
  --shadow-xl: rgba(0, 0, 0, 0.15) 0px 10px 32px 0px,
    rgba(0, 0, 0, 0.04) 0px 40px 40px 0px;
}

body {
  @apply bg-paper text-charcoal font-inter antialiased;
}

/* Skeleton sweep — the only loading pattern (anti-slop: no pulse/ping) */
.skeleton {
  position: relative;
  overflow: hidden;
  background-color: var(--color-fog);
}
.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.75),
    transparent
  );
  animation: sweep 1.4s cubic-bezier(0.23, 1, 0.32, 1) infinite;
}
@keyframes sweep {
  to {
    transform: translateX(100%);
  }
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
```

- [ ] **Step 3: Build** — `npm --prefix frontend run build 2>&1 | tail -3` → succeeds (class failures surface here; old token classes still in components compile to nothing but must not error).

- [ ] **Step 4: Commit** — `git add frontend/src/index.css && git commit -q -m "feat: Wise token foundation (Forest Ink + Lime Voltage, pill radii, Wise-legal shadows)"`

---

### Task 3: Motion vocabulary — `frontend/src/lib/motion.ts`

**Files:**
- Modify: `frontend/src/lib/motion.ts`

- [ ] **Step 1: Preserve the API.** Run `grep -rn "lib/motion\|from \"./motion\"" frontend/src` and list every imported name. The rewrite must export exactly those names.

- [ ] **Step 2: Overwrite** (rename exports if step 1 shows different names — keep consumers compiling):

```ts
import type { Variants } from "framer-motion";

/* Wise motion: strong ease-out entrances, iOS-like drawer. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_OUT, delay: i * 0.05 },
  }),
};

export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const drawerVariants: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { duration: 0.28, ease: EASE_DRAWER } },
  exit: { x: "100%", transition: { duration: 0.24, ease: EASE_DRAWER } },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
```

- [ ] **Step 3: Build + commit** — build green, then `git add frontend/src/lib/motion.ts && git commit -q -m "feat: Wise motion vocabulary (strong ease-out, iOS drawer curve)"`

---

### Task 4: Primitives — `frontend/src/components/ui.tsx` full rewrite

**Files:**
- Modify (full rewrite): `frontend/src/components/ui.tsx`

- [ ] **Step 1: Inventory consumers.** `grep -rn "from \"./ui\"\|from \"../components/ui\"" frontend/src` — every imported symbol must exist in the rewrite (expected set: `Button`, `Pill`, `Card`, `Skeleton`, possibly `Input`/`Field`).

- [ ] **Step 2: Overwrite:**

```tsx
import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  children?: ReactNode;
};

/** Wise button system. Primary = the signature lime pill (Forest Ink ink, 9.45:1). */
export function Button({ variant = "primary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-150",
        "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "px-6 py-2.5 text-base" : "px-4 py-1.5 text-sm",
        variant === "primary" && "bg-lime-voltage text-forest-ink hover:brightness-95",
        variant === "secondary" && "border border-forest-ink bg-paper text-forest-ink hover:bg-fog",
        variant === "ghost" && "text-forest-ink underline underline-offset-2 hover:text-charcoal",
        variant === "danger" && "bg-alarm-red text-paper hover:brightness-110",
        className,
      )}
      {...rest}
    />
  );
}

type PillTone = "positive" | "negative" | "pending" | "neutral";
const PILL_TONES: Record<PillTone, string> = {
  positive: "bg-linen-mist text-forest-ink",   // 12.19:1
  negative: "bg-fog text-alarm-red",            // 4.51:1, weight 600 enforced
  pending: "bg-linen-mist text-signal-blue",    // 8.02:1
  neutral: "bg-fog text-charcoal",              // 7.79:1
};
const PILL_GLYPHS = { up: "▲", down: "▼", wait: "⏳" } as const;

export function Pill({
  tone = "neutral",
  glyph,
  className,
  children,
}: {
  tone?: PillTone;
  glyph?: keyof typeof PILL_GLYPHS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        PILL_TONES[tone],
        className,
      )}
    >
      {glyph ? <span aria-hidden>{PILL_GLYPHS[glyph]}</span> : null}
      {children}
    </span>
  );
}

export function Card({ tone = "paper", className, ...rest }: HTMLAttributes<HTMLDivElement> & { tone?: "paper" | "fog" }) {
  return (
    <div
      className={cx(
        "rounded-card border border-pebble",
        tone === "fog" ? "bg-fog" : "bg-paper",
        className,
      )}
      {...rest}
    />
  );
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "w-full rounded-card border border-pebble bg-paper px-3.5 py-2.5 text-base text-forest-ink",
        "placeholder:text-slate transition-colors duration-150",
        "hover:border-charcoal focus:border-forest-ink focus:outline-none",
        className,
      )}
      {...rest}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("skeleton rounded-card", className)} />;
}
```

- [ ] **Step 3: Build** — fix any consumer expecting a renamed prop (e.g., a tone name), then `npm --prefix frontend run build 2>&1 | tail -3` → green.

- [ ] **Step 4: Commit** — `git add frontend/src/components/ui.tsx && git commit -q -m "feat: Wise primitives (lime pill CTA, semantic pills, pebble-hairline cards)"`

---

### Task 5: Shell — App, IconRail, TopBar, RightRail

**Files:**
- Modify: `frontend/src/App.tsx`, `frontend/src/components/IconRail.tsx`, `frontend/src/components/TopBar.tsx`, `frontend/src/components/RightRail.tsx`

- [ ] **Step 1: `App.tsx`** — root wrapper becomes:
```tsx
<div className="min-h-[100dvh] bg-paper text-charcoal">
```
(drop any `bg-canvas` / sea-glass classes).

- [ ] **Step 2: `IconRail.tsx`** — Wise segmented-rail language:
- Container: `bg-paper border-r border-pebble` (replace Void/linen classes).
- Active item: `bg-linen-mist text-forest-ink rounded-full` — **remove** the 2px left accent bar entirely (spec §6).
- Hover: `hover:bg-fog`; inactive icon: `text-charcoal`.
- Brand mark at rail top: `bg-forest-ink text-lime-voltage` (forest tile + lime glyph).

- [ ] **Step 3: `TopBar.tsx`** —
- Bar: `bg-paper border-b border-pebble`.
- Search input: `bg-fog rounded-full border border-transparent placeholder:text-slate focus:border-forest-ink focus:bg-paper` (pill search).
- Desk pill: `bg-fog border border-pebble rounded-full` with mono desk code `text-forest-ink`.
- Role-switcher segments inside the pill: active = `bg-lime-voltage text-forest-ink rounded-full` (Wise segmented tab); inactive = `text-charcoal`.
- Any remaining old classes via the mapping table.

- [ ] **Step 4: `RightRail.tsx`** —
- Live marker: **mini lime pill** — `<span className="rounded-full bg-lime-voltage px-2 py-0.5 font-mono text-[10px] font-semibold text-forest-ink">LIVE</span>`. (Spec deviation, justified: the pinned "lime dot" on Paper is 1.47:1 — invisible. The lime pill keeps the lime signal at 9.45:1. Static, no animation — anti-slop intact.)
- Rows: name `text-forest-ink font-medium`, value `font-mono text-charcoal tabular-nums`, up-delta `text-spruce` + `▲`, down-delta `text-alarm-red` + `▼`.
- Caution/info row: `bg-linen-mist text-signal-blue`; dividers `border-pebble`; hover `hover:bg-fog rounded-card`.

- [ ] **Step 5: Drift grep + build + commit**
```bash
grep -rnE "glass-[0-9]|mint-[0-9]|sea-[0-9]|coral-[0-9]|amber-[0-9]|bg-well|bg-canvas|bg-wash|border-line|slate-ink|shadow-sheet|abyss|deepsea|fathom|shoal|foam|channel|reef" frontend/src ; npm --prefix frontend run build 2>&1 | tail -3
```
Expected: grep empty, build green.
```bash
git add frontend/src/App.tsx frontend/src/components/IconRail.tsx frontend/src/components/TopBar.tsx frontend/src/components/RightRail.tsx && git commit -q -m "feat: Wise shell (segmented rail, pill search, lime desk segments, lime LIVE marker)"
```

---

### Task 6: AuthPage — recomposed asymmetric split

**Files:**
- Modify: `frontend/src/pages/AuthPage.tsx`

- [ ] **Step 1: Read the current file.** List its hooks/handlers (`useAuth` fields, form state names, submit handler, error state, toggle logic, any role select). **Every one is ported verbatim** into the new JSX below — only markup and classes change. Confirm the input ids `work-email` / `account-password` survive (QA depends on them).

- [ ] **Step 2: New structure** (logic slots marked `/* ported */` must be filled from Step 1 — same state, same handlers, same submit):

```tsx
export function AuthPage() {
  /* ported: all existing hooks, state, handlers, error state verbatim */
  const emailRef = React.useRef<HTMLInputElement>(null);
  const headline = (
    <>
      <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.03em] text-lime-voltage xl:text-[64px] 2xl:text-[89px]">
        Know your rate before you book.
      </h1>
      <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-paper/90">
        Forecasted rates, plant windows, and booking guidance for SAIL&apos;s
        freight desk, powered by live market signals.
      </p>
    </>
  );

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[45fr_55fr]">
      <aside className="m-4 hidden flex-col justify-between rounded-xl bg-forest-ink p-12 lg:flex">
        <div className="font-mono text-xs font-medium uppercase tracking-widest text-paper/70">SAIL Freight Intelligence</div>
        <div>
          {headline}
          <Button className="mt-8" onClick={() => emailRef.current?.focus()}>
            Run your first analysis
          </Button>
        </div>
        <div className="font-mono text-xs text-paper/60">Steel in motion · rates on time</div>
      </aside>

      <main className="flex flex-col justify-center p-6">
        <div className="mb-6 rounded-xl bg-forest-ink p-6 lg:hidden">
          <h1 className="text-2xl font-black leading-tight tracking-[-0.02em] text-lime-voltage">
            Know your rate before you book.
          </h1>
        </div>
        <div className="mx-auto w-full max-w-md rounded-card border border-pebble bg-paper p-8">
          {/* ported: mode toggle (sign in / create account) */}
          {/* ported: form with <Input id="work-email" ref={emailRef} .../> and <Input id="account-password" .../> — labels above, ids unchanged */}
          {/* ported: {error && <p role="alert" className="... text-alarm-red">…</p>} */}
          {/* ported: submit <Button type="submit" className="w-full">…</Button> */}
          {/* ported: switch link <Button variant="ghost">…</Button> */}
        </div>
      </main>
    </div>
  );
}
```

Notes: error paragraph = `text-alarm-red` text on Paper + Alarm Red border if the current design has a bordered box — keep `role="alert"`. The desktop headline is the only 89px display moment in the app.

- [ ] **Step 3: Build + drift grep + commit** (same commands as Task 5 Step 5), then:
```bash
git add frontend/src/pages/AuthPage.tsx && git commit -q -m "feat: Auth recomposed — Forest Ink hero with lime 89px display, Wise auth card"
```

---

### Task 7: Dashboard + GlobalMetricsStrip — greeting band + re-tint

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`, `frontend/src/components/GlobalMetricsStrip.tsx`

- [ ] **Step 1: Confirm user shape.** Read `frontend/src/context/AuthContext.tsx` and `frontend/src/components/TopBar.tsx`: find how the desk code (`FR8-PLN` / `PRT-OPS`) and user name are derived. Reuse that exact source in Step 2 (`deskCode`, first-name derivation) — do not invent a new one.

- [ ] **Step 2: Greeting band** — replace the current `<h1>` block in Dashboard with:

```tsx
const hour = new Date().getHours();
const daypart = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
const firstName = /* ported from Step 1 — e.g. user.name?.split(" ")[0] ?? email local-part */;
const dateLabel = new Date()
  .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })
  .toUpperCase();

<header className="mb-8">
  <p className="font-mono text-xs font-medium uppercase tracking-widest text-slate">
    {deskCode} · {dateLabel}
  </p>
  <h1 className="mt-1 text-4xl font-bold tracking-tight text-obsidian">
    {daypart}, {firstName}
  </h1>
</header>
```
(`text-4xl` = 36px at default scale; keep `font-bold`/`text-obsidian`.)

- [ ] **Step 3: Hazard + fetch error banners** — both become: `border border-pebble bg-fog` container, `text-alarm-red font-semibold` message + `!`/`AlertTriangle` glyph in `text-alarm-red`. Remove every coral/amber class per mapping table.

- [ ] **Step 4: `GlobalMetricsStrip.tsx`** — tiles → `<Card tone="fog">` (or `bg-fog border border-pebble rounded-card`), values `font-mono font-semibold text-forest-ink tabular-nums`, labels `text-slate`, rising deltas `text-spruce ▲`, falling `text-alarm-red ▼`. Loading skeletons keep the `Skeleton` primitive (sweep, no pulse).

- [ ] **Step 5: Drift grep + build + commit** (Task 5 Step 5 commands), then:
```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/components/GlobalMetricsStrip.tsx && git commit -q -m "feat: Dashboard greeting band + Wise metric tiles, alarm-red hazards"
```

---

### Task 8: RecentAnalysesTable — re-tint

**Files:**
- Modify: `frontend/src/components/RecentAnalysesTable.tsx`

- [ ] **Step 1: Apply the mapping table** — header band `bg-fog` with `text-charcoal font-semibold` column labels; eyebrow (`SIMULATION LOG · N ENTRIES`) → `text-slate` on the white card (never Slate on the Fog band — 4.40 trap; put the eyebrow **above** the band on Paper); row hover `hover:bg-fog`; savings/values `font-mono text-forest-ink tabular-nums`; status chips via `Pill` tones (auto-updated in Task 4); timestamps `font-mono text-slate`.

- [ ] **Step 2: Preserve semantics** — `role="region"`, `aria-label`, `tabIndex={0}` on the scroll container, and the visible focus ring (`focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest-ink`) must remain exactly as-is.

- [ ] **Step 3: Drift grep + build + commit** — then:
```bash
git add frontend/src/components/RecentAnalysesTable.tsx && git commit -q -m "feat: Simulation log in Wise dress (fog header band, forest-ink mono values)"
```

---

### Task 9: Drawer + Charts

**Files:**
- Modify: `frontend/src/components/NewAnalysisDrawer.tsx`, `frontend/src/components/AnimatedSvgChart.tsx`

- [ ] **Step 1: Drawer re-tint** — sheet: `bg-paper rounded-card shadow-xl` (replace `.shadow-sheet`); backdrop: `bg-obsidian/40`; title `text-forest-ink font-bold`; quick chips `bg-fog text-charcoal`; Haldia advisory = Dashboard hazard recipe (`bg-fog border-pebble`, `text-alarm-red font-semibold`, `!` glyph); submit stays `<Button>` (lime, auto).

- [ ] **Step 2: Chart series** — in `AnimatedSvgChart.tsx`, replace the variant color definitions with:

```ts
const SERIES = {
  forecast: { stroke: "#454745", strokeWidth: 2, dasharray: "6 4" }, // dashed charcoal
  actual:   { stroke: "#163300", strokeWidth: 2, dasharray: undefined },
  negative: { stroke: "#cb272f", strokeWidth: 2, dasharray: undefined },
} as const;
```
Apply `dasharray` to the forecast `<path>` only. Then: grid lines `#868685` dotted (keep existing dash pattern), axis labels `#6a6c6a`, area wash `#e2f6d5` at `fillOpacity 0.4`, end marker square fill `#163300`. **No lime anywhere in the file.**

- [ ] **Step 3: Full drift grep (must be completely empty) + build + commit**
```bash
grep -rnE "glass-[0-9]|mint-[0-9]|sea-[0-9]|coral-[0-9]|amber-[0-9]|bg-well|bg-canvas|bg-wash|border-line|slate-ink|shadow-sheet|abyss|deepsea|fathom|shoal|foam|channel|reef|2ab08b|26a884|2fbf94|63d1ab|0a5c49|e85c3a|dcf3ea|bfe9db|97ddc6|0d7a61|07453a|08362c" frontend/src
git add frontend/src/components/NewAnalysisDrawer.tsx frontend/src/components/AnimatedSvgChart.tsx && git commit -q -m "feat: Drawer + charts in Wise world (shadow-xl sheet, forest/charcoal series, lime banned from charts)"
```

---

### Task 10: Whole-app verification — build, lint, drift

- [ ] **Step 1:** `npm --prefix frontend run build 2>&1 | tail -4` → green.
- [ ] **Step 2:** `npm --prefix frontend run lint 2>&1 | tail -5` → 0 errors (2 pre-existing warnings acceptable).
- [ ] **Step 3:** Drift grep from Task 9 Step 3 → empty. Also `grep -rn "9fe870" frontend/src/components/AnimatedSvgChart.tsx` → empty (lime never in charts).
- [ ] **Step 4:** Commit any straggler fixes (`git add -A frontend/src && git commit -m "fix: drift sweep stragglers"` — only if needed).

---

### Task 11: QA — axe sweep, structural probes, screenshots

**Setup:**
```bash
setsid nohup ./backend/venv/bin/python -m uvicorn app.main:app --port 8000 > /tmp/qa-backend.log 2>&1 & echo $! > /tmp/qa-backend.pid
cd frontend && npm run build >/dev/null 2>&1 && setsid nohup npx vite preview --port 4173 > /tmp/qa-preview.log 2>&1 & sleep 3
```
(Playwright + axe-core already installed; reuse `/tmp/audit-axe.mjs` flows — register a fresh QA user to avoid persisted-role traps.)

- [ ] **Step 1: axe sweep** — run the 7-flow sweep (auth, planner, drawer, advisory, operator, auth-mobile, dashboard-mobile). Expected: **0 violations**.
- [ ] **Step 2: Structural probe** (new `/tmp/qa-wise-structure.mjs`) asserts:
  - body `rgb(255,255,255)`; auth panel `rgb(22,51,0)`; auth h1 Inter 900 / `rgb(159,232,112)` / size ≥ 64px
  - primary CTA: fill `rgb(159,232,112)`, text `rgb(22,51,0)`, radius `9999px`
  - dashboard h1 Inter 700 / 36px / `rgb(14,15,12)`
  - card radius `10px`, `box-shadow: none`; drawer `shadow-xl` composite present
  - both fonts loaded; zero overflow at 1440 and 390; focus trap + Escape restore on drawer
  - LIVE marker is the lime pill (static — no `animate-` classes in the marker subtree)
- [ ] **Step 3: Screenshots** — auth desktop/mobile, dashboard both desks, drawer, mobile full-page → `/tmp/qa-shots-wise/`.
- [ ] **Step 4: Fix anything the probe catches**, re-run to green, then shut down servers and commit fixes:
```bash
git add -A frontend/src && git commit -q -m "fix: QA findings from Wise QA pass" 2>/dev/null; kill $(cat /tmp/qa-backend.pid) 2>/dev/null
```
- [ ] **Step 5: Final report** — commits table, probe results, honest residuals (bundle size, unthrottled perf numbers).
