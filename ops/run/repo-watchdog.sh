#!/usr/bin/env bash
# ============================================================================
# repo-watchdog.sh — haelt den Mac Mini auf origin/main und meldet Abweichungen.
#
# WARUM (Vorfall 2026-08-01/03):
#   main war seit dem 24.07. KAPUTT — ein Merge-Konflikt hatte 1140 Zeilen aus
#   scripts/fetch_stories.py geloescht (SyntaxError, Fetch-Cronjob tot). Die
#   Reparatur lag danach NUR auf einem lokalen Branch des Minis. Ergebnis: der
#   Mini lief auf einem eigenen Stand, main blieb defekt, und beide Seiten
#   liefen zwei Wochen lang auseinander, ohne dass es jemand bemerkte.
#
# Diese Pruefung laeuft taeglich VOR den Nacht-Routinen und stellt sicher:
#   1. Der Mini ist auf Branch `main` (kein abgezweigter Feature-Branch).
#   2. Er ist auf dem Stand von origin/main (holt fast-forward nach).
#   3. Die kritischen Python-Skripte sind syntaktisch importierbar.
# Jeder Verstoss landet im Log — und blockiert NICHT die Routinen, damit ein
# Netzwerkfehler nicht die Produktion stoppt.
# ============================================================================
set -uo pipefail
ROOT="/home/aaron/NurEine"
LOG="${NUREINE_LOGDIR:-$HOME/nureine-logs}/repo-watchdog.log"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cd "$ROOT" || exit 1

BRANCH="$(git branch --show-current)"
if [ "$BRANCH" != "main" ]; then
  echo "[$STAMP] ALARM Mini steht auf '$BRANCH' statt main — Stand laeuft auseinander." >>"$LOG"
  echo "[$STAMP]   Fix: cd $ROOT && git checkout main && git pull --ff-only origin main" >>"$LOG"
  exit 1
fi

git fetch -q origin 2>/dev/null || { echo "[$STAMP] WARN git fetch fehlgeschlagen (Netz?)" >>"$LOG"; exit 0; }

BEHIND="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"
AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"

if [ "$AHEAD" -gt 0 ]; then
  # Eigene Commits, die nirgends gesichert sind — GENAU der Fall vom 01.08.
  echo "[$STAMP] ALARM $AHEAD Commit(s) nur auf dem Mini, nicht auf origin/main:" >>"$LOG"
  git log --oneline origin/main..HEAD >>"$LOG"
  echo "[$STAMP]   Diese Arbeit ist NICHT gesichert. Von einer Maschine mit GitHub-Zugang:" >>"$LOG"
  echo "[$STAMP]   git fetch && git push origin <commit>:main" >>"$LOG"
fi

if [ "$BEHIND" -gt 0 ]; then
  if git merge --ff-only origin/main -q 2>/dev/null; then
    echo "[$STAMP] OK $BEHIND Commit(s) von origin/main nachgezogen -> $(git rev-parse --short HEAD)" >>"$LOG"
  else
    echo "[$STAMP] ALARM $BEHIND Commit(s) hinter origin/main, fast-forward nicht moeglich." >>"$LOG"
    echo "[$STAMP]   Fix: lokale Aenderungen sichern (git stash), dann git pull --ff-only" >>"$LOG"
    exit 1
  fi
fi

# Kritische Skripte muessen importierbar sein — ein SyntaxError legt still
# ganze Cronjobs lahm (genau so starb der Fetch-Job zwei Wochen lang).
BAD=0
for f in scripts/fetch_stories.py remotion/scripts/tts.py remotion/scripts/verify_vo.py; do
  [ -f "$f" ] || continue
  if ! python3 -c "import ast,sys; ast.parse(open('$f').read())" 2>/dev/null; then
    echo "[$STAMP] ALARM $f ist NICHT importierbar (SyntaxError) — Cronjob wuerde still sterben." >>"$LOG"
    BAD=1
  fi
done
[ "$BAD" = "1" ] && exit 1

[ "$AHEAD" = "0" ] && [ "$BEHIND" = "0" ] && echo "[$STAMP] OK main, synchron, Skripte importierbar" >>"$LOG"
exit 0
