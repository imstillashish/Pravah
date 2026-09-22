# Technical Specification: Dashboard Command Center & Analysis Engine

## 1. Overview
This specification details the Command Center dashboard for the SIH26006 Intelligent Freight Forecasting platform. It enables bulk cargo procurement and chartering officers to monitor real-time global freight metrics, review the last 5 historical analyses with distinct status indicators (Draft, Finalized, Overridden), and launch a slide-over simulation engine to run and record new freight analyses.

## 2. Architecture & Data Flow
- **Backend**: FastAPI with SQLAlchemy & SQLite (`logistics.db`).
  - Table: `analyses` (foreign key to `users.id`).
  - Endpoints:
    - `GET /api/metrics/global`: Returns BDI index, average route freight rate, and fuel bunker prices.
    - `GET /api/analyses/recent`: Returns the user's 5 most recent analyses, auto-seeded with realistic initial analyses if empty.
    - `POST /api/analyses`: Accepts scenario inputs, calculates recommended vessel class and rate savings, persists the record, and returns the newly created analysis object.
- **Frontend**: React (Vite + Tailwind CSS + Lucide Icons) adhering to the Wise Design System (`DESIGN.md`).
  - Interactive slide-over drawer for scenario creation.
  - Natural status badges: `Finalized` (Wise green), `Draft` (neutral slate), `Overridden` (amber caution).

## 3. Data Schema & Models

### 3.1 Database Table (`analyses`)
- `id`: Integer primary key
- `user_id`: Integer (foreign key to `users.id`)
- `title`: String
- `origin_country`: String
- `origin_port`: String
- `destination_port`: String
- `commodity`: String
- `parcel_tonnage`: Integer
- `recommended_vessel`: String
- `predicted_rate_pmt`: Float
- `benchmark_spot_pmt`: Float
- `estimated_savings_usd`: Float
- `status`: String (`draft` | `finalized` | `overridden`)
- `created_at`: Datetime

### 3.2 API Contracts
- `GET /api/metrics/global`
  - Response:
    ```json
    {
      "bdi_index": 1842,
      "bdi_change_pct": 2.4,
      "current_avg_freight_pmt": 14.85,
      "freight_change_pct": -6.8,
      "bunker_vlsfo_pmt": 612.50,
      "capesize_daily_usd": 22450,
      "panamax_daily_usd": 14120
    }
    ```
- `GET /api/analyses/recent`
  - Headers: `Authorization: Bearer <token>`
  - Response: `List[AnalysisResponse]` (limit 5)
- `POST /api/analyses`
  - Headers: `Authorization: Bearer <token>`
  - Request:
    ```json
    {
      "origin_country": "Australia",
      "origin_port": "Hay Point",
      "destination_port": "Paradip",
      "commodity": "Coking Coal",
      "parcel_tonnage": 75000,
      "status": "finalized"
    }
    ```
  - Response: `AnalysisResponse`

## 4. UI & Interaction Design
- **Global Metrics Strip**:
  - 3 metric cards featuring clear visual hierarchy, bold Wise sans numbers, and delta indicators.
- **Recent Analysis Feed**:
  - High-scanability table showing route, cargo parcel, vessel class, rate per metric tonne, total estimated cost savings, and status badge.
- **Interactive Slide-over Simulation Drawer**:
  - Accessible drawer opening on `+ Run New Analysis`.
  - Live preview of vessel compatibility and draft constraints for destination ports (e.g. Haldia 14.5m limit vs. Paradip 17.5m).
  - Instant dispatch to API and optimistic/seamless feed update.

## 5. Testing & Verification
- Unit test suite in `backend/tests/test_analyses_api.py` verifying:
  - `GET /api/metrics/global` response structure.
  - User-specific isolation of recent analyses.
  - Creation of new analyses with valid status transitions.
- Frontend build verification with zero type or lint errors.
