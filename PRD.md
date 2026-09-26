# Product Requirements Document (PRD)

**Project Name:** PRAVAH (प्रवाह) — Predictive Routing & Allocation for Vessel Analytics & Handling  
**Problem Statement ID:** SIH26006  
**Category:** Software | **Theme:** Transportation & Logistics  
**Client / Organisation:** Ministry of Steel (Steel Authority of India Limited - SAIL)  
**Target Delivery Horizon:** Q3 2026 (SIH 2026 Final Prototype Deadline: 30 September 2026)  
**Document Status:** Approved V1 Specification  

---

## 1. Executive Summary & Problem Context

### 1.1 The Operational Challenge
The Steel Authority of India Limited (SAIL) imports millions of metric tonnes (MT) of coking coal and raw bulk commodities annually from global origins (Australia, USA, Mozambique, Russia, Indonesia) into India's East Coast ports (Paradip, Visakhapatnam, Gangavaram, Gopalpur, Dhamra, Haldia, and Sagar-Sandheads lightering anchorage).

Currently, SAIL's chartering operations rely heavily on **daily spot market inquiries**. This traditional, reactive method results in:
1. **Missed Market Opportunities:** Inability to anticipate freight market dips to lock in cost-effective short-term (1–4 weeks) or mid-term (1–6 months) Contracts of Affreightment (COA) / period charters.
2. **Vessel-Port Mismatch & Demurrage Losses:** Inadequate automated matching between vessel deadweight (Handysize, Supramax/Ultramax, Panamax/Kamsarmax, Capesize) and dynamic port infrastructure constraints (maximum permissible draft, LOA, beam, tidal variations, and handling rates), leading to excessive waiting times and deadheading.
3. **Black-Box Scepticism:** Government procurement regulations require full auditability and transparency; opaque AI models cannot be trusted for public sector tenders.
4. **Supply Chain Disconnection:** Freight decisions are made in silos without real-time synchronization with steel plant inventory depletion (stock-out risks at Bhilai, Rourkela, Bokaro, Durgapur, Burnpur).

### 1.2 The Solution Vision
**PRAVAH** is an enterprise-grade, hybrid decision-intelligence platform that combines:
- **SeaRates-style accessibility:** Intuitive cargo-entry and multi-quote explorer UI.
- **Bloomberg-grade analytical depth:** Interactive time-series charts, candlestick views, and multi-factor sensitivity sliders.
- **Explainable Multi-Horizon ML Forecasting:** Probabilistic freight rate predictions (P10/P50/P90) across key dry-bulk shipping lanes.
- **Constrained Mathematical Optimization:** OR-Tools MIP solver that simultaneously optimizes vessel size, draft limits, landed INR cost, and plant stock-out deadlines.
- **PSU Strategic Shift:** Operationalizes the transition from fragmented spot fixtures to optimized medium-term COA portfolios.

---

## 2. Target Personas & User Journeys

| Persona | Role | Core Goals in PRAVAH | Key Pain Points Solved |
|---|---|---|---|
| **Central Chartering Officer** (SAIL Desk, New Delhi / Kolkata) | Decides vessel fixtures, laycan windows, and contract types (Spot vs. COA) | Find the optimal entry window to charter vessels; compare Capesize vs. Panamax landed costs; generate tender fixture notes. | Replaces manual broker calls with automated rate forecasts and optimal entry-timing signals. |
| **Port & Plant Logistics Planner** (Bhilai, Rourkela, Bokaro, Durgapur, Burnpur) | Manages port-to-plant inward coal logistics & stockyard inventory | Prevent blast-furnace stock-outs; monitor port draft/berth queues; assess demurrage risk. | Replaces siloed spreadsheets with real-time stock-out alarms linked directly to vessel arrival lead times. |
| **Finance & Commercial Director** (SAIL / Ministry of Steel) | Approves procurement budgets, audits expenditures, hedges macro risk | Track Total Landed Cost in ₹/MT (including BAF and USD/INR FX); review audit logs and "Regret Scores". | Eliminates currency/bunker surprises; provides defensible, explainable audit trails for CVC/CAG oversight. |

---

## 3. Key Performance Indicators (KPIs) & Target Metrics

| Metric | Baseline (Current As-Is) | Target (V1 With PRAVAH) |
|---|---|---|
| **Spot vs. COA Contract Ratio** | 85% Spot : 15% Medium-Term | 40% Spot : 60% Short/Mid-Term COA |
| **Average Freight Cost per MT** | Spot market benchmark | 6–11% reduction via optimal entry window timing |
| **Vessel Idle / Waiting Demurrage** | 3.5 to 5.2 days per discharge | < 1.8 days via automated draft & LOA pre-qualification |
| **Plant Stock-Out Incidents** | Reactive emergency spot fixtures | 0 stock-outs; proactive warning 21 days in advance |
| **Tender Preparation & Fixture Time** | 2–4 business days | < 15 minutes (auto-generated fixture specifications) |

---

## 4. Prioritized Functional Scope (Tiered Specifications)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TIER 1: COMPULSORY CORE MVP                          │
│  Multi-Horizon Forecast ── Port Constraint Matrix ── Spot vs COA       │
│  Total Landed Cost (₹)  ── Explainability Card   ── Disruption Scanner │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│              TIER 2: HIGH-PRIORITY DIFFERENTIATORS (SIH WINNERS)        │
│  Stock-Out Prevention ── Emergency Mode ── Trading Terminal Charts     │
│  Regret Score & Audit ── What-If Shock Simulator ── Idle Scenario      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    TIER 3: STRONG VALUE-ADDS                           │
│  Intra-SAIL Parcel Pooling ── Bilingual NLP Summaries ── RFQ Generator │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Tier 1: Core MVP (Must-Have)

#### 4.1.1 Multi-Horizon Freight Forecasting Engine
- **Corridors Covered (5 Origins → 7 East Coast Ports):**
  - Origins: Hay Point / Gladstone (Australia), Hampton Roads / US Gulf (USA), Maputo / Beira (Mozambique), Balikpapan / Samarinda (Indonesia), Vanino / Vostochny / Black Sea (Russia).
  - Destinations: Paradip, Visakhapatnam (Vizag), Gangavaram, Gopalpur, Dhamra, Haldia, Sagar-Sandheads (Lightering).
- **Vessel Classes:** Handysize (28k–39k DWT), Supramax/Ultramax (50k–65k DWT), Panamax/Kamsarmax (70k–85k DWT), Capesize (120k–180k DWT).
- **Forecast Horizons:**
  - Spot (1–7 days)
  - Short-term (1–4 weeks)
  - Mid-term (1–6 months)
- **Output:** Point forecast with **P10 (optimistic), P50 (median), P90 (pessimistic)** prediction bands and an actionable **Market Entry Recommendation** badge:
  - `STRONG BUY / FIX NOW` (Rate at cyclical trough, expected to surge >5%)
  - `WAIT / FLOAT` (Rate declining, delay chartering by $N$ days)
  - `COA HEDGE` (High forward volatility; lock 3-month multi-voyage contract)

#### 4.1.2 Port Infrastructure & Physical Constraint Optimizer
- **Living Ports Master Database:**
  - Maximum Permissible Draft (low tide vs. high tide)
  - Length Overall (LOA) & Beam limits
  - Maximum Air Draft / Berth Length
  - Daily Handling / Discharge Rate (MT/day)
  - Lightering requirement (e.g., Capesize lightens at Sagar/Sandheads before Haldia shallow-draft entry)
- **Suitability Validator:** Instant red/yellow/green verification indicating whether a proposed vessel class can berth fully laden, requires partial lightering, or is completely restricted.

#### 4.1.3 Spot vs. COA / Multi-Voyage Contract Evaluator
- Direct side-by-side financial comparison for fulfilling an annual/quarterly quota:
  - **Option 1: Consecutive Spot Fixtures** (High market exposure, zero commitment, high volatility risk).
  - **Option 2: 3-Month COA (3–6 Voyages)** (Negotiated discount, guaranteed vessel supply, demurrage caps).
  - **Option 3: 6-Month Period Charter** (Flat daily hire rate, fuel risk borne by charterer, maximum volume security).
- Outputs net estimated savings in ₹ Crores and percentage variance.

#### 4.1.4 Total Landed Cost Engine (₹/MT)
Calculates real out-of-pocket expenditure for SAIL Finance:
$$\text{Landed Cost (₹/MT)} = \left[ (\text{Base Freight}_{\text{USD}} + \text{BAF}_{\text{USD}} + \text{Insurance}_{\text{USD}}) \times \text{USD-INR Rate} \right] + \text{Port Tariffs}_{\text{INR}} + \text{Handling}_{\text{INR}} + \text{Expected Demurrage}_{\text{INR}}$$
Includes real-time sensitivity toggles for Bunker Price ($\pm 20\%$) and USD/INR exchange rate ($\pm 5\%$).

#### 4.1.5 Explainability Breakdown ("Yeh Recommendation Kyun Di")
For every recommendation card, an interactive decomposition bar chart presents the exact factor weighting:
- **Freight Momentum & Lags:** e.g., 40% (BDI & Baltic Supramax/Capesize curve)
- **Bunker Fuel Trend (VLSFO):** e.g., 20% (Singapore / Fujairah bunker prices)
- **Port Congestion Factor:** e.g., 25% (Vessel queue at discharge port)
- **Macro & Seasonal Demand:** e.g., 15% (Monsoon slowdown, Chinese steel mill demand)
Accompanied by a plain-language explanation generated from rule templates.

#### 4.1.6 Basic Disruption Scanner
- RSS / news keyword-matching ingestion scanning for: `cyclone`, `monsoon`, `port strike`, `strait of malacca`, `red sea`, `canal closure`, `cape of good hope detour`.
- Visual alert banner on the dashboard with alternative route/origin recommendations (e.g., *"Cyclone warning in Mozambique Channel; recommend switching to East Kalimantan, Indonesia for immediate parcel requirements"*).

---

### 4.2 Tier 2: High-Priority Differentiators (Hackathon Winning Features)

#### 4.2.1 Stock-Out Prevention & Runout Alert Engine
- **Inputs:** Steel plant selection (e.g., Rourkela Steel Plant - RSP), Current Coking Coal Inventory (MT), Daily Burn Rate (MT/day), Minimum Buffer Stock (days).
- **Calculation:**
  $$\text{Days to Stock-Out} = \frac{\text{Current Stock} - \text{Safety Buffer}}{\text{Daily Consumption}}$$
  $$\text{Lead Time} = \text{Tender Period (3d)} + \text{Laycan Arrival (5d)} + \text{Sailing Transit Days} + \text{Berthing Queue (2d)} + \text{Discharge Days}$$
- **Decision Engine:** If $\text{Days to Stock-Out} \le \text{Lead Time} + 7\text{ days}$, the system automatically triggers a **CRITICAL PROCUREMENT ALERT**, overriding "Wait" signals and displaying the exact date before which the fixture must be executed.

#### 4.2.2 Emergency Procurement Mode
- Single-click toggle on the search header.
- **Behavioral Shift:** Disables long-term cost optimization; switches optimizer objective function to:
  $$\text{Score} = w_1 \cdot \text{ETA} + w_2 \cdot \text{Feasibility} + w_3 \cdot \text{Cost}$$
- Ranks candidate fixtures on an **Emergency Fixture Matrix**:
  - *Option A:* Fast ETA, Premium Freight, 100% Port-Fit.
  - *Option B:* Medium ETA, Economy Freight, Needs Lightering.
  - *Option C:* Low Cost, Delayed Arrival (Flagged: **STOCK-OUT RISK**).

#### 4.2.3 Advanced Bloomberg-Style Trading Terminal UI
- Multi-panel dark-mode layout with customizable dockable widgets.
- Candlestick / OHLC charts for Baltic Dry routes with Bollinger Bands and 30-day moving averages.
- Route sparklines, live rate tickers, and seasonal heatmaps (Historical monthly volatility vs. current year).

#### 4.2.4 Regret Score & Decision Journal
- Records every user decision: Date, Vessel Class, Rate Locked, and Model's recommendation at that timestamp.
- **Post-Hoc Realized Analysis:**
  $$\text{Regret Amount} = (\text{Actual Locked Rate} - \text{Optimal Window Rate in Laycan}) \times \text{Volume (MT)}$$
- Displays cumulative institutional savings generated by following model guidance versus discretionary spot fixes.

#### 4.2.5 Interactive What-If Scenario Stress Tester
- Sliders for instant re-calculation:
  - Fuel Shock ($\pm \$100/\text{MT}$ VLSFO)
  - Currency Devaluation ($\text{USD/INR from } ₹84 \to ₹90$)
  - Discharge Port Congestion (Waiting time $+4$ days)
  - Origin Geopolitical Disruption (Mozambique export levy $+12\%$)
- Instant dynamic recalculation of P10/P50/P90 forecasts and vessel ranking without full backend retraining.

---

### 4.3 Tier 3: High-ROI Value-Adds

#### 4.3.1 Intra-SAIL Multi-Plant Parcel Pooling
- Aggregates concurrent import requirements from Bhilai (BSP), Rourkela (RSP), and Bokaro (BSL).
- Instead of chartering two separate Supramax vessels ($2 \times 55,000 \text{ MT}$ at $\$22/\text{MT}$), the engine recommends pooling into a single Capesize parcel ($110,000 \text{ MT}$ at $\$14.50/\text{MT}$) discharging at Paradip, followed by rake movement via Indian Railways (FOIS) to individual plants.
- Computes net combined savings: **$\approx ₹4.8 \text{ Crores}$ per joint shipment**.

#### 4.3.2 Simulated Fixture Workflow & BIMCO/GENCON Note Generator
- Converts the accepted quote into a pre-filled, downloadable **BIMCO Standard Fixture Note (Dry Bulk)** containing:
  - Agreed Freight Rate & Demurrage / Despatch rates (e.g., $\$18,000/\text{day}$ pro-rata)
  - Laycan Start and End dates
  - NOR (Notice of Readiness) stipulations and East Coast discharge draft warranties
  - Complete executive summary sheet for SAIL Board Tender Committee sign-off.

#### 4.3.3 Bilingual Executive Summary (English + Hindi)
- One-click toggle generating a high-level briefing in official Hindi (राजभाषा नीति compliance) and English summarizing market conditions and tender recommendations for Ministry briefings.

---

## 5. Technical Architecture & System Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND PRESENTATION LAYER                     │
│  Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui      │
│  State: Zustand | Data Fetching: TanStack Query v5                     │
│  Visualizations: Recharts + TradingView Lightweight Charts + Leaflet  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST / SSE
┌───────────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY & BACKEND CORE (FastAPI)                │
│  Endpoints: /forecast  /optimize  /landed-cost  /stockout  /scenario   │
│  Validation: Pydantic v2 | Background Tasks & Caching: Redis           │
└─────────────┬───────────────────────────────────────────┬──────────────┘
              │                                           │
┌─────────────▼──────────────────────────┐  ┌─────────────▼──────────────┐
│       PREDICTIVE ML ENGINE             │  │   OPTIMIZATION SOLVER      │
│  • StatsForecast (AutoARIMA, MSTL)     │  │  • Google OR-Tools (MIP)   │
│  • MLForecast (LightGBM, XGBoost)      │  │  • Draft/LOA Feasibility   │
│  • Prophet Seasonality & Events        │  │  • Multi-Plant Stem Pool   │
│  • SHAP / Weight Factor Explainability │  │  • Emergency Cost/ETA Rank │
└─────────────┬──────────────────────────┘  └─────────────┬──────────────┘
              │                                           │
┌─────────────▼───────────────────────────────────────────▼──────────────┐
│                       PERSISTENCE & DATA PIPELINE                      │
│  • PostgreSQL + TimescaleDB (Historical Rates, Port Master, Fixes)     │
│  • Parquet Data Lakehouse (Baltic Capesize/Panamax, Bunker, FX series) │
│  • Curated Static Seed Pack (100% Offline-Demo Capable)                │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Tech Stack Breakdown
- **Frontend:** Next.js 15 (React 19, TypeScript), Tailwind CSS, `shadcn/ui`, Lucide Icons, `@tanstack/react-table`, `recharts`, `lightweight-charts`, `leaflet`.
- **Backend & ML Services:** Python 3.12, FastAPI (async), Pydantic v2, `polars`, `numpy`, `scipy`.
- **Forecasting Libraries:** `statsforecast` (AutoARIMA, AutoETS, MSTL), `mlforecast` + `lightgbm`, `prophet`.
- **Optimization:** `ortools` (Google Operations Research Tools - Mixed-Integer Programming).
- **Database:** PostgreSQL (TimescaleDB enabled) for historical time-series and relational master data; SQLite local fallback.
- **Containerization:** Docker & Docker-Compose (Next.js + FastAPI + Postgres + Redis).

---

## 6. Mathematical Formulations & Optimization Model

### 6.1 Multi-Horizon Rate Ensemble
For route $r$, vessel class $v$, and forward day $t$:
$$\hat{Y}_{r,v,t} = w_1 \cdot \hat{Y}_{\text{LightGBM}}(t) + w_2 \cdot \hat{Y}_{\text{AutoARIMA}}(t) + w_3 \cdot \hat{Y}_{\text{Prophet}}(t)$$
Where weights $w_i$ are dynamically calibrated using rolling walk-forward mean absolute percentage error (MAPE) over the preceding 30 days:
$$w_i = \frac{\frac{1}{\text{MAPE}_i}}{\sum_k \frac{1}{\text{MAPE}_k}}$$

Prediction intervals:
$$\text{P10} = \hat{Y} - z_{0.10} \cdot \sigma_{\text{residual}}, \quad \text{P90} = \hat{Y} + z_{0.90} \cdot \sigma_{\text{residual}}$$

### 6.2 Mixed-Integer Optimization for Vessel Allocation
Given a required cargo parcel size $Q$ (MT) between origin $o$ and discharge port $d$ with deadline $T_{\text{max}}$:
$$\min \sum_{v \in V} \sum_{t \in T} \left( \text{LandedCost}(v, t) \cdot x_{v,t} + \text{DemurragePenalty}(v, d) \cdot x_{v,t} \right)$$
**Subject to:**
1. **Demand fulfillment:** $\sum_{v} \sum_{t} \text{Capacity}(v) \cdot x_{v,t} \ge Q$
2. **Draft compliance:** $\text{Draft}(v) \cdot x_{v,t} \le \text{MaxDraft}(d, t)$ (or trigger lightering constraint)
3. **LOA & Beam compliance:** $\text{LOA}(v) \le \text{MaxLOA}(d)$, $\text{Beam}(v) \le \text{MaxBeam}(d)$
4. **Stock-out deadline constraint:** $t + \text{TransitTime}(o, d) \le T_{\text{stockout\_limit}}$
5. **Binary decision variable:** $x_{v,t} \in \{0, 1\}$

---

## 7. Data Ingestion & Seeding Schema

### 7.1 Historical Datasets (Pre-Seeded for 100% Offline Demo Guarantee)
1. **Freight Indexes (2018–2026):**
   - Baltic Dry Index (BDI)
   - Baltic Capesize Index (BCI 180k)
   - Baltic Panamax Index (BPI 82k)
   - Baltic Supramax Index (BSI 58k)
   - Key Corridors ($/MT): Hay Point $\to$ Paradip, Gladstone $\to$ Vizag, Hampton Roads $\to$ Dhamra, Maputo $\to$ Haldia, East Kalimantan $\to$ Paradip.
2. **Exogenous Series:**
   - Singapore VLSFO 0.5% & Marine Gas Oil (MGO) prices ($/MT)
   - USD-INR Exchange Rates (RBI Reference rates)
   - Thermal & Coking Coal FOB benchmark indices (Platts / Argus proxies)
   - Port Congestion index (average waiting days per port)
3. **Port Infrastructure Master:**
   - 7 Indian East Coast Ports + 5 Global Loading Ports (Draft, LOA, Beam, Daily discharge capacity, Port dues per GRT).
4. **SAIL Operational Master:**
   - 5 Integrated Steel Plants (BSP, RSP, BSL, DSP, ISP) daily coking coal consumption rates (approx. 8,000–18,000 MT/day) and standard stockyard capacities.

---

## 8. API Specifications (FastAPI Core)

### `POST /api/v1/forecast`
- **Request Body:**
  ```json
  {
    "origin_port": "HAY_POINT_AU",
    "destination_port": "PARADIP_IN",
    "vessel_class": "CAPESIZE",
    "horizon_days": 60
  }
  ```
- **Response:**
  ```json
  {
    "corridor": "HAY_POINT_AU -> PARADIP_IN",
    "vessel_class": "CAPESIZE",
    "current_spot_usd": 15.40,
    "forecast": [
      { "date": "2026-10-01", "p10": 13.80, "p50": 14.50, "p90": 15.30 },
      { "date": "2026-10-15", "p10": 12.90, "p50": 13.60, "p90": 14.40 }
    ],
    "optimal_window": {
      "recommended_date": "2026-10-18",
      "action": "WAIT_THEN_FIX",
      "expected_savings_usd_mt": 1.80
    }
  }
  ```

### `POST /api/v1/optimize`
- **Request Body:**
  ```json
  {
    "cargo_type": "COKING_COAL",
    "quantity_mt": 140000,
    "origin_port": "GLADSTONE_AU",
    "destination_port": "HALDIA_IN",
    "plant_id": "DURGAPUR_STEEL_PLANT",
    "emergency_mode": false
  }
  ```
- **Response:**
  ```json
  {
    "recommended_vessel": "PANAMAX",
    "parcel_split": "2 x 70,000 MT Panamax (Direct Haldia Berthing)",
    "draft_status": "COMPLIANT_WITH_HIGH_TIDE",
    "lightering_needed": false,
    "total_landed_cost_inr_crores": 32.4,
    "cost_per_mt_inr": 2314.28,
    "spot_vs_coa": {
      "spot_total_inr_cr": 35.1,
      "coa_total_inr_cr": 32.4,
      "projected_savings_inr_cr": 2.7
    }
  }
  ```

### `GET /api/v1/stockout/alert/{plant_id}`
- Returns days of autonomy remaining, expected arrival date of in-transit vessels, and urgency level (`NORMAL`, `WATCH`, `CRITICAL`).

### `GET /api/v1/explain/{recommendation_id}`
- Returns weighted factor breakdown (Freight trend %, Bunker %, Congestion %, Seasonality %) with natural language narrative in English and Hindi.

---

## 9. Non-Functional & Security Requirements

1. **Performance & Latency:**
   - Cached / Precomputed corridor queries: $< 250\text{ ms}$.
   - Full OR-Tools Optimization run: $< 1.5\text{ seconds}$.
2. **Reliability & Offline Demo Guarantee:**
   - The platform must function with 100% feature parity in an isolated localhost / offline presentation environment via seeded SQLite/PostgreSQL and cached ML weights.
3. **Auditability & Compliance:**
   - Every fixture recommendation must be timestamped and stored with the exact snapshot of model weights and input parameters to satisfy Central Vigilance Commission (CVC) procurement scrutiny.
4. **Data Privacy:**
   - Internal plant consumption rates and strategic target prices must be protected with Role-Based Access Control (RBAC: `Logistics_Planner`, `Chartering_Desk`, `Director_Commercial`).

---

## 10. Phased Development Roadmap (SIH Milestone Plan)

| Phase | Milestone Name | Key Deliverables |
|---|---|---|
| **Phase 1 (Week 1–2)** | **Data & Foundation Sprint** | Historical datasets curation; PostgreSQL schema; StatsForecast + LightGBM models trained; basic FastAPI `/forecast` endpoints; Next.js scaffolding with dark-mode theme. |
| **Phase 2 (Week 3–4)** | **Core Engine & Optimization** | Port infrastructure database; OR-Tools MIP solver integration; Total Landed Cost calculator in ₹; Spot vs. COA comparison matrix; Explainability bar charts. |
| **Phase 3 (Week 5–6)** | **Differentiators & Decision Layer** | Stock-Out Prevention module; Emergency Mode toggle; Trading Terminal charts (candlesticks, sparklines); Disruption scanner alert system; Regret score tracker. |
| **Phase 4 (Week 7–8)** | **Enterprise Polish & Demo Readiness** | Intra-SAIL Multi-Plant Pooling; BIMCO Fixture Note PDF/doc generator; Bilingual Hindi/English summary; Docker-Compose containerization; Local offline test dry-run. |

---

## 11. Sign-Off & Approval

- **Product Manager:** Antigravity AI  
- **Lead System Architect:** Confirmed (FastAPI + Next.js 15 Hybrid Architecture)  
- **Client Stakeholder:** SAIL / Ministry of Steel Logistics Evaluation Committee  
- **Version:** 1.0.0-PROD-SPEC
