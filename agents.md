# `agents.md` — Autonomous Agent Architecture & System Guide

> **Project**: Astitva (SIH26006) — Intelligent Maritime Freight Forecasting & Bulk Chartering System  
> **Client / Target**: SAIL (Steel Authority of India Limited) / Ministry of Steel, Government of India  
> **Repository**: `imstillashish/Astitva`  
> **Active Feature Branch**: `feat/ps-features` (anchored to `origin/main` at `fb6ed7c`)  
> **Operating Mode**: Ponytail Ultra Mode (YAGNI, minimal code, root-cause fixes, zero unrequested bloat)

---

## 1. System Overview & Problem Statement

Astitva is a specialized maritime intelligence platform that optimizes raw material procurement (coking coal, iron ore, limestone, thermal coal) and vessel chartering for Indian steel manufacturing. It ingests global trade lane indicators, forecasts freight rate quantiles, enforces dual-port physical berth feasibility, integrates climatological disruption factors, and calculates vessel idle time turnaround with alternative employment fixtures.

### Core Problem Statement (SIH26006) Feature Pillars

1. **Idle Time Forecasting & Alternative Employment Recommendations**:
   - Computes origin load berth wait (`1.4d` to `4.1d`), Indian discharge berth queue (`1.5d` to `4.5d`), contract laytime, and financial demurrage risk exposure.
   - Demurrage benchmarks: Handysize ($14,000/d), Supramax ($18,500/d), Panamax ($24,000/d), Capesize ($36,000/d).
   - Generates and ranks 4 actionable commercial alternative employments to absorb empty ballast deadheading (typically 15–18.5 days return steaming):
     * **Domestic Cabotage**: Coastal Coal Cabotage (`Paradip` → `Ennore / Tuticorin`) under DG Shipping RSR guidelines.
     * **Backhaul Export**: Mineral pellet or bauxite export run (`Paradip / Vizag` → `Qingdao, China`).
     * **Time-Charter Relet**: Short-term period relet in Southeast Asian trades (`Singapore Hub / Malacca Strait`).
     * **Speed Optimization**: Virtual Arrival & Eco-Speed slow steaming at 10.8 knots to synchronize berth readiness with ~28% bunker savings.
2. **Global Origin Ports Infrastructure & Dual-Port Feasibility Validator**:
   - Tracks 14 verified terminals with LOCODE coordinates, depth, beam, LOA, loading rates, and live vessel queues:
     * **Australia (4)**: Hay Point DBCT (`AUHPT`, 19.5m draft, 220k DWT), Gladstone (`AUGLT`, 17.5m draft), Newcastle (`AUNTL`, 15.2m draft), Abbot Point (`AUABP`, 18.5m draft).
     * **United States (2)**: Hampton Roads / Norfolk (`USORF`, 15.2m draft), Baltimore (`USBAL`, 15.5m draft).
     * **Mozambique (2)**: Maputo Matola Coal (`MZMPM`, 13.0m draft), Beira (`MZBEW`, 10.5m draft).
     * **Indonesia (2)**: Samarinda (`IDSRI`, 12.5m draft), Balikpapan (`IDBPN`, 14.0m draft).
     * **India Discharge (4)**: Paradip (`INPRT`, 16.5m draft), Dhamra (`INDHM`, 18.0m draft), Visakhapatnam / Gangavaram (`INGAV`, 21.0m draft), Haldia (`INHLD`, 9.1m draft).
   - Dual-Port Feasibility validates draft, LOA, beam, and DWT limits at **both** origin load port and discharge port.
3. **Month-Indexed Seasonal Climatology & Bilingual Explainability**:
   - 12-month climatological profiles (multipliers `1.05x` to `1.26x`):
     * *Months 6–8*: South-West Monsoon in the Bay of Bengal (heavy sea swell, Sandheads lightering suspended, Paradip discharge slowdown).
     * *Months 1–2*: Queensland tropical cyclone season (Hay Point / Gladstone rail outages & anchorage closures).
     * *Months 11–12*: East Asian winter heating and raw material restocking rush.
   - Bilingual (English & Hindi) explainability narrative generator embedded in Section 4B with real-time toggle.
4. **Global Economic Indicators & Port Congestion Telemetry**:
   - Real-time Baltic Dry indices (BDI, BCI, BPI, BSI), Australian Coking Coal FOB ($/MT), 62% Fe Iron Ore CFR ($/MT), Domestic Coal parity (₹/MT), Global Manufacturing PMI, and China Blast Furnace Utilization (%).

---

## 2. Technology Stack & Runtime Topology

### Backend Stack
| Layer | Technology | Version | Location / Details |
|---|---|---|---|
| **Language** | Python | 3.13.14 | `backend/venv/` |
| **Framework** | FastAPI | >= 0.110.0 | `backend/app/main.py` |
| **ASGI Server** | Uvicorn | >= 0.29.0 | Port 8000 (`uvicorn app.main:app --port 8000`) |
| **Database ORM** | SQLAlchemy | >= 2.0.28 | `backend/app/database.py` |
| **Database** | SQLite | 3.x | `backend/logistics.db` (`check_same_thread=False`) |
| **Auth & Crypto** | PyJWT, Passlib (bcrypt) | >= 2.8.0 | `backend/app/api/auth.py`, `security.py` |
| **Validation** | Pydantic v2 | >= 2.6.0 | `backend/app/schemas.py` |
| **Test Runner** | Pytest | >= 8.1.0 | `backend/tests/` (Run with `backend/venv/bin/pytest`) |

### Machine Learning Stack
| Component | Technology | Artifacts / Models | Purpose |
|---|---|---|---|
| **Quantile Regression** | LightGBM (`lightgbm`) | `ml/models/lgbm_p10.pkl`, `lgbm_p50.pkl`, `lgbm_p90.pkl` | Probabilistic freight bounds (P10 best case, P50 median, P90 worst case) |
| **Residual Correction** | Statsmodels (`statsmodels`) | `ml/models/arima_freight.pkl` | ARIMA baseline residual correction |
| **Feature Pipelines** | Pandas, NumPy, Scikit-Learn | `ml/feature_engineering.py` | 7d/30d rolling EMA, lag deltas (1, 7, 14, 30), and volatility spreads |

### Frontend Stack
| Layer | Technology | Version | Location / Details |
|---|---|---|---|
| **Framework** | React | 19.2.8 | `frontend/src/` |
| **Language** | TypeScript | ~6.0.2 | Strict type checking (`tsc -b`) |
| **Bundler** | Vite | 8.3.0 | `frontend/vite.config.ts` |
| **Styling** | Tailwind CSS v4 (`@theme`) | 4.3.3 | `frontend/src/index.css` |
| **Icons** | Lucide React | 1.47.0 | `lucide-react` |
| **Motion** | Framer Motion | 13.4.0 | Interactive transitions & drawer animations |
| **3D / WebGL** | Three.js | 0.186.0 | `frontend/src/components/MaritimeGlobe.tsx` |
| **Linter** | Oxlint | 1.81.0 | Ultra-fast static analysis |

---

## 3. Directory Layout & Key Modules

```
.
├── backend/
│   ├── app/
│   │   ├── api/                     # Dual-prefix API endpoints (/api/* and /*)
│   │   │   ├── admin.py             # Reference ports & users management (filters: port_type, country)
│   │   │   ├── analyses.py          # /analyses/{id}, /idle-employment, /seasonal-factor, /decision
│   │   │   ├── audit.py             # Immutable decision audit log retrieval
│   │   │   ├── auth.py              # /auth/signup, /auth/login, /auth/me, /auth/switch-role
│   │   │   ├── bookings.py          # Fixture booking and contract workflow
│   │   │   ├── demand.py            # Plant demand board & stockout levels
│   │   │   ├── map.py               # Great-circle routes & AIS vessel positions
│   │   │   ├── market.py            # /market/indicators (Baltic, commodities, PMIs, queues)
│   │   │   ├── metrics.py           # Real-time KPIs for executive strip
│   │   │   └── quotes.py            # Shipbroker quote capture
│   │   ├── connectors/              # Market data connectors & LOCODE data
│   │   │   ├── locode_data.json     # 14 global origin & discharge port coordinates
│   │   │   └── market_indicators_connector.py # Live/benchmark market data provider
│   │   ├── engines/                 # 12 specialized calculation engines
│   │   │   ├── feasibility_engine.py       # Dual-port vessel draft/LOA/beam/DWT constraint validator
│   │   │   ├── seasonal_engine.py          # 12-month climatology factors & bilingual EN/HI narratives
│   │   │   ├── idle_employment_engine.py   # Turnaround metrics, demurrage & 4 alternative fixtures
│   │   │   ├── forecast_engine.py          # LightGBM quantile inference (P10/P50/P90)
│   │   │   ├── landed_cost_engine.py       # Freight + BAF + USD/INR conversion to ₹/MT and Cr
│   │   │   ├── recommendation_engine.py    # Multi-objective composite scoring: 50% Cost, 30% Conf, 20% Fit
│   │   │   ├── risk_engine.py              # 6-vector supply chain telemetry
│   │   │   ├── regret_engine.py            # Historical chartering regret percentage
│   │   │   ├── stockout_engine.py          # Plant burn rate and stockout arrival alert
│   │   │   ├── coa_comparison_engine.py    # Spot fixture vs 10-voyage COA agreement (~8% volume discount)
│   │   │   ├── pooling_engine.py           # Multi-plant cargo parcel consolidation
│   │   │   └── context_engine.py           # Route nautical miles and vessel class inference
│   │   ├── models/                  # SQLAlchemy ORM entity definitions
│   │   │   ├── core.py              # User, Analysis
│   │   │   ├── entities.py          # ForecastResult, FeasibilityResult, LandedCost, RiskResult, etc.
│   │   │   └── reference.py         # ReferencePort (extended with port_type, queues), MarketIndicator
│   │   ├── schemas.py               # Pydantic request/response schemas
│   │   ├── config.py                # Environment configuration and settings
│   │   ├── database.py              # Database engine & session injection
│   │   └── main.py                  # App entry point, CORS middleware, and router mounts
│   ├── tests/                       # Pytest test suite (7 files, 37 passing tests)
│   ├── logistics.db                 # Active SQLite runtime database
│   └── requirements.txt             # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                     # Typed client wrapper (client.ts)
│   │   ├── components/              # Reusable UI widgets
│   │   │   ├── MarketIntelligenceStrip.tsx # Baltic tickers, commodity prices & origin/discharge queues
│   │   │   ├── NewAnalysisDrawer.tsx       # Analysis console with origin selector & seasonal advisory
│   │   │   ├── MaritimeGlobe.tsx           # Three.js 3D global shipping routes & chokepoints
│   │   │   ├── RouteMap.tsx                # SVG great-circle route line and waypoints
│   │   │   ├── TopBar.tsx, IconRail.tsx    # App shell navigation
│   │   │   └── ui.tsx                      # Buttons, Cards, Badges
│   │   ├── pages/                   # 19 application page views
│   │   │   ├── Dashboard.tsx               # Executive Freight Terminal & intelligence feed
│   │   │   ├── AnalysisResultsPage.tsx     # 12-section decision document
│   │   │   ├── DemandBoardPage.tsx         # Steel plant inventory monitoring
│   │   │   ├── BookingPage.tsx             # Charter fixture booking execution
│   │   │   └── AuthPage.tsx                # Secure role-based login/signup
│   │   ├── index.css                # Tailwind CSS v4 design tokens (@theme)
│   │   └── App.tsx                  # Client router
│   └── package.json                 # Node.js dependencies & scripts
├── ml/                              # LightGBM and ARIMA model training scripts & artifacts
├── scripts/
│   └── seed_reference_data.py       # Seeds 14 ports, 4 vessel classes, 5 plants, market benchmarks
└── .planning/                       # Architectural design documents and memory graphs
```

---

## 4. Design System & Styling Conventions

The application follows the **Wise-inspired Oceanic Navy & Electric Cyan** design language defined in [`DESIGN.md`](file:///home/asp/Downloads/Organized/01_ACTIVE_PROJECTS/SIH26006/DESIGN.md) and [`frontend/src/index.css`](file:///home/asp/Downloads/Organized/01_ACTIVE_PROJECTS/SIH26006/frontend/src/index.css).

### Color Palette Tokens
| Token | CSS Variable | Hex Value | Semantic Usage |
|---|---|---|---|
| **Forest Ink** | `--color-forest-ink` | `#07192f` | Deep Abyss Navy — dominant dark surface, authority text, dark buttons |
| **Lime Voltage** | `--color-lime-voltage` | `#38bdf8` | Electric Cyan — primary interactive highlights and focus accents |
| **Spruce** | `--color-spruce` | `#0c4a6e` | Deep Marine Ocean — secondary dark container surfaces |
| **Linen Mist** | `--color-linen-mist` | `#e0f2fe` | Ice Mist — soft cyan background wash for active pills and subtle badges |
| **Emerald Profit** | `--color-emerald-profit` | `#047857` | High-contrast profit green ($\ge 5.2:1$ contrast) for cost savings and passes |
| **Alarm Red** | `--color-alarm-red` | `#be123c` | Rose 700 — strict warning and restriction badge color |
| **Amber Warning**| `--color-amber-warning` | `#b45309` | Amber 700 — climatology disruption and demurrage risk indicator |
| **Charcoal** | `--color-charcoal` | `#334155` | Slate 700 — primary body copy on light backgrounds |
| **Obsidian** | `--color-obsidian` | `#030712` | Pure black for high-impact display headlines |
| **Pebble** | `--color-pebble` | `#cbd5e1` | Slate 300 hairline divider borders |
| **Fog** | `--color-fog` | `#f1f5f9` | Slate 100 soft card surface |
| **Paper** | `--color-paper` | `#ffffff` | Pure white card canvas |

### Typography & Numerals
* **Sans-Serif (`--font-sans`)**: `"Inter", system-ui, -apple-system, sans-serif` for body copy, labels, and headings.
* **Monospace (`--font-mono`)**: `"IBM Plex Mono", ui-monospace, monospace` for financial metrics, freight rates, LOCODEs, coordinates, and quantities.
* **Tabular Numbers**: Apply `tabular-nums` class on all financial and quantitative figures to prevent horizontal layout shift during live updates.

### Radii & Spacing
* **Pill Geometry**: Use `rounded-full` for all status badges, filter buttons, and navigation chips.
* **Card Surfaces**: Use `rounded-xl` or `rounded-card` (10px) with hairline border `border-pebble` for clean container isolation.
* **Accessibility**: Strict **WCAG AA** compliance ($\ge 4.5:1$ contrast ratio) across all text elements.

---

## 5. API Design & Routing Conventions

### Dual Prefix Convention
All routers in `backend/app/api/` are mounted **both** with and without the `/api` prefix in `backend/app/main.py`:
```python
app.include_router(market.router, prefix="/api/market", tags=["market"])
app.include_router(market.router, prefix="/market", tags=["market-legacy"])
```
This ensures zero breakage across legacy frontend callers and strict API gateways.

### Core Endpoints Reference
* `GET /api/market/indicators`: Real-time Baltic indices (BDI, BCI, BPI, BSI), commodity benchmarks, macro PMIs, and port queues.
* `GET /api/analyses/{id}`: Complete 12-section analysis payload including dual-port feasibility, seasonal factors, and alternative employment rankings.
* `POST /api/analyses/idle-employment`: Dynamic calculation of turnaround waiting queues, demurrage exposure, and 4 alternative employment options.
* `GET /api/analyses/seasonal-factor?laycan_month={m}&origin_port={p}&destination_port={d}`: Month-indexed seasonal rate multipliers with English and Hindi advisories.
* `GET /api/admin/reference/ports?port_type={load|discharge}&country={c}`: Filterable reference ports by type and country.
* `POST /api/analyses/{id}/decision`: Records procurement officer decision and audit trail.

---

## 6. Developer & Agent Operational Rules

1. **Ponytail Ultra Mode (ALWAYS ACTIVE)**:
   - Write the minimum working code. Deletion before addition.
   - Do not introduce speculative abstractions or heavy external frameworks without explicit user request.
   - Mark intentional simplifications with `ponytail:` comments naming limits and upgrade paths.
2. **Database Migrations (SQLite Self-Healing)**:
   - When introducing columns to SQLAlchemy models in SQLite, always include self-healing `PRAGMA table_info` alter checks (see `scripts/seed_reference_data.py`) because SQLite `create_all()` does not alter existing tables.
3. **Environment & Verification Commands**:
   - Backend tests **must** run via virtual environment: `backend/venv/bin/pytest` (all 37 tests must pass).
   - Frontend verification **must** run `npm run build` in `frontend/` to enforce strict TypeScript safety.
   - Database re-seeding: `backend/venv/bin/python scripts/seed_reference_data.py`.
4. **Git Hygiene & Worktree Isolation**:
   - Feature development lives on `feat/ps-features` which fast-forwards directly to `origin/main`.
   - Never stage or push local-only audit documents, scratch scripts, or unrequested folders (`SIH26006/`, `UX_JUDGE_AUDIT_REPORT.md`, `local_user_files_backup/`).
