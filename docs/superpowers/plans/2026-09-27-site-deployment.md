# Site Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate production deployment of PRAVAH to Vercel (Frontend) and Render (FastAPI Backend + PostgreSQL DB) with a unified CLI orchestrator, backend SQLAlchemy 2.0 hardening, and a keep-alive daemon to prevent Render free-tier sleep.

**Architecture:** A lightweight shell orchestrator (`scripts/deploy.sh`) coordinates Vercel CLI builds and Render Deploy Webhooks; a background keep-alive worker (`scripts/keep_alive.sh` and `.github/workflows/keep_alive.yml`) periodically pings a zero-overhead `/health` FastAPI endpoint to prevent cold starts; backend configuration normalizes Render `postgres://` connection strings for SQLAlchemy 2.0 compatibility.

**Tech Stack:** Bash, curl, Python 3.13 (FastAPI, SQLAlchemy 2.0), Vite / React 18, Vercel CLI.

**Spec:** [docs/superpowers/specs/2026-09-27-site-deployment-design.md](file:///home/asp/Downloads/Organized/01_ACTIVE_PROJECTS/SIH26006/docs/superpowers/specs/2026-09-27-site-deployment-design.md)

## Global Constraints

- **Python Runtime**: Python 3.13+ with SQLAlchemy 2.0; `postgres://` dialect URLs must be transformed to `postgresql://`.
- **Zero New Dependencies**: Use native `bash`, `curl`, `vercel` CLI, and standard library.
- **Render Inactivity Window**: Free tier spins down at 15 minutes; keep-alive interval must be $\le$ 10 minutes (600s).
- **Frontend SPA Routing**: Vercel configuration must route all non-static paths `/(.*)` to `/index.html`.
- **Executable Permissions**: All shell scripts in `scripts/` must be executable (`chmod +x`).

---

### Task 1: Backend Hardening (Database URL Normalization & Health Endpoint)

**Files:**
- Modify: `backend/app/config.py:8-12`
- Modify: `backend/app/main.py:24-30`
- Test: `backend/tests/test_health_and_config.py`

**Interfaces:**
- Consumes: `os.getenv("DATABASE_URL")`
- Produces: `settings.DATABASE_URL` (starts with `postgresql://` when given `postgres://`), `GET /health` route returning `{"status": "ok", "service": "pravah-backend"}`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_health_and_config.py`:
```python
import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import Settings

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "pravah-backend"

def test_database_url_normalization(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://user:pass@host:5432/dbname")
    custom_settings = Settings()
    assert custom_settings.DATABASE_URL.startswith("postgresql://")
    assert not custom_settings.DATABASE_URL.startswith("postgres://")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_health_and_config.py -v`  
Expected: FAIL (404 on `/health`, `Settings` doesn't normalize prefix)

- [ ] **Step 3: Implement minimal code**

In `backend/app/config.py`:
```python
class Settings:
    _raw_db = os.getenv("DATABASE_URL", f"sqlite:///{_default_sqlite_path}")
    if _raw_db.startswith("postgres://"):
        _raw_db = _raw_db.replace("postgres://", "postgresql://", 1)
    DATABASE_URL: str = _raw_db
```

In `backend/app/main.py`:
```python
@app.get("/health")
def get_health():
    return {"status": "ok", "service": "pravah-backend"}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_health_and_config.py -v`  
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/config.py backend/app/main.py backend/tests/test_health_and_config.py
git commit -m "fix(backend): normalize postgresql DATABASE_URL and add /health endpoint"
```

---

### Task 2: Keep-Alive Daemon Script & Cloud Ping

**Files:**
- Create: `scripts/keep_alive.sh`
- Create: `.github/workflows/keep_alive.yml`
- Test: `scripts/test_keep_alive.sh`

**Interfaces:**
- Consumes: Target backend URL (CLI arg `$1` or `$BACKEND_URL`), Ping interval (CLI arg `$2` or `$INTERVAL_SECONDS`, default 600s), optional `--once` flag.
- Produces: Persistent HTTP keep-alive loop logging timestamp, response code, and latency.

- [ ] **Step 1: Write test script**

Create `scripts/test_keep_alive.sh`:
```bash
#!/bin/sh
set -e
# Test syntax and help
sh -n scripts/keep_alive.sh
# Test --once mode against mock or dummy URL with dry run check
./scripts/keep_alive.sh "http://127.0.0.1:9999" 1 --dry-run
echo "keep_alive tests passed"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `sh scripts/test_keep_alive.sh`  
Expected: FAIL (script does not exist yet)

- [ ] **Step 3: Implement `scripts/keep_alive.sh` and `.github/workflows/keep_alive.yml`**

Create `scripts/keep_alive.sh`:
```bash
#!/bin/sh
# Keep-Alive Daemon for Render Free-Tier Web Services
# Prevents container spin-down by pinging /health every 10 minutes
set -e

BACKEND_URL="${1:-${BACKEND_URL:-https://astitva-api.onrender.com}}"
INTERVAL="${2:-${INTERVAL_SECONDS:-600}}"
DRY_RUN=false
ONCE=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --once) ONCE=true ;;
  esac
done

# Strip trailing slash
BACKEND_URL=$(echo "$BACKEND_URL" | sed 's:/*$::')
TARGET_ENDPOINT="${BACKEND_URL}/health"

echo "============================================================"
echo "PRAVAH RENDER KEEP-ALIVE DAEMON"
echo "Target:   $TARGET_ENDPOINT"
echo "Interval: ${INTERVAL}s"
echo "============================================================"

if [ "$DRY_RUN" = true ]; then
  echo "[DRY RUN] Target configured correctly: $TARGET_ENDPOINT"
  exit 0
fi

ping_server() {
  timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  start_time=$(date +%s%N 2>/dev/null || date +%s)
  
  status_code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$TARGET_ENDPOINT" || echo "ERR")
  
  if [ "$status_code" = "200" ]; then
    echo "[$timestamp] Keep-alive ping -> $TARGET_ENDPOINT -> $status_code OK"
  else
    echo "[$timestamp] WARNING: Keep-alive ping -> $TARGET_ENDPOINT returned $status_code"
  fi
}

if [ "$ONCE" = true ]; then
  ping_server
  exit 0
fi

trap 'echo "\nStopping keep-alive daemon..."; exit 0' INT TERM

while true; do
  ping_server
  sleep "$INTERVAL"
done
```
Make executable: `chmod +x scripts/keep_alive.sh`

Create `.github/workflows/keep_alive.yml`:
```yaml
name: Keep Render Backend Awake

on:
  schedule:
    - cron: "*/12 * * * *"
  workflow_dispatch:

jobs:
  ping:
    name: Ping Render Health
    runs-on: ubuntu-latest
    steps:
      - name: Send Keep-Alive HTTP Ping
        run: |
          TARGET="${{ secrets.RENDER_BACKEND_URL || 'https://astitva-api.onrender.com' }}/health"
          echo "Pinging $TARGET"
          curl -sSf -m 20 "$TARGET" || echo "Ping attempt completed with non-200 status"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `chmod +x scripts/test_keep_alive.sh && ./scripts/test_keep_alive.sh`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/keep_alive.sh .github/workflows/keep_alive.yml scripts/test_keep_alive.sh
git commit -m "feat(ops): add Render keep-alive daemon script and GitHub Actions cron"
```

---

### Task 3: CLI Deployment Orchestrator Script (`scripts/deploy.sh`)

**Files:**
- Create: `scripts/deploy.sh`
- Modify: `.env.example`
- Test: `scripts/test_deploy_syntax.sh`

**Interfaces:**
- Consumes: `.env.deploy` or environment variables `RENDER_BACKEND_URL`, `RENDER_DEPLOY_HOOK_URL`.
- Produces: Executable `./scripts/deploy.sh` with subcommands `setup`, `frontend`, `backend`, `all`, `status`.

- [ ] **Step 1: Write test script**

Create `scripts/test_deploy_syntax.sh`:
```bash
#!/bin/sh
set -e
sh -n scripts/deploy.sh
./scripts/deploy.sh help > /dev/null
echo "deploy.sh syntax and help command verified"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `sh scripts/test_deploy_syntax.sh`  
Expected: FAIL (deploy.sh not found)

- [ ] **Step 3: Implement `scripts/deploy.sh` and update `.env.example`**

Update `.env.example`:
```
VITE_API_BASE_URL=http://localhost:8000
RENDER_BACKEND_URL=https://astitva-api.onrender.com
RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-xxxx?key=yyyy
```

Create `scripts/deploy.sh`:
```bash
#!/bin/bash
# PRAVAH Deployment Orchestrator (Vercel Frontend + Render Backend)
set -e

# Load environment configuration if present
if [ -f ".env.deploy" ]; then
  # shellcheck disable=SC1091
  source .env.deploy
elif [ -f ".env" ]; then
  # shellcheck disable=SC1091
  source .env
fi

BACKEND_URL="${RENDER_BACKEND_URL:-https://astitva-api.onrender.com}"
HOOK_URL="${RENDER_DEPLOY_HOOK_URL:-}"

print_header() {
  echo "============================================================"
  echo " PRAVAH PRODUCTION DEPLOYMENT ORCHESTRATOR"
  echo "============================================================"
}

cmd_help() {
  print_header
  echo "Usage: ./scripts/deploy.sh <command>"
  echo ""
  echo "Commands:"
  echo "  setup     - Verify CLI tools, Vercel auth, and configuration"
  echo "  backend   - Trigger Render deployment via Deploy Hook"
  echo "  frontend  - Build and deploy React Vite app to Vercel production"
  echo "  all       - Trigger backend, wait for /health, then deploy frontend"
  echo "  status    - Check live health of backend and frontend"
  echo "  keepalive - Start keep-alive daemon in the background"
  echo ""
}

cmd_setup() {
  print_header
  echo "--> Checking CLI prerequisites..."
  
  if command -v vercel >/dev/null 2>&1; then
    echo "  [OK] Vercel CLI is installed: $(vercel --version)"
    echo "  [OK] Vercel Account: $(vercel whoami 2>/dev/null || echo 'Not logged in')"
  else
    echo "  [WARN] Vercel CLI not installed globally. Will use 'npx vercel'."
  fi

  if command -v curl >/dev/null 2>&1; then
    echo "  [OK] curl is available"
  else
    echo "  [FAIL] curl is required but not found."
    exit 1
  fi

  echo ""
  echo "--> Target Configuration:"
  echo "  Backend URL:      $BACKEND_URL"
  echo "  Render Hook URL:  ${HOOK_URL:-'(Not set in .env.deploy or RENDER_DEPLOY_HOOK_URL)'}"
  echo ""
  echo "--> To configure:"
  echo "  Create a .env.deploy file with:"
  echo "    RENDER_BACKEND_URL=\"https://your-backend.onrender.com\""
  echo "    RENDER_DEPLOY_HOOK_URL=\"https://api.render.com/deploy/srv-xxxx?key=yyyy\""
}

cmd_backend() {
  print_header
  if [ -z "$HOOK_URL" ]; then
    echo "ERROR: RENDER_DEPLOY_HOOK_URL is not set."
    echo "Provide it via environment variable or in .env.deploy."
    exit 1
  fi

  echo "--> Triggering Render deployment via Deploy Hook..."
  res=$(curl -s -w "\n%{http_code}" -X POST "$HOOK_URL")
  status=$(echo "$res" | tail -n1)
  
  if [ "$status" = "200" ] || [ "$status" = "201" ]; then
    echo "--> [SUCCESS] Render deploy triggered successfully (HTTP $status)."
  else
    echo "--> [ERROR] Render deploy trigger failed with HTTP $status:"
    echo "$res"
    exit 1
  fi
}

cmd_frontend() {
  print_header
  echo "--> Preparing frontend production build..."
  cd frontend
  npm run build
  cd ..
  
  echo "--> Deploying to Vercel production..."
  VERCEL_BIN="vercel"
  if ! command -v vercel >/dev/null 2>&1; then
    VERCEL_BIN="npx vercel"
  fi

  $VERCEL_BIN --prod \
    --build-env VITE_API_BASE_URL="$BACKEND_URL" \
    --env VITE_API_BASE_URL="$BACKEND_URL" \
    --yes

  echo "--> [SUCCESS] Frontend deployed to Vercel."
}

cmd_status() {
  print_header
  echo "--> Checking Backend Health ($BACKEND_URL/health)..."
  health_res=$(curl -s -m 10 "$BACKEND_URL/health" || echo "FAIL")
  echo "  Response: $health_res"

  echo "--> Checking Backend Alerts ($BACKEND_URL/disruption-alerts)..."
  alert_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$BACKEND_URL/disruption-alerts" || echo "000")
  echo "  HTTP Status: $alert_code"
}

cmd_all() {
  print_header
  if [ -n "$HOOK_URL" ]; then
    cmd_backend
    echo "--> Waiting 15s for Render build initialization..."
    sleep 15
  fi
  cmd_frontend
  cmd_status
}

case "${1:-help}" in
  setup) cmd_setup ;;
  backend) cmd_backend ;;
  frontend) cmd_frontend ;;
  all) cmd_all ;;
  status) cmd_status ;;
  keepalive)
    echo "Starting keep-alive in background..."
    nohup ./scripts/keep_alive.sh "$BACKEND_URL" 600 > keep_alive.log 2>&1 &
    echo "Keep-alive running (PID: $!). Logs written to keep_alive.log."
    ;;
  *) cmd_help ;;
esac
```
Make executable: `chmod +x scripts/deploy.sh`

- [ ] **Step 4: Run test to verify it passes**

Run: `chmod +x scripts/test_deploy_syntax.sh && ./scripts/test_deploy_syntax.sh`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/deploy.sh .env.example scripts/test_deploy_syntax.sh
git commit -m "feat(ops): add unified CLI deployment orchestrator script"
```

---

### Task 4: Full Pre-Flight Build & Smoke Verification

**Files:**
- Execute: `cd frontend && npm run build`
- Execute: `pytest backend/tests/test_health_and_config.py`
- Execute: `./scripts/deploy.sh setup`

- [ ] **Step 1: Run frontend production build**

Run: `cd frontend && npm run build`  
Expected: Zero build or TypeScript errors; `frontend/dist/` assets generated.

- [ ] **Step 2: Run backend test suite**

Run: `pytest backend/tests/test_health_and_config.py -v`  
Expected: 100% PASS.

- [ ] **Step 3: Run orchestrator setup verification**

Run: `./scripts/deploy.sh setup`  
Expected: Validates Vercel CLI login, node version, curl, and provides setup guidelines.

- [ ] **Step 4: Commit any remaining test artifacts or docs updates**

```bash
git commit --allow-empty -m "chore(deploy): verify full-stack deployment pipeline readiness"
```
