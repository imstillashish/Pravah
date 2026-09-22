# Animated SVG Trend Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a versatile, responsive `<AnimatedSvgChart />` component with vector path-length draw-in animations and apply it to both the Global Metrics cards and the New Analysis simulation drawer preview.

**Architecture:** A reusable React component built with `framer-motion` rendering vector wave paths, gradient defs, and customizable color variants (`wise-green`, `ocean-blue`, `amber-warning`), integrated seamlessly into the existing dashboard components.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion (`framer-motion`), Vite.

---

### Task 1: Framer Motion Dependency & AnimatedSvgChart Component

**Files:**
- Create: `frontend/src/components/AnimatedSvgChart.tsx`
- Test / Verify: `npm --prefix frontend run build`

- [ ] **Step 1: Install `framer-motion` in frontend**
Run: `npm --prefix frontend install framer-motion`

- [ ] **Step 2: Implement AnimatedSvgChart component**
Write `frontend/src/components/AnimatedSvgChart.tsx` with:
- SVG linear gradients (`wise-green`, `ocean-blue`, `amber-warning`)
- `motion.path` with initial `{ pathLength: 0 }` to `{ pathLength: 1 }`
- `motion.path` area fill with initial `{ opacity: 0 }` to `{ opacity: 1 }`
- Support for customizable `height`, `className`, and `key` to re-trigger on parameter change.

- [ ] **Step 3: Verify build passes**
Run: `npm --prefix frontend run build`
Expected: Build passes with zero errors.

- [ ] **Step 4: Commit**
```bash
git add frontend/
git commit -m "feat(ui): implement AnimatedSvgChart component with framer-motion"
```

---

### Task 2: Embed Animated Charts in Global Metrics Cards

**Files:**
- Modify: `frontend/src/components/GlobalMetricsStrip.tsx`
- Test / Verify: `npm --prefix frontend run build`

- [ ] **Step 1: Update GlobalMetricsStrip cards**
Embed `<AnimatedSvgChart />` into:
- Baltic Dry Index card (`variant="wise-green"`)
- Average Freight Rate card (`variant="ocean-blue"`)
- Bunker Fuel card (`variant="amber-warning"`)
Position as ambient lower-card SVG backdrops with high legibility.

- [ ] **Step 2: Verify build passes**
Run: `npm --prefix frontend run build`

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/GlobalMetricsStrip.tsx
git commit -m "feat(ui): embed animated SVG trend charts in global metrics cards"
```

---

### Task 3: Embed Animated Trajectory in New Analysis Simulation Drawer

**Files:**
- Modify: `frontend/src/components/NewAnalysisDrawer.tsx`
- Test / Verify: `npm --prefix frontend run build`

- [ ] **Step 1: Add Predictive Forward Curve in NewAnalysisDrawer**
Inside the simulation preview box:
- Render a live forward-rate curve preview using `<AnimatedSvgChart key={`${originPort}-${destinationPort}-${parcelTonnage}`} variant="wise-green" height={80} />`
- Smoothly re-animates whenever the user adjusts the trade route or parcel size.

- [ ] **Step 2: Verify build and test suite**
Run: `npm --prefix frontend run build && PYTHONPATH=backend ./backend/venv/bin/pytest backend/tests/ -v`

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/NewAnalysisDrawer.tsx
git commit -m "feat(ui): integrate animated SVG rate trajectory in simulation drawer"
```
