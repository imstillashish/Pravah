# `agents.md` — Autonomous Agent Architecture & System Guide

> **Project**: Astitva (SIH26006) — Intelligent Maritime Freight Forecasting & Bulk Chartering System  
> **Client / Target**: SAIL (Steel Authority of India Limited) / Ministry of Steel, Government of India  
> **Repository**: `imstillashish/Astitva`  
> **Operating Mode**: Ponytail Ultra Mode (YAGNI, minimal code, root-cause fixes, zero unrequested bloat)

---

## 1. System Overview & Problem Statement

Astitva solves overseas raw material procurement (coking coal, iron ore, limestone, thermal coal) bulk vessel chartering for Indian steel manufacturing. It ingests global trade lane indicators, forecasts freight rate quantiles, enforces dual-port physical berth feasibility, integrates climatological disruption factors, and calculates vessel idle time turnaround with alternative employment fixtures.

### Key Problem Statement (SIH26006) Pillars
1. **Idle Time Forecasting & Alternative Employment**:
   - Quantifies load and discharge berth waiting times, contract laytime, and financial demurrage risk.
   - Recommends 4 ranked commercial alternative employments (Coastal Cabotage, Backhaul Mineral Export, Period Relet, Virtual Arrival Eco-Speed) to monetize vessel idle days and eliminate unladen ballast deadheading.
2. **Global Origin Ports Infrastructure & Dual-Port Feasibility**:
   - Tracks 14 verified global load and discharge terminals across Australia (Hay Point, Gladstone, Newcastle, Abbot Point), United States (Hampton Roads, Baltimore), Mozambique (Maputo, Beira), and Indonesia (Samarinda, Balikpapan).
   - Validates draft, LOA, beam, and DWT limits at **both** origin load berth and Indian discharge port (`Paradip`, `Dhamra`, `Gangavaram`, `Haldia`).
3. **Month-Indexed Seasonal Climatology & Bilingual Explainability**:
   - Indexes 12 monthly climatological trade multipliers (1.05x to 1.26x) capturing South-West Monsoon swells, Sandheads lightering suspension, Queensland tropical cyclone tracks, and East Asian winter heating restocking.
   - Provides side-by-side bilingual (English & Hindi) explainability narratives for procurement auditing.
4. **Global Economic Indicators & Port Congestion Telemetry**:
   - Real-time Baltic Dry indices (BDI, BCI, BPI, BSI), Australian Coking Coal FOB, 62% Fe Iron Ore CFR, Domestic Coal parity, Global Manufacturing PMI, and China Blast Furnace Utilization.

---

## 2. Technology Stack

### Backend Stack
| Layer | Technology | Version | Location / Details |
|---|---|---|---|
| **Language** | Python | 3.13.14 | `backend/venv/` |
| **API Framework** | FastAPI | >= 0.110.0 | `backend/app/main.py` |
| **ASGI Server** | Uvicorn | >= 0.29.0 | Port 8000 |
| **Database ORM** | SQLAlchemy | >= 2.0.28 | `backend/app/database.py` |
| **Database** | SQLite | 3.x | `backend/logistics.db` (`check_same_thread=False`) |
| **Authentication** | PyJWT, Passlib (bcrypt) | >= 2.8.0 | `backend/app/api/auth.py`, `security.py` |
| **Data Validation** | Pydantic v2 | >= 2.6.0 | `backend/app/schemas.py` |
| **Testing** | Pytest | >= 8.1.0 | `backend/tests/` (Run with `backend/venv/bin/pytest`) |

### Machine Learning Stack
| Component | Technology | Artifacts / Models | Purpose |
|---|---|---|---|
| **Quantile Regression** | LightGBM (`lightgbm`) | `ml/models/lgbm_p10.pkl`, `lgbm_p50.pkl`, `lgbm_p90.pkl` | Probabilistic freight bounds (P10 best case, P50 median, P90 worst case) |
| **Baseline Correctors**| Statsmodels (`statsmodels`) | `ml/models/arima_freight.pkl` | Residual auto-regressive error correction & baseline benchmark |
| **Feature Engineering**| Pandas, NumPy, Scikit-Learn | `ml/feature_engineering.py` | Rolling 7d/30d EMA, lag deltas (1, 7, 14, 30), and volatility spreads |

### Frontend Stack
| Layer | Technology | Version | Location / Details |
|---|---|---|---|
| **Framework** | React | 19.2.8 | `frontend/src/` |
| **Language** | TypeScript | ~6.0.2 | Strict type checking (`tsc -b`) |
| **Build Tool** | Vite | 8.3.0 | `frontend/vite.config.ts` |
| **Styling** | Tailwind CSS v4 (`@theme`) | 4.3.3 | `frontend/src/index.css` |
| **Icons** | Lucide React | 1.47.0 | `lucide-react` |
| **Motion** | Framer Motion | 13.4.0 | Interactive transitions & drawer animations |
| **3D / WebGL** | Three.js | 0.186.0 | `frontend/src/components/MaritimeGlobe.tsx` |
| **Linter** | Oxlint | 1.81.0 | Ultra-fast static analysis |

---

## 3. Directory Layout

```
.
├── backend/
│   ├── app/
│   │   ├── api/                     # FastAPI route handlers (/api/analyses, /api/auth, /api/market, /api/admin)
│   │   ├── connectors/              # Market data connectors & port LOCODE reference (locode_data.json)
│   │   ├── engines/                 # 12 specialized calculation engines
│   │   │   ├── feasibility_engine.py       # Dual-port vessel draft/LOA/beam/DWT constraint validator
│   │   │   ├── seasonal_engine.py          # Month-indexed seasonal factor & EN/HI narratives
│   │   │   ├── idle_employment_engine.py   # Turnaround metrics, demurrage risk & 4 alternative fixtures
│   │   │   ├── forecast_engine.py          # LightGBM quantile prediction integration
│   │   │   ├── landed_cost_engine.py       # Landed cost in USD/MT and INR Cr
│   │   │   ├── recommendation_engine.py    # Multi-objective composite decision scorer
│   │   │   ├── risk_engine.py              # 6-vector supply chain telemetry
│   │   │   └── ...
│   │   ├── models/                  # SQLAlchemy ORM entities (User, Analysis, ReferencePort, MarketIndicator)
│   │   ├── schemas.py               # Pydantic request/response validation schemas
│   │   ├── config.py                # App settings and environment variables
│   │   ├── database.py              # Engine, SessionLocal, and DB dependency injection
│   │   └── main.py                  # FastAPI application entry point with CORS & router mounts
│   ├── tests/                       # Pytest test suite (37 tests)
│   ├── logistics.db                 # Active SQLite database file
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                     # Typed client wrapper (client.ts)
│   │   ├── components/              # UI components
│   │   │   ├── MarketIntelligenceStrip.tsx # Live Baltic indices, commodities & port congestion lineup
│   │   │   ├── NewAnalysisDrawer.tsx       # Slide-in analysis console with origin selector & seasonal alerts
│   │   │   ├── MaritimeGlobe.tsx           # Three.js 3D global shipping routes & chokepoints
│   │   │   ├── RouteMap.tsx                # Great-circle voyage route renderer
│   │   │   ├── TopBar.tsx, IconRail.tsx    # High-density navigation chrome
│   │   │   └── ui.tsx                      # Button, Card, Badge primitives
│   │   ├── pages/                   # Application views
│   │   │   ├── Dashboard.tsx               # Executive Freight Terminal & intelligence feed
│   │   │   ├── AnalysisResultsPage.tsx     # 12-section comprehensive decision report
│   │   │   ├── DemandBoardPage.tsx         # Steel plant inventory & stockout monitoring
│   │   │   └── AuthPage.tsx                # Secure role-based login/signup
│   │   ├── index.css                # Tailwind CSS v4 design tokens (@theme)
│   │   └── App.tsx                  # HashRouter & page route dispatch
│   └── package.json                 # Node.js dependencies & scripts
├── ml/                              # LightGBM and ARIMA model training scripts & artifacts
├── scripts/
│   └── seed_reference_data.py       # Seeds 14 ports, vessel classes, plants, and market benchmarks
└── .planning/                       # Architectural specs and knowledge graph indices
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

### Core Endpoints
* `GET /api/market/indicators`: Returns real-time Baltic indices, commodity benchmarks, macro PMIs, and port queues.
* `GET /api/analyses/{id}`: Returns complete 12-section analysis payload including dual-port feasibility, seasonal factors, and alternative employment rankings.
* `POST /api/analyses/idle-employment`: Dynamic calculation of turnaround waiting queues, demurrage exposure, and alternative employment options.
* `GET /api/analyses/seasonal-factor`: Month-indexed seasonal rate multipliers with English and Hindi advisories.
* `GET /api/admin/reference/ports`: Filterable reference ports by `port_type` (`load`/`discharge`) and `country`.

---

## 6. Developer & Agent Operational Rules

1. **Ponytail Ultra Mode**:
   - Write the minimum working code. Deletion before addition.
   - Do not introduce speculative abstractions or heavy external frameworks without explicit user request.
   - Mark intentional simplifications with `ponytail:` comments naming limits and upgrade paths.
2. **Database Migrations (SQLite Self-Healing)**:
   - When introducing columns to SQLAlchemy models in SQLite, always include self-healing `PRAGMA table_info` alter checks (see `scripts/seed_reference_data.py`) because SQLite `create_all()` does not alter existing tables.
3. **Environment & Testing**:
   - Backend tests **must** run via virtual environment: `backend/venv/bin/pytest`.
   - Frontend verification **must** run `npm run build` in `frontend/` to enforce strict TypeScript safety.
4. **Git Hygiene & Worktree Isolation**:
   - Keep experimental branches isolated (`feat/ps-features`).
   - Treat `origin/main` as the source of truth. Never stage or push local-only audit documents, scratch scripts, or unrequested folders.
