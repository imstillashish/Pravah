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
