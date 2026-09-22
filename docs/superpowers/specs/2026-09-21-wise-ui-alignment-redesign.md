# Design Specification: Wise-Identity Alignment & UI Fix

**Project:** Intelligent Freight Portal (SAIL Bulk Chartering) — frontend
**Date:** 2026-09-21
**Type:** Refinement + corrective redesign (existing surface)
**Mode:** Operate (task completion outranks expression; brand lives in precise details)
**Incumbent visual truth:** `DESIGN.md` v-alpha — Wise design language

---

## 1. Problem Statement

The frontend renders a competent but **generic gray-zinc SaaS admin** that contradicts the pinned `DESIGN.md` world on nearly every axis. The brand's signature moves — lime CTA pill, sage canvas, 24px pill geometry, 900-weight display type, surface-contrast elevation — are all either missing or executed inconsistently. Additionally, several functional and accessibility defects undermine the Operate-mode quality floor.

## 2. Audit Findings (must all be addressed)

### A. Brand drift vs. DESIGN.md

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| A1 | **Body background drift.** CSS `body` uses `#F6F8F5` and App shell uses `#F8FAFC` (cool gray-blue), while DESIGN.md canvas-soft is sage `#e8ebe6`. Three near-identical but different page fills. | `index.css`, `App.tsx`, `AuthPage.tsx` | High |
| A2 | **CTA polarity inversion.** Primary buttons render as dark forest fill + lime text (`bg-[#163300] text-[#9FE870]`). DESIGN.md `button-primary` is lime fill + near-black ink text. The lime pill IS the brand's conversion signature and appears nowhere as a CTA. | `Dashboard.tsx` (Run New Analysis), `AuthPage.tsx` (submit), `RoleSwitcherBanner.tsx` | High |
| A3 | **Sage canvas absent.** Cards are white-on-gray; DESIGN.md prescribes white cards sitting on sage `{canvas-soft}` so surface contrast itself is the elevation cue. | All pages | High |
| A4 | **Radius drift.** Arbitrary mix: `rounded-3xl` (24px) on cards, `rounded-2xl` (16px) on inputs, `rounded-full` on buttons. DESIGN.md: `rounded.xl` 24px for cards/buttons, `rounded.md` 12px for inputs, `rounded.full` for pills/icons. | Every component | Medium |
| A5 | **Typography ladder not tokenized.** Display uses ad-hoc `text-3xl/4xl font-black`; no `Wise Sans`/Manrope display face is loaded; DESIGN.md's two-face story (900 display / Inter 600 sub-display) is unrealized. Labels use `text-xs font-bold uppercase` inconsistently mixed with `font-medium text-zinc-*`. | `index.html` (no font link), all components | Medium |
| A6 | **Color system bypassed.** 60+ hardcoded hex values (`#163300`, `#9FE870`, `#204900`, `#F6F8F5`) and zinc/emerald/amber/slate/rose Tailwind palette classes scattered instead of the `wise-*` tokens already defined in `tailwind.config.js` (which are themselves dead code — Tailwind v4 doesn't read it; `index.css` `@theme` is missing). | `index.css` vs `tailwind.config.js`, all components | High |
| A7 | **Semantic colors misused.** Savings pill uses emerald-800-on-emerald-50; vessel recommendation uses emerald-100 — DESIGN.md: never repurpose brand green as success; use positive family `#2ead4b`/`#e2f6d5`/`#054d28`. | `RecentAnalysesTable.tsx`, `NewAnalysisDrawer.tsx` | Medium |
| A8 | **Icon chips introduce foreign hues.** Metric card icon chips use blue-50/blue-800 and amber — cyan `#38c8ff` and orange `#ffc091` are the sanctioned tertiary accents. | `Dashboard.tsx` | Low |
| A9 | **Inactive visual states inconsistent.** Hover targets mix border-color changes, bg changes, and shadow with no shared recipe; `active:scale-95` appears only on some buttons. | All interactive elements | Low |

### B. Functional & a11y defects

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| B1 | **Duplicated data fetching.** `Dashboard.fetchAnalyses` and `RecentAnalysesTable`'s internal fetch both call `/api/analyses/recent` on mount; two identical table payloads fetched per render cycle. | `Dashboard.tsx` + `RecentAnalysesTable.tsx` | Medium |
| B2 | **Hardcoded API base.** `http://localhost:8000/api` repeated in 4 files — breaks any non-localhost deploy. | All data components, `AuthContext` | Medium |
| B3 | **Dashboard hides fetch failures.** `catch` only logs to console; the table keeps showing stale/empty state with no error surface. | `Dashboard.tsx` | Medium |
| B4 | **Drawer: no focus trap, no focus restore, no initial focus.** Escape + scroll-lock exist, but keyboard users tab into background content while the modal is open. | `NewAnalysisDrawer.tsx` | Medium |
| B5 | **Drawer: animated content bypasses reduced-motion.** Backdrop/sheet appear instantly (no transitions), while the in-card chart respects reduced motion — inconsistent motion policy within one component. | `NewAnalysisDrawer.tsx`, `AnimatedSvgChart.tsx` | Low |
| B6 | **Auth error copy + a11y.** Inputs lack `aria-invalid`, error `role="alert"` appears only after failure without focus move; labels are fine but error text can be disconnected from the field that failed. | `AuthPage.tsx` | Low |
| B7 | **`title` tag is "frontend".** | `index.html` | Low |
| B8 | **Vite proxy unused.** Fetches hardcode the backend origin; dev proxy would remove the origin coupling cleanly. | `vite.config.ts` not verified to have proxy | Low |

## 3. Design Direction (the committed world)

**Keep:** Information architecture, roles/desks, all factual copy, component inventory, data behaviors, `AnimatedSvgChart` (it's already on-system with ink stroke + lime gradient).

**Replace the execution layer with the pinned Wise world:**

1. **Tokens (single source of truth).** Add `@theme` block in `index.css` (Tailwind v4 mechanism) mapping DESIGN.md colors: `--color-canvas #ffffff`, `--color-sage #e8ebe6`, `--color-ink #0e0f0c`, `--color-ink-deep #163300`, `--color-body #454745`, `--color-mute #868685`, `--color-lime #9fe870`, `--color-lime-active #cdffad`, `--color-lime-pale #e2f6d5`, `--color-positive #2ead4b`, `--color-positive-deep #054d28`, `--color-warning #ffd11a`, `--color-warning-deep #b86700`, `--color-negative #d03238`, `--color-negative-deep #a72027`, `--color-negative-bg #320707`, `--color-accent-cyan #38c8ff`, `--color-accent-orange #ffc091`; radius tokens (`--radius-sm 8px`, `--radius-md 12px`, `--radius-lg 16px`, `--radius-xl 24px`), spacing stays Tailwind default (already 4px-based). Delete the dead `tailwind.config.js` wise block and drift hexes from `index.css` `:root`.

2. **Type.** Load **Manrope** (800 for display, the sanctioned Wise Sans substitute) + keep **Inter** (400/600) from Google Fonts via `index.html` preconnect. Display headings: Manrope 800 with tightened tracking; the dashboard title uses the display scale (~40–47px desktop, clamp down on mobile). Numeric values keep tabular-nums.

3. **Page canvas.** One page fill: sage `#e8ebe6` body background across App + Auth. White cards sit directly on sage — no gray borders needed for elevation; use hairline `rgba(14,15,12,0.08)` borders only where definition aids scanning (data table). Dark bands (RoleSwitcherBanner, footer accents) flip to ink `#0e0f0c` with lime accents per DESIGN.md polarity-flip pattern.

4. **Buttons.**
   - Primary CTA: **lime `#9fe870` fill, ink `#0e0f0c` text**, `rounded-full` per Wise CTA signature (DESIGN.md `rounded.xl` allows 24px; full pill is the Wise nav/CTA standard), `button-md` typography (Inter 600 16px), hover `#cdffad`, min-height 48px, `active:scale-[0.98]`.
   - Secondary: white fill + 1px ink border (tertiary recipe from DESIGN.md) — used for "Save as Draft", "Refresh Feed", "Sign out".
   - Icon buttons: white circular.
5. **Cards.** `rounded-[24px]`, `p-6`, no shadow by default (surface contrast carries elevation), optional hairline border on white-on-white contexts.

6. **Semantic usage.** Savings + status: positive family (pale `#e2f6d5` bg, deep `#054d28` text). Warnings: warning family. Errors: negative family. Vessel badge: neutral ink-on-sage pill. Icon chips: use `lime-pale` bg + ink icon, or accent-cyan/orange only as tertiary illustration accents.

7. **Motion.** One policy: `prefers-reduced-motion` collapses all durations to 0 (chart already does; drawer transitions and hover transitions get the same treatment via a `motion-reduce` variant); entrance transitions ≤200ms ease-out.

8. **Density & hierarchy.** Metric cards: eyebrow caption (Inter 600 12px, `tracking-wide`, mute color) → value (Manrope 800, 32–36px, tabular) → delta pill → body-sm description → chart. Table: keep 7 columns; header row Inter 600 11–12px uppercase mute; zebra-less with hairline row dividers `rgba(14,15,12,0.08)`.

## 4. Accessibility & Quality Bar

- Every interactive element ≥44px touch target (buttons currently pass; chips ~40px → bump to 44px min-height).
- Focus-visible: 2px ink outline, offset 2 (exists; keep).
- Drawer: focus trap (`<dialog>`-like behavior via ref), `aria-modal`, focus moves to first focusable on open, restored to trigger on close; Escape already handled.
- Forms: `aria-invalid` + `aria-describedby` on failed fields; single `role="alert"` container; error summary focused on failure.
- Color contrast: body text on sage ≥4.5:1 (`#454745` on `#e8ebe6` = ~7:1 ✓; lime `#9fe870` only ever hosts ink text = ~13:1 ✓).
- All linter (`oxlint`) and `tsc -b` clean; `npm run build` passes.

## 5. Out of Scope

- Backend changes, API contracts, new features, copy rewrites beyond error-message clarity, routing, auth flow logic, chart geometry redesign.
