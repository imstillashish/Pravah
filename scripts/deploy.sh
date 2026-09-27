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
