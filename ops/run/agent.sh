#!/usr/bin/env bash
# ============================================================================
# agent.sh — führt eine Claude-Code-Agenten-Routine headless aus, über das
# Claude-Max-ABO (CLAUDE_CODE_OAUTH_TOKEN), OHNE API-Key.
#
# Ersetzt die bisherigen Claude-Scheduled-Tasks auf Aarons Mac (Chefredakteur,
# Story-Veredler, Analyst, Bild-Regie, Verbesserer, Fetch-Analyse).
#
# Aufruf:   ops/run/agent.sh <agent-name> [--no-chain]
# Beispiel: ops/run/agent.sh analyst
#
# Der Prompt liegt in ops/prompts/<agent-name>.md (1:1 aus den heutigen
# Scheduled-Tasks übernommen — siehe Task #4 / ops/prompts/README.md).
#
# VERKETTUNG: Nach einem erfolgreichen Lauf startet der Wrapper automatisch den
# nächsten Agenten der Nacht-Kette (siehe NEXT_IN_CHAIN). Damit hängt die Kette
# nicht mehr an geratenen Uhrzeiten — jeder startet, wenn der Vorgänger WIRKLICH
# fertig ist. Nur der erste (fetch) braucht noch einen cron-Eintrag.
#   --no-chain  → Einzellauf ohne Nachfolger (für Tests/manuelles Nachholen)
#
# Braucht:
#   - ops/env.runner mit CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...  (chmod 600)
#   - ../../.env (Supabase/DeepSeek/FAL/… für die Tools)
#   - ../../.mcp.json (Supabase-MCP, damit die Agenten in nureine_ai_runs loggen)
# ============================================================================
set -euo pipefail

AGENT="${1:?Usage: agent.sh <agent-name> [--no-chain]}"
CHAIN=1
[ "${2:-}" = "--no-chain" ] && CHAIN=0
[ "${NUREINE_NO_CHAIN:-0}" = "1" ] && CHAIN=0

# Die Nacht-Kette. Reihenfolge ist inhaltlich zwingend: der Chefredakteur braucht
# frische Stories, die Redaktion genehmigte Perlen, der Analyst das Ergebnis.
# Gemessene Laufzeiten (14 Tage): fetch ~23, chefredakteur ~3, redaktion ~10,
# analyst ~5 Min → Kette ab 03:10 ist um ~04:20 durch, vor dem Newsletter (04:40).
# reel-regie und verbesserer hängen NICHT dran (eigene Cron-Zeiten, andere Aufgabe).
next_in_chain() {
    case "$1" in
        fetch)          echo "chefredakteur" ;;
        chefredakteur)  echo "redaktion" ;;
        redaktion)      echo "analyst" ;;
        *)              echo "" ;;
    esac
}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROMPT_FILE="$ROOT/ops/prompts/$AGENT.md"
[[ -f "$PROMPT_FILE" ]] || { echo "Prompt fehlt: $PROMPT_FILE (Task #4: echten Prompt eintragen)"; exit 1; }

# Runner-ENV (Abo-Token) + Projekt-ENV laden
set -a
[[ -f "$ROOT/ops/env.runner" ]] && source "$ROOT/ops/env.runner"
source "$ROOT/.env"
set +a
: "${CLAUDE_CODE_OAUTH_TOKEN:?CLAUDE_CODE_OAUTH_TOKEN fehlt (ops/env.runner) — Abo-Token via 'claude setup-token'}"

CLAUDE_BIN="${CLAUDE_BIN:-$HOME/.local/bin/claude}"
command -v "$CLAUDE_BIN" >/dev/null 2>&1 || CLAUDE_BIN="claude"

LOGDIR="${NUREINE_LOGDIR:-$HOME/nureine-logs}"
mkdir -p "$LOGDIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$LOGDIR/agent-${AGENT}.log"

echo "[$STAMP] agent=$AGENT start" >>"$LOG"

# YAML-Frontmatter (--- … ---) am Dateianfang entfernen: sonst interpretiert
# claude die führenden "---" als CLI-Option ("error: unknown option '---").
# awk lässt alles ab der ersten Nicht-Frontmatter-Zeile durch.
PROMPT="$(awk 'BEGIN{fm=0} NR==1 && $0=="---"{fm=1; next} fm==1 && $0=="---"{fm=0; next} fm==0{print}' "$PROMPT_FILE")"

# ── Kontingent-Erkennung ────────────────────────────────────────────────────
# Claude-Abo kennt ZWEI Limits mit sehr unterschiedlicher Konsequenz:
#   5-Stunden-Fenster → rollierend, resetet von selbst  → warten lohnt sich
#   Wochen-Limit      → fix pro Account (fester Wochentag) → warten zwecklos
# Das exakte Fehlerformat von `claude -p --output-format json` ist NICHT
# dokumentiert (geprüft 2026-08-02). Deshalb defensiv: wir schauen auf alles,
# was ein Limit anzeigen könnte — is_error, api_error_status, subtype, result
# und den Rohtext. Lieber ein Signal zu viel prüfen als den Fall verpassen.
#
#   Rückgabe von classify_limit: "weekly" | "session" | "none"
classify_limit() {
    local out="$1"
    local low; low="$(printf '%s' "$out" | tr '[:upper:]' '[:lower:]')"

    # Wochen-Limit zuerst — es ist das schwerwiegendere und darf nicht als
    # Session-Limit missdeutet werden (sonst warten wir sinnlos Stunden).
    case "$low" in
        *"weekly limit"*|*"week limit"*|*"wöchentliches limit"*|*"weekly usage"*|*"resets mon"*|*"resets tue"*|*"resets wed"*|*"resets thu"*|*"resets fri"*|*"resets sat"*|*"resets sun"*)
            echo "weekly"; return;;
    esac
    case "$low" in
        *"session limit"*|*"5-hour limit"*|*"five hour"*|*"usage limit reached"*|*"rate_limit_error"*|*"rate limit"*|*"429"*|*"opus limit"*)
            echo "session"; return;;
    esac
    echo "none"
}

# Sekunden bis zur genannten Reset-Uhrzeit ("resets 3:45pm" / "resets at 15:45").
# Fällt auf 5 h zurück, wenn nichts Verwertbares in der Meldung steht.
#
# WARTEDECKEL (MAX_WAIT): Der Retry darf den nächsten regulären Cron-Lauf des
# Agenten NICHT überholen — sonst liefe derselbe Agent doppelt, oder ein Fetch
# käme erst, wenn Redaktion (04:10) und Newsletter (04:40) längst durch sind.
# Voreinstellung 4 h; per NUREINE_MAX_LIMIT_WAIT übersteuerbar.
seconds_until_reset() {
    local out="$1"
    local cap="${NUREINE_MAX_LIMIT_WAIT:-14400}"   # 4 h
    python3 - "$out" "$cap" <<'PY' 2>/dev/null || echo "${NUREINE_MAX_LIMIT_WAIT:-14400}"
import re, sys
from datetime import datetime, timedelta
text = sys.argv[1].lower()
cap = int(sys.argv[2])
m = re.search(r'resets?(?:\s+at)?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', text)
if not m:
    print(min(18000, cap)); raise SystemExit
h = int(m.group(1)); mi = int(m.group(2) or 0); ap = m.group(3)
if ap == 'pm' and h != 12: h += 12
if ap == 'am' and h == 12: h = 0
now = datetime.now()
target = now.replace(hour=h % 24, minute=mi, second=0, microsecond=0)
if target <= now: target += timedelta(days=1)
wait = int((target - now).total_seconds()) + 120   # 2 Min Puffer
print(min(max(wait, 60), cap))
PY
}

run_claude() {
    ( cd "$ROOT" && printf '%s' "$PROMPT" | "$CLAUDE_BIN" -p \
        --permission-mode bypassPermissions \
        --output-format json ) 2>&1
}

# Verwaiste 'running'-Einträge dieses Agenten schließen.
#
# Warum: Bricht der erste Versuch am Kontingent ab, hat der Agent seinen
# nureine_ai_runs-Eintrag schon auf status='running' gesetzt, kommt aber nicht
# mehr zum Abschluss-UPDATE. Der Retry startet eine NEUE Claude-Session, die den
# alten Eintrag nicht kennt — er bliebe als Zombie hängen, bis der Watchdog ihn
# nach 90 Min auf 'failed' setzt und eine Alarm-Mail auslöst (real passiert
# 2026-08-03, redaktion id=137).
#
# Läuft bewusst über PostgREST statt über Claude: Der Aufräumer muss gerade dann
# funktionieren, wenn Claude nicht verfügbar ist. Scheitert er, ist das kein
# Grund den Retry zu verhindern — der Watchdog fängt es weiterhin ab.
close_orphan_runs() {
    [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_SERVICE_KEY:-}" ] || {
        echo "[$STAMP] agent=$AGENT (kein Supabase-Zugang — Aufräumen übersprungen)" >>"$LOG"
        return 0
    }
    # Agent-Name in der DB weicht teils vom Wrapper-Namen ab (fetch → fetcher).
    local db_agent="$AGENT"
    [ "$AGENT" = "fetch" ] && db_agent="fetcher"

    local url="${SUPABASE_URL%/}/rest/v1/nureine_ai_runs?status=eq.running&agent=eq.${db_agent}"
    local body='{"status":"superseded","finished_at":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","error":"vom Retry nach Kontingent-Limit abgeloest (agent.sh)"}'

    local n
    n="$(curl -fsS -m 20 -X PATCH "$url" \
            -H "apikey: $SUPABASE_SERVICE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=representation" \
            -d "$body" 2>/dev/null | grep -o '"id"' | wc -l)" || n=0
    echo "[$STAMP] agent=$AGENT verwaiste running-Einträge geschlossen: ${n:-0}" >>"$LOG"
}

# ── Lauf mit einem Retry nach Kontingent-Reset ──────────────────────────────
set +e
OUT="$(run_claude)"
RC=$?
printf '%s\n' "$OUT" >>"$LOG"

LIMIT="$(classify_limit "$OUT")"

if [ "$LIMIT" = "weekly" ]; then
    # Fix bis zum Wochen-Reset gesperrt — jeder Retry wäre verlorene Zeit.
    echo "[$STAMP] agent=$AGENT WOCHEN-LIMIT erreicht — kein Retry, Lauf abgebrochen" >>"$LOG"
    echo "[$STAMP] agent=$AGENT exit=$RC (limit=weekly)" >>"$LOG"
    set -e
    exit 20   # eigener Code, damit Monitoring das vom normalen Fehler trennen kann

elif [ "$LIMIT" = "session" ]; then
    WAIT="$(seconds_until_reset "$OUT")"
    CAP="${NUREINE_MAX_LIMIT_WAIT:-14400}"
    if [ "$WAIT" -ge "$CAP" ]; then
        # Reset liegt weiter weg als der Deckel erlaubt → der Retry könnte noch
        # ins selbe Limit laufen. Trotzdem versuchen (kostet nur einen Aufruf),
        # aber im Log kenntlich machen, damit ein Fehlschlag erklärbar ist.
        echo "[$STAMP] agent=$AGENT 5H-LIMIT — Reset liegt hinter dem Wartedeckel ($((CAP/60)) Min); Retry evtl. verfrüht" >>"$LOG"
    fi
    echo "[$STAMP] agent=$AGENT 5H-LIMIT erreicht — warte $((WAIT/60)) Min bis Reset, dann EIN Retry" >>"$LOG"
    sleep "$WAIT"

    # Erst den halbfertigen Eintrag des abgebrochenen Versuchs schließen, dann neu
    # starten — sonst bleibt er als Zombie liegen und alarmiert den Watchdog.
    close_orphan_runs

    STAMP2="$(date -u +%Y%m%dT%H%M%SZ)"
    echo "[$STAMP2] agent=$AGENT retry nach Kontingent-Reset" >>"$LOG"
    OUT="$(run_claude)"
    RC=$?
    printf '%s\n' "$OUT" >>"$LOG"

    if [ "$(classify_limit "$OUT")" != "none" ]; then
        echo "[$STAMP2] agent=$AGENT Retry ebenfalls am Limit — aufgegeben" >>"$LOG"
        set -e
        exit 21
    fi
    echo "[$STAMP2] agent=$AGENT retry exit=$RC" >>"$LOG"
fi

set -e
echo "[$STAMP] agent=$AGENT exit=$RC" >>"$LOG"

# ── Nachfolger starten ──────────────────────────────────────────────────────
# Nur nach einem sauberen Lauf. Bei Fehler/Limit bricht die Kette bewusst ab:
# Ein Chefredakteur ohne frische Stories oder eine Redaktion ohne genehmigte
# Perlen würde nur leer laufen — und genau das ist der Fehler, den die
# Verkettung vermeiden soll (siehe Vorfall 2026-08-03).
NEXT="$(next_in_chain "$AGENT")"
if [ "$CHAIN" = "1" ] && [ "$RC" = "0" ] && [ -n "$NEXT" ]; then
    if [ -f "$ROOT/ops/prompts/$NEXT.md" ]; then
        echo "[$STAMP] agent=$AGENT → startet Nachfolger '$NEXT'" >>"$LOG"
        # setsid + nohup: der Nachfolger überlebt, wenn dieser Prozess endet.
        # Er hängt sich selbst wieder an seinen eigenen Log (agent-<name>.log).
        setsid nohup "$ROOT/ops/run/agent.sh" "$NEXT" >/dev/null 2>&1 < /dev/null &
    else
        echo "[$STAMP] agent=$AGENT → Nachfolger '$NEXT' hat keinen Prompt, Kette endet hier" >>"$LOG"
    fi
elif [ -n "$NEXT" ] && [ "$CHAIN" = "1" ]; then
    echo "[$STAMP] agent=$AGENT → Kette gestoppt (exit=$RC), '$NEXT' NICHT gestartet" >>"$LOG"
fi

exit $RC
