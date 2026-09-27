# Site Deployment Design: Vercel (Frontend) + Render (Backend & PostgreSQL)

## 1. Executive Summary

This specification defines the production deployment architecture and automated CLI workflow for the **PRAVAH** platform (Intelligent Bulk Cargo Freight Forecasting & Chartering System, SIH26006).

- **Frontend**: Vite + React 18 SPA hosted on **Vercel Edge Network** with instant CDN distribution and client-side SPA routing.
- **Backend**: FastAPI (Python 3.13) + ML regression/time-series models hosted on **Render Web Service** with managed Uvicorn ASGI runtime.
- **Database**: Managed **Render PostgreSQL** database, synchronized automatically via Alembic migrations and reference seeders on boot.
- **Keep-Alive Engine**: Standalone daemon script (`scripts/keep_alive.sh`) and continuous cloud health ping (`.github/workflows/keep_alive.yml`) to eliminate Render free-tier cold starts (spins down after 15 min idle).
- **Deployment Orchestrator**: Unified CLI script (`scripts/deploy.sh`) supporting single-command frontend deploys, backend webhook triggers, and live status verification.

---

## 2. Platform Topology & Runtime Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │              User Browser                    │
                  └──────────────┬───────────────────────────────┘
                                 │
                 ┌───────────────┴─────────────────┐
                 │                                 │
                 ▼                                 ▼
      [ Vercel Edge Network ]           [ Render Web Service ]
        React 18 SPA (Vite)              FastAPI (Python 3.13)
        Static CDN assets                10 Decision Engines
        Custom / *.vercel.app            ml/models (LightGBM/ARIMA)
                 │                                 │
                 │   REST API Requests             ▼
                 └──────────────────────► [ Render PostgreSQL ]
                                           pravah_prod DB
                                           Alembic Migrations + Seeds
                                                   ▲
                                                   │ Ping every 10 min
                                         [ scripts/keep_alive.sh ]
                                        (Prevents free-tier spin-down)
```

### 2.1 Component Specifications

| Component | Target Platform | Runtime / Plan | Entrypoint / Config |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | Node 24 / Static Edge | `vercel.json`, `npm run build` |
| **Backend** | Render | Python 3.13 / Free Web Service | `render.yaml`, `scripts/deploy_entrypoint.sh` |
| **Database** | Render | Managed PostgreSQL 16 / Free | `render.yaml` (`pravah-db`) |
| **Keep-Alive** | Local daemon & GitHub Actions | Bash `curl` / Free Cron | `scripts/keep_alive.sh`, `.github/workflows/keep_alive.yml` |

---

## 3. Codebase Hardening & Pre-requisites

### 3.1 SQLAlchemy 2.0 `DATABASE_URL` Normalization
Render injects connection strings in the legacy format: `postgres://pravah_user:...@dpg-xxx-a/pravah_prod`.  
SQLAlchemy 2.0 strictly requires the dialect prefix `postgresql://` or `postgresql+psycopg2://`.

- **Target File**: `backend/app/config.py`
- **Logic**:
  ```python
  raw_db_url = os.getenv("DATABASE_URL", f"sqlite:///{_default_sqlite_path}")
  if raw_db_url.startswith("postgres://"):
      raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
  DATABASE_URL: str = raw_db_url
  ```

### 3.2 Canonical Zero-Overhead `/health` Endpoint
Render's health checks, our deployment orchestrator, and the keep-alive daemon require an endpoint that validates service responsiveness without executing heavy database queries or requiring JWT headers.

- **Target File**: `backend/app/main.py`
- **Route**: `GET /health`
- **Payload**:
  ```json
  {
    "status": "ok",
    "service": "pravah-backend",
    "timestamp": 1727435400
  }
  ```

### 3.3 Container Entrypoint Resilience
The startup entrypoint `scripts/deploy_entrypoint.sh` runs:
1. `alembic upgrade head` to apply all schema migrations.
2. `python scripts/seed_reference_data.py || true` to populate ports and baseline routes.
3. `python scripts/seed_demo_scenarios.py || true` to populate demo accounts and sample analyses.
4. `exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"` to start ASGI.

---

## 4. Keep-Alive Daemon Design (`scripts/keep_alive.sh`)

### 4.1 Problem
Render's free tier spins down any web service that receives no incoming HTTP traffic for 15 minutes. Waking it up incurs a 50–60 second latency penalty on the next user request.

### 4.2 Local / Server Script (`scripts/keep_alive.sh`)
- Executable bash script accepting:
  - `$1` (or `$BACKEND_URL`): Target backend base URL.
  - `$2` (or `$INTERVAL_SECONDS`): Ping frequency in seconds (default: `600`, i.e., 10 minutes).
- Measures and prints timestamp, HTTP status, and round-trip latency.
- Gracefully handles network blips with immediate 5-second retries before waiting for the next cycle.
- Supports running in background:
  ```bash
  nohup ./scripts/keep_alive.sh https://astitva-api.onrender.com 600 > keep_alive.log 2>&1 &
  ```

### 4.3 Automated Cloud Ping (`.github/workflows/keep_alive.yml`)
To keep Render awake when the developer's laptop is asleep or disconnected:
- A GitHub Actions workflow triggered on schedule:
  ```yaml
  name: Keep Render Backend Awake
  on:
    schedule:
      - cron: "*/12 * * * *"
    workflow_dispatch:

  jobs:
    ping:
      runs-on: ubuntu-latest
      steps:
        - name: Ping Backend Health Endpoint
          run: |
            curl -sSf -m 15 "${{ secrets.BACKEND_URL || 'https://astitva-api.onrender.com' }}/health" || echo "Ping failed"
  ```

---

## 5. Unified CLI Deployment Orchestrator (`scripts/deploy.sh`)

### 5.1 CLI Commands & Options

```bash
./scripts/deploy.sh <command> [options]
```

| Command | Purpose | Actions Executed |
| :--- | :--- | :--- |
| `setup` | Pre-flight validation | Verifies Vercel auth (`vercel whoami`), checks git cleanliness, guides Render Blueprint link |
| `frontend` | Deploy React app | Verifies build, executes `vercel --prod` with `VITE_API_BASE_URL` |
| `backend` | Deploy FastAPI | Triggers Render Deploy Hook via `curl -X POST`, polls `/health` |
| `all` | Full-stack deploy | Executes backend deploy $\rightarrow$ polls `/health` until healthy $\rightarrow$ deploys frontend |
| `status` | Health & uptime check | Pings live frontend and backend endpoints, displays HTTP status and latency |

### 5.2 Frontend Environment Injection
During `vercel --prod`, the script passes:
```bash
vercel --prod \
  --build-env VITE_API_BASE_URL="$BACKEND_URL" \
  --env VITE_API_BASE_URL="$BACKEND_URL" \
  --yes
```
This guarantees the compiled Vite distribution calls the production Render backend instead of localhost.

---

## 6. One-Time Setup Runbook

### Step 1: Render Provisioning (Backend + PostgreSQL)
1. Commit current repository to GitHub.
2. Open [dashboard.render.com](https://dashboard.render.com) $\rightarrow$ **New** $\rightarrow$ **Blueprint**.
3. Select this repository. Render automatically reads `render.yaml` and provisions:
   - `pravah-db` (PostgreSQL database)
   - `pravah-backend` (Web service with Python runtime and entrypoint script)
4. Once deployed, copy:
   - The backend service URL (e.g., `https://pravah-backend-xxxx.onrender.com`).
   - The **Deploy Hook** URL from the service's **Settings** $\rightarrow$ **Deploy Hook**.
5. Save these into `.env.deploy`:
   ```bash
   RENDER_BACKEND_URL="https://pravah-backend-xxxx.onrender.com"
   RENDER_DEPLOY_HOOK_URL="https://api.render.com/deploy/srv-xxxx?key=yyyy"
   ```

### Step 2: Vercel Link (Frontend)
1. Run:
   ```bash
   vercel link --yes
   ```
   (Account `siddhiblogger-3707` is already authenticated on this machine).

### Step 3: Run Full Deployment
```bash
./scripts/deploy.sh all
```

### Step 4: Start Keep-Alive Daemon
```bash
nohup ./scripts/keep_alive.sh "$RENDER_BACKEND_URL" 600 > keep_alive.log 2>&1 &
```

---

## 7. Verification & Acceptance Criteria

1. **Backend Health Check**:
   - `GET $RENDER_BACKEND_URL/health` returns `200 OK` with JSON `{ "status": "ok" }`.
   - `GET $RENDER_BACKEND_URL/disruption-alerts` returns seeded active alerts.
2. **Database Integrity**:
   - PostgreSQL contains all migrated tables (`users`, `analyses`, `ports`, `vessels`, `audit_events`, `scenarios`).
   - Pre-seeded demo logins work:
     - `procurement@sail.in` (Procurement Officer)
     - `manager@sail.in` (Logistics Manager)
     - `admin@sail.in` (System Administrator)
3. **Frontend Vercel Distribution**:
   - Vercel URL loads without blank screen.
   - Browser network tab verifies all API requests go to `$RENDER_BACKEND_URL` with CORS headers accepted (`Access-Control-Allow-Origin: *`).
   - SPA page refreshes on subroutes (`/dashboard`, `/demand`, `/quotes`) load correctly without 404s.
4. **Keep-Alive Functionality**:
   - `scripts/keep_alive.sh` successfully sends pings every 10 minutes and logs 200 responses.
   - Render service maintains active state without entering sleep mode.
