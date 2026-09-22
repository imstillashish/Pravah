# Dashboard Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Command Center in the SIH26006 platform featuring live global Baltic freight proxy metrics, a 5-item historical analysis feed with distinct status indicators (Draft, Finalized, Overridden), and an interactive slide-over simulation engine to run and record new analyses.

**Architecture:** A FastAPI endpoint group under `/api/analyses` and `/api/metrics` backed by SQLAlchemy/SQLite handles persistence and rate heuristics. The React frontend presents a refined Wise-styled dashboard with real-time indicators and a slide-over modal drawer for scenario generation.

**Tech Stack:** Python 3, FastAPI, SQLAlchemy, SQLite, Pydantic V2, pytest, httpx, React 18, Vite, Tailwind CSS, Lucide icons.

---

### Task 1: Backend Analysis Model & API Endpoints

**Files:**
- Modify: `backend/app/models.py`
- Modify: `backend/app/schemas.py`
- Create: `backend/app/api/analyses.py`
- Create: `backend/app/api/metrics.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_analyses_api.py`

- [ ] **Step 1: Write failing test for analyses & metrics API**

```python
# backend/tests/test_analyses_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_global_metrics_endpoint():
    res = client.get("/api/metrics/global")
    assert res.status_code == 200
    data = res.json()
    assert "bdi_index" in data
    assert "current_avg_freight_pmt" in data

def test_analyses_crud():
    # 1. Register & login user
    reg = client.post("/api/auth/signup", json={
        "full_name": "Priya Sharma",
        "email": "priya@sail.gov.in",
        "password": "Password123"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get initial recent analyses (should auto-seed 3 demo items)
    rec_res = client.get("/api/analyses/recent", headers=headers)
    assert rec_res.status_code == 200
    recent = rec_res.json()
    assert len(recent) >= 1

    # 3. Create new analysis
    create_res = client.post("/api/analyses", headers=headers, json={
        "origin_country": "Australia",
        "origin_port": "Hay Point",
        "destination_port": "Paradip",
        "commodity": "Coking Coal",
        "parcel_tonnage": 75000,
        "status": "finalized"
    })
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["recommended_vessel"] == "Panamax"
    assert created["status"] == "finalized"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=backend ./backend/venv/bin/pytest backend/tests/test_analyses_api.py`
Expected: FAIL (endpoints not found)

- [ ] **Step 3: Implement models, schemas, and endpoints**

Add `Analysis` model in `backend/app/models.py`.
Add `AnalysisCreate` and `AnalysisResponse` in `backend/app/schemas.py`.
Implement `backend/app/api/metrics.py` and `backend/app/api/analyses.py`.
Register routers in `backend/app/main.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=backend ./backend/venv/bin/pytest backend/tests/test_analyses_api.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(api): implement global freight metrics and analyses CRUD endpoints"
```

---

### Task 2: Frontend Data Fetching & Global Metrics Component

**Files:**
- Create: `frontend/src/types/analysis.ts`
- Create: `frontend/src/components/GlobalMetricsStrip.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Define TypeScript contracts for analyses and metrics**
Create `frontend/src/types/analysis.ts` with `AnalysisObject` and `GlobalMetrics` interfaces.

- [ ] **Step 2: Implement GlobalMetricsStrip component**
Render cards for BDI index, Hay Point to Paradip freight rate, and bunker prices with pill delta badges.

- [ ] **Step 3: Verify build passes**
Run: `npm --prefix frontend run build`

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat(ui): add global freight metrics component"
```

---

### Task 3: Recent Analyses Table with Status Badges

**Files:**
- Create: `frontend/src/components/RecentAnalysesTable.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Implement RecentAnalysesTable**
Displays last 5 analyses with status indicators:
- `Finalized`: `#163300` text on `#9FE870`/30 bg.
- `Draft`: slate text on `#F1F5F9`.
- `Overridden`: amber text on `#FEF3C7` with warning icon.

- [ ] **Step 2: Connect to `GET /api/analyses/recent`**
Fetch data on mount, show accessible skeleton loading state, and handle empty states.

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat(ui): add recent analyses table with status indicators"
```

---

### Task 4: "New Analysis" Slide-Over Simulation Drawer

**Files:**
- Create: `frontend/src/components/NewAnalysisDrawer.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Implement NewAnalysisDrawer**
Slide-over panel with inputs:
- Origin port (Hay Point, Hampton Roads, Maputo, Balikpapan)
- Discharge port (Paradip, Vizag, Gangavaram, Dhamra, Haldia)
- Commodity and parcel tonnage
- Dynamic vessel class constraint indicator (e.g. warning if Capesize exceeds Haldia draft).
- Save as Draft or Finalize button.

- [ ] **Step 2: Wire up form submission to `POST /api/analyses`**
Updates the recent analysis table upon submission and closes the drawer.

- [ ] **Step 3: Run full automated verification and build**
Run: `npm --prefix frontend run build` and backend pytest suite.

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat(ui): implement interactive slide-over analysis simulation drawer"
```
