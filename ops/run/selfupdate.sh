#!/usr/bin/env bash
# ============================================================================
# selfupdate.sh — der Mini holt sich seinen Stand von GitHub und meldet zurück.
#
# Damit lässt sich der Mini von ÜBERALL warten, ohne im selben WLAN zu sein:
# Du pushst nach main, der Mini zieht es beim nächsten Lauf (oder sofort per
# Tailscale-SSH) und schreibt seinen Zustand als Datei zurück ins Repo.
#
# Zwei Richtungen:
#   GitHub → Mini : git pull (Code-Updates ankommen lassen)
#   Mini → GitHub : ops/state/mac-mini-server.md (Zustandsbericht, sichtbar
#                   im Browser, ohne SSH — beantwortet "was läuft da gerade?")
#
# Aufruf:
#   ops/run/selfupdate.sh            # pull + Zustand melden (Standard, für Cron)
#   ops/run/selfupdate.sh --report   # NUR Zustand melden, kein pull
#   ops/run/selfupdate.sh --no-push  # nur pull, Bericht lokal lassen
#
# Sicherheitsnetz: Der Pull passiert NUR, wenn der Arbeitsbaum sauber genug ist
# und wir auf main stehen. Lokale Agenten-Arbeit wird nie überfahren.
# ============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

DO_PULL=1; DO_PUSH=1
case "${1:-}" in
    --report)  DO_PULL=0 ;;
    --no-push) DO_PUSH=0 ;;
esac

LOGDIR="${NUREINE_LOGDIR:-$HOME/nureine-logs}"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/selfupdate.log"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
say() { echo "[$STAMP] $*" | tee -a "$LOG"; }

# ── 1. Updates von GitHub holen ─────────────────────────────────────────────
PULL_RESULT="übersprungen"
if [ "$DO_PULL" = "1" ]; then
    BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    if [ "$BRANCH" != "main" ]; then
        # Kein automatischer Wechsel: Der Verbesserer arbeitet auf Feature-Branches,
        # ein Zwangs-Checkout würde ihm mitten im Lauf den Boden wegziehen.
        PULL_RESULT="kein Pull — Mini steht auf '$BRANCH' statt main"
        say "$PULL_RESULT"
    elif [ -n "$(git status --porcelain --untracked-files=no)" ]; then
        PULL_RESULT="kein Pull — uncommittete Änderungen im Arbeitsbaum"
        say "$PULL_RESULT"
    else
        git fetch --quiet origin 2>/dev/null
        BEFORE="$(git rev-parse --short HEAD)"
        if git merge --ff-only origin/main >/dev/null 2>&1; then
            AFTER="$(git rev-parse --short HEAD)"
            if [ "$BEFORE" = "$AFTER" ]; then
                PULL_RESULT="aktuell ($AFTER)"
            else
                PULL_RESULT="aktualisiert $BEFORE → $AFTER"
                # Frisch gezogene Skripte müssen ausführbar bleiben
                chmod +x ops/run/*.sh ops/*.sh 2>/dev/null
            fi
            say "Pull: $PULL_RESULT"
        else
            PULL_RESULT="Pull fehlgeschlagen (divergiert?) — Handarbeit nötig"
            say "$PULL_RESULT"
        fi
    fi
fi

# ── 2. Zustandsbericht schreiben ────────────────────────────────────────────
# Bewusst Markdown: auf github.com direkt lesbar, ohne SSH, ohne Werkzeug.
mkdir -p "$ROOT/ops/state"
REPORT="$ROOT/ops/state/$(hostname).md"

# --- Fakten einsammeln (jeder Schritt einzeln abgesichert) ---
UPTIME="$(uptime -p 2>/dev/null || echo '?')"
DISK="$(df -h / | tail -1 | awk '{print $4 " frei von " $2 " (" $5 " belegt)"}')"
# Zeile 2 statt /Mem:/ — auf deutscher Locale heißt sie "Speicher:"
MEM="$(free -h | awk 'NR==2 {print $7 " verfügbar von " $2}')"
LOAD="$(uptime | grep -oE 'load average.*' || echo '?')"
GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
GIT_HEAD="$(git log -1 --format='%h %s' 2>/dev/null)"
GIT_DATE="$(git log -1 --format='%ci' 2>/dev/null)"
git fetch --quiet origin 2>/dev/null
GIT_BEHIND="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo '?')"
GIT_AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo '?')"
DIRTY="$(git status --porcelain --untracked-files=no 2>/dev/null | wc -l)"
UNPUSHED_BRANCHES=0
for b in $(git branch --format='%(refname:short)' 2>/dev/null); do
    [ "$(git ls-remote --heads origin "$b" 2>/dev/null | wc -l)" = "0" ] && UNPUSHED_BRANCHES=$((UNPUSHED_BRANCHES+1))
done
CRON_JOBS="$(crontab -l 2>/dev/null | grep -cE '^[0-9*]' || echo 0)"
CRON_OK="$(systemctl is-active cron 2>/dev/null)"
TS_IP="$(tailscale ip -4 2>/dev/null | head -1 || echo '—')"
CLAUDE_VER="$($HOME/.local/bin/claude --version 2>/dev/null | head -1 || echo '?')"

# Letzte Agenten-Läufe aus den Logs (nicht aus der DB — der Bericht soll auch
# dann funktionieren, wenn Supabase gerade zickt).
AGENT_LINES=""
for a in fetch chefredakteur redaktion analyst reel-regie verbesserer; do
    line="$(grep -h "agent=$a exit=" "$LOGDIR/agent-$a.log" 2>/dev/null | tail -1)"
    if [ -n "$line" ]; then
        when="$(echo "$line" | grep -oE '^\[[0-9TZ]+\]' | tr -d '[]')"
        code="$(echo "$line" | grep -oE 'exit=[0-9]+' | cut -d= -f2)"
        icon="✅"; [ "$code" != "0" ] && icon="⚠️"
        AGENT_LINES="${AGENT_LINES}| $a | $when | $icon exit=$code |"$'\n'
    else
        AGENT_LINES="${AGENT_LINES}| $a | — | (kein Lauf im Log) |"$'\n'
    fi
done

cat > "$REPORT" <<EOF
# Zustand: $(hostname)

> Automatisch erzeugt von \`ops/run/selfupdate.sh\` — **$STAMP**
> Diese Datei ist der Blick auf den Mini von überall: einfach hier auf GitHub lesen.

## System

| | |
|---|---|
| Läuft seit | $UPTIME |
| Speicherplatz | $DISK |
| Arbeitsspeicher | $MEM |
| Auslastung | $LOAD |
| Tailscale-Adresse | \`$TS_IP\` |
| Claude Code | $CLAUDE_VER |
| cron-Dienst | $CRON_OK ($CRON_JOBS Jobs) |

## Code-Stand

| | |
|---|---|
| Branch | \`$GIT_BRANCH\` |
| Aktueller Commit | \`$GIT_HEAD\` |
| vom | $GIT_DATE |
| Hinter origin/main | $GIT_BEHIND Commits |
| Vor origin/main | $GIT_AHEAD Commits |
| Uncommittete Dateien | $DIRTY |
| Branches nur lokal (ungesichert) | $UNPUSHED_BRANCHES |
| Letzter Pull | $PULL_RESULT |

## Letzte Agenten-Läufe

| Agent | Zeitpunkt (UTC) | Ergebnis |
|---|---|---|
$AGENT_LINES

## Fernwartung

\`\`\`bash
# Direkt auf den Mini (von überall, via Tailscale):
ssh aaron@$TS_IP

# Update anstoßen:
ssh aaron@$TS_IP 'cd ~/NurEine && ops/run/selfupdate.sh'

# Nur den Zustand neu erheben:
ssh aaron@$TS_IP 'cd ~/NurEine && ops/run/selfupdate.sh --report'
\`\`\`

*Exit-Codes: 0 = ok · 20 = Claude-Wochenlimit · 21 = 5h-Limit auch nach Retry · sonst Fehler*
EOF

say "Bericht geschrieben: ops/state/$(hostname).md"

# ── 3. Bericht zu GitHub pushen ─────────────────────────────────────────────
if [ "$DO_PUSH" = "1" ]; then
    # Erst stagen, DANN vergleichen: Beim allerersten Lauf ist die Datei noch
    # untracked — `git diff` sieht sie nicht und würde fälschlich "unverändert"
    # melden, sodass der Bericht nie auf GitHub landet.
    git add "ops/state/" >/dev/null 2>&1
    if git diff --cached --quiet -- "ops/state/" 2>/dev/null; then
        say "Bericht unverändert — kein Push nötig"
    else
        git -c user.name="mac-mini-server" -c user.email="mini@nureine.local" \
            commit -q -m "chore(state): Zustandsbericht $(hostname) $STAMP" -- "ops/state/" 2>/dev/null
        if git push -q origin HEAD:refs/heads/"$(git rev-parse --abbrev-ref HEAD)" 2>/dev/null; then
            say "Bericht gepusht ✅"
        else
            say "Push des Berichts fehlgeschlagen (Branch divergiert?)"
        fi
    fi
fi

say "fertig"
