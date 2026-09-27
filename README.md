# PRAVAH — Freight Intelligence Platform for Bulk Maritime Procurement

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-orange.svg)](https://sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-26006-blue.svg)](https://sih.gov.in/)
[![Theme](https://img.shields.io/badge/Theme-Smart%20Port%20Logistics-teal.svg)](https://sih.gov.in/)
[![Ministry](https://img.shields.io/badge/Ministry-Steel%20(MoS)-silver.svg)](https://steel.gov.in/)
[![Organization](https://img.shields.io/badge/Organization-SAIL-darkblue.svg)](https://www.sail.co.in/)

An operational **multi-engine freight intelligence platform** built for **Smart India Hackathon 2026** (Problem Statement ID: **26006**).

PRAVAH helps SAIL's chartering desk decide which vessel class to hire, at what rate, and when — for bulk coal and iron ore shipments across 4 major Indian ports. It runs a 10-engine ML pipeline on each analysis request: freight rate forecasting (LightGBM quantile ensemble), port-vessel feasibility, landed cost, supply chain risk, cargo pooling, stockout detection, regret analysis, and a weighted recommendation with a full override audit trail.

---

## Table of contents

- [Problem statement and background](#problem-statement-and-background)
- [System architecture](#system-architecture)
- [Core features](#core-features)
- [Tech stack](#tech-stack)
- [ML engine pipeline](#ml-engine-pipeline)
- [REST API endpoints](#rest-api-endpoints)
- [Setup and running instructions](#setup-and-running-instructions)
- [Project directory structure](#project-directory-structure)
- [What is real vs. simulated](#what-is-real-vs-simulated)

---

## Problem statement and background

**Organization:** Ministry of Steel (MoS)  
**Department:** Steel Authority of India Limited (SAIL) — Chartering Division  
**Challenge:** SAIL operates five steel plants (Bhilai, Rourkela, Bokaro, Durgapur, Burnpur) that together import millions of tonnes of coking coal and iron ore annually. Each chartering decision — which vessel class, which broker, which laycan window — is currently made by hand, against live Baltic Dry Index movements, incomplete broker quote sets, and no systematic way to pool sub-optimal parcels across plants.

PRAVAH solves three specific failures in that workflow:

1. **No rate forecast.** Officers negotiate against a spot market with no forward-looking reference. PRAVAH runs a LightGBM quantile ensemble trained on BDI history, bunker prices, and seasonal loading patterns to produce a calibrated rate prediction with confidence intervals.
2. **No feasibility check.** A Capesize vessel cannot enter Paradip at full draft. This constraint is checked manually, inconsistently. PRAVAH's feasibility engine validates every (vessel class, port, tonnage) combination against physical port constraints before any recommendation is made.
3. **No cargo pooling.** Two plants sending 35,000 MT and 40,000 MT to the same port on separate Panamax fixtures pay more per MT than one plant sending 75,000 MT. PRAVAH's pooling engine detects and prices consolidation opportunities across the demand board.

---

## System architecture

```
+------------------------------------------------------------------------------+
|                         DATA SOURCES                                         |
+------------------+-----------------------------------+-----------------------+
| Baltic Dry Index | VLSFO Bunker Prices               | Port Reference Data   |
| (simulated feed) | (simulated feed)                  | (4 ports, SQLite)     |
+--------+---------+-----------------+-----------------+----------+------------+
         |                           |                             |
         v                           v                             v
+------------------------------------------------------------------------------+
|                      FASTAPI BACKEND (app/main.py)                           |
+------------------------------------------------------------------------------+
| Auth: JWT Bearer tokens / bcrypt / role-gated routes                         |
| ORM: SQLAlchemy 2.0 + Alembic migrations                                    |
| DB:  SQLite (local dev) / PostgreSQL (production, Render)                    |
+-----------------------------------+------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------------+
|                      ML ENGINE PIPELINE (app/engines/)                       |
+------------------------------------------------------------------------------+
|  1. context_engine       -- Resolves port LOCODEs, vessel classes, commodity  |
|  2. forecast_engine      -- LightGBM quantile ensemble: rate PMT + CI bands  |
|  3. feasibility_engine   -- Draft/LOA/beam check per port; rejects bad combos|
|  4. landed_cost_engine   -- Freight + currency conversion = full cost per MT  |
|  5. risk_engine          -- Geopolitical alerts, seasonality, weather scoring |
|  6. pooling_engine       -- Cargo consolidation opportunity detection         |
|  7. stockout_engine      -- Days-to-stockout from usage rate + open sea days  |
|  8. coa_comparison_engine-- Spot vs. Contract of Affreightment pricing delta  |
|  9. recommendation_engine-- Weighted scoring across all engine outputs        |
| 10. regret_engine        -- Post-decision regret tracking against actuals     |
+-----------------------------------+------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------------+
|                      REST API (9 endpoint groups)                            |
+------------------------------------------------------------------------------+
| /auth  /analyses  /metrics  /quotes  /map  /bookings  /demand  /admin  /audit|
+-----------------------------------+------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------------+
|                 NEXT.JS 16 FRONTEND (next-app/)                              |
+------------------------------------------------------------------------------+
| * Dashboard: BDI ticker, freight rate trend, active alerts                   |
| * New analysis form: 5 required inputs, 2 optional stockout inputs           |
| * Results page: recommendation, alternatives, ship fit, risk table, cost     |
| * Scenario comparison: side-by-side analysis across parameter variants       |
| * Demand board: plant cargo requests + cargo pooling merge action            |
| * Live map: simulated vessel position along maritime corridor                 |
| * Admin panel: user management, port/vessel reference data, audit log        |
+------------------------------------------------------------------------------+
```

---

## Core features

### 1. LightGBM quantile freight rate forecasting

The forecast engine trains a gradient-boosted quantile regression model on Baltic Dry Index time series, VLSFO bunker prices, route distance, commodity type, and seasonal loading patterns. It outputs three bands: P10 (optimistic), P50 (median), and P90 (conservative), so officers can negotiate with a reference range rather than a point guess.

### 2. Port-vessel feasibility validation

Every (vessel class, destination port, parcel tonnage) combination passes through the feasibility engine before a recommendation is issued. The engine checks draft clearance, LOA limits, and beam restrictions against the port reference table. A Capesize at Paradip at full draft fails immediately — with the constraint that tripped it listed — rather than surfacing as an option the officer has to reject manually.

### 3. Cargo pooling across SAIL plants

When two or more plant cargo requests share a destination port and their combined tonnage fits a larger vessel class, the pooling engine flags the consolidation and computes projected freight savings. A 40,000 MT Bhilai request and a 35,000 MT Rourkela request to Paradip can merge into a single 75,000 MT Panamax fixture at a lower rate per MT. Officers trigger the merge from the demand board with one action.

### 4. Multi-factor risk scoring

The risk engine produces a composite risk score from three inputs: geopolitical disruption alerts (keyword-matched against a news feed, with Red Sea rerouting as the current standing alert), seasonal monsoon loading windows per origin port, and aggregate freight market volatility. Each factor is scored and weighted into a single risk level (Low / Medium / High / Critical) with contributing factors listed.

### 5. Stockout detection

If a plant provides its current stock level and daily consumption rate, the stockout engine computes days to zero stock and compares that against the expected open-sea transit time for the recommended vessel class and route. When the transit window crosses the stockout threshold, it raises a priority alert on the results page.

### 6. Spot vs. CoA comparison

The CoA comparison engine takes the predicted spot rate and compares it against a contract rate the officer can adjust. It outputs a break-even tonnage volume and a cost delta over a 12-month horizon, giving the chartering desk a structured view of when locking into a long-term contract becomes worthwhile.

### 7. Override audit trail

When an officer chooses a vessel class or rate that differs from the system recommendation, the decision form captures the override reason. The approval workflow (Officer creates, Manager approves or rejects) is enforced at the API level, not just in the UI. Every approval, rejection, and override is written to an immutable audit log with actor ID and timestamp.

### 8. Regret tracking

After a decision is finalized, the regret engine records the predicted rate against the eventual market rate (once available). Over time this generates a per-analyst regret score the chartering manager can review to identify systematic biases in how officers deviate from model recommendations.

---

## Tech stack

```
+-------------------------------------------------------------------------------+
|                           TECHNOLOGY LANDSCAPE                                |
+-------------------------+------------------------+--------------------------+
| Frontend                | Backend                | ML and data              |
| Next.js 16              | Python 3.10+ / FastAPI | LightGBM (quantile reg.) |
| React 19 / TypeScript 5 | SQLAlchemy 2.0/Alembic | scikit-learn / joblib    |
| Tailwind CSS v4         | SQLite (dev)/Postgres  | NumPy / Pandas / scipy   |
| shadcn/ui + Base UI     | JWT auth / bcrypt      | statsmodels              |
| Framer Motion           | Render (production)    | Alembic migrations       |
| Lucide React            | Vercel (frontend)      |                          |
+-------------------------+------------------------+--------------------------+
```

<p align="left">
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <br>
  <img src="https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LightGBM-02569B?style=for-the-badge&logo=lightgbm&logoColor=white" alt="LightGBM" />
  <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-Learn" />
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## ML engine pipeline

Each call to `POST /analyses` runs all 10 engines in sequence. The pipeline lives in `backend/app/engines/`.

| Step | Engine file | What it does |
| :---: | :--- | :--- |
| **1** | `context_engine.py` | Resolves input strings to typed domain objects: port records, vessel class specs, commodity coefficients |
| **2** | `forecast_engine.py` | LightGBM quantile regression: produces P10/P50/P90 freight rate bands per MT |
| **3** | `feasibility_engine.py` | Validates vessel draft, LOA, beam against port constraints; rejects infeasible combinations early |
| **4** | `landed_cost_engine.py` | Computes total landed cost per MT: freight rate + bunker share + USD/INR conversion |
| **5** | `risk_engine.py` | Scores geopolitical disruption alerts, seasonality, and freight market volatility into a composite risk level |
| **6** | `pooling_engine.py` | Identifies cargo consolidation opportunities across open plant demand requests |
| **7** | `stockout_engine.py` | Computes days-to-zero-stock; raises alert when transit time exceeds stockout window |
| **8** | `coa_comparison_engine.py` | Calculates spot vs. CoA break-even tonnage and 12-month cost delta |
| **9** | `recommendation_engine.py` | Weighted scoring across all engine outputs; selects best vessel class, rate, and route |
| **10** | `regret_engine.py` | Records predicted rate against post-decision actuals for analyst regret tracking |

---

## REST API endpoints

The FastAPI backend runs on port `8000`. Production is deployed on Render at `https://astitva-api.onrender.com`.

Authentication uses `Authorization: Bearer <token>` on all protected routes.

### Auth (`/auth`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/auth/login` | `POST` | Issues a signed JWT for valid credentials |
| `/auth/register` | `POST` | Creates an account pending admin activation |
| `/auth/forgot-password` | `POST` | Issues a timed password reset token |
| `/auth/reset-password` | `POST` | Completes reset using a cryptographic token |
| `/auth/switch-role` | `POST` | Changes active role for multi-role accounts |

### Freight analysis (`/analyses`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/analyses` | `GET` | Paginated list of past analyses with status filter |
| `/analyses` | `POST` | Runs the full 10-engine pipeline and returns a recommendation |
| `/analyses/{id}` | `GET` | Retrieves a single analysis with all engine outputs |
| `/analyses/{id}/decision` | `POST` | Records a procurement officer chartering decision |
| `/analyses/{id}/decision/approve` | `POST` | Manager approval; triggers `DECISION_RECORDED` audit event |
| `/analyses/{id}/decision/reject` | `POST` | Rejects decision with reason; marks for re-computation |
| `/analyses/disruption-alerts` | `GET` | Returns active geopolitical disruption alerts |

### Market metrics (`/metrics`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/metrics/global` | `GET` | Live BDI, average freight rate PMT, VLSFO bunker price, Capesize and Panamax day rates, and 7-day time series for each |

### Quotes (`/quotes`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/quotes` | `GET` | Sample broker quotes alongside the system's predicted rate, clearly labeled as sample data |

### Maritime routing (`/map`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/map/route` | `GET` | Great-circle distance and lat/lon waypoints between origin and destination port LOCODEs |
| `/map/ship-position` | `GET` | Linear interpolation of vessel position along corridor at a given `progress_pct` (simulated, not AIS) |

### Bookings (`/bookings`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/bookings` | `POST` | Creates a charter fixture note and locks laycan window for a finalized analysis |
| `/bookings` | `GET` | Lists all historical and active charter fixtures |

### Demand board (`/demand`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/demand` | `GET` | Open cargo requests across all SAIL plants |
| `/demand/merge` | `POST` | Consolidates two or more requests into a single parcel; returns projected savings |

### Administration (`/admin`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/admin/users` | `GET` | Lists all system users |
| `/admin/users` | `POST` | Creates a user with assigned role |
| `/admin/users/{id}/deactivate` | `PATCH` | Deactivates credentials without deleting history |
| `/admin/reference` | `GET` | Returns port and vessel class reference constraints |
| `/admin/reference/ports/{id}` | `PUT` | Updates port draft and dimensional specifications |

### Audit and health

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/audit-logs` | `GET` | Immutable log of all auth events, role changes, decisions, and overrides |
| `/health` | `GET` | Returns `{"status": "ok", "service": "Astitva Core API"}` |

---

## Setup and running instructions

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher with npm

### Backend

```bash
# Clone the repository
git clone https://github.com/imstillashish/Pravah.git
cd Pravah

# Create and activate virtual environment
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

Open a separate terminal:

```bash
cd next-app
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Run both together (dev shortcut)

```bash
chmod +x dev.sh
./dev.sh
```

---

## Project directory structure

```
Pravah/
+-- backend/
|   +-- app/
|   |   +-- api/                    # Route handlers (one file per endpoint group)
|   |   +-- engines/                # ML pipeline engines
|   |   |   +-- context_engine.py   # Input resolution
|   |   |   +-- forecast_engine.py  # LightGBM quantile rate forecast
|   |   |   +-- feasibility_engine.py # Port-vessel constraint validation
|   |   |   +-- landed_cost_engine.py # Total landed cost per MT
|   |   |   +-- risk_engine.py      # Geopolitical + seasonality risk scoring
|   |   |   +-- pooling_engine.py   # Cargo consolidation detection
|   |   |   +-- stockout_engine.py  # Days-to-zero-stock alert
|   |   |   +-- coa_comparison_engine.py # Spot vs. CoA cost analysis
|   |   |   +-- recommendation_engine.py # Weighted final recommendation
|   |   |   +-- regret_engine.py    # Post-decision regret tracking
|   |   +-- models/                 # SQLAlchemy ORM models
|   |   +-- services/               # Business logic layer
|   |   +-- connectors/             # External data feed connectors
|   |   +-- utils/                  # Shared utilities
|   |   +-- main.py                 # FastAPI application and router registration
|   |   +-- models.py               # Consolidated model definitions
|   |   +-- schemas.py              # Pydantic request/response schemas
|   |   +-- database.py             # SQLAlchemy session and engine setup
|   |   +-- security.py             # JWT creation and verification
|   |   +-- config.py               # Environment-based configuration
|   |   +-- metrics_service.py      # Global market metrics service
|   +-- alembic/                    # Database migrations
|   +-- tests/                      # Pytest test suite
|   +-- requirements.txt            # Python dependencies
|   +-- alembic.ini
|   +-- logistics.db                # SQLite database (local dev)
+-- next-app/                       # Next.js 16 frontend
|   +-- app/                        # App Router pages and layouts
|   +-- components/                 # UI components (shadcn/ui + custom)
|   +-- hooks/                      # Custom React hooks
|   +-- lib/                        # API client and utility functions
|   +-- public/                     # Static assets
+-- ml/                             # ML training scripts and model artifacts
+-- scripts/                        # Data seeding and utility scripts
+-- docs/
|   +-- API_CONTRACT.md             # Full API contract with request/response shapes
|   +-- Features.md                 # Page-by-page feature specification
|   +-- DEMO_CHEAT_SHEET.md         # Demo walkthrough for judges
+-- DESIGN.md                       # Visual design system reference
+-- render.yaml                     # Render deployment configuration (backend)
+-- vercel.json                     # Vercel deployment configuration (frontend)
+-- dev.sh                          # Concurrent dev runner
+-- README.md
```

---

## What is real vs. simulated

This is a hackathon prototype. Some parts use live computation; others use seeded data to show how the system would behave in production.

| Feature | Status | Note |
| :--- | :--- | :--- |
| ML freight rate forecast | Real | LightGBM model trained on historical BDI and route data |
| Port feasibility check | Real | Validated against actual port depth/LOA/beam specifications |
| Cargo pooling calculation | Real | Computed from actual demand records in the database |
| Stockout detection | Real | Computed from user-supplied stock and usage inputs |
| CoA comparison | Real | Computed from predicted spot rate and user-supplied contract rate |
| BDI and bunker prices | Simulated | Static seed values; updated on each dev server start |
| Broker quotes | Simulated | Sample data, labeled on the Quotes page |
| Live ship position | Simulated | Linear interpolation; not connected to AIS |
| Disruption news alerts | Simulated | Keyword-matched against a seeded news dataset |

---

## Acknowledgments

- **Event:** Smart India Hackathon 2026
- **Problem Statement:** PS-26006
- **Organization:** Steel Authority of India Limited (SAIL), Ministry of Steel
- **Freight data reference:** Baltic Exchange (BDI), Platts VLSFO assessments
- **Port specifications:** Indian Ports Association draft and dimensional data
