#!/usr/bin/env bash
# ============================================================================
# pyjob.sh — führt einen Python-Compute-Job aus dem Repo aus (ersetzt die
# GitHub-Actions-Compute-Workflows). Nutzt das venv unter ../../.venv.
#
# Aufruf:   ops/run/pyjob.sh <script-relpath> [args...] [--cwd <dir>]
# Beispiel: ops/run/pyjob.sh scripts/fetch_world_metrics.py
#           ops/run/pyjob.sh fetch_worldbank.py --cwd scripts
#           ops/run/pyjob.sh scripts/generate_og_images.py --all
#
# Braucht in ../../.env: SUPABASE_URL, SUPABASE_SERVICE_KEY, DEEPSEEK_API_KEY …
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
set -a; source "$ROOT/.env"; set +a

PY="$ROOT/.venv/bin/python"
[[ -x "$PY" ]] || { echo "venv fehlt: $PY — erst 'python3 -m venv .venv' + deps (ops/README.md §2)"; exit 1; }

# --cwd rausparsen (default = Repo-Root)
CWD="$ROOT"
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cwd) CWD="$ROOT/$2"; shift 2;;
    *) ARGS+=("$1"); shift;;
  esac
done
SCRIPT="${ARGS[0]:?Usage: pyjob.sh <script> [args] [--cwd dir]}"
REST=("${ARGS[@]:1}")

LOGDIR="${NUREINE_LOGDIR:-$HOME/nureine-logs}"
mkdir -p "$LOGDIR"
NAME="$(basename "$SCRIPT" .py)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$LOGDIR/py-${NAME}.log"

echo "[$STAMP] cd $CWD && python $SCRIPT ${REST[*]}" >>"$LOG"
( cd "$CWD" && "$PY" "$SCRIPT" "${REST[@]}" ) >>"$LOG" 2>&1
RC=$?
echo "[$STAMP] exit=$RC" >>"$LOG"
exit $RC
