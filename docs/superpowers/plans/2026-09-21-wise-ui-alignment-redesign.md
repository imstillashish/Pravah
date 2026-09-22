# Wise-Identity UI Alignment: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the UI's functional defects and redesign the execution layer to faithfully implement the pinned DESIGN.md (Wise) world: sage canvas, lime CTA pills, ink/Manrope display type, tokenized colors, unified radius scale, and a11y-grade motion/focus behavior.

**Spec:** `docs/superpowers/specs/2026-09-21-wise-ui-alignment-redesign.md`

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (`@theme`), Framer Motion, Vite.

**Design tokens source of truth:** `DESIGN.md` + `frontend/src/index.css` `@theme` block (created in Task 1).

---

### Task 1: Token Foundation (`@theme`), Fonts, Shell & Page Canvas

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/index.html`
- Modify: `frontend/tailwind.config.js` (delete dead config)
- Modify: `frontend/src/App.tsx`
- Verify: `npm --prefix frontend run build`

- [ ] **Step 1: Add Tailwind v4 `@theme` tokens in `index.css`**
  Replace the `:root` drift hexes with a `@theme` block mapping DESIGN.md values:
  ```css
  @theme {
    --color-canvas: #ffffff;
    --color-sage: #e8ebe6;
    --color-ink: #0e0f0c;
    --color-ink-deep: #163300;
    --color-body-text: #454745;
    --color-mute: #868685;
    --color-lime: #9fe870;
    --color-lime-active: #cdffad;
    --color-lime-pale: #e2f6d5;
    --color-positive: #2ead4b;
    --color-positive-deep: #054d28;
    --color-warning: #ffd11a;
    --color-warning-deep: #b86700;
    --color-negative: #d03238;
    --color-negative-deep: #a72027;
    --color-negative-bg: #320707;
    --color-accent-cyan: #38c8ff;
    --color-accent-orange: #ffc091;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --font-display: "Manrope", "Inter", system-ui, sans-serif;
  }
  ```
  Set `body { background-color: var(--color-sage); color: var(--color-ink-deep); font-family: Inter fallback stack }`.

- [ ] **Step 2: Load fonts in `index.html`**
  Preconnect + Google Fonts link for **Manrope 800** and **Inter 400/600/700**; set `<title>` to "Intelligent Freight Portal — SAIL Bulk Chartering".

- [ ] **Step 3: Remove dead `tailwind.config.js`**
  `rm frontend/tailwind.config.js` (Tailwind v4 PostCSS plugin ignores it; tokens now live in `@theme`).

- [ ] **Step 4: Unify App shell background**
  `App.tsx`: replace `bg-[#F8FAFC]` (both loading + main shells) with `bg-sage` (token class). Loading spinner uses ink token.

- [ ] **Step 5: Verify build**
  Run: `npm --prefix frontend run build` — passes with zero errors.

- [ ] **Step 6: Commit**
  ```bash
  git add frontend/src/index.css frontend/index.html frontend/src/App.tsx
  git rm frontend/tailwind.config.js
  git commit -m "feat(ui): establish Wise token foundation via Tailwind v4 @theme"
  ```

---

### Task 2: Shared Primitives — Button Recipes & Card Recipe

**Files:**
- Create: `frontend/src/components/ui.tsx` (small, tokenized primitives: `PrimaryButton`, `SecondaryButton`, `Card`, `Pill`)
- Verify: `npm --prefix frontend run build`

- [ ] **Step 1: Implement primitives with token classes**
  - `PrimaryButton`: lime fill `bg-lime`, ink text `text-ink`, `rounded-full`, `min-h-12 px-6 font-semibold`, hover `hover:bg-lime-active`, `active:scale-[0.98]`, `motion-reduce:transition-none`.
  - `SecondaryButton`: white fill, `border border-ink/90`, `rounded-full`, `min-h-12`, hover `hover:bg-sage`.
  - `Card`: `rounded-xl` (24px token), `bg-canvas`, `p-6`, no default shadow; optional `bordered` prop adds `border border-ink/8`.
  - `Pill`: `rounded-full px-3 py-1 text-xs font-semibold` with variant fills (positive pale, warning pale, neutral sage).

- [ ] **Step 2: Verify build**
  Run: `npm --prefix frontend run build`.

- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/components/ui.tsx
  git commit -m "feat(ui): add tokenized Wise button/card/pill primitives"
  ```

---

### Task 3: Navbar & RoleSwitcherBanner Redesign

**Files:**
- Modify: `frontend/src/components/Navbar.tsx`
- Modify: `frontend/src/components/RoleSwitcherBanner.tsx`
- Verify: `npm --prefix frontend run build`

- [ ] **Step 1: Navbar onto-system**
  White `bg-canvas`, `border-b border-ink/8`; logo tile stays ink with lime icon; nav typography `text-sm font-semibold text-ink`; avatar chip sage fill `bg-ink/10`; Sign out → `SecondaryButton` (compact variant `min-h-9`).

- [ ] **Step 2: RoleSwitcherBanner polarity flip per DESIGN.md**
  Dark band `bg-ink` with `text-lime` active-desk pill (`bg-lime/20 text-lime`); switch CTA → `PrimaryButton` (lime fill, ink text) — no more lime-text-on-forest inverted CTA. Keep all copy verbatim.

- [ ] **Step 3: Verify build**
  Run: `npm --prefix frontend run build`.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/components/Navbar.tsx frontend/src/components/RoleSwitcherBanner.tsx
  git commit -m "feat(ui): redesign Navbar and RoleSwitcherBanner with Wise polarity system"
  ```

---

### Task 4: AuthPage Redesign

**Files:**
- Modify: `frontend/src/pages/AuthPage.tsx`
- Verify: `npm --prefix frontend run build`

- [ ] **Step 1: Page onto sage canvas**
  `bg-sage`; heading in `font-display` (Manrope 800) at display-sm scale; intro copy in `text-body-text`.

- [ ] **Step 2: Inputs onto token recipe**
  Inputs: `bg-canvas border border-ink rounded-md px-4 py-3 text-body`, `placeholder:text-mute`, focus ring unchanged; labels `text-xs font-semibold text-ink`. Add `aria-invalid` + `aria-describedby` wiring to the error alert; error alert uses negative family (`bg-[--color-negative-bg]/5 border-negative/30 text-ink`).

- [ ] **Step 3: Role cards & submit button**
  Role selection cards: selected = ink border + sage fill + lime check; unselected = sage-tinted idle. Submit → `PrimaryButton` (lime/ink). Keep "Choose your starting desk" copy.

- [ ] **Step 4: Verify build**
  Run: `npm --prefix frontend run build`.

- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/pages/AuthPage.tsx
  git commit -m "feat(ui): redesign AuthPage with Wise inputs and lime CTA"
  ```

---

### Task 5: Dashboard Header + Metric Cards Redesign (API base extraction)

**Files:**
- Create: `frontend/src/api.ts` (`export const API_BASE = import.meta.env.VITE_API_BASE ?? "/api"`)
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/context/AuthContext.tsx` (use `API_BASE`)
- Verify: `npm --prefix frontend run build`

- [ ] **Step 1: Extract API base**
  All `fetch("http://localhost:8000/api...")` calls across AuthContext, Dashboard, GlobalMetricsStrip, RecentAnalysesTable, NewAnalysisDrawer switch to `API_BASE`. Add `VITE_API_BASE` fallback note in code comment.

- [ ] **Step 2: Dashboard header typography**
  `h1` → Manrope 800 `text-4xl sm:text-5xl tracking-tight text-ink-deep` on sage; CTA → `PrimaryButton` lime pill ("+ Run New Analysis" copy kept, drop redundant `+` glyph inside label — icon already carries it).

- [ ] **Step 3: Metric cards onto-system**
  Cards: `Card` primitive (white on sage, `rounded-xl`, hairline border `border-ink/8`). Structure per card: eyebrow (Inter 600 12px `text-mute uppercase tracking-wide`) → value (Manrope 800 32px `tabular-nums text-ink-deep`) → delta pill (positive family for favorable moves: `bg-lime-pale text-positive-deep`) → description (`text-body-text text-sm`) → chart unchanged. Icon chips: `bg-lime-pale text-ink-deep` (drop blue/amber chips).

- [ ] **Step 4: Surface fetch failure state**
  Pass `fetchError` down (or set a local banner in Dashboard when `/analyses/recent` fails): inline `role="alert"` strip using negative family with retry affordance wired to `fetchAnalyses`.

- [ ] **Step 5: Verify build**
  Run: `npm --prefix frontend run build`.

- [ ] **Step 6: Commit**
  ```bash
  git add frontend/src/api.ts frontend/src/pages/Dashboard.tsx frontend/src/context/AuthContext.tsx
  git commit -m "feat(ui): redesign dashboard metrics onto Wise system; extract API base"
  ```

---

### Task 6: GlobalMetricsStrip + RecentAnalysesTable Onto-System

**Files:**
- Modify: `frontend/src/components/GlobalMetricsStrip.tsx`
- Modify: `frontend/src/components/RecentAnalysesTable.tsx`
- Verify: `npm --prefix frontend run build`

- [ ] **Step 1: MetricsStrip cards reuse Card/Pill primitives**
  Skeletons updated to same geometry (`rounded-xl bg-canvas` shimmer on sage context). BDI/rate/fuel delta pills: positive pale fill + `text-positive-deep` for favorable, warning-family for adverse; "Singapore Hub" chip → neutral sage pill.

- [ ] **Step 2: Table onto-system**
  Card wrapper → `Card bordered`; header row `text-mute text-xs font-semibold uppercase tracking-wide`; row dividers `divide-ink/8`; hover `hover:bg-sage/60`; route cell keeps bold ink-deep; savings cell → `Pill` positive variant (`bg-lime-pale text-positive-deep` — replaces emerald); status badges: finalized → positive family, draft → neutral sage, overridden → warning family (`bg-[#ffd11a]/25 text-warning-deep`); Refresh → `SecondaryButton` compact.

- [ ] **Step 3: Verify build**
  Run: `npm --prefix frontend run build`.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/components/GlobalMetricsStrip.tsx frontend/src/components/RecentAnalysesTable.tsx
  git commit -m "feat(ui): align metrics strip and analyses table with Wise tokens"
  ```

---

### Task 7: NewAnalysisDrawer — Redesign + A11y Hardening

**Files:**
- Modify: `frontend/src/components/NewAnalysisDrawer.tsx`
- Verify: `npm --prefix frontend run build`

- [ ] **Step 1: Motion policy + focus management**
  - Sheet: `transition-transform duration-200 ease-out` slide-in, backdrop fade; both gated by `motion-reduce:transition-none` (or read `useReducedMotion` like the chart).
  - Focus trap: on open, focus first focusable element in sheet; trap Tab within; on close restore focus to the "Run New Analysis" trigger (via `document.activeElement` snapshot). Keep Escape + scroll lock.

- [ ] **Step 2: Form controls onto token recipe**
  Selects/inputs: `bg-canvas border border-ink rounded-md` recipe (match Task 4); section labels `text-xs font-semibold text-ink`; quick chips: selected = ink fill + lime label, unselected = white + ink/10 border, `min-h-11` touch targets.

- [ ] **Step 3: Recommendation + alert blocks onto-system**
  Vessel recommendation card → `bg-sage rounded-xl`; vessel badge → neutral pill; Haldia advisory → warning family (`bg-[#ffd11a]/15 border-[#ffd11a]/40 text-ink`, title `text-warning-deep`); submit error → negative family. Footer: "Save as Draft" → `SecondaryButton`; "Finalize & Record Forecast" → `PrimaryButton`.

- [ ] **Step 4: Verify build**
  Run: `npm --prefix frontend run build`.

- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/components/NewAnalysisDrawer.tsx
  git commit -m "feat(ui): harden drawer a11y and align with Wise form recipes"
  ```

---

### Task 8: Deduplicate Data Fetching + Final QA

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/components/RecentAnalysesTable.tsx`
- Verify: `npm --prefix frontend run build`, `npx oxlint`

- [ ] **Step 1: Single-source the analyses fetch**
  `RecentAnalysesTable` keeps internal-fetch fallback ONLY when `propAnalyses === undefined` (already conditional — verify Dashboard always passes props and no double-mount fetch fires in StrictMode duplicate; add `hasFetchedRef` guard or rely on props-only path). Result: one network call per refresh.

- [ ] **Step 2: Full-surface visual pass (batched, per skill: one inspect round)**
  Run dev server; screenshot desktop (1440px) + mobile (390px) for: Auth page (both modes), Freight Desk dashboard (loaded + loading + drawer open + Haldia alert), Operations desk. Fix all defects found in one batch.

- [ ] **Step 3: Verify build + lint**
  Run: `npm --prefix frontend run build && npm --prefix frontend run lint`.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/pages/Dashboard.tsx frontend/src/components/RecentAnalysesTable.tsx
  git commit -m "fix(ui): deduplicate analyses fetching and pass batched visual QA"
  ```

---

## Verification Checklist (Definition of Done)

- [ ] Zero hardcoded brand hexes outside `index.css @theme` (grep `#163300|#9FE870|#F8FAFC|#F6F8F5` → only `@theme` + legacy `AnimatedSvgChart` variant configs, which get token references where feasible).
- [ ] One page canvas color (sage) across app + auth.
- [ ] Every primary CTA is lime-fill/ink-text pill; no inverted dark-fill CTA remains.
- [ ] Radius scale: cards 24px, inputs 12px, pills/icons full — no `rounded-2xl`/`rounded-3xl` remnants.
- [ ] Drawer traps focus, restores focus, respects reduced motion.
- [ ] `npm --prefix frontend run build` + `lint` pass clean.
