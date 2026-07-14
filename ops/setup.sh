#!/usr/bin/env bash
# ============================================================================
# NurEine Mac-Mini-Runner — Ubuntu-Grundinstallation
# ----------------------------------------------------------------------------
# Läuft EINMAL auf dem frisch installierten Ubuntu 24.04 (Mac Mini Server 2011).
# Installiert alle System-Pakete, Node 22, Python-Toolchain, ffmpeg, Chromium-
# Systembibliotheken (für Remotion-Headless-Render) und Fonts.
#
# NICHT enthalten (bewusst manuell / eigene Schritte):
#   - Claude Code Installation + Abo-Token   -> siehe ops/README.md Abschnitt 3
#   - Repo-Klon + .env / .mcp.json           -> siehe ops/README.md Abschnitt 4
#   - Cron-Einrichtung                        -> ops/install-cron.sh (später)
#
# Aufruf:  bash ops/setup.sh
# Idempotent: kann gefahrlos mehrfach laufen.
# ============================================================================
set -euo pipefail

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# --- 0. Vorbedingungen -------------------------------------------------------
if [[ "$(uname -s)" != "Linux" ]]; then
  echo "FEHLER: Dieses Skript ist für Ubuntu/Linux (Mac Mini Runner), nicht für macOS." >&2
  exit 1
fi

log "System aktualisieren"
sudo apt-get update
sudo apt-get -y upgrade

# --- 1. Basis-Werkzeuge ------------------------------------------------------
log "Basis-Pakete (git, curl, build-essential, ffmpeg, ripgrep)"
sudo apt-get install -y \
  git curl ca-certificates gnupg build-essential \
  ffmpeg ripgrep unzip jq

# --- 2. Chromium-Systembibliotheken (Remotion Headless-Render) ---------------
# Remotion lädt Chrome Headless Shell selbst herunter, braucht aber diese Libs.
log "Chromium-Laufzeitbibliotheken für Remotion"
sudo apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
  libcairo2 libasound2t64 libatspi2.0-0 libgtk-3-0 || \
  sudo apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
  libcairo2 libasound2 libatspi2.0-0 libgtk-3-0
# (libasound2t64 auf 24.04; Fallback libasound2 falls Paketname abweicht)

# --- 3. Bild-/OG-Abhängigkeiten (Pillow) + Fonts -----------------------------
log "Bildbibliotheken + Fonts (OG-Images, Reel-Text)"
sudo apt-get install -y \
  libjpeg-dev zlib1g-dev libwebp-dev \
  fonts-dejavu fonts-liberation2 fonts-inter || \
  sudo apt-get install -y libjpeg-dev zlib1g-dev libwebp-dev fonts-dejavu fonts-liberation2

# --- 4. Node 22 (NodeSource) -------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 22 ]]; then
  log "Node 22 via NodeSource installieren"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  log "Node bereits vorhanden: $(node -v)"
fi

# --- 5. Python 3 + venv ------------------------------------------------------
log "Python 3 + venv + pip"
sudo apt-get install -y python3 python3-venv python3-pip

log "FERTIG mit setup.sh."
echo
echo "Installiert:"
echo "  node   : $(node -v 2>/dev/null || echo 'FEHLT')"
echo "  npm    : $(npm -v 2>/dev/null || echo 'FEHLT')"
echo "  python3: $(python3 --version 2>/dev/null || echo 'FEHLT')"
echo "  ffmpeg : $(ffmpeg -version 2>/dev/null | head -1 || echo 'FEHLT')"
echo
echo "Nächste Schritte: ops/README.md Abschnitt 3 (Claude Code + Token) und 4 (Repo/.env)."
