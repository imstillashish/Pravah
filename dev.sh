#!/usr/bin/env bash
set -e

cleanup() { kill "$BE_PID" "$FE_PID" 2>/dev/null; exit; }
trap cleanup SIGINT SIGTERM

(cd backend && source venv/bin/activate && uvicorn app.main:app --reload) &
BE_PID=$!

(cd frontend && npm run dev) &
FE_PID=$!

wait "$BE_PID" "$FE_PID"
