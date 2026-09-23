#!/usr/bin/env bash
set -e

cleanup() { kill "$BE_PID" "$FE_PID" 2>/dev/null; exit; }
trap cleanup SIGINT SIGTERM

(
  cd backend
  if [ -d "venv/Scripts" ]; then
    source venv/Scripts/activate
  elif [ -d "venv/bin" ]; then
    source venv/bin/activate
  fi
  uvicorn app.main:app --reload
) &
BE_PID=$!

(
  cd frontend
  if command -v npm.cmd &> /dev/null; then
    npm.cmd run dev
  else
    npm run dev
  fi
) &
FE_PID=$!

wait "$BE_PID" "$FE_PID"
