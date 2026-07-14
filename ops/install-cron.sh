#!/usr/bin/env bash
# ============================================================================
# install-cron.sh — schreibt ops/crontab.txt in die User-crontab des Mini.
# Ersetzt $HOME im Template durch den echten Pfad und installiert idempotent.
#
# Aufruf: bash ops/install-cron.sh
# Danach: crontab -l   (kontrollieren)
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT/ops/crontab.txt"
[[ -f "$TEMPLATE" ]] || { echo "crontab.txt fehlt: $TEMPLATE"; exit 1; }

# $HOME im Template expandieren -> temporäre, installierbare crontab
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
sed "s|\$HOME|$HOME|g" "$TEMPLATE" >"$TMP"

echo "Installiere folgende crontab:"
echo "--------------------------------------------------------"
cat "$TMP"
echo "--------------------------------------------------------"
crontab "$TMP"
echo "OK — installiert. Kontrolle mit: crontab -l"
echo "Hinweis: cron-Dienst aktiv? -> sudo systemctl enable --now cron"
