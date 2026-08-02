#!/usr/bin/env bash
# ============================================================================
# reel-watchdog.sh — meldet, wenn die Reel-Regie KEIN Video produziert hat.
#
# Warum (Vorfall 2026-08-01/02): Der Cron-Job lief taeglich und meldete exit=0,
# aber der Agent hatte den Render nur im Hintergrund gestartet und sich beendet.
# Zwei Tage lang entstand kein Reel — und NICHTS hat gewarnt, weil der Job
# formal erfolgreich war. Ein gruener Exit-Code ist kein Beweis fuer ein Video.
#
# Diese Pruefung schaut auf die TATSACHE: liegt fuer heute ein Master im Bucket?
# Laeuft taeglich 09:00 (eine Stunde nach der Regie).
# ============================================================================
set -uo pipefail
ROOT="/home/aaron/NurEine"
set -a; source "$ROOT/.env"; set +a
LOG="${NUREINE_LOGDIR:-$HOME/nureine-logs}/reel-watchdog.log"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

HEUTE="$(date -u +%Y-%m-%d)"
ANZAHL=$(curl -sS "$SUPABASE_URL/storage/v1/object/list/story_reels" \
  -H "apikey: $SUPABASE_SERVICE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prefix":"reels","limit":1000,"sortBy":{"column":"created_at","order":"desc"}}' \
  | python3 -c "
import json,sys
try: d=json.load(sys.stdin)
except Exception: print(-1); sys.exit()
print(sum(1 for o in d if (o.get('created_at') or '').startswith('$HEUTE')))")

if [ "$ANZAHL" = "-1" ]; then
  echo "[$STAMP] WARNUNG Bucket nicht lesbar — Pruefung unmoeglich" >>"$LOG"
  exit 1
fi
if [ "$ANZAHL" -lt 1 ]; then
  echo "[$STAMP] ALARM: heute ($HEUTE) KEIN Reel-Master gebaut. Letzter Regie-Lauf:" >>"$LOG"
  grep "agent=reel-regie" "${NUREINE_LOGDIR:-$HOME/nureine-logs}/agent-reel-regie.log" 2>/dev/null | tail -2 >>"$LOG"
  exit 1
fi
echo "[$STAMP] OK $ANZAHL Master heute gebaut" >>"$LOG"
