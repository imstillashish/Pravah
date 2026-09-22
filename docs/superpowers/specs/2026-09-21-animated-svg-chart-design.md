# Technical Specification: Animated SVG Trend Chart Component

## 1. Overview
This specification details the `<AnimatedSvgChart />` component inspired by `@spectrumui/animated-SVG-chart`, customized for the SIH26006 Intelligent Freight Forecasting platform. It introduces smooth vector path-length draw-in animations and vertical gradient fills to visualize freight index trajectories, voyage rate troughs, and bunker price movements.

## 2. Component Architecture
- **File**: `frontend/src/components/AnimatedSvgChart.tsx`
- **Dependencies**: `framer-motion` (or `motion/react`)
- **Key Capabilities**:
  - Animates SVG path line drawing with `pathLength: 0 -> 1` (0.6s ease-out).
  - Animates SVG area gradient fill with `opacity: 0 -> 1` (delay 0.2s).
  - Color palette variants:
    1. `wise-green`: `#163300` stroke, `#9FE870` gradient fill (BDI / Cost Savings).
    2. `ocean-blue`: `#1E3A8A` stroke, `#38BDF8` gradient fill (Average Freight Rate).
    3. `amber-warning`: `#B45309` stroke, `#F59E0B` gradient fill (Bunker Volatility / Congestion).
  - Responsive viewBox with clean aspect ratio preservation (`preserveAspectRatio="none"` or responsive auto-fitting).

## 3. Placements & Integration
1. **Global Metrics Strip (`frontend/src/components/GlobalMetricsStrip.tsx`)**:
   - Integrated as subtle, elegant chart backgrounds into each metric card.
2. **New Analysis Simulation Drawer (`frontend/src/components/NewAnalysisDrawer.tsx`)**:
   - Integrated into the real-time simulation preview box, re-triggering animation when route or tonnage changes.

## 4. Quality & Accessibility
- Respects `prefers-reduced-motion` by reducing animation durations to 0s if enabled.
- Pure SVG geometry without pixelated canvases.
- Non-blocking layout with clean absolute background positioning.
