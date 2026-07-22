#!/usr/bin/env bash
# ============================================================================
# agent.sh — führt eine Claude-Code-Agenten-Routine headless aus, über das
# Claude-Max-ABO (CLAUDE_CODE_OAUTH_TOKEN), OHNE API-Key.
#
# Ersetzt die bisherigen Claude-Scheduled-Tasks auf Aarons Mac (Chefredakteur,
# Story-Veredler, Analyst, Bild-Regie, Verbesserer, Fetch-Analyse).
#
# Aufruf:   ops/run/agent.sh <agent-name>
# Beispiel: ops/run/agent.sh analyst
#
# Der Prompt liegt in ops/prompts/<agent-name>.md (1:1 aus den heutigen
# Scheduled-Tasks übernommen — siehe Task #4 / ops/prompts/README.md).
#
# Braucht:
#   - ops/env.runner mit CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...  (chmod 600)
#   - ../../.env (Supabase/DeepSeek/FAL/… für die Tools)
#   - ../../.mcp.json (Supabase-MCP, damit die Agenten in nureine_ai_runs loggen)
# ============================================================================
set -euo pipefail

AGENT="${1:?Usage: agent.sh <agent-name>  (z.B. analyst, chefredakteur, veredler, bildregie, verbesserer)}"

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

# Prompt über STDIN übergeben (nicht als Argument) — so kann kein führendes
# Sonderzeichen im Prompt je als Flag missverstanden werden.
# OHNE --bare (Abo-Token nicht bare-kompatibel). MCP aus projektlokaler .mcp.json.
# bypassPermissions: non-interaktiv, keine Prompts im cron-Kontext.
set +e
( cd "$ROOT" && printf '%s' "$PROMPT" | "$CLAUDE_BIN" -p \
    --permission-mode bypassPermissions \
    --output-format json \
) >>"$LOG" 2>&1
RC=$?
set -e
echo "[$STAMP] agent=$AGENT exit=$RC" >>"$LOG"
exit $RC
