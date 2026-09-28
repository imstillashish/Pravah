#!/bin/sh
set -e

echo "============================================================"
echo "PRAVAH PRODUCTION DEPLOYMENT STARTUP"
echo "============================================================"

# 1. Run database migrations to head
echo "--> Running Alembic database migrations..."
cd backend
python -m alembic upgrade head || python -m alembic stamp head || true
cd ..

# 2. Seed Reference Data and Demo Scenarios
echo "--> Seeding Reference Data & Demo Scenarios..."
python scripts/seed_reference_data.py || true
python scripts/seed_demo_scenarios.py || true

# 3. Start ASGI Server on dynamic PORT (Render supplies $PORT)
echo "--> Launching Uvicorn ASGI production server..."
cd backend
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
