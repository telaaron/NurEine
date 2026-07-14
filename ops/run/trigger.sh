#!/usr/bin/env bash
# ============================================================================
# trigger.sh — generischer curl-Trigger für die "Thin"-Cron-Endpunkte.
# Ersetzt die GitHub-Actions-Workflows, die nur einen /api/cron/*-Endpoint
# der deployten Seite anpingen (die eigentliche Arbeit passiert auf Vercel).
#
# Aufruf:   ops/run/trigger.sh <endpoint> [json-body]
# Beispiel: ops/run/trigger.sh social-publish
#           ops/run/trigger.sh indexnow '{"recent":50}'
#
# Braucht in ../../.env:  PUBLIC_BASE_URL, CRON_SECRET
# ============================================================================
set -euo pipefail

ENDPOINT="${1:?Usage: trigger.sh <endpoint> [json-body]}"
BODY="${2:-}"

# Repo-Root relativ zu diesem Skript (ops/run/ -> ../../)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
set -a; source "$ROOT/.env"; set +a

BASE="${PUBLIC_BASE_URL:?PUBLIC_BASE_URL fehlt in .env}"
SECRET="${CRON_SECRET:?CRON_SECRET fehlt in .env}"

LOGDIR="${NUREINE_LOGDIR:-$HOME/nureine-logs}"
mkdir -p "$LOGDIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$LOGDIR/trigger-${ENDPOINT}.log"

echo "[$STAMP] POST $BASE/api/cron/$ENDPOINT ${BODY:+body=$BODY}" >>"$LOG"

if [[ -n "$BODY" ]]; then
  curl -fsS -X POST "$BASE/api/cron/$ENDPOINT" \
    -H "Authorization: Bearer $SECRET" \
    -H "Content-Type: application/json" \
    -d "$BODY" >>"$LOG" 2>&1
else
  curl -fsS -X POST "$BASE/api/cron/$ENDPOINT" \
    -H "Authorization: Bearer $SECRET" >>"$LOG" 2>&1
fi
RC=$?
echo "[$STAMP] exit=$RC" >>"$LOG"
exit $RC
