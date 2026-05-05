#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AskSaud — restart script
# Kills anything on ports 8000 (backend) and 5173 (frontend),
# then boots both fresh in the background and tails their logs.
#
# Usage:   ./start.sh
# Stop:    ./start.sh stop
# ─────────────────────────────────────────────────────────────────────────────

set -u

# Resolve script directory (so it works no matter where you call it from)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

BACKEND_PORT=8000
FRONTEND_PORT=3000
LOG_DIR="$SCRIPT_DIR/.logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

mkdir -p "$LOG_DIR"

# Colors (fall back gracefully if not a TTY)
if [ -t 1 ]; then
  GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; RED=$'\033[0;31m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  GREEN=""; YELLOW=""; RED=""; DIM=""; RESET=""
fi

log() { printf "%s\n" "$1"; }

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    log "${YELLOW}→ killing $(echo "$pids" | wc -l | tr -d ' ') process(es) on :$port${RESET}"
    kill -9 $pids 2>/dev/null || true
    sleep 0.3
  fi
}

# ── stop subcommand ─────────────────────────────────────────────────────────
if [ "${1:-}" = "stop" ]; then
  log "${YELLOW}Stopping AskSaud…${RESET}"
  kill_port "$BACKEND_PORT"
  kill_port "$FRONTEND_PORT"
  log "${GREEN}✓ stopped${RESET}"
  exit 0
fi

log "${DIM}─────────────────────────────────────────────${RESET}"
log "  ${GREEN}AskSaud restart${RESET}"
log "${DIM}─────────────────────────────────────────────${RESET}"

# ── 1. kill anything currently bound to our ports ───────────────────────────
kill_port "$BACKEND_PORT"
kill_port "$FRONTEND_PORT"

# ── 2. start backend (FastAPI / uvicorn) ────────────────────────────────────
if [ ! -d "myenv" ]; then
  log "${RED}✗ myenv/ not found in $SCRIPT_DIR — cannot start backend${RESET}"
  exit 1
fi

log "${GREEN}→ starting backend${RESET} ${DIM}(uvicorn :$BACKEND_PORT)${RESET}"
(
  # shellcheck disable=SC1091
  source myenv/bin/activate
  nohup uvicorn main:app \
    --host 0.0.0.0 \
    --port "$BACKEND_PORT" \
    --reload \
    > "$BACKEND_LOG" 2>&1 &
  echo $! > "$LOG_DIR/backend.pid"
)

# ── 3. start frontend (Vite) ────────────────────────────────────────────────
if [ ! -d "frontend" ]; then
  log "${RED}✗ frontend/ not found — skipping frontend${RESET}"
else
  if [ ! -d "frontend/node_modules" ]; then
    log "${YELLOW}→ frontend/node_modules missing, running npm install (one-time)…${RESET}"
    (cd frontend && npm install --silent)
  fi

  log "${GREEN}→ starting frontend${RESET} ${DIM}(vite :$FRONTEND_PORT)${RESET}"
  (
    cd frontend
    nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$LOG_DIR/frontend.pid"
  )
fi

# ── 4. wait for ports to come up ────────────────────────────────────────────
wait_for_port() {
  local port=$1
  local label=$2
  local tries=40   # ~10s
  while [ $tries -gt 0 ]; do
    if lsof -ti :"$port" >/dev/null 2>&1; then
      log "${GREEN}✓ $label ready on :$port${RESET}"
      return 0
    fi
    sleep 0.25
    tries=$((tries - 1))
  done
  log "${RED}✗ $label did not bind :$port within 10s — check logs${RESET}"
  return 1
}

wait_for_port "$BACKEND_PORT" "backend"
[ -d "frontend" ] && wait_for_port "$FRONTEND_PORT" "frontend"

# ── 5. summary ──────────────────────────────────────────────────────────────
log "${DIM}─────────────────────────────────────────────${RESET}"
log "  Backend  → ${GREEN}http://localhost:$BACKEND_PORT${RESET}"
[ -d "frontend" ] && \
log "  Frontend → ${GREEN}http://localhost:$FRONTEND_PORT${RESET}"
log ""
log "  Logs:    $BACKEND_LOG"
[ -d "frontend" ] && \
log "           $FRONTEND_LOG"
log ""
log "  Stop:    ${DIM}./start.sh stop${RESET}"
log "${DIM}─────────────────────────────────────────────${RESET}"
