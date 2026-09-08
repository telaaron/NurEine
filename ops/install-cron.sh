#!/usr/bin/env bash
# ============================================================================
# install-cron.sh — schreibt ops/crontab.txt in die User-crontab.
#
# WARUM DIESES SKRIPT EINMAL KAPUTT WAR (behoben 2026-09-08):
# Es ersetzte $HOME im Template durch das echte Home-Verzeichnis. Das Repo
# liegt aber nicht unter ~/NurEine, sondern auf einem externen Volume mit
# LEERZEICHEN im Pfad. Ergebnis: 18 Jobs, die alle ins Leere zeigten — stumm,
# ohne Fehlermeldung. Genau deshalb fiel monatelang niemandem auf, dass die
# gesamte Mac-Mini-Automatisierung nicht lief.
#
# Jetzt: Der Pfad wird aus dem Skript-Standort abgeleitet (funktioniert also
# egal wo das Repo liegt) und wegen der Leerzeichen gequotet.
#
# Aufruf:
#   bash ops/install-cron.sh --dry-run   # nur anzeigen, nichts installieren
#   bash ops/install-cron.sh             # installieren (fragt nach)
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT/ops/crontab.txt"
DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

[[ -f "$TEMPLATE" ]] || { echo "crontab.txt fehlt: $TEMPLATE" >&2; exit 1; }

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# $HOME/NurEine -> echter Repo-Pfad, in Anfuehrungszeichen wegen Leerzeichen.
# Das Template enthaelt den LITERALEN String "$HOME" — in einer
# doppelt gequoteten sed-Expression wuerde die Shell ihn expandieren, bevor
# sed ihn sieht. Deshalb einfache Anfuehrungszeichen fuer das Suchmuster.
sed -e 's|\$HOME/NurEine|@@ROOT@@|g' -e "s|\$HOME|$HOME|g" -e "s|@@ROOT@@|\"$ROOT\"|g" \
    "$TEMPLATE" >"$TMP"

# Gegenprobe: zeigt jedes referenzierte Skript auf eine existierende Datei?
# Der Repo-Pfad steht gequotet in der Zeile ("...NurEine"/ops/run/x.sh), weil
# er Leerzeichen enthaelt. Deshalb wird hier nur der Skriptname geprueft,
# zusammengesetzt mit $ROOT — sonst zerreisst das Quoting die Pfadangabe.
FEHLT=0
while read -r skript; do
  [[ -z "$skript" ]] && continue
  if [[ ! -e "$ROOT/ops/run/$skript" ]]; then
    echo "  FEHLT: $ROOT/ops/run/$skript" >&2
    FEHLT=$((FEHLT + 1))
  fi
done < <(grep -oE '/ops/run/[A-Za-z0-9_.-]+\.sh' "$TMP" | sed 's|.*/||' | sort -u)

if [[ $FEHLT -gt 0 ]]; then
  echo "" >&2
  echo "ABBRUCH: $FEHLT Pfad(e) zeigen ins Leere. Nichts installiert." >&2
  echo "Cron wuerde diese Jobs stumm scheitern lassen." >&2
  exit 1
fi

echo "Zu installierende crontab (alle Pfade geprueft):"
echo "--------------------------------------------------------"
grep -v '^#' "$TMP" | grep -v '^$'
echo "--------------------------------------------------------"
JOBS=$(grep -vc '^#\|^$' "$TMP")
echo "$JOBS Jobs. Aktuell installiert: $(crontab -l 2>/dev/null | grep -vc '^#\|^$' || echo 0)"

if [[ $DRY -eq 1 ]]; then
  echo ""
  echo "--dry-run: nichts installiert."
  exit 0
fi

echo ""
echo "ACHTUNG: Diese Jobs verschicken Mails und posten auf Social Media."
read -r -p "Wirklich installieren? [ja/NEIN] " ANTWORT
[[ "$ANTWORT" == "ja" ]] || { echo "Abgebrochen."; exit 0; }

# Sicherung der bestehenden crontab, damit ein Fehlgriff umkehrbar ist.
BACKUP="$ROOT/ops/crontab-backup-$(date +%Y%m%d-%H%M%S).txt"
crontab -l >"$BACKUP" 2>/dev/null || true
[[ -s "$BACKUP" ]] && echo "Bisherige crontab gesichert: $BACKUP"

crontab "$TMP"
echo "OK — installiert. Kontrolle: crontab -l"
echo ""
echo "Wichtig auf macOS: cron braucht 'Full Disk Access' fuer /usr/sbin/cron"
echo "(Systemeinstellungen > Datenschutz), sonst scheitern Jobs auf dem"
echo "externen Volume stumm."
